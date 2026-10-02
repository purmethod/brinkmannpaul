import { NextResponse } from 'next/server';
import { HttpError, SESSION_COOKIE, sessionCookie, sessionValue, signUp } from '@/lib/auth';

/** { name, password } → a new account with its own first channel, signed in */
export async function POST(req: Request) {
  if (process.env.SIGNUP_OPEN === 'false') return NextResponse.json({ error: 'sign-up is closed right now' }, { status: 403 });
  const { name, password } = (await req.json().catch(() => ({}))) as { name?: string; password?: string };
  try {
    const user = await signUp(name ?? '', password ?? '');
    const res = NextResponse.json({ ok: true });
    res.cookies.set(SESSION_COOKIE, sessionValue(user.id), sessionCookie);
    return res;
  } catch (e) {
    const status = e instanceof HttpError ? e.status : 500;
    return NextResponse.json({ error: (e as Error).message }, { status });
  }
}
