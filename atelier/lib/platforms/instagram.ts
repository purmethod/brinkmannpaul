import type { Post } from '../types';
import type { Connection, ConnectionData, Platform } from './types';

/*
 * Instagram API with Facebook Login (graph.facebook.com).
 * The instagram professional account must be linked to a facebook page.
 * We publish with the page access token — derived from a long-lived user token it does not expire.
 */

const V = process.env.META_GRAPH_VERSION || 'v23.0';
const GRAPH = `https://graph.facebook.com/${V}`;
const SCOPES = ['instagram_basic', 'instagram_content_publish', 'pages_show_list', 'pages_read_engagement', 'business_management'];
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function app() {
  const id = process.env.META_APP_ID;
  const secret = process.env.META_APP_SECRET;
  if (!id || !secret) throw new Error('META_APP_ID / META_APP_SECRET missing');
  return { id, secret };
}

async function graph<T>(method: 'GET' | 'POST', path: string, params: Record<string, string>): Promise<T> {
  const qs = new URLSearchParams(params);
  const res =
    method === 'GET'
      ? await fetch(`${GRAPH}${path}?${qs}`, { cache: 'no-store' })
      : await fetch(`${GRAPH}${path}`, { method: 'POST', body: qs, headers: { 'content-type': 'application/x-www-form-urlencoded' } });
  const json = (await res.json().catch(() => ({}))) as T & { error?: { message?: string; error_user_msg?: string; code?: number } };
  if (!res.ok || json.error) {
    const e = json.error;
    throw new Error(`instagram: ${e?.error_user_msg || e?.message || `http ${res.status}`}${e?.code ? ` (code ${e.code})` : ''}`);
  }
  return json;
}

async function longLived(token: string) {
  const { id, secret } = app();
  return graph<{ access_token: string; expires_in?: number }>('GET', '/oauth/access_token', {
    grant_type: 'fb_exchange_token',
    client_id: id,
    client_secret: secret,
    fb_exchange_token: token,
  });
}

async function pageWithInstagram(userToken: string) {
  const pages = await graph<{
    data: { id: string; name: string; access_token: string; instagram_business_account?: { id: string; username?: string } }[];
  }>('GET', '/me/accounts', { fields: 'id,name,access_token,instagram_business_account{id,username}', access_token: userToken, limit: '100' });
  const page = pages.data.find((p) => p.instagram_business_account);
  if (!page) throw new Error('no facebook page with a linked instagram professional account found — link them in the instagram app (settings → accounts center) and try again');
  return page;
}

async function waitFinished(container: string, token: string, timeoutMs: number) {
  const until = Date.now() + timeoutMs;
  while (Date.now() < until) {
    const s = await graph<{ status_code?: string; status?: string }>('GET', `/${container}`, { fields: 'status_code,status', access_token: token });
    if (s.status_code === 'FINISHED' || s.status_code === 'PUBLISHED') return;
    if (s.status_code === 'ERROR' || s.status_code === 'EXPIRED') throw new Error(`instagram processing failed: ${s.status ?? s.status_code}`);
    await sleep(4000);
  }
  throw new Error(`instagram still processing after ${Math.round(timeoutMs / 1000)}s`);
}

export const instagram: Platform = {
  id: 'instagram',
  label: 'instagram',
  available: true,

  authorizeUrl(state, redirectUri) {
    const params = new URLSearchParams({ client_id: app().id, redirect_uri: redirectUri, state, response_type: 'code' });
    // facebook login for business: a configuration id replaces the scope list
    if (process.env.META_CONFIG_ID) params.set('config_id', process.env.META_CONFIG_ID);
    else params.set('scope', SCOPES.join(','));
    return `https://www.facebook.com/${V}/dialog/oauth?${params}`;
  },

  async handleCallback(code, redirectUri) {
    const { id, secret } = app();
    const short = await graph<{ access_token: string }>('GET', '/oauth/access_token', {
      client_id: id,
      client_secret: secret,
      redirect_uri: redirectUri,
      code,
    });
    const long = await longLived(short.access_token);
    const page = await pageWithInstagram(long.access_token);
    return {
      accountId: page.instagram_business_account!.id,
      username: page.instagram_business_account!.username,
      pageId: page.id,
      token: page.access_token,
      userToken: long.access_token,
      expiresAt: long.expires_in ? new Date(Date.now() + long.expires_in * 1000) : null,
    };
  },

  async refresh(conn) {
    if (!conn.userToken) return null;
    const long = await longLived(conn.userToken);
    const page = await pageWithInstagram(long.access_token);
    return {
      token: page.access_token,
      userToken: long.access_token,
      username: page.instagram_business_account?.username ?? conn.username,
      expiresAt: long.expires_in ? new Date(Date.now() + long.expires_in * 1000) : conn.expiresAt,
    };
  },

  async publish(conn, post: Post) {
    const token = conn.token;
    const create = (params: Record<string, string>) =>
      graph<{ id: string }>('POST', `/${conn.accountId}/media`, { ...params, access_token: token }).then((r) => r.id);
    const collab: Record<string, string> = post.options.collaborators?.length ? { collaborators: JSON.stringify(post.options.collaborators) } : {};
    let creation: string;

    if (post.kind === 'reel') {
      if (!post.output.video) throw new Error('video not rendered yet');
      creation = await create({
        media_type: 'REELS',
        video_url: post.output.video,
        caption: post.caption,
        share_to_feed: 'true',
        ...(post.output.cover ? { cover_url: post.output.cover } : {}),
        ...collab,
      });
      await waitFinished(creation, token, 240_000);
    } else {
      const slides = post.output.slides ?? [];
      if (!slides.length) throw new Error('nothing rendered yet');
      if (slides.length === 1) {
        creation = await create({ image_url: slides[0].jpg, caption: post.caption, ...collab });
      } else {
        const children: string[] = [];
        for (const s of slides) children.push(await create({ image_url: s.jpg, is_carousel_item: 'true' }));
        for (const c of children) await waitFinished(c, token, 60_000);
        creation = await create({ media_type: 'CAROUSEL', children: children.join(','), caption: post.caption, ...collab });
      }
      await waitFinished(creation, token, 60_000);
    }

    const { id: mediaId } = await graph<{ id: string }>('POST', `/${conn.accountId}/media_publish`, { creation_id: creation, access_token: token });
    const permalink = await graph<{ permalink?: string }>('GET', `/${mediaId}`, { fields: 'permalink', access_token: token })
      .then((r) => r.permalink)
      .catch(() => undefined);
    return { mediaId, permalink };
  },
};
