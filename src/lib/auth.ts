import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { User } from '@/types';
import { getUserByEmail, createUser } from '@/lib/db';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'duhat-link-builder-super-secret-key-2026'
);

const COOKIE_NAME = 'duhat_session';

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createSessionToken(user: User): Promise<string> {
  return new SignJWT({
    sub: user.id,
    email: user.email,
    fullName: user.fullName,
    role: user.role,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(JWT_SECRET);
}

export async function setSessionCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function getSessionUser(): Promise<User | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return null;

    const { payload } = await jwtVerify(token, JWT_SECRET);
    if (!payload.sub || !payload.email) return null;

    return {
      id: payload.sub as string,
      email: payload.email as string,
      fullName: (payload.fullName as string) || (payload.email as string),
      role: (payload.role as any) || 'MEMBER',
      createdAt: '',
    };
  } catch (err) {
    return null;
  }
}

export async function registerUser(email: string, password: string, fullName: string): Promise<User> {
  const existing = await getUserByEmail(email);
  if (existing) {
    throw new Error('Email này đã được đăng ký tài khoản.');
  }

  const passwordHash = await hashPassword(password);
  const user = await createUser(email, passwordHash, fullName);
  
  const token = await createSessionToken(user);
  await setSessionCookie(token);

  return user;
}

export async function loginUser(email: string, password: string): Promise<User> {
  const account = await getUserByEmail(email);
  if (!account) {
    throw new Error('Email hoặc mật khẩu không chính xác.');
  }

  const isValid = await verifyPassword(password, account.passwordHash);
  if (!isValid) {
    throw new Error('Email hoặc mật khẩu không chính xác.');
  }

  const token = await createSessionToken(account.user);
  await setSessionCookie(token);

  return account.user;
}
