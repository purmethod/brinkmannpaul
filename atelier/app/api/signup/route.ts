import { NextResponse } from 'next/server';
import { HttpError, SESSION_COOKIE, clientKey, recordAttempt, sessionCookie, sessionValue, signUp, tooManyAttempts } from '@/lib/auth';

/** { name, password } → a new account with its own first channel, signed in */
export async function POST(req: Request) {
  if (process.env.SIGNUP_OPEN === 'false') return NextResponse.json({ error: 'sign-up is closed right now' }, { status: 403 });
  const { name, password } = (await req.json().catch(() => ({}))) as { name?: string; password?: string };
  try {
    // at most 5 new accounts per address in 15 minutes
    const key = [`signup:${clientKey(req)}`];
    if (await tooManyAttempts(key, 5)) return NextResponse.json({ error: 'too many new accounts from here — try later' }, { status: 429 });
    await recordAttempt(key);
    const user = await signUp(name ?? '', password ?? '');
    const res = NextResponse.json({ ok: true });
    res.cookies.set(SESSION_COOKIE, sessionValue(user.id), sessionCookie);
    return res;
  } catch (e) {
    const status = e instanceof HttpError ? e.status : 500;
    return NextResponse.json({ error: (e as Error).message }, { status });
  }
}
