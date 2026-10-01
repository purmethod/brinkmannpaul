import { brandKey, getBrand, getBrandAsset } from './brand';
import type { IgAccount } from './instagram';
import { redis } from './redis';
import { tokenInfo } from './token';

export interface Check {
  label: string;
  ok: boolean;
  detail?: string;
  needed: 'post' | 'reels' | 'nice';
}

/** Everything the 18:00 post depends on, as a checklist for /status. */
export async function setupChecks(brandId: string): Promise<Check[]> {
  const checks: Check[] = [];
  let redisOk = false;
  try {
    await redis().ping();
    redisOk = true;
  } catch (e) {
    checks.push({ label: 'upstash redis', ok: false, detail: (e as Error).message, needed: 'post' });
  }
  if (redisOk) checks.push({ label: 'upstash redis', ok: true, needed: 'post' });
  checks.push({ label: 'vercel blob (public store)', ok: Boolean(process.env.BLOB_READ_WRITE_TOKEN), needed: 'post' });

  if (redisOk) {
    const token = await tokenInfo(brandId);
    checks.push({ label: 'instagram token', ok: Boolean(token), detail: token ? undefined : 'IG_ACCESS_TOKEN missing', needed: 'post' });
    const account = await redis().get<IgAccount>(brandKey(brandId, 'ig', 'account'));
    checks.push({
      label: 'instagram account',
      ok: Boolean(account?.id),
      detail: account?.id ? `@${account.username ?? account.id}` : 'press “test instagram”',
      needed: 'post',
    });
  }

  const production = process.env.VERCEL_ENV === 'production';
  checks.push({
    label: 'production deployment (cron runs only there)',
    ok: production,
    detail: production ? undefined : `this is ${process.env.VERCEL_ENV ?? 'not vercel'} — use “post now” or merge to main`,
    needed: 'post',
  });
  checks.push({ label: 'CRON_SECRET', ok: Boolean(process.env.CRON_SECRET), detail: 'without it the 18:00 cron is rejected', needed: 'post' });

  if (redisOk) {
    const brand = await getBrand(brandId);
    const sig = await getBrandAsset(brandId, brand.signature.file).catch(() => null);
    checks.push({ label: 'signature', ok: Boolean(sig), detail: sig ? undefined : 'upload it on /brand, then re-render', needed: 'nice' });
  }
  checks.push({ label: 'claude api (captions, subtitles)', ok: Boolean(process.env.ANTHROPIC_API_KEY), needed: 'nice' });
  checks.push({ label: 'github token (reels)', ok: Boolean(process.env.GITHUB_TOKEN), needed: 'reels' });
  return checks;
}
