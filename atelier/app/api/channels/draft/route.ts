import { HttpError, requireCtx, route } from '@/lib/auth';
import { claude, parseJson } from '@/lib/claude';

export const maxDuration = 120;

/** A spoken idea → a channel draft the owner edits before creating it. */
export const POST = route(async (req: Request) => {
  await requireCtx(req);
  const { idea } = (await req.json()) as { idea?: string };
  if (!idea?.trim()) throw new HttpError(400, 'say what the channel is about');
  const system = [
    'you help a creator start a themed instagram channel that posts carousels every few hours.',
    'from their idea (any language, maybe rambling) write a sharp english channel concept. names may use internet slang if it fits the audience ' +
      '(e.g. "-maxxing"), but stay respectful — humour yes, contempt no.',
    'logo: 1–3 very short lowercase words or syllables stacked like a wordmark (e.g. ["fo","yo"] for "forever young"). max 6 letters per line.',
    'answer only json: {"name": "..", "handle": "@..", "tagline": "max 4 words", "logo": [".."], "cta": "follow @.. for ..|one short line", ' +
      '"brief": "3–5 sentences: what every post teaches, for whom, what to avoid", "tone": "one sentence"}',
  ].join('\n');
  const out = parseJson<Record<string, unknown>>(await claude({ system, prompt: idea.slice(0, 4000), maxTokens: 900 }));
  return Response.json({ draft: out });
});
