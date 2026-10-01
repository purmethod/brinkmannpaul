import type { Ctx } from './auth';
import { resolveBrand } from './brand';
import { listMedia } from './media';
import { apply, type Action } from './planner';
import { getPost, render } from './posts';
import { addFeedback } from './rules';
import { upcoming } from './schedule';
import { fmtLocal } from './time';

const at = { type: 'string', description: 'local time "YYYY-MM-DDTHH:MM" in the user timezone' };
const media = { type: 'array', items: { type: 'integer' }, description: 'media numbers, e.g. [1] for #1' };
const template = { type: 'string', description: 'WHITE, BLACK or PHOTO' };

export const tools = [
  { name: 'list_media', description: 'List uploaded videos and photos with their numbers (#1, #2 …).', inputSchema: { type: 'object', properties: {} } },
  {
    name: 'cut_video',
    description: 'Cut one or more videos (#numbers, joined in order) into a reel: hook first, pauses and filler removed, subtitles, signature. Returns the post id; rendering takes a few minutes.',
    inputSchema: { type: 'object', properties: { media, template }, required: ['media'] },
  },
  {
    name: 'create_carousel',
    description: 'Render a text carousel. One line per slide, "|" = line break, **bold**. Optional photos as background (#numbers).',
    inputSchema: { type: 'object', properties: { text: { type: 'string' }, media, template }, required: ['text'] },
  },
  {
    name: 'schedule_post',
    description: 'Create a post from media (#numbers) or carousel text and schedule it for an exact minute.',
    inputSchema: { type: 'object', properties: { media, text: { type: 'string' }, at, template }, required: ['at'] },
  },
  { name: 'list_schedule', description: 'Planned and recent posts with schedule ids.', inputSchema: { type: 'object', properties: { days: { type: 'integer' } } } },
  {
    name: 'reschedule',
    description: 'Move a scheduled post.',
    inputSchema: { type: 'object', properties: { schedule_id: { type: 'string' }, at }, required: ['schedule_id', 'at'] },
  },
  { name: 'cancel', description: 'Cancel a scheduled post.', inputSchema: { type: 'object', properties: { schedule_id: { type: 'string' } }, required: ['schedule_id'] } },
  {
    name: 'give_feedback',
    description: 'Editing feedback on a cut ("start too slow", "fewer cuts"). Learned into the cut rules; recut=true re-cuts the video now.',
    inputSchema: { type: 'object', properties: { post_id: { type: 'string' }, text: { type: 'string' }, recut: { type: 'boolean' } }, required: ['post_id', 'text'] },
  },
];

type Args = Record<string, unknown>;

export async function callTool(ctx: Ctx, name: string, args: Args): Promise<string> {
  const tz = ctx.user.timezone;
  const row = ctx.brand;
  const nums = (v: unknown) => (Array.isArray(v) ? v.map(Number).filter(Number.isFinite) : undefined);
  const run = async (a: Action) => (await apply(row, tz, [a])).join('\n');

  switch (name) {
    case 'list_media': {
      const m = await listMedia(row.id, 100);
      return m.map((x) => `#${x.number} ${x.kind} ${x.status}${x.filename ? ` ${x.filename}` : ''} (${fmtLocal(x.created_at, tz)})`).join('\n') || 'no media yet';
    }
    case 'cut_video':
      return run({ type: 'create', media: nums(args.media), template: args.template as string, kind: 'reel' });
    case 'create_carousel':
      return run({ type: 'create', text: String(args.text ?? ''), media: nums(args.media), template: args.template as string, kind: 'carousel' });
    case 'schedule_post':
      return run({ type: 'schedule', media: nums(args.media), text: args.text as string | undefined, at: String(args.at), template: args.template as string });
    case 'list_schedule': {
      const rows = await upcoming(row.id, 1, Number(args.days) || 14);
      return (
        rows
          .map((s) => `${s.id} · ${fmtLocal(s.at, tz)} · ${s.kind} · ${s.media_numbers.map((n) => `#${n}`).join(' ') || 'text'} · post ${s.post_id} (${s.post_status}) · ${s.status}${s.error ? ` · ${s.error}` : ''}`)
          .join('\n') || 'nothing planned'
      );
    }
    case 'reschedule':
      return run({ type: 'reschedule', scheduleId: String(args.schedule_id), at: String(args.at) });
    case 'cancel':
      return run({ type: 'cancel', scheduleId: String(args.schedule_id) });
    case 'give_feedback': {
      const post = await getPost(String(args.post_id), row.id);
      if (!post) return 'post not found';
      await addFeedback(row, post.id, String(args.text));
      if (args.recut) await render(post, row, { feedback: String(args.text) });
      return `saved. current cut rules:\n${resolveBrand(row).cutRules}`;
    }
    default:
      throw new Error(`unknown tool ${name}`);
  }
}
