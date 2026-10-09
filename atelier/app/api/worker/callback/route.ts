import { safeEqual } from '@/lib/crypto';
import { one } from '@/lib/db';
import { finishRender } from '@/lib/posts';
import { runDueFor } from '@/lib/schedule';
import type { BrandRow, Post } from '@/lib/types';
import { callbackToken } from '@/lib/worker';

export const maxDuration = 60;

// the render worker reports back here (token = hmac of the post id, no shared secret in github)
export async function POST(req: Request) {
  const b = (await req.json().catch(() => ({}))) as {
    postId?: string; token?: string; ok?: boolean; videoUrl?: string; coverUrl?: string; duration?: number; transcript?: string; plan?: unknown; error?: string;
  };
  if (!b.postId || !b.token || !safeEqual(b.token, callbackToken(b.postId))) return Response.json({ error: 'unauthorized' }, { status: 401 });
  const post = await one<Post>('select * from posts where id = $1', [b.postId]);
  if (!post) return Response.json({ error: 'post not found' }, { status: 404 });
  const row = (await one<BrandRow>('select * from brands where id = $1', [post.brand_id]))!;
  await finishRender(post, row, { ok: Boolean(b.ok), videoUrl: b.videoUrl, coverUrl: b.coverUrl, duration: b.duration, transcript: b.transcript, plan: b.plan, error: b.error });
  // "post it now": out as soon as the cut is back
  await runDueFor(post.id).catch((e) => console.error('run due', e));
  return Response.json({ ok: true });
}
