import { after } from 'next/server';
import { requireCtx, route } from '@/lib/auth';
import { autopilotOf, poolSize, runAutopilot, slotTimes } from '@/lib/autopilot';
import { resolveBrand, templateList } from '@/lib/brand';
import { one, q } from '@/lib/db';
import { isBlobUrl } from '@/lib/media';
import { connectionStatus } from '@/lib/platforms';
import { updateSettings } from '@/lib/rules';
import { ensureHeartbeat, qstashReady } from '@/lib/schedule';
import type { AutopilotSettings, BrandSettings } from '@/lib/types';

export const maxDuration = 300;

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
    autopilot: { ...autopilotOf(brand), recent: undefined, slots: slotTimes(autopilotOf(brand)), pool: await poolSize(brand.id), exact: qstashReady() },
    openFeedback: (await one<{ n: number }>('select count(*)::int as n from edit_feedback where brand_id = $1 and not consumed', [brand.id]))?.n ?? 0,
  });
});

export const PATCH = route(async (req: Request) => {
  const { user, brand } = await requireCtx(req);
  const b = (await req.json()) as Omit<BrandSettings, 'autopilot'> & { timezone?: string; autopilot?: Partial<AutopilotSettings> };
  const patch: BrandSettings = {};
  // autopilot: only the given fields are merged — history and recent topics are written concurrently elsewhere
  let apPatch: Partial<AutopilotSettings> | null = null;
  if (b.autopilot && typeof b.autopilot === 'object') {
    const a = b.autopilot;
    const time = (t: unknown) => typeof t === 'string' && /^\d{2}:\d{2}$/.test(t);
    apPatch = {
      ...(typeof a.enabled === 'boolean' ? { enabled: a.enabled } : {}),
      ...(typeof a.everyHours === 'number' ? { everyHours: Math.min(24, Math.max(1, a.everyHours)) } : {}),
      ...(typeof a.slides === 'number' ? { slides: Math.min(10, Math.max(3, Math.round(a.slides))) } : {}),
      ...(typeof a.insights === 'string' ? { insights: a.insights.slice(0, 12000) } : {}),
      ...(typeof a.review === 'boolean' ? { review: a.review } : {}),
      ...(typeof a.reviewTarget === 'number' ? { reviewTarget: Math.min(1000, Math.max(10, Math.round(a.reviewTarget))) } : {}),
      ...(time(a.from) ? { from: a.from } : {}),
      ...(time(a.to) ? { to: a.to } : {}),
    };
    await q(
      `update brands set settings = settings || jsonb_build_object('autopilot', $2::jsonb || coalesce(settings->'autopilot', '{}'::jsonb) || $3::jsonb) where id = $1`,
      [brand.id, JSON.stringify(autopilotOf({ ...brand, settings: {} })), JSON.stringify(apPatch)],
    );
  }
  if (typeof b.autoApprove === 'boolean') patch.autoApprove = b.autoApprove;
  if (typeof b.captionRules === 'string') patch.captionRules = b.captionRules.slice(0, 4000);
  if (typeof b.cutRules === 'string') patch.cutRules = b.cutRules.slice(0, 4000);
  if (typeof b.subtitleLanguage === 'string') patch.subtitleLanguage = b.subtitleLanguage.slice(0, 20);
  if (typeof b.defaultTemplate === 'string') patch.defaultTemplate = b.defaultTemplate;
  if (b.signatureUrl === null || isBlobUrl(b.signatureUrl)) patch.signatureUrl = b.signatureUrl;
  const row = await updateSettings(brand.id, patch);
  if (apPatch && autopilotOf(row).enabled) {
    // switched on: heartbeat for exact times, and the first post right away
    after(async () => {
      await ensureHeartbeat().catch((e) => console.error('heartbeat', e));
      await runAutopilot(row, user, 1).catch((e) => console.error('autopilot', e));
    });
  }
  if (typeof b.timezone === 'string' && b.timezone) {
    Intl.DateTimeFormat('en', { timeZone: b.timezone }); // throws on invalid zones
    await q('update users set timezone = $2 where id = $1', [user.id, b.timezone]);
  }
  return Response.json({ ok: true });
});
