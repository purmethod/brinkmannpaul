import type { Brand } from './types';

const API = 'https://api.anthropic.com/v1/messages';

export async function claude(opts: { model: string; system: string; prompt: string; maxTokens?: number }): Promise<string> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error('ANTHROPIC_API_KEY not set');
  const res = await fetch(API, {
    method: 'POST',
    headers: { 'x-api-key': key, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
    body: JSON.stringify({
      model: opts.model,
      max_tokens: opts.maxTokens ?? 800,
      system: opts.system,
      messages: [{ role: 'user', content: opts.prompt }],
    }),
  });
  const json = (await res.json()) as { content?: { type: string; text?: string }[]; error?: { message?: string } };
  if (!res.ok) throw new Error(`claude api ${res.status}: ${json.error?.message ?? 'unknown error'}`);
  return (json.content ?? []).filter((c) => c.type === 'text').map((c) => c.text ?? '').join('').trim();
}

/** Enforce brand caption rules that should never depend on the model behaving. */
export function normalizeCaption(raw: string, maxHashtags: number): string {
  let text = raw.trim().replace(/^["'`]+|["'`]+$/g, '').toLowerCase();
  let seen = 0;
  text = text.replace(/#[\p{L}\p{N}_]+/gu, (tag) => (++seen <= maxHashtags ? tag : ''));
  text = text
    .split('\n')
    .map((l) => l.replace(/[ \t]{2,}/g, ' ').trimEnd())
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  return text.slice(0, 2200);
}

export async function writeCaption(brand: Brand, kind: 'carousel' | 'reel', source: string): Promise<string> {
  const system = [
    `you write instagram captions for ${brand.handle}.`,
    'rules:',
    ...brand.caption.rules.map((r) => `- ${r}`),
    `- never more than ${brand.caption.maxHashtags} hashtags.`,
  ].join('\n');
  const label = kind === 'carousel' ? 'carousel slide text' : 'reel transcript';
  const prompt = `write the caption for this ${kind}.\n\n${label}:\n"""\n${source.slice(0, 12000)}\n"""`;
  const out = await claude({ model: brand.caption.model, system, prompt, maxTokens: 700 });
  return normalizeCaption(out, brand.caption.maxHashtags);
}
