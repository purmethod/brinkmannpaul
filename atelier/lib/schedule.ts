import { Client } from '@upstash/qstash';
import { resolveBrand } from './brand';
import { id, one, q } from './db';
import { appOrigin } from './origin';
import { getConnection, getPlatform } from './platforms';
import { getPost, recoverStuck, updatePost } from './posts';
import { fmtLocal } from './time';
import type { BrandRow, Post, Schedule } from './types';

const RETRY_MINUTES = 10;
const MAX_ATTEMPTS = 3;

export function qstashReady() {
  return Boolean(process.env.QSTASH_TOKEN);
}

function qstash() {
  const url = process.env.QSTASH_URL;
  return new Client({ token: process.env.QSTASH_TOKEN!, ...(url && /^https?:\/\//.test(url) ? { baseUrl: url } : {}) });
}

/**
 * Minute-exact delivery: one qstash message per schedule, delivered to /api/qstash/publish.
 * Without qstash (or if it fails) the schedule stays unqueued and sweepDue() picks it up.
 */
async function enqueue(scheduleId: string, at: Date): Promise<string | null> {
  if (!qstashReady()) return null;
  const notBefore = Math.floor(at.getTime() / 1000);
  try {
    const res = await qstash().publishJSON({
      url: `${appOrigin()}/api/qstash/publish`,
      body: { scheduleId },
      retries: 2,
      ...(notBefore > Date.now() / 1000 + 5 ? { notBefore } : {}),
    });
    return (res as { messageId: string }).messageId;
  } catch (e) {
    console.error('qstash enqueue failed', e);
    return null;
  }
}

async function dequeue(messageId: string | null) {
  if (messageId && qstashReady()) await qstash().messages.delete(messageId).catch(() => undefined);
}

/**
 * With qstash: a heartbeat every 15 minutes (posts the due, keeps the autopilot topped up).
 * Idempotent — the fixed schedule id updates instead of duplicating.
 */
let heartbeatSet = false;
export async function ensureHeartbeat() {
  if (!qstashReady() || heartbeatSet) return heartbeatSet;
  await qstash().schedules.create({
    scheduleId: 'atelier-heartbeat',
    destination: `${appOrigin()}/api/qstash/publish`,
    cron: '*/15 * * * *',
    body: JSON.stringify({ heartbeat: true }),
    headers: { 'content-type': 'application/json' },
    retries: 0,
  });
  heartbeatSet = true;
  return true;
}

/** Fallback publisher: runs every unqueued schedule whose time has come. Safe to call often — runSchedule claims atomically. */
export async function sweepDue(brandId?: string) {
  await recoverStuck(brandId).catch((e) => console.error('recover', e));
  const due = await q<{ id: string }>(
    `select id from schedules where status = 'pending' and message_id is null and coalesce(retry_at, at) <= now()
       ${brandId ? 'and brand_id = $1' : ''} order by at limit 10`,
    brandId ? [brandId] : [],
  );
  const results = [];
  for (const s of due) results.push(await runSchedule(s.id).catch((e) => ({ error: (e as Error).message })));
  return results;
}

export async function notify(brandId: string, text: string) {
  await q("insert into messages (id, brand_id, role, text) values ($1, $2, 'system', $3)", [id('msg'), brandId, text]);
}

export async function schedulePost(brandId: string, postId: string, at: Date): Promise<Schedule> {
  // one active slot per post: re-planning moves it
  const existing = await one<Schedule>("select * from schedules where post_id = $1 and status = 'pending'", [postId]);
  if (existing) return reschedule(existing.id, brandId, at);
  const s = (await one<Schedule>('insert into schedules (id, post_id, brand_id, at) values ($1, $2, $3, $4) returning *', [id('sch'), postId, brandId, at]))!;
  const messageId = await enqueue(s.id, at);
  return (await one<Schedule>('update schedules set message_id = $2 where id = $1 returning *', [s.id, messageId]))!;
}

export async function reschedule(scheduleId: string, brandId: string, at: Date): Promise<Schedule> {
  const s = await one<Schedule>('select * from schedules where id = $1 and brand_id = $2', [scheduleId, brandId]);
  if (!s) throw new Error('schedule not found');
  await dequeue(s.message_id);
  const messageId = await enqueue(s.id, at);
  return (await one<Schedule>(
    "update schedules set at = $2, message_id = $3, status = 'pending', attempts = 0, error = null, retry_at = null where id = $1 returning *",
    [s.id, at, messageId],
  ))!;
}

export async function cancelSchedule(scheduleId: string, brandId: string) {
  const s = await one<Schedule>('select * from schedules where id = $1 and brand_id = $2', [scheduleId, brandId]);
  if (!s) throw new Error('schedule not found');
  await dequeue(s.message_id);
  await q("update schedules set status = 'canceled' where id = $1", [s.id]);
}

export async function publishPost(post: Post, row: BrandRow): Promise<Post> {
  const conn = await getConnection(row.id, 'instagram');
  if (!conn) throw new Error('instagram is not connected (settings → connect)');
  const { mediaId, permalink } = await getPlatform(conn.platform).publish(conn, post);
  return updatePost(post.id, { status: 'posted', ig_media_id: mediaId, permalink, error: null });
}

/** Called by qstash at the scheduled minute. Idempotent; failures retry after 10 minutes. */
export async function runSchedule(scheduleId: string) {
  // claim: only one delivery may run
  const s = await one<Schedule>("update schedules set status = 'done' where id = $1 and status = 'pending' returning *", [scheduleId]);
  if (!s) return { skipped: 'not pending' };
  const row = (await one<BrandRow>('select * from brands where id = $1', [s.brand_id]))!;
  const brand = resolveBrand(row);
  const post = await getPost(s.post_id, s.brand_id);
  const when = fmtLocal(s.at, brand.timezone);

  const retry = async (reason: string) => {
    const attempts = s.attempts + 1;
    if (attempts >= MAX_ATTEMPTS) {
      await q("update schedules set status = 'error', attempts = $2, error = $3 where id = $1", [s.id, attempts, reason]);
      if (post) await updatePost(post.id, { status: 'error', error: reason });
      await notify(s.brand_id, `not posted (${when}): ${reason}`);
      return { error: reason };
    }
    const next = new Date(Date.now() + RETRY_MINUTES * 60_000);
    const messageId = await enqueue(s.id, next);
    await q("update schedules set status = 'pending', attempts = $2, error = $3, message_id = $4, retry_at = $5 where id = $1", [s.id, attempts, reason, messageId, next]);
    await notify(s.brand_id, `${when}: ${reason} — retrying in ${RETRY_MINUTES} minutes`);
    return { retry: reason };
  };

  if (!post) {
    await q("update schedules set status = 'canceled', error = 'post deleted' where id = $1", [s.id]);
    return { skipped: 'post deleted' };
  }
  if (post.status === 'posted') return { skipped: 'already posted' };
  if (post.status === 'processing') return retry('still cutting');
  if (post.status === 'error' && !(post.output.video || post.output.slides?.length)) return retry(post.error || 'render failed');
  if (!post.caption?.trim()) return retry('no caption yet'); // never out without its words
  if (post.status === 'review') {
    // learning phase: nothing goes out without the owner's ok; it gets a new slot once approved
    await q("update schedules set status = 'canceled', error = 'waiting for your ok' where id = $1", [s.id]);
    await notify(s.brand_id, `${when}: not posted — it is waiting for your ok`);
    return { skipped: 'review' };
  }
  if (post.status === 'ready') {
    await q("update schedules set status = 'canceled', error = 'paused' where id = $1", [s.id]);
    return { skipped: 'paused' };
  }
  // no api connection (e.g. a personal account): hand it to the user to share from the phone
  if (!(await getConnection(row.id, 'instagram'))) {
    await updatePost(post.id, { status: 'due', error: null });
    await notify(s.brand_id, `${when}: ready to share — open it and tap share to instagram`);
    return { due: post.id };
  }

  try {
    await publishPost(post, row);
    await q('update schedules set error = null, attempts = $2 where id = $1', [s.id, s.attempts + 1]);
    return { posted: post.id };
  } catch (e) {
    return retry((e as Error).message);
  }
}

export async function upcoming(brandId: string, fromDays = 1, toDays = 14) {
  return q<Schedule & { kind: string; post_status: string; template: string; cover: string | null; media_numbers: number[] }>(
    `select s.*, p.kind, p.status as post_status, p.template,
       coalesce(p.output->>'cover', p.output->'slides'->0->>'png') as cover,
       coalesce((select array_agg(m.number order by m.number) from media m where m.id = any(p.media_ids)), '{}') as media_numbers
     from schedules s join posts p on p.id = s.post_id
     where s.brand_id = $1 and s.status <> 'canceled'
       and s.at > now() - make_interval(days => $2) and s.at < now() + make_interval(days => $3)
     order by s.at`,
    [brandId, fromDays, toDays],
  );
}
