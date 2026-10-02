import { cookies } from 'next/headers';
import { BRAND_COOKIE, HttpError, ensureBrands, requireCtx, route } from '@/lib/auth';
import { resolveBrand } from '@/lib/brand';
import { one, q } from '@/lib/db';
import type { BrandRow } from '@/lib/types';

/** The owner's accounts (one per brand kit) and which one is active. */
export const GET = route(async () => {
  const { user, brand } = await requireCtx();
  await ensureBrands(user.id);
  const rows = await q<BrandRow & { username: string | null }>(
    `select b.id, b.user_id, b.kit, b.name, b.settings, c.username
       from brands b left join connections c on c.brand_id = b.id and c.platform = 'instagram'
      where b.user_id = $1 order by b.created_at`,
    [user.id],
  );
  return Response.json({
    active: brand.id,
    brands: rows.map((b) => ({
      id: b.id,
      name: resolveBrand(b).name,
      handle: resolveBrand(b).handle,
      logo: b.settings?.channel?.logo ?? (b.kit === 'foyo' ? ['fo', 'yo'] : null),
      instagram: b.username,
      autopilot: Boolean(b.settings?.autopilot?.enabled),
    })),
  });
});

/** Switch the active account: { active } */
export const PATCH = route(async (req: Request) => {
  const { user } = await requireCtx(req);
  const { active } = (await req.json()) as { active?: string };
  const b = active ? await one('select id from brands where id = $1 and user_id = $2', [active, user.id]) : null;
  if (!b) throw new HttpError(404, 'account not found');
  (await cookies()).set(BRAND_COOKIE, active!, { httpOnly: true, secure: true, sameSite: 'lax', path: '/', maxAge: 60 * 60 * 24 * 365 });
  return Response.json({ ok: true });
});
