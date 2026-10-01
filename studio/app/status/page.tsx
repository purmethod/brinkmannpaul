import { defaultBrandId, getBrand, loadBrandDefaults } from '@/lib/brand';
import { pickNext } from '@/lib/queue';
import { ensureSeed } from '@/lib/seed';
import { setupChecks, type Check } from '@/lib/setup';
import { listPosts } from '@/lib/store';
import { zonedNow } from '@/lib/time';
import { tokenInfo } from '@/lib/token';
import type { Brand, Post } from '@/lib/types';
import PostActions from './post-actions';
import SetupPanel from './setup-panel';

export const dynamic = 'force-dynamic';
export const maxDuration = 120;

const fmt = (ms: number | undefined, tz: string) =>
  ms ? new Date(ms).toLocaleString('en-GB', { timeZone: tz, dateStyle: 'short', timeStyle: 'short' }) : '–';

export default async function StatusPage() {
  const brandId = defaultBrandId();
  const errors: string[] = [];
  try {
    await ensureSeed();
  } catch (e) {
    errors.push(`first post could not be created: ${(e as Error).message}`);
  }

  let brand: Brand = loadBrandDefaults(brandId);
  let posts: Post[] = [];
  let token: Awaited<ReturnType<typeof tokenInfo>> = null;
  let next: Post | null = null;
  let checks: Check[] = [];
  try {
    brand = await getBrand(brandId);
    const { date } = zonedNow(brand.timezone);
    [posts, token, next, checks] = await Promise.all([listPosts(brandId), tokenInfo(brandId), pickNext(brandId, date), setupChecks(brandId)]);
  } catch (e) {
    errors.push((e as Error).message);
  }

  const tz = brand.timezone;
  const { hour } = zonedNow(tz);
  const when = hour <= brand.postHour ? `today ${brand.postHour}:00` : `tomorrow ${brand.postHour}:00`;
  const order: Post['status'][] = ['error', 'processing', 'draft', 'approved', 'posted'];
  const sorted = [...posts].sort((a, b) => order.indexOf(a.status) - order.indexOf(b.status) || b.createdAt - a.createdAt);

  return (
    <>
      <h1>queue</h1>
      {checks.length > 0 && <SetupPanel checks={checks} />}
      <p>
        {next ? (
          <>
            next post {when}: <a href={`/preview/${next.id}`}>{(next.caption || next.source.text || next.type).split('\n')[0].slice(0, 70)}</a>
          </>
        ) : (
          <span className="muted">nothing approved — approve a draft to post {when}.</span>
        )}
      </p>
      <p className="muted">
        {brand.handle} · daily {brand.postHour}:00 {tz.toLowerCase()} · auto-approve {brand.autoApprove ? 'on' : 'off'}
        {token ? ` · token refreshed ${token.refreshedAt ? fmt(token.refreshedAt, tz) : 'not yet'}` : ''}
      </p>
      {token?.lastError && <p className="error">token refresh: {token.lastError}</p>}
      {errors.map((e) => (
        <p className="error" key={e}>{e}</p>
      ))}

      <ul className="list">
        {sorted.map((p) => (
          <li key={p.id}>
            <div className="row" style={{ justifyContent: 'space-between' }}>
              <a href={`/preview/${p.id}`}>
                {p.type} · {p.templateId.toLowerCase()}
                {p.slides ? ` · ${p.slides.length} slides` : ''}
              </a>
              <span className={`badge ${p.status}`}>{p.status}</span>
            </div>
            <p className="muted" style={{ margin: '6px 0' }}>
              {(p.caption || p.source.text || '').split('\n')[0].slice(0, 90) || '—'}
            </p>
            <p className="muted" style={{ margin: '6px 0' }}>
              created {fmt(p.createdAt, tz)}
              {p.scheduledFor ? ` · desired ${p.scheduledFor}` : ''}
              {p.postedAt ? ` · posted ${fmt(p.postedAt, tz)}` : ''}
            </p>
            {p.error && <p className="error">{p.error}</p>}
            {p.permalink && (
              <a href={p.permalink} target="_blank" rel="noreferrer">
                view on instagram
              </a>
            )}
            <PostActions id={p.id} status={p.status} />
          </li>
        ))}
      </ul>
      {!posts.length && !errors.length && <p className="muted">nothing here yet.</p>}
    </>
  );
}
