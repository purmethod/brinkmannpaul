import { del, put } from '@vercel/blob';
import { getTemplate, loadTemplates, resolveBrand } from './brand';
import { plainText, renderSlide, splitSlides } from './carousel';
import { composePost } from './claude';
import { id, one, q } from './db';
import { mediaByIds } from './media';
import type { BrandRow, BrandTemplate, Media, Post, PostKind, PostOptions, Slide } from './types';
import { dispatchRender } from './worker';

export async function getPost(postId: string, brandId: string): Promise<Post | null> {
  return one<Post>('select * from posts where id = $1 and brand_id = $2', [postId, brandId]);
}

export async function updatePost(postId: string, patch: Partial<Post>): Promise<Post> {
  const keys = Object.keys(patch) as (keyof Post)[];
  const sets = keys.map((k, i) => `${k} = $${i + 2}`).join(', ');
  const vals = keys.map((k) => {
    const v = patch[k];
    return v && typeof v === 'object' && !Array.isArray(v) ? JSON.stringify(v) : v;
  });
  const row = await one<Post>(`update posts set ${sets}, updated_at = now() where id = $1 returning *`, [postId, ...vals]);
  if (!row) throw new Error('post not found');
  return row;
}

/** Created in the create flow = meant to go out; only an explicit pause ('ready') holds it back. */
function readyStatus(_row: BrandRow, post: Post): 'ready' | 'approved' {
  return post.status === 'ready' ? 'ready' : 'approved';
}

/** Format follows the material: any video → reel, several photos or text → carousel, one photo → photo. */
export function inferKind(media: Media[], text?: string | null): PostKind {
  if (media.some((m) => m.kind === 'video')) return 'reel';
  if (text || media.length > 1) return 'carousel';
  return 'photo';
}

/** Template id may be a built-in (POLAROID) or a saved style (saved:<id>) = base + notes. */
export function resolveTemplate(row: BrandRow, templateId?: string | null): { base: string; tpl: BrandTemplate; notes: string | null } {
  const set = loadTemplates(row.kit);
  const saved = templateId?.startsWith('saved:') ? row.settings?.savedTemplates?.find((t) => `saved:${t.id}` === templateId) : undefined;
  const fallback = resolveBrand(row).defaultTemplate;
  const base = saved?.base ?? (templateId && set.templates[templateId] ? templateId : set.templates[fallback] ? fallback : set.default);
  return { base, tpl: getTemplate(row.kit, base), notes: saved?.notes ?? null };
}

/** The creator's latest corrections — captions learn from them too. */
async function learned(brandId: string): Promise<string[]> {
  const rows = await q<{ text: string }>('select text from edit_feedback where brand_id = $1 order by created_at desc limit 8', [brandId]).catch(() => []);
  return rows.map((r) => r.text.slice(0, 200));
}

async function renderStill(post: Post, row: BrandRow, photos: string[]): Promise<{ slides: Slide[]; caption: string }> {
  const brand = resolveBrand(row);
  const { tpl } = resolveTemplate(row, post.template);
  const given = splitSlides(post.text);
  const count = given.length || photos.length;
  if (!count) throw new Error('needs photos or text');
  if (count > brand.carousel.maxSlides) throw new Error(`max ${brand.carousel.maxSlides} slides`);

  // slide lines + caption from what the photos evoke and what the creator said
  let lines = given;
  let caption = post.caption;
  if (!given.length || !caption) {
    try {
      const out = await composePost(brand, {
        kind: post.kind,
        textStyle: tpl.textStyle,
        photos,
        slides: given.length ? 0 : count,
        description: post.description ?? (given.length ? given.map(plainText).join('\n') : null),
        notes: post.options.notes,
        learned: await learned(row.id),
      });
      if (!given.length) lines = out.lines;
      if (!caption) caption = out.caption;
    } catch (e) {
      if (!given.length) lines = Array(count).fill('');
      console.error('compose failed', e);
    }
  }

  const v = Date.now().toString(36);
  const renderOne = async (i: number): Promise<Slide> => {
    const { png, jpg } = await renderSlide({
      row,
      brand,
      template: tpl,
      text: lines[i] ?? '',
      photoUrl: photos.length ? photos[i % photos.length] : undefined,
      index: i,
      total: count,
    });
    const n = String(i + 1).padStart(2, '0');
    const [p, j] = await Promise.all([
      put(`posts/${post.id}/${v}/${n}.png`, png, { access: 'public', contentType: 'image/png', addRandomSuffix: true }),
      put(`posts/${post.id}/${v}/${n}.jpg`, jpg, { access: 'public', contentType: 'image/jpeg', addRandomSuffix: true }),
    ]);
    return { png: p.url, jpg: j.url };
  };
  const slides: Slide[] = [];
  for (let i = 0; i < count; i += 3) {
    slides.push(...(await Promise.all(Array.from({ length: Math.min(3, count - i) }, (_, k) => renderOne(i + k)))));
  }
  return { slides, caption };
}

/** Renders (stills) or dispatches the cut (reels). Never throws: errors land on the post. */
export async function render(post: Post, row: BrandRow, extra: { feedback?: string; reusePlan?: boolean; recaption?: boolean } = {}): Promise<Post> {
  try {
    if (extra.feedback) {
      // corrections steer the new text, caption and cut of this post
      const notes = [post.options.notes, `- ${extra.feedback}`].filter(Boolean).join('\n');
      post = await updatePost(post.id, { caption: '', options: { ...post.options, notes } });
    } else if (extra.recaption) post = await updatePost(post.id, { caption: '' });
    if (post.kind === 'reel') {
      await dispatchRender(post, row, extra);
      return updatePost(post.id, { status: 'processing', error: null });
    }
    const media = await mediaByIds(post.media_ids);
    const old = (post.output.slides ?? []).flatMap((s) => [s.png, s.jpg]);
    const { slides, caption } = await renderStill(post, row, media.filter((m) => m.kind === 'photo').map((m) => m.url));
    if (old.length) await del(old).catch(() => undefined);
    return updatePost(post.id, { output: { ...post.output, slides }, caption, status: readyStatus(row, post), error: null });
  } catch (e) {
    return updatePost(post.id, { status: 'error', error: (e as Error).message });
  }
}

/**
 * Self-healing for posts that never finished preparing.
 * - leftovers of create attempts that failed before the scheduling fix (render never started) are duplicates: removed
 * - a photo/carousel render takes < 5 min; older ones died with their function: re-rendered once, then reported
 * - reels: the worker reports back well within 45 min
 */
export async function recoverStuck(brandId?: string) {
  const args = brandId ? [brandId] : [];
  const scope = brandId ? 'and brand_id = $1' : '';
  const removed = await q<{ id: string }>(
    `delete from posts where status = 'processing' and output = '{}'::jsonb and created_at < '2026-10-02T09:20:00Z' ${scope} returning id`,
    args,
  );
  // claim atomically so parallel sweeps never render the same post twice
  const stuck = await q<Post>(
    `update posts set updated_at = now() where id in (
       select id from posts where status = 'processing' and kind <> 'reel' and updated_at < now() - interval '10 minutes' ${scope}
       order by updated_at limit 2) returning *`,
    args,
  );
  for (const p of stuck) {
    const retried = p.options.retriedAt && Date.now() - new Date(p.options.retriedAt).getTime() < 3600_000;
    if (retried) {
      await updatePost(p.id, { status: 'error', error: 'could not prepare it — tap try again' });
      continue;
    }
    const row = await one<BrandRow>('select * from brands where id = $1', [p.brand_id]);
    if (row) await render(await updatePost(p.id, { options: { ...p.options, retriedAt: new Date().toISOString() } }), row);
  }
  await q(
    `update posts set status = 'error', error = 'the cut did not come back — tap try again', updated_at = now()
     where status = 'processing' and kind = 'reel' and updated_at < now() - interval '45 minutes' ${scope}`,
    args,
  );
  return { removed: removed.length, retried: stuck.length };
}

export async function createPost(
  row: BrandRow,
  input: { media?: Media[]; text?: string | null; description?: string | null; template?: string | null; kind?: PostKind; caption?: string; options?: PostOptions },
): Promise<Post> {
  const media = input.media ?? [];
  const kind = input.kind ?? inferKind(media, input.text);
  const { notes } = resolveTemplate(row, input.template);
  const template = input.template || resolveBrand(row).defaultTemplate;
  const used = kind === 'reel' ? media.filter((m) => m.kind === 'video') : media.filter((m) => m.kind === 'photo');
  const post = (await one<Post>(
    `insert into posts (id, brand_id, kind, status, template, media_ids, text, description, caption, options)
     values ($1, $2, $3, 'processing', $4, $5, $6, $7, $8, $9) returning *`,
    [
      id('pst'),
      row.id,
      kind,
      template,
      used.map((m) => m.id),
      input.text ?? null,
      input.description ?? null,
      input.caption ?? '',
      JSON.stringify({ ...(input.options ?? {}), ...(notes ? { notes } : {}) }),
    ],
  ))!;
  await q("update brands set settings = settings || jsonb_build_object('lastTemplate', $2::text) where id = $1", [row.id, template]);
  return post;
}

/** Worker finished a cut. */
export async function finishRender(
  post: Post,
  row: BrandRow,
  r: { ok: boolean; videoUrl?: string; coverUrl?: string; duration?: number; transcript?: string; plan?: unknown; error?: string },
) {
  if (!r.ok || !r.videoUrl) return updatePost(post.id, { status: 'error', error: `cut: ${r.error ?? 'failed'}` });
  let caption = post.caption;
  if (!caption) {
    caption = await composePost(resolveBrand(row), {
      kind: 'reel',
      textStyle: 'hook',
      description: post.description,
      transcript: r.transcript,
      notes: post.options.notes,
      learned: await learned(row.id),
    })
      .then((o) => o.caption)
      .catch(() => '');
  }
  if (post.output.video) await del([post.output.video, ...(post.output.cover ? [post.output.cover] : [])]).catch(() => undefined);
  return updatePost(post.id, {
    status: readyStatus(row, post),
    output: { ...post.output, video: r.videoUrl, cover: r.coverUrl, duration: r.duration, plan: r.plan ?? post.output.plan },
    transcript: r.transcript ?? post.transcript,
    caption,
    error: null,
  });
}

export async function deletePost(post: Post) {
  const urls = [...(post.output.slides ?? []).flatMap((s) => [s.png, s.jpg]), post.output.video, post.output.cover].filter(Boolean) as string[];
  if (urls.length) await del(urls).catch(() => undefined);
  await q('delete from posts where id = $1', [post.id]);
}

export async function listPosts(brandId: string, ids?: string[]) {
  return ids
    ? q<Post>('select * from posts where brand_id = $1 and id = any($2::text[])', [brandId, ids])
    : q<Post>('select * from posts where brand_id = $1 order by created_at desc limit 100', [brandId]);
}
