'use client';

import { useState } from 'react';

export default function Login() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    const res = await fetch('/api/login', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ password }) });
    setBusy(false);
    if (!res.ok) return setError((await res.json().catch(() => ({}))).error || 'wrong password');
    const next = new URLSearchParams(location.search).get('next');
    window.location.href = next && next.startsWith('/') && !next.startsWith('//') ? next : '/';
  }

  return (
    <form onSubmit={submit} style={{ marginTop: '18vh' }}>
      <h1>atelier</h1>
      <p className="muted">plan, cut and post — calmly.</p>
      <label htmlFor="pw">password</label>
      <input id="pw" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
      <button className="primary wide" style={{ marginTop: 18 }} disabled={busy || !password}>
        enter
      </button>
      {error && <p className="error">{error}</p>}
    </form>
  );
}
