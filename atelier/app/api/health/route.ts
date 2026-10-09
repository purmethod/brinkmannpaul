import { blobMode } from '@/lib/blob';
import { one } from '@/lib/db';
import { reelsReady } from '@/lib/reel';
import { qstashReady } from '@/lib/schedule';

export const dynamic = 'force-dynamic';

/** What is wired up in this deployment — names and yes/no only, never values. Read by the deploy workflow. */
export async function GET() {
  const t = Date.now();
  const db = await one<{ users: number; posts: number; pending: number }>(
    `select (select count(*)::int from users) as users, (select count(*)::int from posts) as posts,
            (select count(*)::int from schedules where status = 'pending') as pending`,
  )
    .then((r) => ({ ok: true, ms: Date.now() - t, ...r }))
    .catch((e) => ({ ok: false, error: (e as Error).message.slice(0, 160) }));
  const checks = {
    database: db,
    storage: blobMode() ?? 'missing',
    claude: Boolean(process.env.ANTHROPIC_API_KEY),
    qstash: qstashReady(),
    instagramApp: Boolean((process.env.INSTAGRAM_APP_ID || process.env.META_APP_ID) && (process.env.INSTAGRAM_APP_SECRET || process.env.META_APP_SECRET)),
    photoReels: await reelsReady(),
    videoWorker: Boolean(process.env.GITHUB_TOKEN),
    signup: process.env.SIGNUP_OPEN !== 'false',
  };
  const ok = db.ok && checks.storage !== 'missing' && checks.claude;
  return Response.json({ ok, version: process.env.APP_VERSION ?? process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? null, ...checks }, { status: ok ? 200 : 503 });
}
