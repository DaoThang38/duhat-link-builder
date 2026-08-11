import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { generateUtmUrl, generateOneLinkUrl } from '@/lib/link-generator';
import { computeLinkHash } from '@/lib/url-normalizer';
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
    return NextResponse.json({ error: 'Bạn cần đăng nhập để tạo link.' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { linkType } = body;

    let finalLink = '';
    let originalUrl = '';

    if (linkType === 'UTM') {
      const { originalUrl: rawUrl, utmSource, utmMedium, utmCampaign, utmId, utmContent, utmTerm } = body;
      if (!rawUrl || !utmSource || !utmMedium || !utmCampaign) {
        return NextResponse.json({ error: 'Thiếu trường bắt buộc cho Google UTM (URL, Source, Medium, Campaign).' }, { status: 400 });
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
        campaignName,
        channel,
        campaignId,
        adGroup,
        adName,
        keywords,
        deepLinkValue,
        isRetargeting,
      } = body;

      if (!oneLinkTemplate || !mediaSource || !campaignName) {
        return NextResponse.json({ error: 'Thiếu trường bắt buộc cho AppsFlyer OneLink (Template, Media Source, Campaign).' }, { status: 400 });
      }

      originalUrl = oneLinkTemplate;
      finalLink = generateOneLinkUrl({
        oneLinkTemplate,
        mediaSource,
        campaignName,
        channel,
        campaignId,
        adGroup,
        adName,
        keywords,
        deepLinkValue,
        isRetargeting,
      });

      // Update Catalog usage for ONELINK
      await touchCatalogItem('media_source', mediaSource, 'ONELINK', user.id);
      await touchCatalogItem('campaign_name', campaignName, 'ONELINK', user.id);
      if (channel) await touchCatalogItem('channel', channel, 'ONELINK', user.id);
      if (campaignId) await touchCatalogItem('campaign_id', campaignId, 'ONELINK', user.id);
      if (adGroup) await touchCatalogItem('ad_group', adGroup, 'ONELINK', user.id);
      if (adName) await touchCatalogItem('ad_name', adName, 'ONELINK', user.id);
      if (keywords) await touchCatalogItem('keywords', keywords, 'ONELINK', user.id);
      if (deepLinkValue) await touchCatalogItem('deep_link_screen', deepLinkValue, 'ONELINK', user.id);

    } else {
      return NextResponse.json({ error: 'Loại link không hợp lệ (Chỉ hỗ trợ UTM hoặc ONELINK).' }, { status: 400 });
    }

    // Compute SHA-256 Hash
    const linkHash = computeLinkHash(finalLink);

    // Attempt DB insert
    let linkRecord;
    try {
      linkRecord = await createLinkRecord({
        linkType,
        originalUrl,
        finalLink,
        linkHash,
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
        afKeywords: body.keywords,
        deepLinkValue: body.deepLinkValue,
        isRetargeting: body.isRetargeting || false,
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
            error: 'Link này đã được tạo trước đó trong hệ thống!',
            isDuplicate: true,
            existingRecord: {
              finalLink: ext.finalLink,
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

    return NextResponse.json({ linkRecord, message: 'Tạo link thành công!' }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Lỗi xử lý tạo link.' }, { status: 500 });
  }
}
