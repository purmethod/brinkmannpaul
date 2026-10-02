import type { Post } from '../types';
import type { Connection, ConnectionData, Platform } from './types';

/*
 * Instagram API with Instagram Login (graph.instagram.com).
 * Works for professional accounts (creator + business) — no facebook page needed.
 * Personal accounts cannot publish through any Instagram API; they use the share flow in the app instead.
 */

const V = process.env.IG_API_VERSION || 'v23.0';
const GRAPH = `https://graph.instagram.com/${V}`;
const SCOPES = ['instagram_business_basic', 'instagram_business_content_publish'];
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function app() {
  const id = process.env.INSTAGRAM_APP_ID || process.env.META_APP_ID;
  const secret = process.env.INSTAGRAM_APP_SECRET || process.env.META_APP_SECRET;
  if (!id || !secret) throw new Error('instagram app not configured (INSTAGRAM_APP_ID / INSTAGRAM_APP_SECRET)');
  return { id, secret };
}

type IgError = { error?: { message?: string; error_user_msg?: string; code?: number } | string; error_message?: string };

async function call<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { cache: 'no-store', ...init });
  const json = (await res.json().catch(() => ({}))) as T & IgError;
  if (!res.ok || json.error) {
    const e = json.error;
    const msg = typeof e === 'string' ? json.error_message || e : e?.error_user_msg || e?.message;
    throw new Error(`instagram: ${msg || `http ${res.status}`}${typeof e === 'object' && e?.code ? ` (code ${e.code})` : ''}`);
  }
  return json;
}

const get = <T>(path: string, params: Record<string, string>) => call<T>(`${GRAPH}${path}?${new URLSearchParams(params)}`);
const post = <T>(path: string, params: Record<string, string>) =>
  call<T>(`${GRAPH}${path}`, { method: 'POST', body: new URLSearchParams(params), headers: { 'content-type': 'application/x-www-form-urlencoded' } });

async function waitFinished(container: string, token: string, timeoutMs: number) {
  const until = Date.now() + timeoutMs;
  while (Date.now() < until) {
    const s = await get<{ status_code?: string; status?: string }>(`/${container}`, { fields: 'status_code,status', access_token: token });
    if (s.status_code === 'FINISHED' || s.status_code === 'PUBLISHED') return;
    if (s.status_code === 'ERROR' || s.status_code === 'EXPIRED') throw new Error(`instagram processing failed: ${s.status ?? s.status_code}`);
    await sleep(4000);
  }
  throw new Error(`instagram still processing after ${Math.round(timeoutMs / 1000)}s`);
}

async function profile(token: string) {
  return get<{ user_id?: string; id?: string; username?: string; account_type?: string }>('/me', {
    fields: 'user_id,username,account_type',
    access_token: token,
  });
}

export const instagram: Platform = {
  id: 'instagram',
  label: 'instagram',
  available: true,

  authorizeUrl(state, redirectUri) {
    const params = new URLSearchParams({
      client_id: app().id,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: SCOPES.join(','),
      state,
      enable_fb_login: '0',
      force_reauth: 'true',
    });
    return `https://www.instagram.com/oauth/authorize?${params}`;
  },

  async handleCallback(code, redirectUri) {
    const { id, secret } = app();
    const short = await call<{ access_token: string; user_id?: string | number }>('https://api.instagram.com/oauth/access_token', {
      method: 'POST',
      body: new URLSearchParams({ client_id: id, client_secret: secret, grant_type: 'authorization_code', redirect_uri: redirectUri, code: code.replace(/#_$/, '') }),
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
    });
    const long = await call<{ access_token: string; expires_in?: number }>(
      `https://graph.instagram.com/access_token?${new URLSearchParams({ grant_type: 'ig_exchange_token', client_secret: secret, access_token: short.access_token })}`,
    );
    const me = await profile(long.access_token);
    return {
      accountId: String(me.user_id ?? me.id ?? short.user_id),
      username: me.username,
      token: long.access_token,
      expiresAt: long.expires_in ? new Date(Date.now() + long.expires_in * 1000) : null,
    } satisfies ConnectionData;
  },

  async refresh(conn: Connection) {
    const r = await call<{ access_token: string; expires_in?: number }>(
      `https://graph.instagram.com/refresh_access_token?${new URLSearchParams({ grant_type: 'ig_refresh_token', access_token: conn.token })}`,
    );
    return { token: r.access_token, expiresAt: r.expires_in ? new Date(Date.now() + r.expires_in * 1000) : conn.expiresAt };
  },

  async publish(conn, p: Post) {
    const token = conn.token;
    const user = conn.accountId;
    const create = (params: Record<string, string>) => post<{ id: string }>(`/${user}/media`, { ...params, access_token: token }).then((r) => r.id);
    const collab: Record<string, string> = p.options.collaborators?.length ? { collaborators: JSON.stringify(p.options.collaborators) } : {};
    let creation: string;

    if (p.kind === 'reel') {
      if (!p.output.video) throw new Error('video not rendered yet');
      creation = await create({
        media_type: 'REELS',
        video_url: p.output.video,
        caption: p.caption,
        share_to_feed: 'true',
        ...(p.output.cover ? { cover_url: p.output.cover } : {}),
        ...collab,
      });
      await waitFinished(creation, token, 240_000);
    } else {
      const slides = p.output.slides ?? [];
      if (!slides.length) throw new Error('nothing rendered yet');
      if (slides.length === 1) {
        creation = await create({ image_url: slides[0].jpg, caption: p.caption, ...collab });
      } else {
        const children: string[] = [];
        for (const s of slides) children.push(await create({ image_url: s.jpg, is_carousel_item: 'true' }));
        for (const c of children) await waitFinished(c, token, 60_000);
        creation = await create({ media_type: 'CAROUSEL', children: children.join(','), caption: p.caption, ...collab });
      }
      await waitFinished(creation, token, 60_000);
    }

    const { id: mediaId } = await post<{ id: string }>(`/${user}/media_publish`, { creation_id: creation, access_token: token });
    const permalink = await get<{ permalink?: string }>(`/${mediaId}`, { fields: 'permalink', access_token: token })
      .then((r) => r.permalink)
      .catch(() => undefined);
    return { mediaId, permalink };
  },
};
