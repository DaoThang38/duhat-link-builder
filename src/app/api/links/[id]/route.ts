import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { updateOneLinkStatusAndUrl } from '@/lib/db';
import { syncLinkToSharePoint } from '@/lib/sharepoint-sync';

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: 'Bạn cần đăng nhập để thực hiện thao tác này.' }, { status: 401 });
  }

  if (user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Chỉ tài khoản Quản trị viên (Admin) / Người phụ trách mới được cập nhật link.' }, { status: 403 });
  }

  const { id } = await params;

  try {
    const body = await req.json();
    const { finalLink, status = 'COMPLETED' } = body;

    if (status === 'COMPLETED' && (!finalLink || !finalLink.trim())) {
      return NextResponse.json({ error: 'Vui lòng nhập link AppsFlyer OneLink hoàn chỉnh.' }, { status: 400 });
    }

    if (finalLink && finalLink.trim()) {
      try {
        let testUrl = finalLink.trim();
        if (!testUrl.startsWith('http://') && !testUrl.startsWith('https://')) {
          testUrl = `https://${testUrl}`;
        }
        new URL(testUrl);
      } catch {
        return NextResponse.json({ error: 'Link OneLink hoàn chỉnh không hợp lệ. Ví dụ: https://duhat.onelink.me/abc1/x7ab29' }, { status: 400 });
      }
    }

    const updatedRecord = await updateOneLinkStatusAndUrl(
      id,
      finalLink ? finalLink.trim() : '',
      status,
      user.id,
      user.fullName
    );

    if (!updatedRecord) {
      return NextResponse.json({ error: 'Không tìm thấy bản ghi yêu cầu.' }, { status: 404 });
    }

    // Trigger async SharePoint sync with updated final link
    if (updatedRecord.finalLink) {
      syncLinkToSharePoint(updatedRecord).catch((err) => console.error('SharePoint Update Sync Error:', err));
    }

    return NextResponse.json({
      linkRecord: updatedRecord,
      message: status === 'COMPLETED' ? 'Đã cập nhật OneLink hoàn chỉnh thành công!' : 'Đã cập nhật trạng thái yêu cầu!',
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Lỗi cập nhật yêu cầu.' }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: 'Bạn cần đăng nhập để thực hiện thao tác này.' }, { status: 401 });
  }

  if (user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Chỉ tài khoản Quản trị viên (Admin) mới có quyền xóa bản ghi.' }, { status: 403 });
  }

  const { id } = await params;

  try {
    const { deleteLinkRecord } = await import('@/lib/db');
    const success = await deleteLinkRecord(id);
    if (!success) {
      return NextResponse.json({ error: 'Không tìm thấy bản ghi cần xóa.' }, { status: 404 });
    }
    return NextResponse.json({ message: 'Xóa bản ghi thành công.' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Lỗi khi xóa bản ghi.' }, { status: 500 });
  }
}

