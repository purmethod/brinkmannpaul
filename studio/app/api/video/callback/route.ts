import { NextResponse } from 'next/server';
import { bearerMatches } from '@/lib/auth';
import { getBrand } from '@/lib/brand';
import { writeCaption } from '@/lib/claude';
import { initialStatus } from '@/lib/posts';
import { getPost, savePost } from '@/lib/store';

export const runtime = 'nodejs';
export const maxDuration = 60;

// called by the github action when a reel is rendered (or failed)
export async function POST(req: Request) {
  if (!bearerMatches(req, process.env.ADMIN_SECRET)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const body = (await req.json().catch(() => ({}))) as {
    postId?: string;
    ok?: boolean;
    videoUrl?: string;
    duration?: number;
    transcript?: string;
    error?: string;
  };
  const post = body.postId ? await getPost(body.postId) : null;
  if (!post) return NextResponse.json({ error: 'post not found' }, { status: 404 });

  if (!body.ok || !body.videoUrl) {
    await savePost({ ...post, status: 'error', error: `video: ${body.error ?? 'processing failed'}` });
    return NextResponse.json({ ok: true });
  }

  let caption = post.caption;
  let error: string | null = null;
  if (!caption) {
    try {
      caption = body.transcript ? await writeCaption(await getBrand(post.brandId), 'reel', body.transcript) : '';
    } catch (e) {
      error = `caption: ${(e as Error).message}`;
    }
  }
  const status = await initialStatus(post.brandId);
  await savePost({
    ...post,
    status,
    approvedAt: status === 'approved' ? Date.now() : undefined,
    caption,
    transcript: body.transcript,
    video: { url: body.videoUrl, duration: body.duration },
    error,
  });
  return NextResponse.json({ ok: true });
}
