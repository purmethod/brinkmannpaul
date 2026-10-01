import { redis } from './redis';

const KEY = 'ig:token';
const REFRESH_AFTER_MS = 25 * 24 * 3600 * 1000; // monthly, well inside the 60 day lifetime

interface StoredToken {
  token: string;
  envToken: string; // the IG_ACCESS_TOKEN this record was seeded from
  refreshedAt: number; // 0 = unknown (seeded from env)
  expiresAt?: number;
  lastError?: string;
}

/** Token lives in redis (server-side only). IG_ACCESS_TOKEN only seeds it — or resets it when you paste a new one. */
async function record(): Promise<StoredToken> {
  const env = process.env.IG_ACCESS_TOKEN;
  const stored = await redis().get<StoredToken>(KEY);
  if (stored && (!env || stored.envToken === env)) return stored;
  if (!env) throw new Error('IG_ACCESS_TOKEN not set');
  const fresh: StoredToken = { token: env, envToken: env, refreshedAt: 0 };
  await redis().set(KEY, fresh);
  return fresh;
}

export async function getAccessToken(): Promise<string> {
  return (await record()).token;
}

export async function refreshToken(force = false): Promise<{ refreshed: boolean; error?: string }> {
  const rec = await record();
  if (!force && Date.now() - rec.refreshedAt < REFRESH_AFTER_MS) return { refreshed: false };
  const url = `https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token&access_token=${encodeURIComponent(rec.token)}`;
  const res = await fetch(url);
  const json = (await res.json()) as { access_token?: string; expires_in?: number; error?: { message?: string } };
  if (!res.ok || !json.access_token) {
    const error = json.error?.message ?? `http ${res.status}`;
    await redis().set(KEY, { ...rec, lastError: error });
    return { refreshed: false, error };
  }
  await redis().set(KEY, {
    ...rec,
    token: json.access_token,
    refreshedAt: Date.now(),
    expiresAt: json.expires_in ? Date.now() + json.expires_in * 1000 : undefined,
    lastError: undefined,
  });
  return { refreshed: true };
}

export async function tokenInfo(): Promise<{ refreshedAt: number; expiresAt?: number; lastError?: string } | null> {
  try {
    const r = await record();
    return { refreshedAt: r.refreshedAt, expiresAt: r.expiresAt, lastError: r.lastError };
  } catch {
    return null;
  }
}
