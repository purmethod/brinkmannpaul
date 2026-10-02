import { HttpError, requireCtx, route } from '@/lib/auth';
import { autopilotOf, pendingReviews, poolSize, reviewStats, slotTimes } from '@/lib/autopilot';
import { resolveBrand } from '@/lib/brand';
import { one, q } from '@/lib/db';
import { connectionStatus } from '@/lib/platforms';
import { qstashReady } from '@/lib/schedule';
import type { BrandRow, ChannelSettings } from '@/lib/types';

type P = { params: Promise<{ id: string }> };

async function mine(userId: string, id: string) {
  const row = await one<BrandRow>('select * from brands where id = $1 and user_id = $2', [id, userId]);
  if (!row) throw new HttpError(404, 'channel not found');
  return row;
}

export const GET = route(async (_req: Request, { params }: P) => {
  const { user } = await requireCtx();
  const row = await mine(user.id, (await params).id);
  const k = resolveBrand(row);
  const ap = autopilotOf(row);
  return Response.json({
    id: row.id,
    kit: row.kit,
    custom: Boolean(row.settings?.channel),
    name: k.name,
    handle: k.handle,
    brief: k.brief ?? '',
    tone: k.tone ?? '',
    channel: row.settings?.channel ?? null,
    autopilot: { ...ap, recent: (ap.recent ?? []).slice(0, 8), history: undefined, slots: slotTimes(ap) },
    stats: reviewStats(ap),
    waiting: await pendingReviews(row.id),
    pool: await poolSize(row.id),
    exact: qstashReady(),
    connections: await connectionStatus(row.id),
  });
});

/** { channel?: ChannelSettings } — the autopilot is changed through /api/settings on the active channel. */
export const PATCH = route(async (req: Request, { params }: P) => {
  const { user } = await requireCtx(req);
  const row = await mine(user.id, (await params).id);
  const b = (await req.json()) as { channel?: ChannelSettings };
  if (b.channel) {
    const cur = row.settings?.channel ?? {};
    const c = b.channel;
    const str = (v: unknown, max: number) => (typeof v === 'string' ? v.slice(0, max) : undefined);
    const next: ChannelSettings = {
      ...cur,
      ...(str(c.name, 40) !== undefined ? { name: str(c.name, 40)!.toLowerCase() } : {}),
      ...(str(c.handle, 31) !== undefined ? { handle: `@${str(c.handle, 31)!.replace(/^@/, '').toLowerCase()}` } : {}),
      ...(str(c.tagline, 40) !== undefined ? { tagline: str(c.tagline, 40)!.toLowerCase() } : {}),
      ...(Array.isArray(c.logo) ? { logo: c.logo.map((l) => String(l).toLowerCase().slice(0, 12)).filter(Boolean).slice(0, 3) } : {}),
      ...(str(c.cta, 140) !== undefined ? { cta: str(c.cta, 140)!.toLowerCase() } : {}),
      ...(str(c.brief, 4000) !== undefined ? { brief: str(c.brief, 4000) } : {}),
      ...(str(c.tone, 600) !== undefined ? { tone: str(c.tone, 600) } : {}),
    };
    await q("update brands set settings = settings || jsonb_build_object('channel', $2::jsonb), name = coalesce($3, name) where id = $1", [
      row.id,
      JSON.stringify(next),
      next.name ?? null,
    ]);
  }
  return Response.json({ ok: true });
});

/** Only channels made in the app can be removed (kit accounts come back with the repo). */
export const DELETE = route(async (_req: Request, { params }: P) => {
  const { user } = await requireCtx();
  const row = await mine(user.id, (await params).id);
  if (!row.settings?.channel || row.kit !== 'foyo' || row.name === 'foyo') throw new HttpError(409, 'this channel cannot be removed here');
  const n = await one<{ n: number }>('select count(*)::int as n from brands where user_id = $1', [user.id]);
  if ((n?.n ?? 0) <= 1) throw new HttpError(409, 'keep at least one channel');
  await q('delete from brands where id = $1', [row.id]);
  return Response.json({ ok: true });
});
