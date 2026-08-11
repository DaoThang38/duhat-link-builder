import { NextResponse } from 'next/server';
import { getSessionUser, createSessionToken, setSessionCookie } from '@/lib/auth';
import { updateUserName } from '@/lib/db';

export async function PUT(req: Request) {
  const currentUser = await getSessionUser();
  if (!currentUser) {
    return NextResponse.json({ error: 'Bạn cần đăng nhập để đổi tên.' }, { status: 401 });
  }

  try {
    const { fullName } = await req.json();
    if (!fullName || !fullName.trim()) {
      return NextResponse.json({ error: 'Vui lòng nhập họ và tên hợp lệ.' }, { status: 400 });
    }

    const updatedUser = await updateUserName(currentUser.id, fullName.trim());
    if (!updatedUser) {
      return NextResponse.json({ error: 'Không tìm thấy thông tin tài khoản.' }, { status: 404 });
    }

    // Refresh JWT session cookie with new full name
    const token = await createSessionToken(updatedUser);
    await setSessionCookie(token);

    return NextResponse.json({ user: updatedUser, message: 'Đã đổi tên hiển thị thành công!' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Lỗi khi cập nhật tên.' }, { status: 500 });
  }
}
