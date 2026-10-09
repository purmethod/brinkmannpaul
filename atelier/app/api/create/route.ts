import { after } from 'next/server';
import { HttpError, requireCtx, route } from '@/lib/auth';
import { loadTemplates, resolveBrand } from '@/lib/brand';
import { mediaByIds } from '@/lib/media';
import { TEXT_STYLES } from '@/lib/carousel';
import { createPost, deletePost, render, type PhotoFormat } from '@/lib/posts';
import { LOOKS } from '@/lib/reel';
import { runDueFor, schedulePost } from '@/lib/schedule';
import { nextFreeSlot } from '@/lib/slots';
import { localToUtc } from '@/lib/time';
import type { ChannelStyle } from '@/lib/types';

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
  return Response.json({
    timezone: user.timezone,
    slot: await nextFreeSlot(brand.id, user.timezone, kit.slots),
    slots: kit.slots,
    templates,
    style: brand.settings?.style ?? {},
    looks: Object.entries(LOOKS).map(([id, l]) => ({ id, label: l.label })),
    textStyles: TEXT_STYLES,
  });
});

/**
 * { media: string[] (ids, upload order), description?, at?: "YYYY-MM-DDTHH:MM" | "now", template?,
 *   format?: auto|reel|carousel, look?, textStyle? }
 */
export const POST = route(async (req: Request) => {
  const { user, brand } = await requireCtx(req);
  const b = (await req.json().catch(() => ({}))) as {
    media?: string[];
    description?: string;
    at?: string;
    template?: string;
    text?: string;
    format?: PhotoFormat;
    look?: string;
    textStyle?: string;
  };
  const media = await mediaByIds((b.media ?? []).map(String), brand.id);
  if (!media.length && !b.text?.trim()) throw new HttpError(400, 'add a photo or video first');
  const at = b.at === 'now' ? new Date() : b.at ? localToUtc(b.at, user.timezone) : null;
  const look = b.look && b.look in LOOKS ? (b.look as ChannelStyle['look']) : undefined;
  const textStyle = TEXT_STYLES.includes(b.textStyle as never) ? (b.textStyle as ChannelStyle['text']) : undefined;
  const post = await createPost(brand, {
    media,
    description: b.description?.trim() || null,
    template: b.template,
    text: b.text?.trim() || null,
    format: ['reel', 'carousel'].includes(b.format ?? '') ? b.format : 'auto',
    options: { ...(look ? { look } : {}), ...(textStyle ? { textStyle } : {}) },
  });
  if (at) {
    try {
      await schedulePost(brand.id, post.id, at);
    } catch (e) {
      // never leave a half-created post behind: a retry would otherwise duplicate it
      await deletePost(post).catch(() => undefined);
      throw e;
    }
  }
  // cutting, captions and rendering happen after the response; "now" goes out the moment it is ready
  after(async () => {
    await render(post, brand);
    if (at && at.getTime() <= Date.now() + 60_000) await runDueFor(post.id).catch((e) => console.error('run due', e));
  });
  return Response.json({ post: { id: post.id, kind: post.kind } });
});
