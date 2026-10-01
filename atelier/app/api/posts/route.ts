import { HttpError, requireCtx, route } from '@/lib/auth';
import { mediaByNumbers } from '@/lib/media';
import { createPost, listPosts } from '@/lib/posts';
import type { PostKind } from '@/lib/types';

export const maxDuration = 120;

export const GET = route(async () => {
  const { brand } = await requireCtx();
  return Response.json({ posts: await listPosts(brand.id) });
});

/** { media?: number[], text?: string, template?: string, kind?: 'reel'|'carousel'|'photo' } */
export const POST = route(async (req: Request) => {
  const { brand } = await requireCtx(req);
  const body = (await req.json().catch(() => ({}))) as { media?: number[]; text?: string; template?: string; kind?: PostKind };
  const media = body.media?.length ? await mediaByNumbers(brand.id, body.media.map(Number)) : [];
  if (!media.length && !body.text?.trim()) throw new HttpError(400, 'choose media or write text');
  const post = await createPost(brand, { media, text: body.text?.trim() || null, template: body.template, kind: body.kind });
  return Response.json({ post });
});
