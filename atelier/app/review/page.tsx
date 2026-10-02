'use client';

import { useCallback, useEffect, useState } from 'react';
import { api, useMic } from '../client';
import { Icon, Sheet } from '../ui';

interface Item {
  id: string;
  status: string;
  caption: string;
  description: string | null;
  at: string | null;
  output: { slides?: { png: string; jpg: string }[] };
}
interface Queue {
  name: string;
  posts: Item[];
  stats: { reviewed: number; target: number; approvedAsIs: number | null; ready: boolean };
}

/** Learning phase: one post at a time — ok, fix, or no. Every answer teaches the channel. */
export default function Review() {
  const [q, setQ] = useState<Queue | null>(null);
  const [i, setI] = useState(0);
  const [slide, setSlide] = useState(0);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [mode, setMode] = useState<'fix' | 'reject' | null>(null);
  const [heard, setHeard] = useState('');

  const load = useCallback(() => api<Queue>('/api/review').then(setQ).catch((e) => setError(e.message)), []);
  useEffect(() => {
    load();
    const t = setInterval(load, 10000);
    return () => clearInterval(t);
  }, [load]);

  const posts = q?.posts ?? [];
  const post = posts[Math.min(i, Math.max(0, posts.length - 1))];

  async function act(body: Record<string, unknown>, label: string) {
    if (!post) return;
    setBusy(label);
    setError('');
    try {
      await api(`/api/posts/${post.id}`, { method: 'PATCH', json: body });
      setMode(null);
      setHeard('');
      setSlide(0);
      await load();
    } catch (e) {
      setError((e as Error).message);
    }
    setBusy('');
  }

  const answer = useCallback(
    (text: string) => {
      setHeard(text);
      if (mode === 'fix') act({ action: 'recut', feedback: text }, 'reworking…');
      else if (mode === 'reject') act({ action: 'reject', reason: text }, 'noted');
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [mode, post?.id],
  );
  const mic = useMic(answer);

  if (!q) return error ? <p className="error">{error}</p> : <p className="muted">…</p>;
  const pct = Math.min(100, Math.round((q.stats.reviewed / Math.max(1, q.stats.target)) * 100));
  const slides = post?.output.slides ?? [];
  const working = post?.status === 'processing';

  return (
    <>
      <header className="page-top">
        <a className="icon-btn" href="/channels" aria-label="back">
          <Icon name="back" />
        </a>
        <span className="muted small">{q.name} · {posts.length} waiting</span>
      </header>
      <div className="progress" aria-hidden="true">
        <span style={{ width: `${pct}%` }} />
      </div>
      <p className="muted small">
        {q.stats.reviewed} / {q.stats.target} reviewed{q.stats.approvedAsIs !== null ? ` · ${q.stats.approvedAsIs}% ok as is` : ''}
        {q.stats.ready ? ' · ready for fully automatic (channels → learning phase)' : ''}
      </p>
      {error && <p className="error">{error}</p>}

      {!post && (
        <div className="empty">
          <strong>all caught up</strong>
          new posts arrive every few hours.
        </div>
      )}

      {post && (
        <>
          <div className="review-head">
            <h2>{post.description || 'new post'}</h2>
            {post.at && <span className="muted small">{fmt(post.at)}</span>}
          </div>
          <div className="stage">
            {working && (
              <div className="stage-veil">
                <span className="pulse" />
                <p>reworking…</p>
              </div>
            )}
            {slides.length > 0 ? (
              <div className="slider" onScroll={(e) => setSlide(Math.round(e.currentTarget.scrollLeft / e.currentTarget.clientWidth))}>
                {slides.map((s, k) => (
                  <img key={s.png} src={s.png} alt={`slide ${k + 1}`} />
                ))}
              </div>
            ) : (
              <div className="stage-wait">
                <span className="pulse" />
              </div>
            )}
          </div>
          {slides.length > 1 && (
            <div className="dots" aria-hidden="true">
              {slides.map((s, k) => (
                <span key={s.png} className={k === slide ? 'on' : ''} />
              ))}
            </div>
          )}
          <p style={{ whiteSpace: 'pre-wrap', fontSize: 15 }}>{post.caption}</p>

          <div className="review-bar">
            <button disabled={Boolean(busy) || working} onClick={() => setMode('reject')} aria-label="no">
              no
            </button>
            <button disabled={Boolean(busy) || working} onClick={() => setMode('fix')}>
              fix
            </button>
            <button className="primary" disabled={Boolean(busy) || working || !slides.length} onClick={() => act({ action: 'ok' }, 'approved')}>
              ok ✓
            </button>
          </div>
          {posts.length > 1 && (
            <div className="row between" style={{ marginTop: 10 }}>
              <button className="link" disabled={i === 0} onClick={() => setI(i - 1)}>
                previous
              </button>
              <button className="link" disabled={i >= posts.length - 1} onClick={() => setI(i + 1)}>
                skip
              </button>
            </div>
          )}
        </>
      )}

      <Sheet
        open={Boolean(mode)}
        onClose={() => {
          if (mic.listening) mic.toggle();
          setMode(null);
        }}
      >
        <p className="kicker">{mode === 'fix' ? 'what should change?' : 'why not? (it teaches the channel)'}</p>
        <p className="heard">{mic.listening ? mic.interim || 'listening…' : heard || (mode === 'fix' ? '“the hook is too soft” · “less science, more practical”' : '“wrong topic for this channel” · “too preachy”')}</p>
        {mic.supported && (
          <button className={`mic-xl small ${mic.listening ? 'on' : ''}`} onClick={mic.toggle} aria-label={mic.listening ? 'stop' : 'speak'}>
            <Icon name="mic" size={28} stroke={1.2} />
          </button>
        )}
        <form
          style={{ width: '100%', marginTop: 12 }}
          onSubmit={(e) => {
            e.preventDefault();
            const v = String(new FormData(e.currentTarget).get('t') || '').trim();
            if (v) answer(v);
            else if (mode === 'reject') act({ action: 'reject' }, 'removed');
          }}
        >
          <input className="line-input" name="t" placeholder={mode === 'fix' ? 'or type it' : 'or type it — or just send'} />
        </form>
        {mode === 'reject' && (
          <button className="link" onClick={() => act({ action: 'reject' }, 'removed')}>
            remove without a reason
          </button>
        )}
        {busy && <p className="live">{busy}</p>}
      </Sheet>
    </>
  );
}

function fmt(iso: string) {
  const d = new Date(iso);
  return `${['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'][d.getDay()]} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}
