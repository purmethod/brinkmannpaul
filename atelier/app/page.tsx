'use client';

import { useCallback, useEffect, useState } from 'react';
import { api, useMic } from './client';
import CreateFlow from './create-flow';
import { Icon, Logo, Mark, Sheet } from './ui';

interface Item {
  id: string;
  post_id: string;
  at: string;
  status: string;
  error: string | null;
  kind: string;
  post_status: string;
  cover: string | null;
}
interface Plan {
  timezone: string;
  channel?: { name: string; handle: string; waiting: number; logo?: string[] | null };
  items: Item[];
  notices: { id: string; text: string }[];
}
interface Proposal {
  id?: string;
  reply: string;
  lines: string[];
}

function parts(iso: string, tz: string) {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat('en-GB', { timeZone: tz, weekday: 'long', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
      .formatToParts(new Date(iso))
      .map((x) => [x.type, x.value]),
  );
  return { day: `${p.weekday.toLowerCase()} ${p.day}.${p.month}.`, time: `${p.hour}:${p.minute}` };
}

function state(i: Item): { text: string; cls: string } {
  if (i.post_status === 'posted') return { text: 'posted', cls: 'quiet' };
  if (i.post_status === 'due') return { text: 'share now', cls: 'attention' };
  if (i.status === 'error' || i.post_status === 'error') return { text: 'needs a look', cls: 'error' };
  if (i.post_status === 'review') return { text: 'waiting for your ok', cls: 'attention' };
  if (i.post_status === 'processing') return { text: 'preparing', cls: 'quiet' };
  if (i.post_status === 'ready') return { text: 'paused', cls: 'quiet' };
  return { text: 'ready', cls: '' };
}

export default function Create() {
  const [plan, setPlan] = useState<Plan | null>(null);
  const [error, setError] = useState('');
  const [flow, setFlow] = useState(false);
  const [voice, setVoice] = useState(false);
  const [busy, setBusy] = useState(false);
  const [heard, setHeard] = useState('');
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [result, setResult] = useState<string[]>([]);

  const load = useCallback(() => api<Plan>('/api/schedules').then(setPlan).catch((e) => setError(e.message)), []);
  useEffect(() => {
    load();
    const t = setInterval(load, 15000);
    if (new URLSearchParams(location.search).get('new')) setFlow(true);
    return () => clearInterval(t);
  }, [load]);

  const ask = useCallback(async (text: string) => {
    setHeard(text);
    setBusy(true);
    setProposal(null);
    setResult([]);
    try {
      setProposal(await api<Proposal>('/api/planner', { method: 'POST', json: { message: text } }));
    } catch (e) {
      setProposal({ reply: (e as Error).message, lines: [] });
    }
    setBusy(false);
  }, []);
  const mic = useMic(ask);

  async function confirm() {
    if (!proposal?.id) return;
    setBusy(true);
    try {
      const r = await api<{ result: string[] }>('/api/planner/apply', { method: 'POST', json: { messageId: proposal.id } });
      setResult(r.result);
      setProposal(null);
      load();
    } catch (e) {
      setResult([(e as Error).message]);
    }
    setBusy(false);
  }

  function openVoice() {
    setVoice(true);
    setHeard('');
    setProposal(null);
    setResult([]);
    if (mic.supported && !mic.listening) mic.toggle();
  }

  const tz = plan?.timezone ?? 'Europe/Berlin';
  const today = parts(new Date().toISOString(), tz).day;
  const days = new Map<string, Item[]>();
  for (const i of plan?.items ?? []) {
    const d = parts(i.at, tz).day;
    days.set(d, [...(days.get(d) ?? []), i]);
  }
  const upcoming = (plan?.items ?? []).filter((i) => i.post_status !== 'posted').length;

  return (
    <>
      <header className="page-top">
        <h1 className="brand">
          <Logo size={30} />
          cutcake
        </h1>
        <button className="icon-btn ring" onClick={openVoice} aria-label="speak to plan">
          <Icon name="mic" />
        </button>
      </header>

      {plan?.channel && (
        <a className="channel-chip" href={plan.channel.waiting > 0 ? '/review' : '/channels'}>
          <span>
            <Mark name={plan.channel.name} logo={plan.channel.logo ?? null} />
            <span>
              <strong>{plan.channel.name}</strong>
              <br />
              <span className="muted small">{plan.channel.handle}</span>
            </span>
          </span>
          {plan.channel.waiting > 0 ? <span className="badge attention">{plan.channel.waiting} to review</span> : <span className="muted small">switch</span>}
        </a>
      )}

      <button className="new-post" onClick={() => setFlow(true)}>
        <span className="new-plus">
          <Icon name="plus" size={28} stroke={1.2} />
        </span>
        <span>
          <strong>new post</strong>
          <small>record or pick — the rest happens on its own</small>
        </span>
      </button>

      {plan?.notices.map((n) => (
        <div className="notice" key={n.id}>
          {n.text}
        </div>
      ))}
      {error && <p className="error">{error}</p>}

      <div className="plan-head">
        <h2>planned</h2>
        <span className="muted small">{upcoming ? `${upcoming} upcoming` : ''}</span>
      </div>
      {plan && !plan.items.length && (
        <div className="empty">
          <strong>nothing planned yet</strong>
          your first post is one tap away.
        </div>
      )}
      {[...days.entries()].map(([day, items]) => (
        <section className="day" key={day}>
          <h3>
            <span>{day}</span>
            {day === today && <span className="muted small">today</span>}
          </h3>
          {items.map((i) => {
            const s = state(i);
            return (
              <a className="slot" href={i.post_status === 'review' ? '/review' : `/p/${i.post_id}`} key={i.id}>
                <time>{parts(i.at, tz).time}</time>
                {i.cover ? <img className="thumb" src={i.cover} alt="" /> : <span className="thumb" />}
                <span className="meta">
                  {i.kind}
                  <br />
                  <span className={`badge ${s.cls}`}>{s.text}</span>
                </span>
              </a>
            );
          })}
        </section>
      ))}

      {flow && (
        <CreateFlow
          onClose={() => {
            setFlow(false);
            load();
          }}
          onCreated={load}
        />
      )}

      <Sheet
        open={voice}
        onClose={() => {
          if (mic.listening) mic.toggle();
          setVoice(false);
        }}
      >
        <p className="kicker">say what should change</p>
        <p className="heard">{mic.listening ? mic.interim || 'listening…' : heard || '“move tomorrow’s post to 19:00” · “the caption is too long”'}</p>
        {mic.supported && (
          <button className={`mic-xl small ${mic.listening ? 'on' : ''}`} onClick={mic.toggle} aria-label={mic.listening ? 'stop' : 'speak'}>
            <Icon name="mic" size={28} stroke={1.2} />
          </button>
        )}
        {!mic.supported && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const v = new FormData(e.currentTarget).get('t');
              if (v) ask(String(v));
            }}
          >
            <input className="big-input" name="t" placeholder="type a command" autoFocus />
          </form>
        )}
        {busy && <p className="live">thinking…</p>}
        {proposal && (
          <div className="proposal">
            {proposal.reply && <p>{proposal.reply}</p>}
            {proposal.lines.length > 0 && (
              <>
                <ul>
                  {proposal.lines.map((l, i) => (
                    <li key={i}>{l}</li>
                  ))}
                </ul>
                <button className="primary wide" disabled={busy} onClick={confirm}>
                  passt
                </button>
              </>
            )}
          </div>
        )}
        {result.length > 0 && (
          <ul className="result">
            {result.map((r, i) => (
              <li key={i}>{r}</li>
            ))}
          </ul>
        )}
      </Sheet>
    </>
  );
}
