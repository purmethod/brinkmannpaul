import { del, put } from '@vercel/blob';
import { getTemplate, loadTemplates, resolveBrand } from './brand';
import { plainText, renderSlide, splitSlides } from './carousel';
import { writeCaption } from './claude';
import { id, one, q } from './db';
import { mediaByIds } from './media';
import type { BrandRow, Media, Post, PostKind, PostOptions, Slide } from './types';
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

function readyStatus(row: BrandRow): 'ready' | 'approved' {
  return resolveBrand(row).autoApprove ? 'approved' : 'ready';
}

/** Kind follows the material: videos → reel, several photos or text → carousel, one photo → photo. */
export function inferKind(media: Media[], text?: string | null): PostKind {
  if (media.some((m) => m.kind === 'video')) return 'reel';
  if (text || media.length > 1) return 'carousel';
  return 'photo';
}

async function renderStill(post: Post, row: BrandRow, photos: string[]): Promise<Slide[]> {
  const brand = resolveBrand(row);
  const template = getTemplate(row.kit, post.template);
  const texts = splitSlides(post.text ?? '');
  const count = texts.length || photos.length;
  if (!count) throw new Error('needs text or photos');
  if (count > brand.carousel.maxSlides) throw new Error(`max ${brand.carousel.maxSlides} slides`);
  const media = Object.values(loadTemplates(row.kit).templates).find((t) => t.background.type === 'media') ?? template;
  const v = Date.now().toString(36);
  const one = async (i: number): Promise<Slide> => {
    const text = texts[i] ?? '';
    const usePhoto = photos.length > 0 && (template.background.type === 'media' || !text);
    const tpl = usePhoto && template.background.type !== 'media' ? media : template;
    const { png, jpg } = await renderSlide({ row, brand, template: tpl, text, photoUrl: usePhoto ? photos[i % photos.length] : undefined });
    const n = String(i + 1).padStart(2, '0');
    const [p, j] = await Promise.all([
      put(`posts/${post.id}/${v}/${n}.png`, png, { access: 'public', contentType: 'image/png', addRandomSuffix: true }),
      put(`posts/${post.id}/${v}/${n}.jpg`, jpg, { access: 'public', contentType: 'image/jpeg', addRandomSuffix: true }),
    ]);
    return { png: p.url, jpg: j.url };
  };
  const slides: Slide[] = [];
  for (let i = 0; i < count; i += 3) {
    slides.push(...(await Promise.all(Array.from({ length: Math.min(3, count - i) }, (_, k) => one(i + k)))));
  }
  return slides;
}

/** Renders (stills) or dispatches the cut (reels). Never throws: errors land on the post. */
export async function render(post: Post, row: BrandRow, extra: { feedback?: string; reusePlan?: boolean } = {}): Promise<Post> {
  try {
    if (post.kind === 'reel') {
      await dispatchRender(post, row, extra);
      return updatePost(post.id, { status: 'processing', error: null });
    }
    const media = await mediaByIds(post.media_ids);
    const old = (post.output.slides ?? []).flatMap((s) => [s.png, s.jpg]);
    const slides = await renderStill(post, row, media.filter((m) => m.kind === 'photo').map((m) => m.url));
    if (old.length) await del(old).catch(() => undefined);
    let caption = post.caption;
    if (!caption && post.text) {
      caption = await writeCaption(resolveBrand(row), post.kind, splitSlides(post.text).map(plainText).join('\n\n')).catch(() => '');
    }
    const status = post.status === 'approved' ? 'approved' : readyStatus(row);
    return updatePost(post.id, { output: { ...post.output, slides }, caption, status, error: null });
  } catch (e) {
    return updatePost(post.id, { status: 'error', error: (e as Error).message });
  }
}

export async function createPost(
  row: BrandRow,
  input: { media?: Media[]; text?: string | null; template?: string; kind?: PostKind; caption?: string; options?: PostOptions },
): Promise<Post> {
  const media = input.media ?? [];
  const brand = resolveBrand(row);
  const template = input.template && loadTemplates(row.kit).templates[input.template] ? input.template : brand.defaultTemplate;
  const kind = input.kind ?? inferKind(media, input.text);
  // photo template without photos makes no sense — fall back to the default look
  const tpl = getTemplate(row.kit, template).background.type === 'media' && !media.length ? brand.defaultTemplate : template;
  const post = (await one<Post>(
    `insert into posts (id, brand_id, kind, status, template, media_ids, text, caption, options)
     values ($1, $2, $3, 'processing', $4, $5, $6, $7, $8) returning *`,
    [id('pst'), row.id, kind, tpl, media.map((m) => m.id), input.text ?? null, input.caption ?? '', JSON.stringify(input.options ?? {})],
  ))!;
  return render(post, row);
}

/** Worker finished a cut. */
export async function finishRender(
  post: Post,
  row: BrandRow,
  r: { ok: boolean; videoUrl?: string; coverUrl?: string; duration?: number; transcript?: string; plan?: unknown; error?: string },
) {
  if (!r.ok || !r.videoUrl) return updatePost(post.id, { status: 'error', error: `cut: ${r.error ?? 'failed'}` });
  let caption = post.caption;
  if (!caption && r.transcript) caption = await writeCaption(resolveBrand(row), 'reel', r.transcript).catch(() => '');
  if (post.output.video) await del([post.output.video, ...(post.output.cover ? [post.output.cover] : [])]).catch(() => undefined);
  return updatePost(post.id, {
    status: post.status === 'approved' ? 'approved' : readyStatus(row),
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
