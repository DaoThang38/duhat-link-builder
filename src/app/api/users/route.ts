import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { getAllUsers } from '@/lib/db';

export async function GET() {
  const currentUser = await getSessionUser();
  if (!currentUser) {
    return NextResponse.json({ error: 'Bạn cần đăng nhập.' }, { status: 401 });
  }

  if (currentUser.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Chỉ tài khoản ADMIN mới có quyền xem danh sách thành viên.' }, { status: 403 });
  }

  try {
    const users = await getAllUsers();
    return NextResponse.json({ users });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Lỗi khi tải danh sách thành viên.' }, { status: 500 });
  }
}
