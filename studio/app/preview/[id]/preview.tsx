'use client';

import { useCallback, useEffect, useState } from 'react';
import type { Post } from '@/lib/types';
import { saveFile } from '../../save';

type Tpl = { id: string; label: string; media: boolean };

export default function Preview({ id, templates }: { id: string; templates: Tpl[] }) {
  const [post, setPost] = useState<Post | null>(null);
  const [caption, setCaption] = useState('');
  const [date, setDate] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    const res = await fetch(`/api/posts/${id}`, { cache: 'no-store' });
    const json = await res.json();
    if (!res.ok) {
      setError(json.error || 'not found');
      return null;
    }
    setPost(json.post);
    return json.post as Post;
  }, [id]);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    let sync = true; // copy server values into the form on first load and when processing finishes
    const tick = async () => {
      const p = await load();
      if (!p) return;
      if (sync) {
        setCaption(p.caption);
        setDate(p.scheduledFor ?? '');
      }
      sync = p.status === 'processing';
      if (sync) timer = setTimeout(tick, 8000);
    };
    tick();
    return () => clearTimeout(timer);
  }, [load]);

  async function patch(body: Record<string, unknown>, done: string, working = '') {
    setBusy(true);
    setError('');
    setMsg(working);
    const res = await fetch(`/api/posts/${id}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ caption, scheduledFor: date || null, ...body }),
    });
    const json = await res.json();
    setBusy(false);
    if (!res.ok) return setError(json.error || `http ${res.status}`);
    setPost(json.post);
    setMsg(done);
  }

  async function remove() {
    if (!confirm('delete this post?')) return;
    await fetch(`/api/posts/${id}`, { method: 'DELETE' });
    window.location.href = '/status';
  }

  if (error && !post) return <p className="error">{error}</p>;
  if (!post) return <p className="muted">loading…</p>;

  const locked = post.status === 'posted';

  return (
    <div>
      <h1>
        {post.type} · {post.templateId.toLowerCase()} <span className={`badge ${post.status}`}>{post.status}</span>
      </h1>

      {post.status === 'processing' && (
        <p className="muted">the video is being cut, subtitled and rendered. this page refreshes on its own — usually 3–10 minutes.</p>
      )}
      {post.error && <p className="error">{post.error}</p>}

      {post.slides && (
        <div className="slides">
          {post.slides.map((s, i) => {
            const n = String(i + 1).padStart(2, '0');
            return (
              <div className="slide" key={s.png}>
                <img src={s.png} alt={`slide ${n}`} loading="lazy" />
                <div className="row">
                  <span className="muted">{n} / {post.slides!.length}</span>
                  <button type="button" onClick={() => saveFile(s.png, `${post.id}-${n}.png`)}>save</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {post.type === 'carousel' && !locked && (
        <>
          <label>template</label>
          <div className="seg" role="group" aria-label="template">
            {templates
              .filter((t) => !t.media || (post.source.media ?? []).length > 0)
              .map((t) => (
                <button
                  key={t.id}
                  type="button"
                  disabled={busy}
                  aria-pressed={post.templateId === t.id}
                  onClick={() => patch({ action: 'rerender', templateId: t.id }, `re-rendered as ${t.label}`, 'rendering…')}
                >
                  {t.label}
                </button>
              ))}
          </div>
          <p>
            <button type="button" disabled={busy} onClick={() => patch({ action: 'rerender' }, 're-rendered', 'rendering…')}>
              re-render (after signature change)
            </button>
          </p>
        </>
      )}

      {post.video && (
        <div className="slide">
          <video src={post.video.url} controls playsInline preload="metadata" />
          <div className="row">
            <span className="muted">{post.video.duration ? `${post.video.duration.toFixed(1)} s` : ''}</span>
            <button type="button" onClick={() => saveFile(post.video!.url, `${post.id}.mp4`)}>save</button>
          </div>
        </div>
      )}

      <label htmlFor="caption">caption</label>
      <textarea id="caption" value={caption} onChange={(e) => setCaption(e.target.value)} disabled={locked} />
      <p className="muted">{caption.length} / 2200 · {(caption.match(/#[\p{L}\p{N}_]+/gu) || []).length} hashtags</p>

      <label htmlFor="date">desired date</label>
      <input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} disabled={locked} />

      {post.permalink && (
        <p>
          <a href={post.permalink} target="_blank" rel="noreferrer">view on instagram</a>
        </p>
      )}

      {!locked && (
        <div className="sticky row">
          <button disabled={busy} onClick={() => patch({}, 'saved')}>save</button>
          {post.status !== 'approved' ? (
            <button className="primary" disabled={busy || post.status === 'processing'} onClick={() => patch({ action: 'approve' }, 'approved — in the queue')}>
              approve
            </button>
          ) : (
            <button disabled={busy} onClick={() => patch({ action: 'unapprove' }, 'back to draft')}>unapprove</button>
          )}
          {post.status === 'error' && (
            <button disabled={busy} onClick={() => patch({ action: 'retry' }, 'retrying')}>retry</button>
          )}
          <button disabled={busy} onClick={remove}>delete</button>
        </div>
      )}
      {msg && <p className="muted">{msg}</p>}
      {error && <p className="error">{error}</p>}
    </div>
  );
}
