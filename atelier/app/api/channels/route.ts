import { requireCtx, route, HttpError, ensureBrands, isOwner } from '@/lib/auth';
import { autopilotOf, pendingReviews, reviewStats, slotTimes } from '@/lib/autopilot';
import { resolveBrand } from '@/lib/brand';
import { id, one, q } from '@/lib/db';
import type { BrandRow, ChannelSettings } from '@/lib/types';

/** Every channel the owner runs, with what matters at a glance. */
export const GET = route(async () => {
  const { user, brand } = await requireCtx();
  if (isOwner(user)) await ensureBrands(user.id); // the repo's kits belong to the owner only
  const rows = await q<BrandRow & { username: string | null }>(
    `select b.*, c.username from brands b left join connections c on c.brand_id = b.id and c.platform = 'instagram'
      where b.user_id = $1 order by b.created_at`,
    [user.id],
  );
  const channels = [];
  for (const r of rows) {
    const k = resolveBrand(r);
    const ap = autopilotOf(r);
    const next = await one<{ n: number }>(
      "select count(*)::int as n from schedules where brand_id = $1 and status = 'pending' and at > now() and at < now() + interval '24 hours'",
      [r.id],
    );
    channels.push({
      id: r.id,
      kit: r.kit,
      name: k.name,
      handle: k.handle,
      logo: r.settings?.channel?.logo ?? null,
      instagram: r.username,
      active: r.id === brand.id,
      autopilot: { enabled: ap.enabled, everyHours: ap.everyHours, from: ap.from, to: ap.to, perDay: slotTimes(ap).length, review: ap.review },
      waiting: await pendingReviews(r.id),
      next24h: next?.n ?? 0,
      stats: reviewStats(ap),
    });
  }
  return Response.json({ channels });
});

/** New theme channel on the channel design: { name, handle, tagline, logo, cta, brief, tone } */
export const POST = route(async (req: Request) => {
  const { user } = await requireCtx(req);
  const b = (await req.json()) as ChannelSettings;
  const name = String(b.name || '').trim().toLowerCase().slice(0, 40);
  if (!name) throw new HttpError(400, 'give the channel a name');
  const taken = await q<{ name: string }>('select name from brands where user_id = $1', [user.id]);
  if (taken.some((t) => t.name.toLowerCase() === name)) throw new HttpError(409, `a channel called “${name}” already exists`);
  const handle = `@${String(b.handle || name).replace(/^@/, '').replace(/[^a-z0-9._]/gi, '').toLowerCase().slice(0, 30)}`;
  const channel: ChannelSettings = {
    name,
    handle,
    tagline: String(b.tagline ?? '').toLowerCase().slice(0, 40),
    logo: (Array.isArray(b.logo) && b.logo.length ? b.logo : [name]).map((l) => String(l).toLowerCase().slice(0, 12)).slice(0, 3),
    cta: String(b.cta ?? `follow ${handle} for more.`).toLowerCase().slice(0, 140),
    brief: String(b.brief ?? '').slice(0, 4000),
    tone: String(b.tone ?? '').slice(0, 600),
  };
  const row = await one<BrandRow>("insert into brands (id, user_id, kit, name, settings) values ($1, $2, 'foyo', $3, $4) returning *", [
    id('brd'),
    user.id,
    name,
    JSON.stringify({ channel, autopilot: { ...autopilotOf({ settings: {} } as BrandRow) } }),
  ]);
  return Response.json({ channel: { id: row!.id } });
});
