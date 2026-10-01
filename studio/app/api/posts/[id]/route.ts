import { NextResponse } from 'next/server';
import { del } from '@vercel/blob';
import { dispatchVideoJob } from '@/lib/github';
import { rerenderCarousel } from '@/lib/posts';
import { deletePost, getPost, savePost } from '@/lib/store';
import type { Post } from '@/lib/types';

export const runtime = 'nodejs';
export const maxDuration = 120;

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Ctx) {
  const post = await getPost((await params).id);
  if (!post) return NextResponse.json({ error: 'not found' }, { status: 404 });
  return NextResponse.json({ post });
}

/**
 * Body (all optional): caption, scheduledFor (YYYY-MM-DD | null), templateId (with rerender),
 * action: 'approve' | 'unapprove' | 'retry' | 'rerender'
 */
export async function PATCH(req: Request, { params }: Ctx) {
  const post = await getPost((await params).id);
  if (!post) return NextResponse.json({ error: 'not found' }, { status: 404 });
  const body = (await req.json().catch(() => ({}))) as { caption?: string; scheduledFor?: string | null; action?: string; templateId?: string };
  if (post.status === 'posted') return NextResponse.json({ error: 'already posted' }, { status: 409 });

  let next: Post = { ...post };
  if (typeof body.caption === 'string') next.caption = body.caption.slice(0, 2200);
  if (body.scheduledFor === null || body.scheduledFor === '') next.scheduledFor = null;
  else if (typeof body.scheduledFor === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(body.scheduledFor)) next.scheduledFor = body.scheduledFor;

  const ready = post.type === 'carousel' ? Boolean(post.slides?.length) : Boolean(post.video?.url);
  try {
    if (body.action === 'rerender') {
      next = await rerenderCarousel(next, body.templateId || post.templateId);
    } else if (body.action === 'approve') {
      if (!ready) throw new Error('nothing rendered yet');
      next.status = 'approved';
      next.approvedAt = Date.now();
      next.error = null;
    } else if (body.action === 'unapprove') {
      next.status = ready ? 'draft' : post.status;
    } else if (body.action === 'retry') {
      if (ready) {
        // publishing failed earlier: back into the queue
        next.status = 'approved';
        next.approvedAt = Date.now();
        next.error = null;
      } else if (post.type === 'reel') {
        next.status = 'processing';
        next.error = null;
        try {
          await dispatchVideoJob(next, new URL(req.url).origin);
        } catch (e) {
          next.status = 'error';
          next.error = `dispatch: ${(e as Error).message}`;
        }
      }
    }
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 409 });
  }
  return NextResponse.json({ post: await savePost(next) });
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const post = await getPost((await params).id);
  if (!post) return NextResponse.json({ ok: true });
  const urls = [...(post.slides ?? []).flatMap((s) => [s.png, s.jpg]), ...(post.video ? [post.video.url] : []), ...(post.source.media ?? [])];
  if (urls.length) await del(urls).catch(() => undefined);
  await deletePost(post);
  return NextResponse.json({ ok: true });
}
