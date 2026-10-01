'use client';

import { useEffect, useState } from 'react';
import { api, uploadFiles, type MediaItem } from '../client';

export default function MediaPage() {
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [selected, setSelected] = useState<number[]>([]);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [text, setText] = useState<string | null>(null);

  const load = () => api<{ media: MediaItem[] }>('/api/media').then((r) => setMedia(r.media)).catch((e) => setError(e.message));
  useEffect(() => {
    load();
  }, []);

  async function add(list: FileList | null) {
    if (!list?.length) return;
    setError('');
    try {
      const added = await uploadFiles(Array.from(list), (m) => setBusy(`uploading ${m}`));
      await load();
      setSelected(added.map((m) => m.number));
    } catch (e) {
      setError((e as Error).message);
    }
    setBusy('');
  }

  async function makePost(body: Record<string, unknown>) {
    setBusy('preparing…');
    setError('');
    try {
      const { post } = await api<{ post: { id: string } }>('/api/posts', { method: 'POST', json: body });
      window.location.href = `/p/${post.id}`;
    } catch (e) {
      setError((e as Error).message);
      setBusy('');
    }
  }

  const toggle = (n: number) => setSelected((s) => (s.includes(n) ? s.filter((x) => x !== n) : [...s, n]));

  return (
    <>
      <h1>media</h1>
      <div className="row">
        <label className="btn primary" style={{ margin: 0, flex: 1 }}>
          {busy || 'add videos or photos'}
          <input type="file" multiple accept="video/*,image/*" hidden disabled={Boolean(busy)} onChange={(e) => { add(e.target.files); e.target.value = ''; }} />
        </label>
        <button onClick={() => setText(text === null ? '' : null)}>text</button>
      </div>
      {error && <p className="error">{error}</p>}

      {text !== null && (
        <div className="stack" style={{ marginTop: 18 }}>
          <label htmlFor="t">text carousel — one line per slide · | new line · **bold**</label>
          <textarea id="t" value={text} onChange={(e) => setText(e.target.value)} autoCapitalize="none" placeholder={'you think you have no ego. | **that thought is your ego.**'} />
          <button className="primary wide" disabled={!text.trim() || Boolean(busy)} onClick={() => makePost({ text, media: selected })}>
            render carousel
          </button>
        </div>
      )}

      {!media.length && !busy && <p className="muted" style={{ marginTop: 24 }}>every file gets a number — #1, #2, #3 — so you can plan by voice.</p>}
      <div className="grid">
        {media.map((m) => (
          <button key={m.id} className="tile" aria-pressed={selected.includes(m.number)} onClick={() => toggle(m.number)} aria-label={`#${m.number}`}>
            {m.status !== 'ready' ? null : m.kind === 'video' ? <video src={`${m.url}#t=0.5`} muted playsInline preload="metadata" /> : <img src={m.url} alt="" loading="lazy" />}
            <span className="num">#{m.number}{m.status !== 'ready' ? ' · uploading' : ''}</span>
          </button>
        ))}
      </div>

      {selected.length > 0 && (
        <div className="bar">
          <div className="inner">
            <button onClick={() => setSelected([])} className="ghost">{selected.map((n) => `#${n}`).join(' ')} ×</button>
            <button className="primary" disabled={Boolean(busy)} onClick={() => makePost({ media: selected })}>prepare</button>
            <a className="btn" href={`/chat?media=${selected.join(',')}`}>plan</a>
          </div>
        </div>
      )}
    </>
  );
}
