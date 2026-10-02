'use client';

import { useState } from 'react';
import { Logo } from '../ui';

export default function Login() {
  const [mode, setMode] = useState<'in' | 'up'>('in');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    const res = await fetch(mode === 'in' ? '/api/login' : '/api/signup', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name, password }),
    });
    setBusy(false);
    if (!res.ok) return setError((await res.json().catch(() => ({}))).error || `server error (${res.status})`);
    const next = new URLSearchParams(location.search).get('next');
    window.location.href = next && next.startsWith('/') && !next.startsWith('//') ? next : mode === 'up' ? '/channels' : '/';
  }

  const up = mode === 'up';
  return (
    <form onSubmit={submit} className="login">
      <span className="login-mark">
        <Logo size={58} />
      </span>
      <h1>cutcake</h1>
      <p className="muted">cut it, plan it, post it.</p>

      <div className="segmented" role="tablist">
        <button type="button" role="tab" aria-selected={!up} onClick={() => setMode('in')}>
          log in
        </button>
        <button type="button" role="tab" aria-selected={up} onClick={() => setMode('up')}>
          create account
        </button>
      </div>

      <label htmlFor="name">name</label>
      <input
        id="name"
        autoComplete="username"
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        placeholder={up ? 'e.g. your instagram name' : ''}
        value={name}
        onChange={(e) => setName(e.target.value.toLowerCase())}
      />
      <label htmlFor="pw">password</label>
      <input
        id="pw"
        type="password"
        autoComplete={up ? 'new-password' : 'current-password'}
        placeholder={up ? 'at least 8 characters' : ''}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button className="primary wide" style={{ marginTop: 20 }} disabled={busy || !password || (up && (name.length < 3 || password.length < 8))}>
        {busy ? '…' : up ? 'create my account' : 'log in'}
      </button>
      {error && <p className="error">{error}</p>}
      {up && <p className="muted small" style={{ marginTop: 14 }}>you get your own space and your first channel. nothing is shared with other accounts.</p>}
    </form>
  );
}
