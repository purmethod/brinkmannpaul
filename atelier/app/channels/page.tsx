'use client';

import { useCallback, useEffect, useState } from 'react';
import { api, useMic } from '../client';
import { Icon, Mark, Sheet } from '../ui';

interface Channel {
  id: string;
  name: string;
  handle: string;
  logo: string[] | null;
  instagram: string | null;
  active: boolean;
  autopilot: { enabled: boolean; everyHours: number; from: string; to: string; perDay: number; review: boolean };
  waiting: number;
  next24h: number;
  stats: { reviewed: number; target: number; approvedAsIs: number | null; ready: boolean };
}
interface Draft {
  name?: string;
  handle?: string;
  tagline?: string;
  logo?: string[];
  cta?: string;
  brief?: string;
  tone?: string;
}

export default function Channels() {
  const [list, setList] = useState<Channel[] | null>(null);
  const [error, setError] = useState('');
  const [sheet, setSheet] = useState(false);

  const load = useCallback(() => api<{ channels: Channel[] }>('/api/channels').then((r) => setList(r.channels)).catch((e) => setError(e.message)), []);
  useEffect(() => {
    load();
  }, [load]);

  return (
    <>
      <header className="page-top">
        <h1>channels</h1>
        <button className="icon-btn ring" onClick={() => setSheet(true)} aria-label="new channel">
          <Icon name="plus" />
        </button>
      </header>
      {error && <p className="error">{error}</p>}
      {!list && !error && <p className="muted">…</p>}
      {list?.map((c) => {
        const pct = Math.min(100, Math.round((c.stats.reviewed / Math.max(1, c.stats.target)) * 100));
        return (
          <a key={c.id} className={`channel ${c.active ? 'active' : ''}`} href={`/channels/${c.id}`}>
            <Mark name={c.name} logo={c.logo} />
            <span className="channel-meta">
              <strong>{c.name}</strong>
              <span className="muted small">
                {c.instagram ? `@${c.instagram}` : `${c.handle} · not connected`}
              </span>
              <span>
                <span className={`pill ${c.autopilot.enabled ? 'dark' : ''}`}>
                  {c.autopilot.enabled ? `autopilot · every ${c.autopilot.everyHours} h` : 'autopilot off'}
                </span>
                {c.waiting > 0 && <span className="pill dark">{c.waiting} to review</span>}
                {c.autopilot.enabled && <span className="pill">{c.next24h} in the next 24 h</span>}
              </span>
              {c.autopilot.review && c.autopilot.enabled && (
                <>
                  <span className="progress" aria-hidden="true">
                    <span style={{ width: `${pct}%` }} />
                  </span>
                  <span className="muted small">
                    learning · {c.stats.reviewed} / {c.stats.target} reviewed{c.stats.approvedAsIs !== null ? ` · ${c.stats.approvedAsIs}% ok as is` : ''}
                  </span>
                </>
              )}
              {!c.autopilot.review && c.autopilot.enabled && <span className="muted small">fully automatic</span>}
            </span>
            <span className="chev" aria-hidden="true" />
          </a>
        );
      })}
      <button className="wide" style={{ marginTop: 6 }} onClick={() => setSheet(true)}>
        <Icon name="plus" size={18} /> new channel
      </button>
      <NewChannel open={sheet} onClose={() => setSheet(false)} onCreated={(id) => (window.location.href = `/channels/${id}`)} />
    </>
  );
}

function NewChannel({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: (id: string) => void }) {
  const [idea, setIdea] = useState('');
  const [draft, setDraft] = useState<Draft | null>(null);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');

  const think = useCallback(async (text: string) => {
    setIdea(text);
    setBusy('shaping your channel…');
    setError('');
    try {
      setDraft((await api<{ draft: Draft }>('/api/channels/draft', { method: 'POST', json: { idea: text } })).draft);
    } catch (e) {
      setError((e as Error).message);
    }
    setBusy('');
  }, []);
  const mic = useMic(think);

  useEffect(() => {
    if (!open) {
      setDraft(null);
      setIdea('');
      setError('');
    }
  }, [open]);

  async function create() {
    setBusy('creating…');
    try {
      const r = await api<{ channel: { id: string } }>('/api/channels', { method: 'POST', json: draft });
      onCreated(r.channel.id);
    } catch (e) {
      setError((e as Error).message);
      setBusy('');
    }
  }

  const set = (k: keyof Draft, v: string) => setDraft((d) => ({ ...d, [k]: k === 'logo' ? v.split(/[\/,]/).map((x) => x.trim()).filter(Boolean) : v }));

  return (
    <Sheet open={open} onClose={onClose}>
      <p className="kicker">new channel</p>
      {!draft ? (
        <>
          <p className="heard">{mic.listening ? mic.interim || 'listening…' : idea || 'what is it about, and for whom? just talk.'}</p>
          {mic.supported && (
            <button className={`mic-xl small ${mic.listening ? 'on' : ''}`} onClick={mic.toggle} aria-label={mic.listening ? 'stop' : 'speak'}>
              <Icon name="mic" size={28} stroke={1.2} />
            </button>
          )}
          {mic.listening && <p className="muted small">tap the mic when you are done</p>}
          <form
            style={{ width: '100%', marginTop: 12 }}
            onSubmit={(e) => {
              e.preventDefault();
              const v = String(new FormData(e.currentTarget).get('idea') || '').trim();
              if (v) think(v);
            }}
          >
            <input className="line-input" name="idea" placeholder="or type the idea" />
          </form>
        </>
      ) : (
        <div className="draft">
          <label>name</label>
          <input value={draft.name ?? ''} onChange={(e) => set('name', e.target.value)} />
          <label>instagram handle</label>
          <input value={draft.handle ?? ''} onChange={(e) => set('handle', e.target.value)} />
          <label>logo lines (split with /)</label>
          <input value={(draft.logo ?? []).join(' / ')} onChange={(e) => set('logo', e.target.value)} />
          <label>tagline</label>
          <input value={draft.tagline ?? ''} onChange={(e) => set('tagline', e.target.value)} />
          <label>what every post is about</label>
          <textarea value={draft.brief ?? ''} onChange={(e) => set('brief', e.target.value)} />
          <label>tone</label>
          <input value={draft.tone ?? ''} onChange={(e) => set('tone', e.target.value)} />
          <label>last slide line (| = new line)</label>
          <input value={draft.cta ?? ''} onChange={(e) => set('cta', e.target.value)} />
          <button className="primary wide" style={{ marginTop: 20 }} disabled={Boolean(busy) || !draft.name} onClick={create}>
            create channel
          </button>
          <button className="link" onClick={() => setDraft(null)}>
            start over
          </button>
        </div>
      )}
      {busy && <p className="live">{busy}</p>}
      {error && <p className="error">{error}</p>}
    </Sheet>
  );
}
