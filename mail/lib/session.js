// Stateless sessions: an HMAC-signed cookie that carries the email and an expiry.

import crypto from 'node:crypto';

export function createSigner(secret, purpose) {
  const key = crypto.createHash('sha256').update(`zero:${purpose}:${secret}`).digest();
  const mac = body => crypto.createHmac('sha256', key).update(body).digest('base64url');

  return {
    sign(payload, ttlSeconds) {
      const body = Buffer.from(JSON.stringify({ ...payload, exp: Date.now() + ttlSeconds * 1000 })).toString('base64url');
      return `${body}.${mac(body)}`;
    },
    verify(token) {
      const [body, signature] = String(token || '').split('.');
      if (!body || !signature) return null;
      const expected = Buffer.from(mac(body));
      const given = Buffer.from(signature);
      if (expected.length !== given.length || !crypto.timingSafeEqual(expected, given)) return null;
      try {
        const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
        return payload.exp > Date.now() ? payload : null;
      } catch {
        return null;
      }
    },
  };
}

export function parseCookies(header = '') {
  const out = {};
  for (const part of header.split(';')) {
    const i = part.indexOf('=');
    if (i > 0) out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim());
  }
  return out;
}

export function cookie(name, value, { maxAge, secure }) {
  return [
    `${name}=${encodeURIComponent(value)}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${maxAge}`,
    secure ? 'Secure' : '',
  ].filter(Boolean).join('; ');
}
