import type { BrandKit } from './types';

export const MODEL = process.env.CLAUDE_MODEL || 'claude-sonnet-5-5';

type Block = { type: 'text'; text: string } | { type: 'image'; source: { type: 'base64'; media_type: 'image/jpeg'; data: string } };

type Content = { type: string; text?: string; [k: string]: unknown };

async function call(body: Record<string, unknown>) {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error('ANTHROPIC_API_KEY missing');
  const res = await fetch(`${process.env.ANTHROPIC_BASE_URL || 'https://api.anthropic.com'}/v1/messages`, {
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

/** Lowercase, hashtag cap, and never the account's own name or handle. */
export function normalizeCaption(raw: string, maxHashtags: number, hide: string[] = []): string {
  let seen = 0;
  let text = raw.trim();
  for (const h of hide.map((x) => x?.replace(/^@/, '').trim()).filter(Boolean)) {
    const esc = h.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    text = text.replace(new RegExp(`[@#]${esc}\\b`, 'gi'), '');
  }
  return text
    .replace(/^["'`]+|["'`]+$/g, '')
    .toLowerCase()
    .replace(/#[\p{L}\p{N}_]+/gu, (tag) => (++seen <= maxHashtags ? tag : ''))
    .split('\n')
    .map((l) => l.replace(/[ \t]{2,}/g, ' ').trim())
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
    .slice(0, 2200);
}

export async function writeCaption(brand: BrandKit, kind: string, source: string): Promise<string> {
  const system = [
    'you write instagram captions that people save and send.',
    'rules:',
    ...brand.caption.rules.map((r) => `- ${r}`),
    `- never more than ${brand.caption.maxHashtags} hashtags.`,
  ].join('\n');
  const out = await claude({ system, prompt: `write the caption for this ${kind}.\n\nsource:\n"""\n${source.slice(0, 12000)}\n"""`, maxTokens: 700 });
  return normalizeCaption(out, brand.caption.maxHashtags, [brand.handle, brand.name]);
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

/** Form of the slide text per look. The tone never comes from here — it comes from the post's mode. */
const STYLE: Record<string, string> = {
  poetic:
    'one short line per slide, 6–16 words, like a line written under a photo. no quotation marks, never a quote or an attribution.',
  hook: 'one short, strong line per slide, 4–12 words. use **bold** for the 2–4 key words.',
  video: 'words on a short video, one line per photo, 3–9 words, read in two seconds. line 1 is the hook. **bold** the one or two words that carry it.',
  statement: 'one bold, minimal line per slide, 2–8 words. use "|" for a deliberate line break and **bold** for the key phrase.',
  longevity:
    'each line is "headline :: body". headline: max 8 words, ends with a period. body: one plain sentence, max 16 words. ' +
    'line 1 is the hook, the last line the thing to remember.',
};

/** What each mode sounds like — slide words and caption alike. */
const MODES: Record<string, string> = {
  funny:
    'funny: the joke is the point. playful, cheeky, dry or absurd — land the punchline, use the irony of what is visible. never solemn, never preachy, no life lessons.',
  educational: 'educational: teach one useful, true thing clearly. concrete, a little surprising, easy to save.',
  inspirational: 'inspirational: a quiet, true thought (stoic spirit) that the moment evokes — your own words, never a fake quote.',
  personal: 'personal: a real moment from life, told warmly and simply, a little self-aware — like talking to a friend.',
  promotional: 'promotional: what it is, why it matters, one clear next step — confident, never pushy.',
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
 * Substance first: the creator's idea, deepened with real knowledge on the topic; then the viral craft.
 */
export async function composePost(
  brand: BrandKit,
  o: {
    kind: string;
    textStyle: string;
    photos?: string[];
    slides?: number;
    description?: string | null;
    transcript?: string | null;
    notes?: string | null;
    learned?: string[];
    mode?: string | null; // forced by the owner
    positions?: boolean; // video: also say where the words sit on each photo
  },
): Promise<{ lines: string[]; caption: string; mode: string; positions: string[] }> {
  const slides = o.slides ?? 0;
  const system = [
    'you write instagram posts that people save, send and follow for. taste: precise, premium — the opposite of loud ai content.',
    '',
    'substance (for educational and inspirational posts; funny and personal posts live from the moment itself):',
    "- the creator's own words are the starting point. find the one idea in what they said, recorded or photographed.",
    '- deepen it with real knowledge that fits the topic: health → physiology, mechanisms, research consensus; architecture, design, art → principles, ' +
      'history, the masters; mind → philosophy, psychology, neuroscience; business → strategy, economics, behaviour.',
    '- one concrete, true, non-obvious insight beats five generic ones. it must read as one voice: their thought, sharpened by what humanity knows.',
    '- use web search when a precise fact, mechanism or name would make it sharper and you are not certain of it.',
    '- truth: never invent quotes, studies, numbers or attributions. name a person, study or figure only if you are sure (or found it). ' +
      'otherwise say it in your own words. no links, no citations, no sources in the text.',
    '',
    'caption craft (the rules bend to the mode: in a funny post the "insight" is the joke, in a personal one the moment):',
    ...brand.caption.rules.map((r) => `- ${r}`),
    `- never more than ${brand.caption.maxHashtags} hashtags.`,
    '- before writing, draft three different hooks and keep the strongest: the one a stranger would stop scrolling for.',
    '',
    'first decide the mode of this post — it sets the tone of the slide words and the caption alike:',
    ...Object.values(MODES).map((m) => `- ${m}`),
    o.mode
      ? `the creator chose the mode: ${o.mode}. write in it.`
      : 'decide it from the photos themselves (read everything visible, including any text, signs, gestures and the situation) and from the creator\'s words; ' +
        'if they say what it is, that wins. a funny photo gets a funny post — never a solemn line on a joke.',
    slides ? `\nslide text: exactly ${slides} lines, one per slide in order, all lowercase. form: ${STYLE[o.textStyle] ?? STYLE.hook} the tone comes from the mode.` : '',
    o.notes ? `\nthe creator's notes for this post and style (follow them):\n${o.notes}` : '',
    o.learned?.length ? `\nwhat the creator corrected before (apply it):\n${o.learned.map((l) => `- ${l}`).join('\n')}` : '',
    '',
    o.positions
      ? '\nthe slides become a short video: each line is shown over its photo. for each photo say where the words sit best without covering faces, ' +
        'hands, the food or the subject: "top", "middle" or "bottom" → "positions": [..], one per photo.'
      : '',
    'answer only json: {"mode": "funny|educational|inspirational|personal|promotional", "seen": "what the photos show, incl. any text in them", ' +
      '"hooks": ["..", "..", ".."], "lines": [..], "positions": [..], "caption": "..."} — the caption starts with the strongest hook.',
  ]
    .filter((l) => l !== null)
    .join('\n');
  const parts: Block[] = [];
  if (o.photos?.length) parts.push(...(await imageBlocks(o.photos)));
  parts.push({
    type: 'text',
    text: [
      `format: ${o.kind}${slides ? ` with ${slides} slides` : ''}.`,
      o.description ? `what the creator says it is about: """${o.description.slice(0, 2000)}"""` : '',
      o.transcript ? `video transcript: """${o.transcript.slice(0, 8000)}"""` : '',
      !o.description && !o.transcript && !o.photos?.length ? 'no material given — write one strong, true thought.' : '',
    ]
      .filter(Boolean)
      .join('\n'),
  });
  const out = parseJson<{ lines?: unknown; caption?: unknown; mode?: unknown; positions?: unknown }>(await claude({ system, prompt: parts, maxTokens: 2500, search: 3 }));
  const lines = Array.isArray(out.lines) ? out.lines.map((l) => String(l).toLowerCase().replace(/^["“”']+|["“”']+$/g, '').trim()) : [];
  while (slides && lines.length < slides) lines.push(lines[lines.length - 1] ?? '');
  const mode = String(o.mode || out.mode || '').toLowerCase();
  return {
    lines: lines.slice(0, slides || undefined),
    caption: normalizeCaption(String(out.caption ?? ''), brand.caption.maxHashtags, [brand.handle, brand.name]),
    mode: MODES[mode] ? mode : '',
    positions: Array.isArray(out.positions) ? out.positions.map((p) => String(p).toLowerCase()) : [],
  };
}
