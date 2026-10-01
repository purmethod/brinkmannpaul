import { requireCtx, route } from '@/lib/auth';
import { resolveBrand, templateList } from '@/lib/brand';
import { one, q } from '@/lib/db';
import { isBlobUrl } from '@/lib/media';
import { connectionStatus } from '@/lib/platforms';
import { updateSettings } from '@/lib/rules';
import type { BrandSettings } from '@/lib/types';

export const GET = route(async () => {
  const { user, brand } = await requireCtx();
  const b = resolveBrand(brand);
  const keys = await one<{ n: number }>('select count(*)::int as n from api_keys where user_id = $1', [user.id]);
  return Response.json({
    timezone: user.timezone,
    handle: b.handle,
    autoApprove: b.autoApprove,
    captionRules: b.caption.rules.join('\n'),
    cutRules: b.cutRules,
    subtitleLanguage: b.subtitleLanguage,
    defaultTemplate: b.defaultTemplate,
    signatureUrl: brand.settings?.signatureUrl ?? null,
    templates: templateList(brand.kit),
    connections: await connectionStatus(brand.id),
    keys: keys?.n ?? 0,
    openFeedback: (await one<{ n: number }>('select count(*)::int as n from edit_feedback where brand_id = $1 and not consumed', [brand.id]))?.n ?? 0,
  });
});

export const PATCH = route(async (req: Request) => {
  const { user, brand } = await requireCtx(req);
  const b = (await req.json()) as BrandSettings & { timezone?: string };
  const patch: BrandSettings = {};
  if (typeof b.autoApprove === 'boolean') patch.autoApprove = b.autoApprove;
  if (typeof b.captionRules === 'string') patch.captionRules = b.captionRules.slice(0, 4000);
  if (typeof b.cutRules === 'string') patch.cutRules = b.cutRules.slice(0, 4000);
  if (typeof b.subtitleLanguage === 'string') patch.subtitleLanguage = b.subtitleLanguage.slice(0, 20);
  if (typeof b.defaultTemplate === 'string') patch.defaultTemplate = b.defaultTemplate;
  if (b.signatureUrl === null || isBlobUrl(b.signatureUrl)) patch.signatureUrl = b.signatureUrl;
  await updateSettings(brand.id, patch);
  if (typeof b.timezone === 'string' && b.timezone) {
    Intl.DateTimeFormat('en', { timeZone: b.timezone }); // throws on invalid zones
    await q('update users set timezone = $2 where id = $1', [user.id, b.timezone]);
  }
  return Response.json({ ok: true });
});
