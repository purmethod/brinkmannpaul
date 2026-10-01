import { NextResponse } from 'next/server';
import { defaultBrandId } from '@/lib/brand';
import { createCarouselPost, createReelPost, isBlobUrl } from '@/lib/posts';
import { listPosts } from '@/lib/store';

export const runtime = 'nodejs';
export const maxDuration = 120;

export async function GET() {
  return NextResponse.json({ posts: await listPosts(defaultBrandId()) });
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as {
    type?: string;
    templateId?: string;
    text?: string;
    media?: string[];
    scheduledFor?: string;
  };
  const media = Array.isArray(body.media) ? body.media.filter(isBlobUrl) : [];
  try {
    if (!body.templateId) throw new Error('choose a template');
    if (body.type === 'carousel') {
      const post = await createCarouselPost({ templateId: body.templateId, text: body.text, photos: media, scheduledFor: body.scheduledFor });
      return NextResponse.json({ post });
    }
    if (body.type === 'reel') {
      const post = await createReelPost({
        templateId: body.templateId,
        clips: media,
        scheduledFor: body.scheduledFor,
        origin: new URL(req.url).origin,
      });
      return NextResponse.json({ post });
    }
    throw new Error('type must be carousel or reel');
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
