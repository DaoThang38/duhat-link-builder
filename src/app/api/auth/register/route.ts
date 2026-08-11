import { NextResponse } from 'next/server';
import { registerUser } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password, fullName } = body;

    if (!email || !password || !fullName) {
      return NextResponse.json({ error: 'Vui lòng điền đầy đủ Họ tên, Email và Mật khẩu.' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Mật khẩu phải chứa ít nhất 6 ký tự.' }, { status: 400 });
    }

    const user = await registerUser(email, password, fullName);
    return NextResponse.json({ user, message: 'Đăng ký tài khoản thành công!' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Đăng ký thất bại. Vui lòng thử lại.' }, { status: 400 });
  }
}
