'use client';

import { useParams } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { api, saveFile, uploadOne, useMic } from '../../client';

interface Post {
  id: string;
  kind: 'reel' | 'carousel' | 'photo';
  status: string;
  template: string;
  caption: string;
  error: string | null;
  permalink: string | null;
  output: { video?: string; cover?: string; duration?: number; slides?: { png: string; jpg: string }[] };
  options: { subtitleLanguage?: string; voiceoverUrl?: string | null; collaborators?: string[] };
}
interface View {
  post: Post;
  schedule: { id: string; at: string; status: string; error: string | null } | null;
  media: { number: number; kind: string; url: string }[];
}
interface Settings {
  timezone: string;
  templates: { id: string; label: string; media: boolean }[];
}

const LANGS = ['en', 'de', 'es', 'fr', 'it'];

function toLocalInput(iso: string, tz: string) {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
      .formatToParts(new Date(iso))
      .map((x) => [x.type, x.value]),
  );
  return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}`;
}

export default function PostPage() {
  const { id } = useParams<{ id: string }>();
  const [view, setView] = useState<View | null>(null);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [caption, setCaption] = useState('');
  const [at, setAt] = useState('');
  const [feedback, setFeedback] = useState('');
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [recording, setRecording] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const recRef = useRef<MediaRecorder | null>(null);
  const synced = useRef(false);

  const load = useCallback(async () => {
    const v = await api<View>(`/api/posts/${id}`);
    setView(v);
    return v;
  }, [id]);

  useEffect(() => {
    let t: ReturnType<typeof setTimeout>;
    Promise.all([load(), api<Settings>('/api/settings')])
      .then(([v, s]) => {
        setSettings(s);
        const tick = async () => {
          const cur = await load().catch(() => null);
          if (cur && (!synced.current || cur.post.status !== 'processing')) {
            if (!synced.current || !caption) setCaption(cur.post.caption);
            synced.current = true;
          }
          if (cur?.post.status === 'processing') t = setTimeout(tick, 8000);
        };
        setCaption(v.post.caption);
        if (v.schedule && v.schedule.status === 'pending') setAt(toLocalInput(v.schedule.at, s.timezone));
        synced.current = true;
        if (v.post.status === 'processing') t = setTimeout(tick, 8000);
      })
      .catch((e) => setError(e.message));
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [load]);

  async function patch(body: Record<string, unknown>, label: string) {
    setBusy(label);
    setError('');
    try {
      const v = await api<View>(`/api/posts/${id}`, { method: 'PATCH', json: body });
      setView(v);
      if (v.post.status === 'processing') setTimeout(() => window.location.reload(), 9000);
    } catch (e) {
      setError((e as Error).message);
    }
    setBusy('');
  }

  const mic = useMic(useCallback((t: string) => setFeedback((f) => (f ? `${f} ${t}` : t)), []));

  async function recordVoiceover() {
    const video = videoRef.current;
    if (!video) return;
    if (recording) {
      recRef.current?.stop();
      return;
    }
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const rec = new MediaRecorder(stream);
    const chunks: Blob[] = [];
    rec.ondataavailable = (e) => chunks.push(e.data);
    rec.onstop = async () => {
      stream.getTracks().forEach((t) => t.stop());
      video.pause();
      setRecording(false);
      const blob = new Blob(chunks, { type: rec.mimeType || 'audio/mp4' });
      setBusy('uploading voiceover…');
      try {
        const url = await uploadOne(blob, `voiceover.${blob.type.includes('webm') ? 'webm' : 'm4a'}`);
        await patch({ voiceoverUrl: url }, 'rendering with voiceover…');
      } catch (e) {
        setError((e as Error).message);
        setBusy('');
      }
    };
    video.currentTime = 0;
    video.muted = true;
    video.onended = () => rec.state === 'recording' && rec.stop();
    rec.start();
    recRef.current = rec;
    setRecording(true);
    await video.play();
  }

  if (error && !view) return <p className="error">{error}</p>;
  if (!view || !settings) return <p className="muted">…</p>;
  const { post } = view;
  const posted = post.status === 'posted';
  const rendered = Boolean(post.output.video || post.output.slides?.length);

  return (
    <>
      <div className="row between">
        <h1 style={{ margin: 0 }}>
          {post.kind} {view.media.length ? view.media.map((m) => `#${m.number}`).join(' ') : ''}
        </h1>
        <span className="status">{post.status === 'ready' ? 'needs approval' : post.status}</span>
      </div>
      <hr className="rule" />
      {post.error && <p className="error">{post.error}</p>}
      {post.status === 'processing' && <p className="muted">cutting — hook first, pauses out, subtitles in. a few minutes; this page updates itself.</p>}

      {post.output.video && (
        <div>
          <video ref={videoRef} className="frame" src={post.output.video} poster={post.output.cover} controls playsInline preload="metadata" />
          <div className="file-row">
            <span className="muted small">{post.output.duration ? `${post.output.duration.toFixed(0)} s` : ''}</span>
            <button onClick={() => saveFile(post.output.video!, `${post.id}.mp4`)}>save</button>
          </div>
        </div>
      )}
      {post.output.slides && (
        <div className="slides">
          {post.output.slides.map((s, i) => (
            <div key={s.png}>
              <img className="frame" src={s.png} alt={`slide ${i + 1}`} loading="lazy" />
              <div className="file-row">
                <span className="muted small">{i + 1} / {post.output.slides!.length}</span>
                <button onClick={() => saveFile(s.png, `${post.id}-${String(i + 1).padStart(2, '0')}.png`)}>save</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {!posted && (
        <>
          <label>template</label>
          <div className="seg">
            {settings.templates
              .filter((t) => !t.media || view.media.length > 0)
              .map((t) => (
                <button key={t.id} aria-pressed={post.template === t.id} disabled={Boolean(busy)} onClick={() => patch({ template: t.id }, 'rendering…')}>
                  {t.label}
                </button>
              ))}
          </div>

          <label htmlFor="caption">caption</label>
          <textarea id="caption" value={caption} onChange={(e) => setCaption(e.target.value)} onBlur={() => caption !== post.caption && patch({ caption }, 'saving…')} />
          <p className="muted small">{caption.length} / 2200 · {(caption.match(/#[\p{L}\p{N}_]+/gu) || []).length} / 5 hashtags</p>

          <label htmlFor="at">post at ({settings.timezone.toLowerCase()})</label>
          <div className="row">
            <input id="at" type="datetime-local" value={at} onChange={(e) => setAt(e.target.value)} style={{ flex: 1 }} />
            <button disabled={!at || Boolean(busy)} onClick={() => patch({ at, caption }, 'scheduling…')}>set</button>
            {view.schedule?.status === 'pending' && (
              <button className="ghost" disabled={Boolean(busy)} onClick={() => { setAt(''); patch({ at: null }, 'removing…'); }}>×</button>
            )}
          </div>
          {view.schedule?.error && <p className="muted small">last attempt: {view.schedule.error}</p>}

          {post.kind === 'reel' && rendered && (
            <>
              <label htmlFor="fb">what should the next cut do better?</label>
              <div className="row">
                <input id="fb" type="text" value={feedback} onChange={(e) => setFeedback(e.target.value)} placeholder="start is too slow · fewer cuts · bread part first" style={{ flex: 1 }} />
                {mic.supported && (
                  <button className={`mic ${mic.listening ? 'on' : ''}`} onClick={mic.toggle}>{mic.listening ? 'stop' : 'speak'}</button>
                )}
              </div>
              <div className="row" style={{ marginTop: 10 }}>
                <button disabled={Boolean(busy)} onClick={() => patch({ action: 'recut', feedback }, 'recutting…').then(() => setFeedback(''))} style={{ flex: 1 }}>
                  recut
                </button>
                <button disabled={Boolean(busy)} onClick={recordVoiceover} className={recording ? 'primary' : ''} style={{ flex: 1 }}>
                  {recording ? 'stop recording' : 'record voiceover'}
                </button>
              </div>
              <label htmlFor="lang">subtitles</label>
              <select id="lang" value={post.options.subtitleLanguage || ''} onChange={(e) => patch({ subtitleLanguage: e.target.value }, 'rendering…')}>
                <option value="">brand default</option>
                {LANGS.map((l) => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
            </>
          )}

          <details style={{ marginTop: 22 }}>
            <summary className="muted">collab</summary>
            <label htmlFor="collab">invite a second account (username)</label>
            <input
              id="collab"
              type="text"
              defaultValue={(post.options.collaborators ?? []).join(', ')}
              onBlur={(e) => patch({ collaborators: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) }, 'saving…')}
              placeholder="username"
              autoCapitalize="none"
            />
          </details>

          <div className="sticky">
            {busy && <p className="muted small" style={{ margin: '0 0 8px' }}>{busy}</p>}
            {error && <p className="error">{error}</p>}
            <div className="row">
              {post.status === 'approved' ? (
                <button style={{ flex: 1 }} disabled={Boolean(busy)} onClick={() => patch({ action: 'unapprove' }, '…')}>approved ✓</button>
              ) : (
                <button className="primary" style={{ flex: 1 }} disabled={!rendered || Boolean(busy)} onClick={() => patch({ action: 'approve', caption }, 'approving…')}>
                  approve
                </button>
              )}
              <button disabled={!rendered || Boolean(busy)} onClick={() => confirm('post to instagram now?') && patch({ action: 'post_now', caption }, 'posting…')}>
                post now
              </button>
              <button
                className="ghost"
                disabled={Boolean(busy)}
                onClick={async () => {
                  if (!confirm('delete this post?')) return;
                  await api(`/api/posts/${id}`, { method: 'DELETE' });
                  window.location.href = '/';
                }}
              >
                delete
              </button>
            </div>
          </div>
        </>
      )}
      {post.permalink && (
        <p>
          <a href={post.permalink} target="_blank" rel="noreferrer">view on instagram</a>
        </p>
      )}
    </>
  );
}
