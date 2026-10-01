'use client';

import { useEffect, useState } from 'react';
import { api } from './client';

interface Item {
  id: string;
  post_id: string;
  at: string;
  status: string;
  error: string | null;
  kind: string;
  post_status: string;
  cover: string | null;
  media_numbers: number[];
}

function parts(iso: string, tz: string) {
  const f = new Intl.DateTimeFormat('en-GB', { timeZone: tz, weekday: 'long', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
  const p = Object.fromEntries(f.formatToParts(new Date(iso)).map((x) => [x.type, x.value]));
  return { day: `${p.weekday.toLowerCase()} ${p.day}.${p.month}.`, time: `${p.hour}:${p.minute}` };
}

function label(i: Item) {
  if (i.status === 'error' || i.post_status === 'error') return { text: 'error', cls: 'error' };
  if (i.status === 'done' && i.post_status === 'posted') return { text: 'posted', cls: '' };
  if (i.post_status === 'processing') return { text: 'cutting…', cls: '' };
  if (i.post_status === 'ready') return { text: 'approve', cls: 'attention' };
  return { text: 'ready', cls: '' };
}

export default function Week() {
  const [data, setData] = useState<{ timezone: string; items: Item[]; notices: { id: string; text: string }[] } | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = () => api<typeof data & object>('/api/schedules').then(setData).catch((e) => setError(e.message));
    load();
    const t = setInterval(load, 20000);
    return () => clearInterval(t);
  }, []);

  if (error) return <p className="error">{error}</p>;
  if (!data) return <p className="muted">…</p>;

  const tz = data.timezone;
  const today = parts(new Date().toISOString(), tz).day;
  const days = new Map<string, Item[]>();
  for (const i of data.items) {
    const d = parts(i.at, tz).day;
    if (!days.has(d)) days.set(d, []);
    days.get(d)!.push(i);
  }

  return (
    <>
      <h1>week</h1>
      {data.notices.map((n) => (
        <div className="notice" key={n.id}>{n.text}</div>
      ))}
      {!data.items.length && (
        <div className="stack">
          <p className="muted">nothing planned. upload your videos, then say when — e.g. “video 1 monday 15:00, video 2 monday 18:00”.</p>
          <a className="btn primary wide" href="/media">add media</a>
          <a className="btn wide" href="/chat">plan by voice</a>
        </div>
      )}
      {[...days.entries()].map(([day, items]) => (
        <section className="day" key={day}>
          <h3>
            <span>{day}</span>
            {day === today && <span className="muted small">today</span>}
          </h3>
          {items.map((i) => {
            const l = label(i);
            return (
              <a className="slot" href={`/p/${i.post_id}`} key={i.id}>
                <time>{parts(i.at, tz).time}</time>
                {i.cover ? <img className="thumb" src={i.cover} alt="" /> : <span className="thumb" />}
                <span className="meta">
                  {i.kind} {i.media_numbers.length ? `· ${i.media_numbers.map((n) => `#${n}`).join(' ')}` : ''}
                  <br />
                  <span className={`badge ${l.cls}`}>{l.text}</span>
                </span>
              </a>
            );
          })}
        </section>
      ))}
    </>
  );
}
