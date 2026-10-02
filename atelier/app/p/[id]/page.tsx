'use client';

import { useParams } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { api, saveFile, useMic } from '../../client';
import { Icon, Sheet, TemplatePreview, Wheel } from '../../ui';

interface Post {
  id: string;
  kind: 'reel' | 'carousel' | 'photo';
  status: string;
  template: string;
  caption: string;
  error: string | null;
  permalink: string | null;
  output: { video?: string; cover?: string; duration?: number; slides?: { png: string; jpg: string }[] };
  options: { notes?: string | null };
}
interface View {
  post: Post;
  schedule: { id: string; at: string; status: string; error: string | null } | null;
}
interface Setup {
  timezone: string;
  templates: { id: string; label: string; layout: string; saved: boolean }[];
}

const STATUS: Record<string, string> = {
  processing: 'preparing',
  approved: 'ready',
  ready: 'paused',
  due: 'ready to share',
  posted: 'posted',
  error: 'needs a look',
};

function when(iso: string, tz: string) {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat('en-GB', { timeZone: tz, weekday: 'short', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
      .formatToParts(new Date(iso))
      .map((x) => [x.type, x.value]),
  );
  return `${p.weekday.toLowerCase()} ${p.day}.${p.month}. · ${p.hour}:${p.minute}`;
}

export default function PostPage() {
  const { id } = useParams<{ id: string }>();
  const [view, setView] = useState<View | null>(null);
  const [setup, setSetup] = useState<Setup | null>(null);
  const [caption, setCaption] = useState('');
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [note, setNote] = useState('');
  const [slide, setSlide] = useState(0);
  const [styleSheet, setStyleSheet] = useState(false);
  const lastStatus = useRef('');

  const load = useCallback(async () => {
    const v = await api<View>(`/api/posts/${id}`);
    setView(v);
    if (lastStatus.current !== v.post.status) setCaption(v.post.caption);
    lastStatus.current = v.post.status;
    return v;
  }, [id]);

  useEffect(() => {
    load().catch((e) => setError(e.message));
    api<Setup>('/api/create').then(setSetup).catch(() => undefined);
    const t = setInterval(() => load().catch(() => undefined), 8000);
    return () => clearInterval(t);
  }, [load]);

  /** label '' = work silently (the stage shows progress instead of a toast) */
  async function patch(body: Record<string, unknown>, label: string) {
    setBusy(label || ' ');
    setError('');
    try {
      const v = await api<View>(`/api/posts/${id}`, { method: 'PATCH', json: body });
      setView(v);
      lastStatus.current = v.post.status;
    } catch (e) {
      setError((e as Error).message);
    }
    setBusy('');
  }

  const correct = useCallback(
    (text: string) => {
      // no echo: what was said goes straight into the rework
      setNote('');
      patch({ action: 'recut', feedback: text }, '');
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [id],
  );
  const mic = useMic(correct, { autoStop: 1600 });

  async function share() {
    const p = view!.post;
    try {
      await navigator.clipboard?.writeText(p.caption).catch(() => undefined);
      const urls = p.output.video ? [p.output.video] : (p.output.slides ?? []).map((s) => s.jpg);
      const files = await Promise.all(
        urls.map(async (u, i) => {
          const b = await (await fetch(u)).blob();
          return new File([b], p.output.video ? `${p.id}.mp4` : `${p.id}-${i + 1}.jpg`, { type: b.type });
        }),
      );
      if (navigator.canShare?.({ files })) {
        await navigator.share({ files });
        setNote('caption copied — paste it in instagram. then mark it as posted.');
      } else {
        for (const [i, u] of urls.entries()) await saveFile(u, files[i].name);
        setNote('saved. caption copied — paste it in instagram.');
      }
    } catch (e) {
      if ((e as Error).name !== 'AbortError') setError((e as Error).message);
    }
  }

  if (error && !view) return <p className="error">{error}</p>;
  if (!view) return <p className="muted">…</p>;
  const { post, schedule } = view;
  const tz = setup?.timezone ?? 'Europe/Berlin';
  const posted = post.status === 'posted';
  const slides = post.output.slides ?? [];

  return (
    <div className="post">
      <header className="page-top">
        <a className="icon-btn" href="/" aria-label="back">
          <Icon name="back" />
        </a>
        <span className={`status ${post.status}`}>{STATUS[post.status] ?? post.status}</span>
      </header>

      <div className="stage">
        {post.status === 'processing' && (post.output.video || slides.length > 0) && (
          <div className="stage-veil">
            <span className="pulse" />
            <p>reworking…</p>
          </div>
        )}
        {post.status === 'processing' && !post.output.video && !slides.length && (
          <div className="stage-wait">
            <span className="pulse" />
            <p>{post.kind === 'reel' ? 'finding the best moments, cutting, subtitling…' : 'reading your photos, writing, setting the type…'}</p>
          </div>
        )}
        {post.output.video && <video className="frame" src={post.output.video} poster={post.output.cover} controls playsInline preload="metadata" />}
        {slides.length > 0 && (
          <>
            <div
              className="slider"
              onScroll={(e) => {
                const el = e.currentTarget;
                setSlide(Math.round(el.scrollLeft / el.clientWidth));
              }}
            >
              {slides.map((s, i) => (
                <img key={s.png} src={s.png} alt={`slide ${i + 1}`} />
              ))}
            </div>
            {slides.length > 1 && (
              <div className="dots" aria-hidden="true">
                {slides.map((s, i) => (
                  <span key={s.png} className={i === slide ? 'on' : ''} />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {(post.output.video || slides.length > 0) && (
        <div className="row between files">
          <span className="muted small">{post.output.duration ? `${post.output.duration.toFixed(0)} s` : slides.length > 1 ? `${slide + 1} / ${slides.length}` : ''}</span>
          <button
            className="ghost small-btn"
            onClick={() => (post.output.video ? saveFile(post.output.video, `${post.id}.mp4`) : saveFile(slides[slide].png, `${post.id}-${slide + 1}.png`))}
          >
            <Icon name="download" size={18} /> save
          </button>
        </div>
      )}

      {post.error && <p className="error">{post.error}</p>}

      {post.status === 'due' && (
        <div className="due">
          <p>your account posts by hand. share it now — the caption is copied for you.</p>
          <div className="row">
            <button className="primary" style={{ flex: 1 }} onClick={share}>
              <Icon name="share" size={18} /> share to instagram
            </button>
            <button style={{ flex: 1 }} onClick={() => patch({ action: 'mark_posted' }, '…')}>
              mark posted
            </button>
          </div>
        </div>
      )}

      {schedule && schedule.status !== 'canceled' && (
        <p className="when">
          {posted ? 'posted ' : 'goes out '}
          <strong>{when(schedule.at, tz)}</strong>
        </p>
      )}

      {!posted && (
        <>
          <section className="block">
            <p className="kicker">caption</p>
            <textarea className="caption" value={caption} onChange={(e) => setCaption(e.target.value)} onBlur={() => caption !== post.caption && patch({ caption }, 'saving…')} />
          </section>

          <section className="block">
            <p className="kicker">not quite right?</p>
            <div className="correct">
              {mic.supported && (
                <button className={`mic-xl small ${mic.listening ? 'on' : ''}`} onClick={mic.toggle} aria-label="say what to change">
                  <Icon name="mic" size={26} stroke={1.2} />
                </button>
              )}
              <form
                style={{ flex: 1 }}
                onSubmit={(e) => {
                  e.preventDefault();
                  const v = String(new FormData(e.currentTarget).get('c') || '').trim();
                  if (v) correct(v);
                  e.currentTarget.reset();
                }}
              >
                <input className="line-input" name="c" placeholder={mic.listening ? mic.interim || 'listening…' : 'say or type what to change'} />
              </form>
            </div>
            <p className="muted small">atelier remembers this for next time.</p>
          </section>

          {setup && (
            <section className="block">
              <p className="kicker">look</p>
              <div className="chips">
                {setup.templates.map((t) => (
                  <button key={t.id} aria-pressed={post.template === t.id} disabled={Boolean(busy)} onClick={() => patch({ template: t.id }, 'restyling…')}>
                    {t.label}
                  </button>
                ))}
              </div>
            </section>
          )}

          {schedule && setup && (
            <section className="block">
              <p className="kicker">time</p>
              <TimeEdit at={schedule.at} tz={tz} onSave={(v) => patch({ at: v }, 'moving…')} />
            </section>
          )}

          <section className="block actions">
            {post.status === 'ready' ? (
              <button onClick={() => patch({ action: 'resume' }, '…')}>resume</button>
            ) : (
              post.status !== 'processing' && <button onClick={() => patch({ action: 'pause' }, '…')}>pause</button>
            )}
            <button disabled={!(post.output.video || slides.length) || Boolean(busy)} onClick={() => confirm('post to instagram now?') && patch({ action: 'post_now', caption }, 'posting…')}>
              post now
            </button>
            <button disabled={post.status === 'processing'} onClick={() => setStyleSheet(true)}>
              {post.template.startsWith('saved:') ? 'saved style ✓' : 'save style'}
            </button>
            <button
              className="ghost"
              onClick={async () => {
                if (!confirm('delete this post?')) return;
                await api(`/api/posts/${id}`, { method: 'DELETE' });
                window.location.href = '/';
              }}
            >
              delete
            </button>
          </section>
        </>
      )}

      {post.permalink && (
        <p>
          <a href={post.permalink} target="_blank" rel="noreferrer">
            view on instagram
          </a>
        </p>
      )}
      {((busy && busy !== ' ') || note) && <p className="toast">{busy.trim() || note}</p>}
      {error && <p className="error">{error}</p>}
      <SaveStyle
        open={styleSheet}
        postId={id}
        cover={post.output.cover ?? slides[0]?.png ?? null}
        current={setup?.templates.find((t) => t.id === post.template) ?? null}
        saved={setup?.templates.filter((t) => t.saved) ?? []}
        onClose={() => setStyleSheet(false)}
        onSaved={(name) => {
          setStyleSheet(false);
          setNote(`saved as “${name}”`);
          load().catch(() => undefined);
          api<Setup>('/api/create').then(setSetup).catch(() => undefined);
        }}
      />
    </div>
  );
}

function TimeEdit({ at, tz, onSave }: { at: string; tz: string; onSave: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const local = new Intl.DateTimeFormat('sv-SE', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
    .format(new Date(at))
    .replace(' ', 'T');
  const [v, setV] = useState(local);
  if (!open) return <button onClick={() => setOpen(true)}>{when(at, tz)} · change</button>;
  const pad = (n: number) => String(n).padStart(2, '0');
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: tz }).format(new Date());
  const days = Array.from({ length: 60 }, (_, i) => {
    const d = new Date(new Date(`${today}T12:00:00Z`).getTime() + i * 864e5);
    const value = d.toISOString().slice(0, 10);
    return { value, label: i === 0 ? 'today' : i === 1 ? 'tomorrow' : `${['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'][d.getUTCDay()]} ${value.slice(8)}.${value.slice(5, 7)}.` };
  });
  return (
    <>
      <div className="wheels compact">
        <div className="wheel-band" aria-hidden="true" />
        <Wheel items={days} value={v.slice(0, 10)} onChange={(d) => setV(`${d}T${v.slice(11)}`)} width="50%" />
        <Wheel items={Array.from({ length: 24 }, (_, h) => ({ value: pad(h), label: pad(h) }))} value={v.slice(11, 13)} onChange={(h) => setV(`${v.slice(0, 11)}${h}:${v.slice(14)}`)} width="25%" />
        <Wheel items={Array.from({ length: 12 }, (_, m) => ({ value: pad(m * 5), label: pad(m * 5) }))} value={v.slice(14, 16)} onChange={(m) => setV(`${v.slice(0, 14)}${m}`)} width="25%" />
      </div>
      <button
        className="primary wide"
        onClick={() => {
          onSave(v);
          setOpen(false);
        }}
      >
        move to {v.slice(8, 10)}.{v.slice(5, 7)}. {v.slice(11, 16)}
      </button>
    </>
  );
}

function SaveStyle(props: {
  open: boolean;
  postId: string;
  cover: string | null;
  current: { label: string; layout: string } | null;
  saved: { id: string; label: string }[];
  onClose: () => void;
  onSaved: (name: string) => void;
}) {
  const full = props.saved.length >= 5;
  const [name, setName] = useState('');
  const [replace, setReplace] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    if (!props.open) return;
    setName(`${props.current?.label ?? 'style'} ${props.saved.length + 1}`.toLowerCase());
    setReplace(null);
    setError('');
  }, [props.open, props.current, props.saved.length]);

  async function save() {
    setBusy(true);
    setError('');
    try {
      await api('/api/templates', { method: 'POST', json: { postId: props.postId, name: name.trim(), replace: replace?.replace('saved:', '') } });
      props.onSaved(name.trim().toLowerCase());
    } catch (e) {
      setError((e as Error).message);
    }
    setBusy(false);
  }

  return (
    <Sheet open={props.open} onClose={props.onClose}>
      <p className="kicker">save this style</p>
      <div className="save-style">
        <div className="save-style-preview">
          {props.cover ? <img src={props.cover} alt="" /> : <TemplatePreview layout={props.current?.layout ?? 'polaroid'} />}
        </div>
        <p className="muted small">look, text tone and every correction of this post — reusable in one tap.</p>
      </div>
      <input className="big-input" value={name} maxLength={24} onChange={(e) => setName(e.target.value)} aria-label="name" autoFocus />
      {full && (
        <>
          <p className="kicker" style={{ marginTop: 20 }}>
            all 5 places are taken — replace
          </p>
          <div className="chips">
            {props.saved.map((t) => (
              <button key={t.id} aria-pressed={replace === t.id} onClick={() => setReplace(t.id)}>
                {t.label}
              </button>
            ))}
          </div>
        </>
      )}
      {error && <p className="error">{error}</p>}
      <button className="primary wide" style={{ marginTop: 20 }} disabled={busy || !name.trim() || (full && !replace)} onClick={save}>
        {busy ? 'saving…' : 'save style'}
      </button>
    </Sheet>
  );
}
