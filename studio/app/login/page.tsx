'use client';

import { useState } from 'react';

export default function LoginPage() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    setBusy(false);
    if (res.ok) window.location.href = '/';
    else setError('wrong password');
  }

  return (
    <form onSubmit={submit}>
      <h1>studio</h1>
      <label htmlFor="pw">password</label>
      <input id="pw" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
      <p className="row" style={{ marginTop: 20 }}>
        <button className="primary" disabled={busy || !password}>enter</button>
      </p>
      {error && <p className="error">{error}</p>}
    </form>
  );
}
