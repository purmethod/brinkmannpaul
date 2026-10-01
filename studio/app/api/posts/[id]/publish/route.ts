import { NextResponse } from 'next/server';
import { publishPost } from '@/lib/queue';

export const runtime = 'nodejs';
export const maxDuration = 300;

// manual "post now" for an approved post
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const post = await publishPost((await params).id);
    return NextResponse.json({ post }, { status: post.status === 'posted' ? 200 : 502 });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 409 });
  }
}
