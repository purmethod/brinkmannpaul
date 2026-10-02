import { NextResponse } from 'next/server';
import { SESSION_COOKIE, sessionCookie, sessionValue, signIn } from '@/lib/auth';

/** { name, password } — an account, or the owner's setup password */
export async function POST(req: Request) {
  const { name, password } = (await req.json().catch(() => ({}))) as { name?: string; password?: string };
  let user;
  try {
    user = await signIn(name ?? '', password ?? '');
  } catch (e) {
    // the setup is not complete yet (usually: no database connected)
    return NextResponse.json({ error: `setup incomplete: ${(e as Error).message}` }, { status: 503 });
  }
  if (!user) {
    await new Promise((r) => setTimeout(r, 800));
    return NextResponse.json({ error: 'name or password is wrong' }, { status: 401 });
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, sessionValue(user.id), sessionCookie);
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.delete(SESSION_COOKIE);
  res.cookies.delete('atelier_brand');
  return res;
}
