import { redis } from './redis';
import { getAccessToken } from './token';
import type { Post } from './types';

const GRAPH = 'https://graph.instagram.com/v23.0';
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function ig<T>(method: 'GET' | 'POST', path: string, params: Record<string, string>): Promise<T> {
  const token = await getAccessToken();
  const qs = new URLSearchParams({ ...params, access_token: token });
  const res =
    method === 'GET'
      ? await fetch(`${GRAPH}${path}?${qs}`)
      : await fetch(`${GRAPH}${path}`, { method: 'POST', body: qs, headers: { 'content-type': 'application/x-www-form-urlencoded' } });
  const json = (await res.json()) as T & { error?: { message?: string; error_user_msg?: string } };
  if (!res.ok || json.error) {
    throw new Error(`instagram ${path}: ${json.error?.error_user_msg || json.error?.message || `http ${res.status}`}`);
  }
  return json;
}

/** Instagram professional account id, fetched once via GET /me and stored. */
export async function getIgUserId(): Promise<string> {
  const cached = await redis().get<string>('ig:userId');
  if (cached) return String(cached);
  const me = await ig<{ user_id?: string | number; id?: string; username?: string }>('GET', '/me', { fields: 'user_id,username' });
  const id = String(me.user_id ?? me.id);
  await redis().set('ig:userId', id);
  if (me.username) await redis().set('ig:username', me.username);
  return id;
}

async function waitFinished(containerId: string, timeoutMs: number) {
  const until = Date.now() + timeoutMs;
  while (Date.now() < until) {
    const s = await ig<{ status_code?: string; status?: string }>('GET', `/${containerId}`, { fields: 'status_code,status' });
    if (s.status_code === 'FINISHED') return;
    if (s.status_code === 'ERROR' || s.status_code === 'EXPIRED') throw new Error(`container ${containerId}: ${s.status_code} ${s.status ?? ''}`);
    await sleep(5000);
  }
  throw new Error(`container ${containerId} not ready after ${Math.round(timeoutMs / 1000)}s`);
}

async function publish(userId: string, creationId: string): Promise<string> {
  const r = await ig<{ id: string }>('POST', `/${userId}/media_publish`, { creation_id: creationId });
  return r.id;
}

export async function publishToInstagram(post: Post): Promise<{ mediaId: string; permalink?: string }> {
  const userId = await getIgUserId();
  let creationId: string;

  if (post.type === 'carousel') {
    const slides = post.slides ?? [];
    if (!slides.length) throw new Error('no slides');
    if (slides.length === 1) {
      creationId = (await ig<{ id: string }>('POST', `/${userId}/media`, { image_url: slides[0].jpg, caption: post.caption })).id;
    } else {
      const children: string[] = [];
      for (const s of slides) {
        const c = await ig<{ id: string }>('POST', `/${userId}/media`, { image_url: s.jpg, is_carousel_item: 'true' });
        children.push(c.id);
      }
      for (const c of children) await waitFinished(c, 60_000);
      creationId = (
        await ig<{ id: string }>('POST', `/${userId}/media`, { media_type: 'CAROUSEL', children: children.join(','), caption: post.caption })
      ).id;
    }
    await waitFinished(creationId, 60_000);
  } else {
    if (!post.video?.url) throw new Error('no video');
    creationId = (
      await ig<{ id: string }>('POST', `/${userId}/media`, {
        media_type: 'REELS',
        video_url: post.video.url,
        caption: post.caption,
        share_to_feed: 'true',
      })
    ).id;
    await waitFinished(creationId, 240_000);
  }

  const mediaId = await publish(userId, creationId);
  let permalink: string | undefined;
  try {
    permalink = (await ig<{ permalink?: string }>('GET', `/${mediaId}`, { fields: 'permalink' })).permalink;
  } catch {
    /* permalink is nice-to-have */
  }
  return { mediaId, permalink };
}
