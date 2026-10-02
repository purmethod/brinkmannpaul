import { after } from 'next/server';
import { resolveBrand, templateList } from './brand';
import { claude, parseJson } from './claude';
import { id, one, q } from './db';
import { listMedia, mediaByNumbers } from './media';
import { createPost, getPost, render, updatePost } from './posts';
import { addFeedback } from './rules';
import { cancelSchedule, reschedule, schedulePost, upcoming } from './schedule';
import { fmtLocal, localToUtc, zoned } from './time';
import type { BrandRow, Post } from './types';

/*
 * Voice/chat planner: Claude turns a command in any language into a small list of actions.
 * Nothing is saved before the user confirms the list ("passt").
 */

export type Action =
  | { type: 'schedule'; media?: number[]; text?: string; at: string; template?: string; kind?: 'reel' | 'carousel' | 'photo' }
  | { type: 'create'; media?: number[]; text?: string; template?: string; kind?: 'reel' | 'carousel' | 'photo' }
  | { type: 'reschedule'; scheduleId: string; at: string }
  | { type: 'cancel'; scheduleId: string }
  | { type: 'caption'; postId: string; caption: string }
  | { type: 'template'; postId: string; template: string }
  | { type: 'song'; postId: string; title: string }
  | { type: 'feedback'; postId: string; text: string };

export interface Proposal {
  reply: string;
  actions: Action[];
}

export async function propose(row: BrandRow, timezone: string, message: string, mediaHint?: number[]): Promise<Proposal> {
  const brand = resolveBrand(row);
  const now = zoned(timezone);
  const media = (await listMedia(row.id, 60)).map((m) => `#${m.number} ${m.kind}${m.filename ? ` (${m.filename})` : ''} uploaded ${fmtLocal(m.created_at, timezone)}`);
  const plan = (await upcoming(row.id, 1, 21)).map(
    (s) => `schedule ${s.id}: ${fmtLocal(s.at, timezone)} · post ${s.post_id} · ${s.kind} · media ${s.media_numbers.map((n) => `#${n}`).join(' ') || '–'} · ${s.status}`,
  );
  const recent = (await q<Post>('select id, kind, status, template, media_ids, caption from posts where brand_id = $1 order by created_at desc limit 15', [row.id])).map(
    (p) => `post ${p.id}: ${p.kind} · ${p.status} · ${p.template} · caption: ${(p.caption || '').split('\n')[0].slice(0, 60)}`,
  );
  const templates = templateList(row.kit).map((t) => t.id);

  const system = `you are the planner of "atelier", an instagram scheduling app. turn the user's command (any language) into actions.
now: ${now.weekday} ${now.date} ${now.time} (${timezone}). weeks start on monday. "monday" means the next upcoming monday (today if still ahead).
times are local ${timezone}, format "YYYY-MM-DDTHH:MM". "video 1" / "nummer 1" / "#1" all mean media #1.
templates: ${templates.join(', ')} (default ${brand.defaultTemplate}).
actions (json):
- {"type":"schedule","media":[1],"at":"...","template"?:"...","kind"?:"reel|carousel|photo"} — one post per item. several numbers in ONE post only if the user says so (e.g. "carousel from #3 #4"); otherwise "sunday #5 #6 #7 at 19, 20 and 21" = three schedule actions.
- {"type":"schedule","text":"slide 1 | line **bold**\\nslide 2","at":"..."} — text carousel (one line per slide).
- {"type":"create", ...same without at} — prepare/cut now, no time.
- {"type":"reschedule","scheduleId":"...","at":"..."}, {"type":"cancel","scheduleId":"..."}
- {"type":"caption","postId":"...","caption":"..."}, {"type":"template","postId":"...","template":"..."}
- {"type":"song","postId":"...","title":"..."}, {"type":"feedback","postId":"...","text":"..."} (editing feedback, e.g. "start is too slow")
if the command refers to "this"/"das" and media were just shared, use: ${mediaHint?.length ? mediaHint.map((n) => `#${n}`).join(' ') : 'the newest media'}.
answer only json: {"reply":"one short english sentence","actions":[...]}. if unclear, ask in reply and return no actions.`;

  const prompt = `media:\n${media.join('\n') || '(none)'}\n\nplanned:\n${plan.join('\n') || '(nothing)'}\n\nrecent posts:\n${recent.join('\n') || '(none)'}\n\ncommand: ${message}`;
  const out = parseJson<Proposal>(await claude({ system, prompt, maxTokens: 1500 }));
  return { reply: out.reply ?? '', actions: Array.isArray(out.actions) ? out.actions : [] };
}

/** Human-readable confirmation line per action ("mon 05.10. 15:00 · #1 · reel"). */
export function describe(a: Action, timezone: string): string {
  const at = 'at' in a && a.at ? fmtLocal(localToUtc(a.at, timezone), timezone) : '';
  const what = 'media' in a && a.media?.length ? a.media.map((n) => `#${n}`).join(' ') : 'text' in a && a.text ? 'text carousel' : '';
  switch (a.type) {
    case 'schedule':
      return [at, what, a.kind, a.template?.toLowerCase()].filter(Boolean).join(' · ');
    case 'create':
      return ['prepare', what, a.template?.toLowerCase()].filter(Boolean).join(' · ');
    case 'reschedule':
      return `move → ${at}`;
    case 'cancel':
      return 'cancel slot';
    case 'caption':
      return `caption: ${a.caption.slice(0, 50)}`;
    case 'template':
      return `template → ${a.template.toLowerCase()}`;
    case 'song':
      return `song: ${a.title}`;
    case 'feedback':
      return `feedback: ${a.text}`;
  }
}

export async function saveMessage(brandId: string, role: 'user' | 'assistant' | 'system', text: string, proposal?: Proposal & { lines?: string[]; applied?: boolean }) {
  return one<{ id: string }>('insert into messages (id, brand_id, role, text, proposal) values ($1,$2,$3,$4,$5) returning id', [
    id('msg'),
    brandId,
    role,
    text,
    proposal ? JSON.stringify(proposal) : null,
  ]);
}

export async function apply(row: BrandRow, timezone: string, actions: Action[]): Promise<string[]> {
  const done: string[] = [];
  for (const a of actions) {
    try {
      if (a.type === 'schedule' || a.type === 'create') {
        const media = a.media?.length ? await mediaByNumbers(row.id, a.media) : [];
        if (a.media?.length && media.length !== a.media.length) throw new Error(`unknown media ${a.media.map((n) => `#${n}`).join(' ')}`);
        const post = await createPost(row, { media, text: a.text, template: a.template, kind: a.kind });
        if (a.type === 'schedule') await schedulePost(row.id, post.id, localToUtc(a.at, timezone));
        after(() => render(post, row).then(() => undefined));
        done.push(`✓ ${describe(a, timezone)}`);
      } else if (a.type === 'reschedule') {
        await reschedule(a.scheduleId, row.id, localToUtc(a.at, timezone));
        done.push(`✓ ${describe(a, timezone)}`);
      } else if (a.type === 'cancel') {
        await cancelSchedule(a.scheduleId, row.id);
        done.push('✓ canceled');
      } else {
        const post = await getPost(a.postId, row.id);
        if (!post) throw new Error('post not found');
        if (a.type === 'caption') await updatePost(post.id, { caption: a.caption });
        if (a.type === 'song') await updatePost(post.id, { options: { ...post.options, song: a.title } });
        if (a.type === 'template') await render(await updatePost(post.id, { template: a.template }), row, { reusePlan: true });
        if (a.type === 'feedback') {
          await addFeedback(row, post.id, a.text);
          await render(post, row, { feedback: a.text });
        }
        done.push(`✓ ${describe(a, timezone)}`);
      }
    } catch (e) {
      done.push(`✗ ${describe(a, timezone)}: ${(e as Error).message}`);
    }
  }
  return done;
}
