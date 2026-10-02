import type { BrandKit } from './types';

export const MODEL = process.env.CLAUDE_MODEL || 'claude-sonnet-5-5';

type Block = { type: 'text'; text: string } | { type: 'image'; source: { type: 'base64'; media_type: 'image/jpeg'; data: string } };

export async function claude(opts: { system: string; prompt: string | Block[]; maxTokens?: number }): Promise<string> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error('ANTHROPIC_API_KEY missing');
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'x-api-key': key, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: opts.maxTokens ?? 1000,
      system: opts.system,
      messages: [{ role: 'user', content: opts.prompt }],
    }),
  });
  const json = (await res.json()) as { content?: { type: string; text?: string }[]; error?: { message?: string } };
  if (!res.ok) throw new Error(`claude ${res.status}: ${json.error?.message ?? 'error'}`);
  return (json.content ?? []).filter((c) => c.type === 'text').map((c) => c.text ?? '').join('').trim();
}

/** First JSON object in a model answer. */
export function parseJson<T>(text: string): T {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start < 0 || end < start) throw new Error('model returned no json');
  return JSON.parse(text.slice(start, end + 1)) as T;
}

export function normalizeCaption(raw: string, maxHashtags: number): string {
  let seen = 0;
  return raw
    .trim()
    .replace(/^["'`]+|["'`]+$/g, '')
    .toLowerCase()
    .replace(/#[\p{L}\p{N}_]+/gu, (tag) => (++seen <= maxHashtags ? tag : ''))
    .split('\n')
    .map((l) => l.replace(/[ \t]{2,}/g, ' ').trimEnd())
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
    .slice(0, 2200);
}

export async function writeCaption(brand: BrandKit, kind: string, source: string): Promise<string> {
  const system = [
    `you write instagram captions for ${brand.handle}.`,
    'rules:',
    ...brand.caption.rules.map((r) => `- ${r}`),
    `- never more than ${brand.caption.maxHashtags} hashtags.`,
  ].join('\n');
  const out = await claude({ system, prompt: `write the caption for this ${kind}.\n\nsource:\n"""\n${source.slice(0, 12000)}\n"""`, maxTokens: 700 });
  return normalizeCaption(out, brand.caption.maxHashtags);
}

/** Learning cut: condense raw feedback + current rules into short, editable rules. */
export async function summarizeRules(current: string, feedback: string[]): Promise<string> {
  const system =
    'you maintain the editing rules of a video editor for one creator. merge the current rules with new feedback into at most 10 short, ' +
    'concrete, non-contradicting rules (newer feedback wins). one rule per line starting with "- ". english, lowercase. output only the rules.';
  const prompt = `current rules:\n${current || '(none)'}\n\nnew feedback (oldest first):\n${feedback.map((f) => `- ${f}`).join('\n')}`;
  return (await claude({ system, prompt, maxTokens: 600 })).trim();
}

/* ---------- creating a post from what the user recorded ---------- */

const STYLE: Record<string, string> = {
  poetic:
    'each line is a short poetic, philosophical thought in the spirit of marcus aurelius and the stoics — inspired by what the photo evokes, never describing it. ' +
    'it is your own line: never present it as a quote, never attribute it to anyone, no quotation marks. 6–16 words.',
  hook: 'each line is a short, strong editorial statement that makes people stop — calm, confident, no clickbait. 4–12 words. use **bold** for the 2–4 key words.',
  statement: 'each line is a bold, minimal statement, like a manifesto line. 2–8 words. use "|" for a deliberate line break and **bold** for the key phrase.',
};

/** Photos as small jpegs for claude vision. */
export async function imageBlocks(urls: string[], max = 10): Promise<Block[]> {
  const sharp = (await import('sharp')).default;
  const { loadPhoto } = await import('./carousel');
  const out: Block[] = [];
  for (const url of urls.slice(0, max)) {
    try {
      const buf = await sharp(await loadPhoto(url)).rotate().resize(768, 768, { fit: 'inside' }).jpeg({ quality: 78 }).toBuffer();
      out.push({ type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: buf.toString('base64') } });
    } catch {
      /* a broken photo should not block the post */
    }
  }
  return out;
}

/**
 * One call: slide lines (one per photo) + caption, in the template's text style,
 * from the photos, the user's spoken description and/or a video transcript.
 */
export async function composePost(
  brand: BrandKit,
  o: { kind: string; textStyle: string; photos?: string[]; slides?: number; description?: string | null; transcript?: string | null; notes?: string | null },
): Promise<{ lines: string[]; caption: string }> {
  const slides = o.slides ?? 0;
  const system = [
    `you create instagram posts for ${brand.handle}. taste: calm, architectural, premium, less is more — the opposite of loud ai content.`,
    'caption rules:',
    ...brand.caption.rules.map((r) => `- ${r}`),
    `- never more than ${brand.caption.maxHashtags} hashtags.`,
    slides ? `slide text: exactly ${slides} lines, one per slide in order, all lowercase. ${STYLE[o.textStyle] ?? STYLE.hook}` : '',
    o.notes ? `the creator's saved style notes:\n${o.notes}` : '',
    'answer only json: {"lines": [..], "caption": "..."}',
  ]
    .filter(Boolean)
    .join('\n');
  const parts: Block[] = [];
  if (o.photos?.length) parts.push(...(await imageBlocks(o.photos)));
  parts.push({
    type: 'text',
    text: [
      `format: ${o.kind}${slides ? ` with ${slides} slides` : ''}.`,
      o.description ? `what the creator says it is about: """${o.description.slice(0, 2000)}"""` : '',
      o.transcript ? `video transcript: """${o.transcript.slice(0, 8000)}"""` : '',
      !o.description && !o.transcript && !o.photos?.length ? 'no material given — write something true to the brand.' : '',
    ]
      .filter(Boolean)
      .join('\n'),
  });
  const out = parseJson<{ lines?: unknown; caption?: unknown }>(await claude({ system, prompt: parts, maxTokens: 1200 }));
  const lines = Array.isArray(out.lines) ? out.lines.map((l) => String(l).toLowerCase().replace(/^["“”']+|["“”']+$/g, '').trim()) : [];
  while (slides && lines.length < slides) lines.push(lines[lines.length - 1] ?? '');
  return { lines: lines.slice(0, slides || undefined), caption: normalizeCaption(String(out.caption ?? ''), brand.caption.maxHashtags) };
}
