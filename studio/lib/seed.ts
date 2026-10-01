import { createCarouselPost } from './posts';
import { redis } from './redis';
import { updatePost } from './store';

const SEED_KEY = 'seed:ego-carousel-v1';

const TEXT = `01 you think you have no ego. | **that thought is your ego.**
02 most men think ego means being loud. | arrogant. better than others. | **but the quiet ones have it too.**
03 ego is your attachment to the image you have of yourself. | **you can catch it in three moments.**
04 one. | **when being right becomes more important than understanding.**
05 two. | **when disagreement feels like disrespect.**
06 three. | **when you need someone's approval to feel secure.** | be honest. which one is yours?
07 ego is intelligent. | it hides behind your own explanations. | you believe you are choosing freely. | **but your need to defend yourself is choosing.**
08 real masculinity is letting go of the need to prove yourself. | no shouting. no making yourself bigger. | **but that does not mean anyone can cross your line.**
09 i am an architect. | boundaries need foundations as solid as concrete. | **"this crosses my boundary. i do not want this."** | calm. firm. without humiliating anyone.
10 when your ego no longer needs to win every argument, | **there is finally room to understand her.**`;

const CAPTION = `most men will read this and think of someone else. that's the ego too.`;

/** Puts the first carousel into the queue exactly once (status draft, template WHITE). */
export async function ensureSeed(): Promise<void> {
  const claimed = await redis().set(SEED_KEY, 'pending', { nx: true, ex: 600 });
  if (!claimed) return;
  try {
    const post = await createCarouselPost({ templateId: 'WHITE', text: TEXT, caption: CAPTION });
    if (post.status !== 'draft') await updatePost(post.id, { status: 'draft', approvedAt: undefined });
    await redis().set(SEED_KEY, post.id); // no expiry: seeded for good
  } catch (e) {
    await redis().del(SEED_KEY);
    throw e;
  }
}
