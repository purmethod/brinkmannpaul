import { HttpError, requireCtx, route } from '@/lib/auth';
import { one } from '@/lib/db';
import { mediaByIds } from '@/lib/media';
import { deletePost, getPost, render, updatePost } from '@/lib/posts';
import { addFeedback } from '@/lib/rules';
import { cancelSchedule, publishPost, schedulePost } from '@/lib/schedule';
import { localToUtc } from '@/lib/time';
import type { Post, Schedule } from '@/lib/types';

export const maxDuration = 300;
type P = { params: Promise<{ id: string }> };

async function load(req: Request, params: P['params']) {
  const ctx = await requireCtx(req);
  const post = await getPost((await params).id, ctx.brand.id);
  if (!post) throw new HttpError(404, 'post not found');
  return { ...ctx, post };
}

async function view(post: Post) {
  const schedule = await one<Schedule>("select * from schedules where post_id = $1 and status <> 'canceled' order by at desc limit 1", [post.id]);
  const media = await mediaByIds(post.media_ids);
  return { post, schedule, media: media.map((m) => ({ number: m.number, kind: m.kind, url: m.url })) };
}

export const GET = route(async (req: Request, { params }: P) => {
  const { post } = await load(req, params);
  return Response.json(await view(post));
});

/**
 * { caption?, template?, at?: "YYYY-MM-DDTHH:MM" | null, collaborators?, subtitleLanguage?, voiceoverUrl?, feedback?,
 *   action?: 'approve' | 'unapprove' | 'recut' | 'post_now' }
 */
export const PATCH = route(async (req: Request, { params }: P) => {
  const { user, brand, post: current } = await load(req, params);
  const b = (await req.json().catch(() => ({}))) as {
    caption?: string; template?: string; at?: string | null; collaborators?: string[]; subtitleLanguage?: string;
    voiceoverUrl?: string | null; feedback?: string; action?: string;
  };
  if (current.status === 'posted') throw new HttpError(409, 'already posted');
  let post = current;

  const patch: Partial<Post> = {};
  if (typeof b.caption === 'string') patch.caption = b.caption.slice(0, 2200);
  const options = { ...post.options };
  if (Array.isArray(b.collaborators)) options.collaborators = b.collaborators.map((c) => String(c).replace(/^@/, '').trim()).filter(Boolean).slice(0, 3);
  if (typeof b.subtitleLanguage === 'string') options.subtitleLanguage = b.subtitleLanguage;
  if (b.voiceoverUrl !== undefined) options.voiceoverUrl = b.voiceoverUrl;
  patch.options = options;
  const templateChanged = typeof b.template === 'string' && b.template !== post.template;
  if (templateChanged) patch.template = b.template!;
  post = await updatePost(post.id, patch);

  if (b.feedback?.trim()) await addFeedback(brand, post.id, b.feedback.trim());

  if (b.action === 'approve') {
    if (!(post.output.video || post.output.slides?.length)) throw new HttpError(409, 'not rendered yet');
    post = await updatePost(post.id, { status: 'approved', error: null });
  } else if (b.action === 'unapprove') {
    post = await updatePost(post.id, { status: 'ready' });
  } else if (b.action === 'recut' || templateChanged || b.voiceoverUrl !== undefined || b.subtitleLanguage) {
    // voiceover / template / language re-render the same cut; recut with feedback cuts anew
    const keepCut = b.action !== 'recut';
    post = await render(post, brand, { feedback: b.feedback?.trim(), reusePlan: keepCut });
  } else if (b.action === 'post_now') {
    if (post.status !== 'approved') post = await updatePost(post.id, { status: 'approved' });
    try {
      post = await publishPost(post, brand);
    } catch (e) {
      post = await updatePost(post.id, { status: 'error', error: (e as Error).message });
    }
  }

  if (b.at !== undefined) {
    const s = await one<Schedule>("select * from schedules where post_id = $1 and status = 'pending'", [post.id]);
    if (b.at === null) {
      if (s) await cancelSchedule(s.id, brand.id);
    } else await schedulePost(brand.id, post.id, localToUtc(b.at, user.timezone));
  }
  return Response.json(await view(post));
});

export const DELETE = route(async (req: Request, { params }: P) => {
  const { brand, post } = await load(req, params);
  const s = await one<Schedule>("select * from schedules where post_id = $1 and status = 'pending'", [post.id]);
  if (s) await cancelSchedule(s.id, brand.id);
  await deletePost(post);
  return Response.json({ ok: true });
});
