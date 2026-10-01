export const SESSION_COOKIE = 'studio_session';

async function sha256hex(input: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input));
  return Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, '0')).join('');
}

export function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/** Cookie value derived from ADMIN_SECRET — the secret itself never leaves the server. */
export async function sessionToken(): Promise<string> {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) throw new Error('ADMIN_SECRET not set');
  return sha256hex(`${secret}:studio-session`);
}

export async function isValidSession(value: string | undefined): Promise<boolean> {
  if (!value || !process.env.ADMIN_SECRET) return false;
  return safeEqual(value, await sessionToken());
}

export function bearerMatches(req: Request, ...secrets: (string | undefined)[]): boolean {
  const token = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  if (!token) return false;
  return secrets.some((s) => Boolean(s) && safeEqual(token, s as string));
}
