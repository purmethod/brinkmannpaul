import { HttpError, requireCtx, route } from '@/lib/auth';
import { id, q } from '@/lib/db';
import { getPost, resolveTemplate } from '@/lib/posts';
import { updateSettings } from '@/lib/rules';
import type { SavedTemplate } from '@/lib/types';

const MAX = 5;

/** Save a post's look as a style: { postId, name } */
export const POST = route(async (req: Request) => {
  const { brand } = await requireCtx(req);
  const b = (await req.json()) as { postId?: string; name?: string };
  const post = b.postId ? await getPost(b.postId, brand.id) : null;
  if (!post) throw new HttpError(404, 'post not found');
  const list = brand.settings?.savedTemplates ?? [];
  if (list.length >= MAX) throw new HttpError(409, `max ${MAX} saved styles — delete one in settings`);
  const { base, notes } = resolveTemplate(brand, post.template);
  const feedback = await q<{ text: string }>('select text from edit_feedback where post_id = $1 order by created_at', [post.id]);
  const style: SavedTemplate = {
    id: id('sty'),
    name: (b.name || `style ${list.length + 1}`).toLowerCase().slice(0, 24),
    base,
    notes: [notes, ...feedback.map((f) => `- ${f.text}`), post.caption ? `- caption tone like: "${post.caption.split('\n')[0]}"` : '']
      .filter(Boolean)
      .join('\n')
      .slice(0, 1500),
  };
  await updateSettings(brand.id, { savedTemplates: [...list, style] });
  return Response.json({ template: style });
});

/** Rename: { id, name } */
export const PATCH = route(async (req: Request) => {
  const { brand } = await requireCtx(req);
  const b = (await req.json()) as { id?: string; name?: string };
  const list = (brand.settings?.savedTemplates ?? []).map((t) => (t.id === b.id && b.name ? { ...t, name: b.name.toLowerCase().slice(0, 24) } : t));
  await updateSettings(brand.id, { savedTemplates: list });
  return Response.json({ ok: true });
});

export const DELETE = route(async (req: Request) => {
  const { brand } = await requireCtx(req);
  const sid = new URL(req.url).searchParams.get('id');
  await updateSettings(brand.id, { savedTemplates: (brand.settings?.savedTemplates ?? []).filter((t) => t.id !== sid) });
  return Response.json({ ok: true });
});
