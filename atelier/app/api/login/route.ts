import { NextResponse } from 'next/server';
import { SESSION_COOKIE, checkPassword, ensureOwner, sessionCookie, sessionValue } from '@/lib/auth';

export async function POST(req: Request) {
  const { password } = (await req.json().catch(() => ({}))) as { password?: string };
  if (!checkPassword(password ?? '')) {
    await new Promise((r) => setTimeout(r, 800));
    return NextResponse.json({ error: 'wrong password' }, { status: 401 });
  }
  let user;
  try {
    user = await ensureOwner();
  } catch (e) {
    // password was right — the setup is not complete yet (usually: no database connected)
    return NextResponse.json({ error: `password ok, but: ${(e as Error).message}` }, { status: 503 });
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, sessionValue(user.id), sessionCookie);
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.delete(SESSION_COOKIE);
  return res;
}
