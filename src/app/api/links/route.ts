import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { generateUtmUrl } from '@/lib/link-generator';
import { computeLinkHash, computeOneLinkRequestHash } from '@/lib/url-normalizer';
import { createLinkRecord, getAllLinks, touchCatalogItem } from '@/lib/db';
import { syncLinkToSharePoint } from '@/lib/sharepoint-sync';

export async function GET() {
  try {
    const links = await getAllLinks();
    return NextResponse.json({ links });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: 'Bạn cần đăng nhập để gửi yêu cầu.' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { linkType } = body;

    let finalLink = '';
    let originalUrl = '';
    let linkHash = '';
    let requestStatus: 'NEW' | 'COMPLETED' = 'COMPLETED';

    if (linkType === 'UTM') {
      const { originalUrl: rawUrl, utmSource, utmMedium, utmCampaign, utmId, utmContent, utmTerm } = body;
      if (!rawUrl || !utmSource || !utmMedium || !utmCampaign) {
        return NextResponse.json({ error: 'Thiếu trường bắt buộc cho Google UTM (URL, Nguồn, Kênh, Tên chiến dịch).' }, { status: 400 });
      }

      originalUrl = rawUrl;
      finalLink = generateUtmUrl({
        originalUrl: rawUrl,
        utmSource,
        utmMedium,
        utmCampaign,
        utmId,
        utmContent,
        utmTerm,
      });

      linkHash = computeLinkHash(finalLink);
      requestStatus = 'COMPLETED';

      // Update Catalog usage for UTM
      await touchCatalogItem('utm_source', utmSource, 'UTM', user.id);
      await touchCatalogItem('utm_medium', utmMedium, 'UTM', user.id);
      await touchCatalogItem('utm_campaign', utmCampaign, 'UTM', user.id);
      if (utmId) await touchCatalogItem('utm_id', utmId, 'UTM', user.id);
      if (utmContent) await touchCatalogItem('utm_content', utmContent, 'UTM', user.id);
      if (utmTerm) await touchCatalogItem('utm_term', utmTerm, 'UTM', user.id);

    } else if (linkType === 'ONELINK') {
      const {
        oneLinkTemplate,
        mediaSource,
        channel,
        campaignName,
        campaignId,
        adGroup,
        adName,
        targetUser,
        deepLinkValue,
        desiredSlug,
        socialPreview,
        note,
      } = body;

      if (!oneLinkTemplate || !mediaSource || !channel || !campaignName || !targetUser || !deepLinkValue) {
        return NextResponse.json({ error: 'Thiếu trường bắt buộc cho Yêu cầu OneLink (Template, Nguồn, Hình thức, Chiến dịch, Khách hàng mục tiêu, Đích đến trong App).' }, { status: 400 });
      }

      originalUrl = oneLinkTemplate;
      finalLink = ''; // Will be populated by AppsFlyer Admin later
      requestStatus = 'NEW';

      // Compute hash based on request composite keys
      linkHash = computeOneLinkRequestHash({
        oneLinkTemplate,
        mediaSource,
        campaignName,
        channel,
        deepLinkValue,
        targetUser,
        adGroup,
        adName,
      });

      // Update Catalog usage for ONELINK
      await touchCatalogItem('media_source', mediaSource, 'ONELINK', user.id);
      await touchCatalogItem('channel', channel, 'ONELINK', user.id);
      await touchCatalogItem('campaign_name', campaignName, 'ONELINK', user.id);
      if (campaignId) await touchCatalogItem('campaign_id', campaignId, 'ONELINK', user.id);
      if (adGroup) await touchCatalogItem('ad_group', adGroup, 'ONELINK', user.id);
      if (adName) await touchCatalogItem('ad_name', adName, 'ONELINK', user.id);
      if (deepLinkValue) await touchCatalogItem('deep_link_screen', deepLinkValue, 'ONELINK', user.id);

    } else {
      return NextResponse.json({ error: 'Loại link không hợp lệ (Chỉ hỗ trợ UTM hoặc ONELINK).' }, { status: 400 });
    }

    // Attempt DB insert
    let linkRecord;
    try {
      linkRecord = await createLinkRecord({
        linkType,
        originalUrl,
        finalLink,
        linkHash,
        status: requestStatus,
        utmSource: body.utmSource || body.mediaSource,
        utmMedium: body.utmMedium || body.channel,
        utmCampaign: body.utmCampaign || body.campaignName,
        utmId: body.utmId,
        utmContent: body.utmContent || body.adName,
        utmTerm: body.utmTerm || body.keywords,
        mediaSource: body.mediaSource,
        afChannel: body.channel,
        afCId: body.campaignId,
        afAdset: body.adGroup,
        afAd: body.adName,
        deepLinkValue: body.deepLinkValue,
        isRetargeting: body.targetUser === 'EXISTING_USER' || body.targetUser === 'BOTH',
        targetUser: body.targetUser,
        desiredSlug: body.desiredSlug,
        socialPreview: body.socialPreview,
        note: body.note,
        createdByUserId: user.id,
        createdByName: user.fullName,
        createdByEmail: user.email,
        syncStatus: 'PENDING',
        syncAttempts: 0,
      });
    } catch (dbErr: any) {
      if (dbErr.message === 'LINK_DUPLICATE' && dbErr.existingRecord) {
        const ext = dbErr.existingRecord;
        return NextResponse.json(
          {
            error: linkType === 'ONELINK' 
              ? 'Yêu cầu OneLink với cấu hình này đã được gửi trước đó!'
              : 'Link này đã được tạo trước đó trong hệ thống!',
            isDuplicate: true,
            existingRecord: {
              finalLink: ext.finalLink || 'Đang chờ tạo trên AppsFlyer',
              createdByName: ext.createdByName,
              createdByEmail: ext.createdByEmail,
              createdAt: ext.createdAt,
            },
          },
          { status: 409 }
        );
      }
      throw dbErr;
    }

    // Trigger async SharePoint Excel Sync
    syncLinkToSharePoint(linkRecord).catch((err) => console.error('SharePoint Sync Background Error:', err));

    return NextResponse.json({ 
      linkRecord, 
      message: linkType === 'ONELINK' ? 'Gửi yêu cầu OneLink thành công! Đang chờ xử lý.' : 'Tạo link thành công!' 
    }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Lỗi xử lý gửi yêu cầu.' }, { status: 500 });
  }
}

export async function DELETE() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: 'Bạn cần đăng nhập để thực hiện thao tác này.' }, { status: 401 });
  }

  if (user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Chỉ tài khoản Quản trị viên (Admin) mới có quyền xóa bản ghi.' }, { status: 403 });
  }

  try {
    const { deleteLegacyOneLinks } = await import('@/lib/db');
    const deletedCount = await deleteLegacyOneLinks();
    return NextResponse.json({
      deletedCount,
      message: `Đã dọn dẹp ${deletedCount} bản ghi OneLink kiểu cũ khỏi hệ thống.`
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Lỗi dọn dẹp OneLink cũ.' }, { status: 500 });
  }
}


