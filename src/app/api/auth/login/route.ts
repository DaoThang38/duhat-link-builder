import { NextResponse } from 'next/server';
import { loginUser } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ error: 'Vui lòng nhập Email và Mật khẩu.' }, { status: 400 });
    }

    const user = await loginUser(email, password);
    return NextResponse.json({ user, message: 'Đăng nhập thành công!' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Đăng nhập thất bại.' }, { status: 401 });
  }
}
