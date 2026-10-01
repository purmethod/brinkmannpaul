import type { BrandKit } from './types';

export const MODEL = process.env.CLAUDE_MODEL || 'claude-sonnet-5-5';

export async function claude(opts: { system: string; prompt: string; maxTokens?: number }): Promise<string> {
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
