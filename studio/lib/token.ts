import { brandKey, defaultBrandId } from './brand';
import { redis } from './redis';

const DAY = 24 * 3600 * 1000;
const REFRESH_AFTER_MS = 25 * DAY; // monthly, well inside the 60 day lifetime

interface StoredToken {
  token: string;
  envToken?: string; // the IG_ACCESS_TOKEN this record was seeded from
  refreshedAt: number;
  expiresAt?: number;
  lastError?: string;
}

const tokenKey = (brandId: string) => brandKey(brandId, 'ig', 'token');

/**
 * Token per brand, stored server-side in redis. For the default brand IG_ACCESS_TOKEN seeds it
 * (and resets it when a new one is pasted). Later each customer's token comes from the OAuth flow.
 */
async function record(brandId: string): Promise<StoredToken> {
  const env = brandId === defaultBrandId() ? process.env.IG_ACCESS_TOKEN : undefined;
  const stored = await redis().get<StoredToken>(tokenKey(brandId));
  if (stored && (!env || stored.envToken === env)) return stored;
  if (!env) throw new Error(`instagram is not connected for ${brandId} (IG_ACCESS_TOKEN missing)`);
  // a freshly pasted token can only be refreshed after 24h — first refresh runs in ~5 days
  const fresh: StoredToken = { token: env, envToken: env, refreshedAt: Date.now() - 20 * DAY };
  await redis().set(tokenKey(brandId), fresh);
  await redis().del(brandKey(brandId, 'ig', 'account'));
  return fresh;
}

export async function getAccessToken(brandId: string): Promise<string> {
  return (await record(brandId)).token;
}

export async function refreshToken(brandId: string, force = false): Promise<{ refreshed: boolean; error?: string }> {
  const rec = await record(brandId);
  if (!force && Date.now() - rec.refreshedAt < REFRESH_AFTER_MS) return { refreshed: false };
  const url = `https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token&access_token=${encodeURIComponent(rec.token)}`;
  const res = await fetch(url);
  const json = (await res.json()) as { access_token?: string; expires_in?: number; error?: { message?: string } };
  if (!res.ok || !json.access_token) {
    const error = json.error?.message ?? `http ${res.status}`;
    await redis().set(tokenKey(brandId), { ...rec, lastError: error });
    return { refreshed: false, error };
  }
  await redis().set(tokenKey(brandId), {
    ...rec,
    token: json.access_token,
    refreshedAt: Date.now(),
    expiresAt: json.expires_in ? Date.now() + json.expires_in * 1000 : undefined,
    lastError: undefined,
  });
  return { refreshed: true };
}

export async function tokenInfo(brandId: string): Promise<{ refreshedAt: number; expiresAt?: number; lastError?: string } | null> {
  try {
    const r = await record(brandId);
    return { refreshedAt: r.refreshedAt, expiresAt: r.expiresAt, lastError: r.lastError };
  } catch {
    return null;
  }
}
