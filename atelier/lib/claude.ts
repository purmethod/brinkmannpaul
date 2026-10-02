import type { BrandKit } from './types';

export const MODEL = process.env.CLAUDE_MODEL || 'claude-sonnet-5-5';

type Block = { type: 'text'; text: string } | { type: 'image'; source: { type: 'base64'; media_type: 'image/jpeg'; data: string } };

type Content = { type: string; text?: string; [k: string]: unknown };

async function call(body: Record<string, unknown>) {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error('ANTHROPIC_API_KEY missing');
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'x-api-key': key, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  const json = (await res.json()) as { content?: Content[]; stop_reason?: string; error?: { message?: string } };
  if (!res.ok) throw new Error(`claude ${res.status}: ${json.error?.message ?? 'error'}`);
  return json;
}

/**
 * One answer from claude. `search` lets it consult the web (anthropic's server-side web search)
 * before answering; if search is unavailable for the account it answers from its own knowledge.
 */
export async function claude(opts: { system: string; prompt: string | Block[]; maxTokens?: number; search?: number }): Promise<string> {
  const base = { model: MODEL, max_tokens: opts.maxTokens ?? 1000, system: opts.system };
  const messages: { role: string; content: unknown }[] = [{ role: 'user', content: opts.prompt }];
  if (opts.search) {
    try {
      const tools = [{ type: 'web_search_20260209', name: 'web_search', max_uses: opts.search }];
      for (let turn = 0; turn < 4; turn++) {
        const json = await call({ ...base, messages, tools });
        const content = json.content ?? [];
        // long server-side searches pause; sending the partial answer back resumes them
        if (json.stop_reason === 'pause_turn') {
          messages.push({ role: 'assistant', content });
          continue;
        }
        const text = content.filter((c) => c.type === 'text').map((c) => c.text ?? '').join('').trim();
        if (text) return text;
        break;
      }
    } catch (e) {
      console.error('claude with web search failed, answering without', (e as Error).message);
    }
    messages.splice(1);
  }
  const json = await call({ ...base, messages });
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
    '',
    'how to write: the creator\'s own words are the core. first find the one idea in what they said or recorded. then connect it with real, ' +
      'well-established insight from human knowledge — philosophy, architecture and design history, psychology, neuroscience, health science, craft. ' +
      'use web search when a fact, finding or name would make the post sharper and you are not certain of it. ' +
      'the result must read as one voice: their thought, deepened by what humanity already knows — not a summary, not a lecture.',
    'truth: never invent quotes, studies, numbers or attributions. only name a person, study or figure you are sure of (or found). ' +
      'if in doubt, express the insight in your own words without a source. no links, no citations in the text.',
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
  const search = o.description || o.transcript ? 3 : 0;
  const out = parseJson<{ lines?: unknown; caption?: unknown }>(await claude({ system, prompt: parts, maxTokens: 2000, search }));
  const lines = Array.isArray(out.lines) ? out.lines.map((l) => String(l).toLowerCase().replace(/^["“”']+|["“”']+$/g, '').trim()) : [];
  while (slides && lines.length < slides) lines.push(lines[lines.length - 1] ?? '');
  return { lines: lines.slice(0, slides || undefined), caption: normalizeCaption(String(out.caption ?? ''), brand.caption.maxHashtags) };
}
