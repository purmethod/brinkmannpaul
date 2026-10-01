import { put } from '@vercel/blob';
import { defaultBrandId, getTemplate, loadBrand, loadTemplates } from './brand';
import { plainText, renderSlide, splitSlides } from './carousel';
import { writeCaption } from './claude';
import { dispatchVideoJob } from './github';
import { newId, savePost } from './store';
import type { Post, Slide } from './types';

export function initialStatus(brandId: string): 'draft' | 'approved' {
  return loadBrand(brandId).autoApprove ? 'approved' : 'draft';
}

function validDate(d: unknown): string | null {
  return typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d) ? d : null;
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
  const brand = loadBrand(brandId);
  const template = getTemplate(brandId, input.templateId);
  const photos = input.photos ?? [];
  const texts = splitSlides(input.text);
  const count = texts.length || photos.length;
  if (!count) throw new Error('carousel needs text or photos');
  if (count > brand.carousel.maxSlides) throw new Error(`max ${brand.carousel.maxSlides} slides (got ${count})`);
  if (template.background.type === 'media' && !photos.length) throw new Error(`template needs at least one photo`);

  // a slide without text but with a photo always uses the brand's media template look
  const mediaTemplate = Object.values(loadTemplates(brandId).templates).find((t) => t.background.type === 'media') ?? template;

  const id = newId();
  const slides: Slide[] = [];
  for (let i = 0; i < count; i++) {
    const text = texts[i] ?? '';
    const usePhoto = photos.length > 0 && (template.background.type === 'media' || !text);
    const tpl = usePhoto && template.background.type !== 'media' ? mediaTemplate : template;
    const { png, jpg } = await renderSlide({ brand, template: tpl, text, photoUrl: usePhoto ? photos[i % photos.length] : undefined });
    const n = String(i + 1).padStart(2, '0');
    const [p, j] = await Promise.all([
      put(`posts/${id}/slide-${n}.png`, png, { access: 'public', contentType: 'image/png', addRandomSuffix: true }),
      put(`posts/${id}/slide-${n}.jpg`, jpg, { access: 'public', contentType: 'image/jpeg', addRandomSuffix: true }),
    ]);
    slides.push({ png: p.url, jpg: j.url });
  }

  let caption = input.caption ?? '';
  let error: string | null = null;
  if (!input.caption && texts.length) {
    try {
      caption = await writeCaption(brand, 'carousel', texts.map(plainText).join('\n\n'));
    } catch (e) {
      error = `caption: ${(e as Error).message}`;
    }
  }

  const now = Date.now();
  const status = initialStatus(brandId);
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

export async function createReelPost(input: {
  brandId?: string;
  templateId: string;
  clips: string[];
  scheduledFor?: string | null;
  origin: string;
}): Promise<Post> {
  const brandId = input.brandId || defaultBrandId();
  getTemplate(brandId, input.templateId);
  if (!input.clips.length) throw new Error('reel needs at least one video');
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
    source: { media: input.clips },
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
