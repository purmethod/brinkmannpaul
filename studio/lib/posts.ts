import { del, put } from '@vercel/blob';
import { defaultBrandId, getBrand, getTemplate, loadTemplates } from './brand';
import { plainText, renderSlide, splitSlides } from './carousel';
import { writeCaption } from './claude';
import { dispatchVideoJob } from './github';
import { newId, savePost } from './store';
import type { Brand, Post, Slide } from './types';

export async function initialStatus(brandId: string): Promise<'draft' | 'approved'> {
  return (await getBrand(brandId)).autoApprove ? 'approved' : 'draft';
}

function validDate(d: unknown): string | null {
  return typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d) ? d : null;
}

/** Only files from our own blob store are rendered / sent to instagram. */
export function isBlobUrl(u: unknown): u is string {
  try {
    const url = new URL(String(u));
    return url.protocol === 'https:' && url.hostname.endsWith('.blob.vercel-storage.com');
  } catch {
    return false;
  }
}

async function renderSlides(brand: Brand, postId: string, templateId: string, text: string | undefined, photos: string[]): Promise<Slide[]> {
  const template = getTemplate(brand.id, templateId);
  const texts = splitSlides(text);
  const count = texts.length || photos.length;
  if (!count) throw new Error('carousel needs text or photos');
  if (count > brand.carousel.maxSlides) throw new Error(`max ${brand.carousel.maxSlides} slides (got ${count})`);
  if (template.background.type === 'media' && !photos.length) throw new Error('this template needs at least one photo');

  // a slide without text but with a photo always uses the brand's media template look
  const mediaTemplate = Object.values(loadTemplates(brand.id).templates).find((t) => t.background.type === 'media') ?? template;
  const version = Date.now().toString(36);

  const renderOne = async (i: number): Promise<Slide> => {
    const slideText = texts[i] ?? '';
    const usePhoto = photos.length > 0 && (template.background.type === 'media' || !slideText);
    const tpl = usePhoto && template.background.type !== 'media' ? mediaTemplate : template;
    const { png, jpg } = await renderSlide({ brand, template: tpl, text: slideText, photoUrl: usePhoto ? photos[i % photos.length] : undefined });
    const n = String(i + 1).padStart(2, '0');
    const [p, j] = await Promise.all([
      put(`posts/${postId}/${version}/slide-${n}.png`, png, { access: 'public', contentType: 'image/png', addRandomSuffix: true }),
      put(`posts/${postId}/${version}/slide-${n}.jpg`, jpg, { access: 'public', contentType: 'image/jpeg', addRandomSuffix: true }),
    ]);
    return { png: p.url, jpg: j.url };
  };
  // render 3 at a time: fast enough, gentle on memory
  const slides: Slide[] = [];
  for (let i = 0; i < count; i += 3) {
    const batch = Array.from({ length: Math.min(3, count - i) }, (_, k) => renderOne(i + k));
    slides.push(...(await Promise.all(batch)));
  }
  return slides;
}

export async function createCarouselPost(input: {
  brandId?: string;
  templateId: string;
  text?: string;
  photos?: string[];
  scheduledFor?: string | null;
  caption?: string;
}): Promise<Post> {
  const brandId = input.brandId || defaultBrandId();
  const brand = await getBrand(brandId);
  const photos = (input.photos ?? []).filter(isBlobUrl);
  const id = newId();
  const slides = await renderSlides(brand, id, input.templateId, input.text, photos);

  let caption = input.caption ?? '';
  let error: string | null = null;
  const texts = splitSlides(input.text);
  if (!input.caption && texts.length) {
    try {
      caption = await writeCaption(brand, 'carousel', texts.map(plainText).join('\n\n'));
    } catch (e) {
      error = `caption: ${(e as Error).message}`;
    }
  }

  const now = Date.now();
  const status = await initialStatus(brandId);
  return savePost({
    id,
    brandId,
    type: 'carousel',
    templateId: input.templateId,
    status,
    caption,
    scheduledFor: validDate(input.scheduledFor),
    createdAt: now,
    updatedAt: now,
    approvedAt: status === 'approved' ? now : undefined,
    slides,
    source: { text: input.text, media: photos },
    error,
  });
}

/** Re-render a carousel from its source text — e.g. after a new signature or another template. Caption stays. */
export async function rerenderCarousel(post: Post, templateId = post.templateId): Promise<Post> {
  if (post.type !== 'carousel') throw new Error('only carousels can be re-rendered');
  const brand = await getBrand(post.brandId);
  const slides = await renderSlides(brand, post.id, templateId, post.source.text, post.source.media ?? []);
  const old = (post.slides ?? []).flatMap((s) => [s.png, s.jpg]);
  if (old.length) await del(old).catch(() => undefined);
  return savePost({ ...post, templateId, slides });
}

export async function createReelPost(input: {
  brandId?: string;
  templateId: string;
  clips: string[];
  scheduledFor?: string | null;
  origin: string;
}): Promise<Post> {
  const brandId = input.brandId || defaultBrandId();
  getTemplate(brandId, input.templateId);
  const clips = input.clips.filter(isBlobUrl);
  if (!clips.length) throw new Error('reel needs at least one video');
  const now = Date.now();
  const post = await savePost({
    id: newId(),
    brandId,
    type: 'reel',
    templateId: input.templateId,
    status: 'processing',
    caption: '',
    scheduledFor: validDate(input.scheduledFor),
    createdAt: now,
    updatedAt: now,
    source: { media: clips },
    error: null,
  });
  try {
    await dispatchVideoJob(post, input.origin);
  } catch (e) {
    post.status = 'error';
    post.error = `dispatch: ${(e as Error).message}`;
    await savePost(post);
  }
  return post;
}
