import { safeEqual, sign } from './crypto';

export const SESSION_COOKIE = 'atelier_session';
const SESSION_DAYS = 90;

export const sessionCookie = { httpOnly: true, secure: true, sameSite: 'lax' as const, path: '/', maxAge: SESSION_DAYS * 86400 };

export function sessionValue(userId: string): string {
  const exp = Date.now() + SESSION_DAYS * 864e5;
  return `${userId}.${exp}.${sign(`${userId}.${exp}`)}`;
}

export function readSession(value: string | undefined): string | null {
  if (!value) return null;
  const [userId, exp, sig] = value.split('.');
  if (!userId || !exp || !sig || Number(exp) < Date.now()) return null;
  try {
    return safeEqual(sig, sign(`${userId}.${exp}`)) ? userId : null;
  } catch {
    return null;
  }
}
