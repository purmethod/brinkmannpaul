'use client';

import { useParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { api, uploadFiles, useMic } from '../../client';
import { Icon, Mark } from '../../ui';

interface Detail {
  id: string;
  custom: boolean;
  name: string;
  handle: string;
  brief: string;
  tone: string;
  channel: { logo?: string[]; tagline?: string; cta?: string } | null;
  autopilot: {
    enabled: boolean;
    everyHours: number;
    from: string;
    to: string;
    slides: number;
    insights: string;
    review: boolean;
    reviewTarget: number;
    slots: string[];
    recent: string[];
  };
  stats: { reviewed: number; target: number; approvedAsIs: number | null; ready: boolean };
  waiting: number;
  pool: number;
  exact: boolean;
  connections: { platform: string; username: string | null; status: string; error: string | null }[];
}

const HOURS = Array.from({ length: 24 }, (_, h) => `${String(h).padStart(2, '0')}:00`);

export default function ChannelPage() {
  const { id } = useParams<{ id: string }>();
  const [d, setD] = useState<Detail | null>(null);
  const [error, setError] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState('');

  const load = useCallback(() => api<Detail>(`/api/channels/${id}`).then(setD), [id]);
  useEffect(() => {
    // this channel becomes the active one: create, uploads and instagram act on it
    const ig = new URLSearchParams(location.search).get('instagram');
    if (ig) (/^connected/.test(ig) ? setNote : setError)(ig);
    api('/api/brands', { method: 'PATCH', json: { active: id } })
      .then(load)
      .catch((e) => setError(e.message));
  }, [id, load]);

  async function autopilot(patch: Record<string, unknown>, done = '') {
    setError('');
    try {
      await api('/api/settings', { method: 'PATCH', json: { autopilot: patch } });
      await load();
      if (done) setNote(done);
    } catch (e) {
      setError((e as Error).message);
    }
  }
  async function channel(patch: Record<string, unknown>) {
    setError('');
    try {
      await api(`/api/channels/${id}`, { method: 'PATCH', json: { channel: patch } });
      await load();
      setNote('saved');
    } catch (e) {
      setError((e as Error).message);
    }
  }

  const addInsight = useCallback(
    (text: string) => {
      if (!d) return;
      const insights = [d.autopilot.insights.trim(), `- ${text.trim()}`].filter(Boolean).join('\n');
      autopilot({ insights }, 'insight added');
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [d],
  );
  const mic = useMic(addInsight);

  async function runNow() {
    setBusy('writing the next post… (about a minute)');
    setError('');
    try {
      const r = await api<{ made: { postId: string; topic: string }[] }>('/api/autopilot', { method: 'POST' });
      setNote(`ready: ${r.made[0]?.topic ?? 'new post'}`);
      await load();
    } catch (e) {
      setError((e as Error).message);
    }
    setBusy('');
  }

  if (!d) return error ? <p className="error">{error}</p> : <p className="muted">…</p>;
  const ap = d.autopilot;
  const ig = d.connections.find((c) => c.platform === 'instagram');
  const pct = Math.min(100, Math.round((d.stats.reviewed / Math.max(1, d.stats.target)) * 100));

  return (
    <>
      <header className="page-top">
        <a className="icon-btn" href="/channels" aria-label="back">
          <Icon name="back" />
        </a>
        <span />
      </header>
      <div className="hero">
        <Mark name={d.name} logo={d.channel?.logo ?? (d.name === 'foyo' ? ['fo', 'yo'] : null)} />
        <span>
          <h1>{d.name}</h1>
          <span className="muted">{ig ? `@${ig.username}` : `${d.handle} · not connected`}</span>
        </span>
      </div>
      {note && <p className="toast static">{note}</p>}
      {error && <p className="error">{error}</p>}

      {ap.review && d.waiting > 0 && (
        <a className="btn primary wide" href="/review" style={{ marginBottom: 14 }}>
          review {d.waiting} {d.waiting === 1 ? 'post' : 'posts'}
        </a>
      )}

      <section className="card">
        <div className="switch">
          <span>
            <p className="kicker" style={{ margin: 0 }}>autopilot</p>
            <span className="muted small">
              {ap.enabled ? `${ap.slots.length} posts a day · ${ap.from}–${ap.to}` : 'off — nothing is created on its own'}
            </span>
          </span>
          <input type="checkbox" role="switch" aria-label="autopilot" checked={ap.enabled} onChange={(e) => autopilot({ enabled: e.target.checked }, e.target.checked ? 'on — the first post is being written' : 'off')} />
        </div>
        <div className="grid3" style={{ marginTop: 18 }}>
          <select aria-label="every" value={ap.everyHours} onChange={(e) => autopilot({ everyHours: Number(e.target.value) })}>
            {[1, 2, 3, 4, 6, 8, 12, 24].map((h) => (
              <option key={h} value={h}>
                every {h} h
              </option>
            ))}
          </select>
          <select aria-label="from" value={ap.from} onChange={(e) => autopilot({ from: e.target.value })}>
            {HOURS.map((h) => (
              <option key={h} value={h}>
                {h}
              </option>
            ))}
          </select>
          <select aria-label="to" value={ap.to} onChange={(e) => autopilot({ to: e.target.value })}>
            {HOURS.map((h) => (
              <option key={h} value={h}>
                – {h}
              </option>
            ))}
          </select>
        </div>
        {ap.enabled && (
          <button className="ghost wide" style={{ marginTop: 12 }} disabled={Boolean(busy)} onClick={runNow}>
            write the next post now
          </button>
        )}
        {busy && <p className="live">{busy}</p>}
        {!d.exact && ap.enabled && (
          <p className="muted small" style={{ marginTop: 12 }}>
            posts go out within minutes of their time. for the exact minute connect upstash qstash in vercel → storage.
          </p>
        )}
      </section>

      <section className="card">
        <div className="switch">
          <span>
            <p className="kicker" style={{ margin: 0 }}>{ap.review ? 'learning phase' : 'fully automatic'}</p>
            <span className="muted small">
              {ap.review ? 'every post waits for your ok. your answers teach the channel.' : 'posts go out without asking.'}
            </span>
          </span>
          <input
            type="checkbox"
            role="switch"
            aria-label="review every post"
            checked={ap.review}
            onChange={(e) => {
              if (!e.target.checked && !d.stats.ready && !confirm(`only ${d.stats.reviewed} of ${d.stats.target} reviewed. go fully automatic anyway?`)) return;
              autopilot({ review: e.target.checked }, e.target.checked ? 'learning phase on' : 'fully automatic');
            }}
          />
        </div>
        <div className="progress" aria-hidden="true">
          <span style={{ width: `${pct}%` }} />
        </div>
        <p className="muted small">
          {d.stats.reviewed} / {d.stats.target} reviewed
          {d.stats.approvedAsIs !== null ? ` · ${d.stats.approvedAsIs}% of the last 50 were ok as they were` : ''}
          {d.stats.ready && ap.review ? ' · ready for fully automatic' : ''}
        </p>
        <label htmlFor="target">posts to review before going automatic</label>
        <select id="target" value={ap.reviewTarget} onChange={(e) => autopilot({ reviewTarget: Number(e.target.value) })}>
          {[25, 50, 100, 150, 200, 300].map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </section>

      <section className="card">
        <p className="kicker">your insights</p>
        <p className="muted small">the core of every post. say what you know, believe and have seen work — cutcake builds on it.</p>
        <textarea
          key={ap.insights}
          defaultValue={ap.insights}
          placeholder="- …"
          style={{ minHeight: 160 }}
          onBlur={(e) => e.target.value !== ap.insights && autopilot({ insights: e.target.value }, 'saved')}
        />
        {mic.supported && (
          <button className={`ghost wide ${mic.listening ? 'primary' : ''}`} style={{ marginTop: 10 }} onClick={mic.toggle}>
            <Icon name="mic" size={18} /> {mic.listening ? mic.interim || 'listening… tap when done' : 'add an insight by voice'}
          </button>
        )}
      </section>

      <section className="card">
        <p className="kicker">what the channel is about</p>
        <textarea key={d.brief} defaultValue={d.brief} onBlur={(e) => e.target.value !== d.brief && channel({ brief: e.target.value })} />
        <label htmlFor="tone">tone</label>
        <input id="tone" key={d.tone} defaultValue={d.tone} onBlur={(e) => e.target.value !== d.tone && channel({ tone: e.target.value })} />
        {d.custom && (
          <>
            <label htmlFor="logo">logo lines (split with /)</label>
            <input
              id="logo"
              key={(d.channel?.logo ?? []).join('/')}
              defaultValue={(d.channel?.logo ?? []).join(' / ')}
              onBlur={(e) => channel({ logo: e.target.value.split('/').map((x) => x.trim()).filter(Boolean) })}
            />
            <label htmlFor="tagline">tagline</label>
            <input id="tagline" key={d.channel?.tagline} defaultValue={d.channel?.tagline ?? ''} onBlur={(e) => channel({ tagline: e.target.value })} />
            <label htmlFor="cta">last slide line (| = new line)</label>
            <input id="cta" key={d.channel?.cta} defaultValue={d.channel?.cta ?? ''} onBlur={(e) => channel({ cta: e.target.value })} />
          </>
        )}
        {ap.recent.length > 0 && <p className="muted small" style={{ marginTop: 16 }}>recent topics: {ap.recent.join(' · ')}</p>}
      </section>

      <section className="card">
        <p className="kicker">photo pool</p>
        <p className="muted small">
          {d.pool} unused {d.pool === 1 ? 'photo' : 'photos'}. each post takes the next one; without photos the dark design carries it.
        </p>
        <label className="btn wide">
          add photos
          <input
            type="file"
            accept="image/*"
            multiple
            hidden
            onChange={async (e) => {
              const files = [...(e.target.files ?? [])];
              if (!files.length) return;
              setBusy('uploading…');
              try {
                await uploadFiles(files, (m) => setBusy(`uploading ${m}`), { pool: true });
                await load();
                setNote(`${files.length} added`);
              } catch (err) {
                setError((err as Error).message);
              }
              setBusy('');
            }}
          />
        </label>
      </section>

      <section className="card">
        <p className="kicker">instagram</p>
        {ig ? (
          <>
            <p className="big">@{ig.username}</p>
            {ig.error && <p className="error">{ig.error}</p>}
            <a className="btn wide" href="/api/auth/instagram">reconnect</a>
          </>
        ) : (
          <>
            <p className="muted small">log in with the instagram account of this channel (creator or business account posts on its own).</p>
            <a className="btn primary wide" href="/api/auth/instagram">connect {d.handle}</a>
          </>
        )}
      </section>

      {d.custom && (
        <button
          className="link"
          onClick={async () => {
            if (!confirm(`delete the channel “${d.name}” and all its posts?`)) return;
            try {
              await api(`/api/channels/${id}`, { method: 'DELETE' });
              window.location.href = '/channels';
            } catch (e) {
              setError((e as Error).message);
            }
          }}
        >
          delete channel
        </button>
      )}
    </>
  );
}
