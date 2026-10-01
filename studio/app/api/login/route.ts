import { NextResponse } from 'next/server';
import { SESSION_COOKIE, safeEqual, sessionToken } from '@/lib/auth';

export async function POST(req: Request) {
  const { password } = (await req.json().catch(() => ({}))) as { password?: string };
  const secret = process.env.ADMIN_SECRET;
  if (!secret || typeof password !== 'string' || !safeEqual(password, secret)) {
    await new Promise((r) => setTimeout(r, 800));
    return NextResponse.json({ error: 'wrong password' }, { status: 401 });
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, await sessionToken(), {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 60,
  });
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.delete(SESSION_COOKIE);
  return res;
}
