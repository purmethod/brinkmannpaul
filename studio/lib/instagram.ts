import { brandKey } from './brand';
import { redis } from './redis';
import { getAccessToken } from './token';
import type { Post } from './types';

const GRAPH = `https://graph.instagram.com/${process.env.IG_API_VERSION || 'v23.0'}`;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function ig<T>(brandId: string, method: 'GET' | 'POST', path: string, params: Record<string, string>): Promise<T> {
  const token = await getAccessToken(brandId);
  const qs = new URLSearchParams({ ...params, access_token: token });
  const res =
    method === 'GET'
      ? await fetch(`${GRAPH}${path}?${qs}`, { cache: 'no-store' })
      : await fetch(`${GRAPH}${path}`, { method: 'POST', body: qs, headers: { 'content-type': 'application/x-www-form-urlencoded' } });
  const json = (await res.json().catch(() => ({}))) as T & { error?: { message?: string; error_user_msg?: string; code?: number } };
  if (!res.ok || json.error) {
    const e = json.error;
    throw new Error(`instagram ${path}: ${e?.error_user_msg || e?.message || `http ${res.status}`}${e?.code ? ` (code ${e.code})` : ''}`);
  }
  return json;
}

export interface IgAccount {
  id: string;
  username?: string;
}

/** Instagram professional account behind the brand's token — fetched via GET /me and stored. */
export async function getIgAccount(brandId: string, fresh = false): Promise<IgAccount> {
  const key = brandKey(brandId, 'ig', 'account');
  if (!fresh) {
    const cached = await redis().get<IgAccount>(key);
    if (cached?.id) return { ...cached, id: String(cached.id) };
  }
  const me = await ig<{ user_id?: string | number; id?: string; username?: string }>(brandId, 'GET', '/me', { fields: 'user_id,username' });
  const account: IgAccount = { id: String(me.user_id ?? me.id), username: me.username };
  await redis().set(key, account);
  return account;
}

async function waitFinished(brandId: string, containerId: string, timeoutMs: number) {
  const until = Date.now() + timeoutMs;
  while (Date.now() < until) {
    const s = await ig<{ status_code?: string; status?: string }>(brandId, 'GET', `/${containerId}`, { fields: 'status_code,status' });
    if (s.status_code === 'FINISHED' || s.status_code === 'PUBLISHED') return;
    if (s.status_code === 'ERROR' || s.status_code === 'EXPIRED') throw new Error(`container ${containerId}: ${s.status_code} ${s.status ?? ''}`);
    await sleep(4000);
  }
  throw new Error(`container ${containerId} not ready after ${Math.round(timeoutMs / 1000)}s`);
}

export async function publishToInstagram(post: Post): Promise<{ mediaId: string; permalink?: string }> {
  const b = post.brandId;
  const { id: userId } = await getIgAccount(b);
  const create = (params: Record<string, string>) => ig<{ id: string }>(b, 'POST', `/${userId}/media`, params).then((r) => r.id);
  let creationId: string;

  if (post.type === 'carousel') {
    const slides = post.slides ?? [];
    if (!slides.length) throw new Error('no slides');
    if (slides.length === 1) {
      creationId = await create({ image_url: slides[0].jpg, caption: post.caption });
    } else {
      const children: string[] = [];
      for (const s of slides) children.push(await create({ image_url: s.jpg, is_carousel_item: 'true' }));
      for (const c of children) await waitFinished(b, c, 60_000);
      creationId = await create({ media_type: 'CAROUSEL', children: children.join(','), caption: post.caption });
    }
    await waitFinished(b, creationId, 60_000);
  } else {
    if (!post.video?.url) throw new Error('no video');
    creationId = await create({ media_type: 'REELS', video_url: post.video.url, caption: post.caption, share_to_feed: 'true' });
    await waitFinished(b, creationId, 240_000);
  }

  const mediaId = (await ig<{ id: string }>(b, 'POST', `/${userId}/media_publish`, { creation_id: creationId })).id;
  let permalink: string | undefined;
  try {
    permalink = (await ig<{ permalink?: string }>(b, 'GET', `/${mediaId}`, { fields: 'permalink' })).permalink;
  } catch {
    /* permalink is nice-to-have */
  }
  return { mediaId, permalink };
}
