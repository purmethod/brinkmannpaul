import { createCipheriv, createDecipheriv, createHash, createHmac, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

function key(): Buffer {
  const raw = process.env.ENCRYPTION_KEY;
  if (!raw || raw.length < 16) throw new Error('ENCRYPTION_KEY missing (32+ random characters)');
  return createHash('sha256').update(raw).digest();
}

/** AES-256-GCM, output: iv.tag.ciphertext (base64url). Used for platform tokens. */
export function encrypt(plain: string): string {
  const iv = randomBytes(12);
  const c = createCipheriv('aes-256-gcm', key(), iv);
  const enc = Buffer.concat([c.update(plain, 'utf8'), c.final()]);
  return [iv, c.getAuthTag(), enc].map((b) => b.toString('base64url')).join('.');
}

export function decrypt(blob: string): string {
  const [iv, tag, enc] = blob.split('.').map((p) => Buffer.from(p, 'base64url'));
  const d = createDecipheriv('aes-256-gcm', key(), iv);
  d.setAuthTag(tag);
  return Buffer.concat([d.update(enc), d.final()]).toString('utf8');
}

export function sign(value: string): string {
  return createHmac('sha256', key()).update(value).digest('base64url');
}

export function safeEqual(a: string, b: string): boolean {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

export function sha256(value: string): string {
  return createHash('sha256').update(value).digest('base64url');
}

export function token(bytes = 32): string {
  return randomBytes(bytes).toString('base64url');
}

/** Account passwords: scrypt with a random salt, stored as scrypt$salt$hash. */
export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('base64url');
  return `scrypt$${salt}$${scryptSync(password, salt, 64).toString('base64url')}`;
}

export function verifyPassword(password: string, stored: string | null | undefined): boolean {
  const [kind, salt, hash] = (stored ?? '').split('$');
  if (kind !== 'scrypt' || !salt || !hash) return false;
  return safeEqual(scryptSync(password, salt, 64).toString('base64url'), hash);
}
