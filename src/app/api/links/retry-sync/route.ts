import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { getAllLinks } from '@/lib/db';
import { syncLinkToSharePoint } from '@/lib/sharepoint-sync';

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: 'Chưa đăng nhập.' }, { status: 401 });
  }

  try {
    const { linkId } = await req.json();
    const links = await getAllLinks();
    const target = links.find((l) => l.id === linkId);

    if (!target) {
      return NextResponse.json({ error: 'Không tìm thấy bản ghi link.' }, { status: 404 });
    }

    const result = await syncLinkToSharePoint(target);
    if (result.success) {
      return NextResponse.json({ message: 'Đồng bộ lại sang SharePoint Excel thành công!' });
    } else {
      return NextResponse.json({ error: result.error || 'Đồng bộ lại thất bại.' }, { status: 400 });
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
