import { after } from 'next/server';
import { HttpError, requireCtx, route } from '@/lib/auth';
import { loadTemplates, resolveBrand } from '@/lib/brand';
import { mediaByIds } from '@/lib/media';
import { createPost, deletePost, render } from '@/lib/posts';
import { schedulePost } from '@/lib/schedule';
import { nextFreeSlot } from '@/lib/slots';
import { localToUtc } from '@/lib/time';

export const maxDuration = 300;

/** Everything the create interview needs: next free slot + templates (last used first). */
export const GET = route(async () => {
  const { user, brand } = await requireCtx();
  const kit = resolveBrand(brand);
  const builtIn = Object.entries(loadTemplates(brand.kit).templates).map(([id, t]) => ({ id, label: t.label, layout: t.layout, saved: false }));
  const saved = (brand.settings?.savedTemplates ?? []).map((t) => {
    const base = loadTemplates(brand.kit).templates[t.base];
    return { id: `saved:${t.id}`, label: t.name, layout: base?.layout ?? 'polaroid', saved: true };
  });
  const last = brand.settings?.lastTemplate ?? kit.defaultTemplate;
  const templates = [...saved, ...builtIn].sort((a, b) => Number(b.id === last) - Number(a.id === last));
  return Response.json({ timezone: user.timezone, slot: await nextFreeSlot(brand.id, user.timezone, kit.slots), slots: kit.slots, templates });
});

/** { media: string[] (ids, upload order), description?, at: "YYYY-MM-DDTHH:MM", template } */
export const POST = route(async (req: Request) => {
  const { user, brand } = await requireCtx(req);
  const b = (await req.json().catch(() => ({}))) as { media?: string[]; description?: string; at?: string; template?: string; text?: string };
  const media = await mediaByIds((b.media ?? []).map(String));
  if (!media.length && !b.text?.trim()) throw new HttpError(400, 'add a photo or video first');
  const at = b.at ? localToUtc(b.at, user.timezone) : null;
  const post = await createPost(brand, { media, description: b.description?.trim() || null, template: b.template, text: b.text?.trim() || null });
  if (at) {
    try {
      await schedulePost(brand.id, post.id, at);
    } catch (e) {
      // never leave a half-created post behind: a retry would otherwise duplicate it
      await deletePost(post).catch(() => undefined);
      throw e;
    }
  }
  // cutting, captions and rendering happen after the response
  after(() => render(post, brand).then(() => undefined));
  return Response.json({ post: { id: post.id, kind: post.kind } });
});
