import { resolveBrand } from './brand';
import { claude, imageBlocks, normalizeCaption, parseJson } from './claude';
import { one, q } from './db';
import { createPost, render, resolveTemplate } from './posts';
import { schedulePost } from './schedule';
import { localToUtc } from './time';
import type { AutopilotSettings, BrandKit, BrandRow, Media, User } from './types';

/*
 * Autopilot: keeps the next day of an account filled — one carousel every few hours inside a time window.
 * Each post = one longevity topic + one real food + the mechanism, built around the creator's own insights
 * and checked against real evidence (web search). A photo from the account's pool carries it; without one
 * the template's own photo-less design does.
 */

export const AUTOPILOT_DEFAULTS: AutopilotSettings = {
  enabled: false,
  everyHours: 2,
  from: '08:00',
  to: '22:00',
  slides: 5,
  insights: '',
  review: true,
  reviewTarget: 100,
};
const HORIZON_HOURS = 30; // how far ahead posts are prepared
const LEAD_MINUTES = 20; // never create a post that would go out sooner than this
const MAX_WAITING = 12; // learning phase: at most this many posts wait for review

export async function pendingReviews(brandId: string): Promise<number> {
  return (await one<{ n: number }>("select count(*)::int as n from posts where brand_id = $1 and options->>'review' = 'pending'", [brandId]))?.n ?? 0;
}

export function autopilotOf(row: BrandRow): AutopilotSettings {
  return { ...AUTOPILOT_DEFAULTS, ...(row.settings?.autopilot ?? {}) };
}

/** "08:00", "10:00" … inside the window. */
export function slotTimes(ap: AutopilotSettings): string[] {
  const toMin = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5));
  const step = Math.max(1, Math.round(ap.everyHours * 60));
  const out: string[] = [];
  for (let m = toMin(ap.from); m <= toMin(ap.to); m += step) out.push(`${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`);
  return out;
}

/** Autopilot slots in the horizon that have no post yet (a post within ±45 min counts as taken). */
export async function openSlots(row: BrandRow, timezone: string, now = new Date()): Promise<Date[]> {
  const ap = autopilotOf(row);
  const taken = await q<{ at: string }>(
    "select at from schedules where brand_id = $1 and status <> 'canceled' and at > now() - interval '1 hour' and at < now() + make_interval(hours => $2)",
    [row.id, HORIZON_HOURS + 1],
  );
  const takenMs = taken.map((t) => new Date(t.at).getTime());
  const out: Date[] = [];
  for (let d = 0; d <= 2; d++) {
    const day = new Intl.DateTimeFormat('en-CA', { timeZone: timezone }).format(new Date(now.getTime() + d * 864e5));
    for (const time of slotTimes(ap)) {
      const at = localToUtc(`${day}T${time}`, timezone);
      const ms = at.getTime();
      if (ms < now.getTime() + LEAD_MINUTES * 60_000 || ms > now.getTime() + HORIZON_HOURS * 3600_000) continue;
      if (takenMs.some((t) => Math.abs(t - ms) < 45 * 60_000)) continue;
      if (!out.some((o) => o.getTime() === ms)) out.push(at);
    }
  }
  return out.sort((a, b) => a.getTime() - b.getTime());
}

/** Next unused photo of the account's pool (uploaded in settings), oldest first. */
async function nextPhoto(brandId: string): Promise<Media | null> {
  return one<Media>(
    `select m.* from media m where m.brand_id = $1 and m.kind = 'photo' and m.status = 'ready'
       and not exists (select 1 from posts p where p.brand_id = $1 and m.id = any(p.media_ids))
     order by m.number limit 1`,
    [brandId],
  );
}

export async function poolSize(brandId: string): Promise<number> {
  const r = await one<{ n: number }>(
    `select count(*)::int as n from media m where m.brand_id = $1 and m.kind = 'photo' and m.status = 'ready'
       and not exists (select 1 from posts p where p.brand_id = $1 and m.id = any(p.media_ids))`,
    [brandId],
  );
  return r?.n ?? 0;
}

const SYSTEM = (brand: BrandKit, ap: AutopilotSettings, recent: string[], learned: string[]) =>
  [
    `you create instagram carousels for ${brand.handle} (${brand.name}).`,
    `what the channel is about:\n${brand.brief || 'a calm, premium channel that teaches one true, useful thing per post.'}`,
    `voice: ${brand.tone || 'calm, clear, warm authority. short sentences.'} lowercase.`,
    '',
    "the creator's own insights are the core of every post. build on them, use their words and angles, never contradict them. " +
      'if one conflicts with strong evidence, follow the evidence and phrase it carefully.',
    `the creator's insights:\n"""\n${ap.insights.trim() || '(none yet — rely on established knowledge)'}\n"""`,
    '',
    'every post: one topic, one concrete idea, specific beats general.',
    'evidence: use web search to check every factual claim. no invented studies, numbers, quotes or names. ' +
      'no miracle claims, no fear-mongering, nothing demeaning — humour is fine, contempt is not.',
    recent.length ? `do not repeat these recent topics: ${recent.join('; ')}` : '',
    learned.length ? `what the creator corrected or rejected before (apply it):\n${learned.map((l) => `- ${l}`).join('\n')}` : '',
    '',
    `slides: exactly ${ap.slides}. each slide has a headline (max 8 words, ends with a period) and a body line (max 16 words).`,
    '- slide 1: the hook — a tension or counterintuitive truth that stops the scroll.',
    `- slides 2–${ap.slides - 1}: one idea each — what is going on, why, what to do with it today.`,
    `- slide ${ap.slides}: the core truth as a short, memorable line + one line that lands it. ` +
      'the follow line is added by the design — do not write one.',
    '',
    'caption rules:',
    ...brand.caption.rules.map((r) => `- ${r}`),
    '',
    'if a photo is attached, build the post around what it shows when it fits the channel; otherwise treat it as mood.',
    'answer only json: {"topic": "..", "slides": [{"headline": "..", "body": ".."}], "caption": ".."}',
  ]
    .filter((l) => l !== '')
    .join('\n');

export async function composeLongevity(row: BrandRow, photoUrl: string | null) {
  const brand = resolveBrand(row);
  const ap = autopilotOf(row);
  const learned = (await q<{ text: string }>('select text from edit_feedback where brand_id = $1 order by created_at desc limit 8', [row.id])).map((r) =>
    r.text.slice(0, 200),
  );
  const prompt = [
    ...(photoUrl ? await imageBlocks([photoUrl], 1) : []),
    { type: 'text' as const, text: `today is ${new Date().toISOString().slice(0, 10)}. write the next post.` },
  ];
  const out = parseJson<{ topic?: string; food?: string; slides?: { headline?: string; body?: string }[]; caption?: string }>(
    await claude({ system: SYSTEM(brand, ap, (ap.recent ?? []).slice(0, 30), learned), prompt, maxTokens: 3000, search: 4 }),
  );
  const slides = (out.slides ?? [])
    .map((s) => ({ headline: String(s.headline ?? '').replace(/::/g, ':').trim(), body: String(s.body ?? '').replace(/::/g, ':').trim() }))
    .filter((s) => s.headline)
    .slice(0, ap.slides);
  if (slides.length < 2) throw new Error('autopilot: no slides');
  return {
    topic: `${out.topic ?? ''}${out.food ? ` / ${out.food}` : ''}`.trim(),
    // the foyo layout sets headline + body; the other looks carry one line per slide
    text: slides
      .map((s) => (resolveTemplate(row, row.settings?.lastTemplate).tpl.layout === 'foyo' ? `${s.headline} :: ${s.body}` : s.headline).replace(/\n/g, ' '))
      .join('\n'),
    caption: normalizeCaption(String(out.caption ?? ''), brand.caption.maxHashtags, [brand.handle, brand.name]),
  };
}

/** Learning phase numbers: how many were reviewed and how many were fine as they were. */
export function reviewStats(ap: AutopilotSettings) {
  const h = ap.history ?? '';
  const last = h.slice(-50);
  const ok = [...last].filter((c) => c === 'a').length;
  return {
    reviewed: h.length,
    target: ap.reviewTarget,
    approvedAsIs: last.length ? Math.round((ok / last.length) * 100) : null, // % of the last 50
    ready: h.length >= ap.reviewTarget && last.length > 0 && ok / last.length >= 0.9,
  };
}

/** Record one review outcome (a = ok as is, e = ok after a fix, r = rejected). */
export async function recordReview(brandId: string, outcome: 'a' | 'e' | 'r') {
  await q(
    `update brands set settings = jsonb_set(settings, '{autopilot,history}',
       to_jsonb(right(coalesce(settings->'autopilot'->>'history', '') || $2, 1000)), true)
     where id = $1 and settings ? 'autopilot'`,
    [brandId, outcome],
  );
}

/** Atomic per-account lock so parallel sweeps never write the same slot twice. */
async function claim(brandId: string, minutes: number): Promise<boolean> {
  const r = await one(
    `update brands set settings = settings || jsonb_build_object('autopilotLock', (now() + make_interval(mins => $2))::text)
      where id = $1 and coalesce((settings->>'autopilotLock')::timestamptz, 'epoch'::timestamptz) < now() returning id`,
    [brandId, minutes],
  );
  return Boolean(r);
}
async function release(brandId: string) {
  await q("update brands set settings = settings - 'autopilotLock' where id = $1", [brandId]);
}

/** Fill up to `max` open slots of one account. Returns what was created. */
export async function runAutopilot(row: BrandRow, user: User, max = 1, budgetMs = 200_000) {
  const ap = autopilotOf(row);
  if (!ap.enabled) return [];
  const started = Date.now();
  if (!(await claim(row.id, 6))) return [];
  const made: { postId: string; at: string; topic: string }[] = [];
  try {
    for (let i = 0; i < max && Date.now() - started < budgetMs; i++) {
      const fresh = (await one<BrandRow>('select * from brands where id = $1', [row.id]))!;
      const [slot] = await openSlots(fresh, user.timezone);
      if (!slot) break;
      if (autopilotOf(fresh).review && (await pendingReviews(row.id)) >= MAX_WAITING) break; // don't bury the owner
      const photo = await nextPhoto(row.id);
      const content = await composeLongevity(fresh, photo?.url ?? null);
      const post = await createPost(fresh, {
        media: photo ? [photo] : [],
        text: content.text,
        caption: content.caption,
        description: content.topic,
        kind: 'carousel',
        // learning phase: it waits for the owner's ok instead of going out on its own
        options: { autopilot: true, ...(autopilotOf(fresh).review ? { review: 'pending' as const } : {}) },
      });
      const done = await render(post, fresh);
      if (done.status === 'error') throw new Error(done.error || 'render failed');
      await schedulePost(row.id, post.id, slot);
      const recent = [content.topic, ...(autopilotOf(fresh).recent ?? [])].filter(Boolean).slice(0, 30);
      // only this field: reviews may have landed while the post was being written
      await q("update brands set settings = jsonb_set(settings, '{autopilot,recent}', $2::jsonb, true) where id = $1", [row.id, JSON.stringify(recent)]);
      made.push({ postId: post.id, at: slot.toISOString(), topic: content.topic });
    }
  } finally {
    await release(row.id);
  }
  return made;
}

/** Every account with autopilot on gets topped up (used by the sweep and the daily cron). */
export async function autopilotTick(max = 1, budgetMs = 200_000) {
  const rows = await q<BrandRow & { timezone: string; email: string }>(
    `select b.*, u.timezone, u.email from brands b join users u on u.id = b.user_id where (b.settings->'autopilot'->>'enabled')::boolean is true`,
  );
  const out = [];
  for (const r of rows) {
    const user: User = { id: r.user_id, email: r.email, timezone: r.timezone };
    out.push(...(await runAutopilot(r, user, max, budgetMs).catch((e) => [{ error: (e as Error).message, brand: r.name }])));
  }
  return out;
}
