import { loadBrand } from '@/lib/brand';
import { redis } from '@/lib/redis';
import { ensureSeed } from '@/lib/seed';
import { listPosts } from '@/lib/store';
import { tokenInfo } from '@/lib/token';
import type { Post } from '@/lib/types';
import PostActions from './post-actions';

export const dynamic = 'force-dynamic';
export const maxDuration = 120;

const fmt = (ms?: number) =>
  ms ? new Date(ms).toLocaleString('en-GB', { timeZone: 'Europe/Berlin', dateStyle: 'short', timeStyle: 'short' }) : '–';

export default async function StatusPage() {
  let setupError = '';
  try {
    await ensureSeed();
  } catch (e) {
    setupError = `first post could not be created: ${(e as Error).message}`;
  }

  let posts: Post[] = [];
  let username: string | null = null;
  let token: Awaited<ReturnType<typeof tokenInfo>> = null;
  try {
    posts = await listPosts();
    username = await redis().get<string>('ig:username');
    token = await tokenInfo();
  } catch (e) {
    setupError = (e as Error).message;
  }

  const brand = loadBrand();
  const order: Post['status'][] = ['error', 'processing', 'draft', 'approved', 'posted'];
  const sorted = [...posts].sort((a, b) => order.indexOf(a.status) - order.indexOf(b.status));

  return (
    <>
      <h1>queue</h1>
      <p className="muted">
        posts daily at {brand.postHour}:00 {brand.timezone.toLowerCase()} · {brand.handle}
        {username ? ` (connected as @${username})` : ''} · auto-approve {brand.autoApprove ? 'on' : 'off'}
      </p>
      {token && (
        <p className="muted">
          token refreshed {token.refreshedAt ? fmt(token.refreshedAt) : 'not yet'}
          {token.expiresAt ? ` · expires ${fmt(token.expiresAt)}` : ''}
        </p>
      )}
      {token?.lastError && <p className="error">token refresh: {token.lastError}</p>}
      {setupError && <p className="error">{setupError}</p>}

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
              created {fmt(p.createdAt)}
              {p.scheduledFor ? ` · desired ${p.scheduledFor}` : ''}
              {p.postedAt ? ` · posted ${fmt(p.postedAt)}` : ''}
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
      {!posts.length && !setupError && <p className="muted">nothing here yet.</p>}
    </>
  );
}
