'use client';

import { useState } from 'react';
import type { Check } from '@/lib/setup';

export default function SetupPanel({ checks }: { checks: Check[] }) {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const blocking = checks.filter((c) => !c.ok && c.needed === 'post').length;

  async function test() {
    setBusy(true);
    setMsg('');
    setError('');
    const res = await fetch('/api/setup', { method: 'POST' });
    const json = await res.json().catch(() => ({}));
    setBusy(false);
    if (res.ok) {
      setMsg(`connected: @${json.account.username ?? json.account.id}`);
      setTimeout(() => window.location.reload(), 1200);
    } else setError(json.error || `http ${res.status}`);
  }

  return (
    <details className="setup" open={blocking > 0}>
      <summary>
        setup {blocking ? `· ${blocking} open for the 18:00 post` : '· ready to post'}
      </summary>
      <ul className="checks">
        {checks.map((c) => (
          <li key={c.label} className={c.ok ? 'ok' : c.needed === 'post' ? 'bad' : 'warn'}>
            <span>{c.ok ? '✓' : c.needed === 'post' ? '✗' : '–'}</span> {c.label}
            {c.detail && <span className="muted"> · {c.detail}</span>}
          </li>
        ))}
      </ul>
      <div className="row">
        <button disabled={busy} onClick={test}>{busy ? 'testing…' : 'test instagram'}</button>
        <a className="btn" href="/brand">brand kit</a>
      </div>
      {msg && <p className="muted">{msg}</p>}
      {error && <p className="error">{error}</p>}
    </details>
  );
}
