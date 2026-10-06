'use client';

import { useEffect, useState } from 'react';
import { api, uploadOne } from '../client';
import { Mark, TemplatePreview } from '../ui';

interface S {
  timezone: string;
  handle: string;
  cutRules: string;
  signatureUrl: string | null;
  templates: { id: string; label: string }[];
  connections: { platform: string; username: string | null; status: string; error: string | null; expires_at: string | null }[];
  keys: number;
  openFeedback: number;
}
interface Setup {
  templates: { id: string; label: string; layout: string; saved: boolean }[];
}
interface Brands {
  user?: { name: string | null; owner: boolean };
  active: string;
  brands: { id: string; name: string; handle: string; logo: string[] | null; instagram: string | null; autopilot: boolean }[];
}

export default function Settings() {
  const [s, setS] = useState<S | null>(null);
  const [setup, setSetup] = useState<Setup | null>(null);
  const [brands, setBrands] = useState<Brands | null>(null);
  const [pwOpen, setPwOpen] = useState(false);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [key, setKey] = useState('');
  const [origin, setOrigin] = useState('');

  const load = () =>
    Promise.all([api<S>('/api/settings').then(setS), api<Setup>('/api/create').then(setSetup), api<Brands>('/api/brands').then(setBrands)]).catch((e) =>
      setError(e.message),
    );
  useEffect(() => {
    load();
    setOrigin(location.origin);
    const ig = new URLSearchParams(location.search).get('instagram');
    if (ig) setMsg(ig);
  }, []);

  async function save(patch: Record<string, unknown>, done = 'saved') {
    setError('');
    try {
      await api('/api/settings', { method: 'PATCH', json: patch });
      await load();
      setMsg(done);
    } catch (e) {
      setError((e as Error).message);
    }
  }

  if (!s) return error ? <p className="error">{error}</p> : <p className="muted">…</p>;
  const ig = s.connections.find((c) => c.platform === 'instagram');
  const builtIn = setup?.templates.filter((t) => !t.saved) ?? [];
  const saved = setup?.templates.filter((t) => t.saved) ?? [];

  const active = brands?.brands.find((b) => b.id === brands.active);
  return (
    <>
      <header className="page-top">
        <h1>settings</h1>
      </header>
      {msg && <p className="toast static">{msg}</p>}
      {error && <p className="error">{error}</p>}

      {active && (
        <>
          <p className="section-title">channel</p>
          <div className="list">
            <a href={`/channels/${active.id}`}>
              <span className="row" style={{ gap: 12 }}>
                <Mark name={active.name} logo={active.logo} />
                <span>
                  <strong style={{ fontWeight: 650 }}>{active.name}</strong>
                  <br />
                  <span className="muted small">{active.instagram ? `@${active.instagram}` : `${active.handle} · instagram not connected`}</span>
                </span>
              </span>
              <span className="value" />
            </a>
            <a href="/channels">
              <span>switch channel</span>
              <span className="value">{brands!.brands.length}</span>
            </a>
          </div>
          <p className="section-foot">looks, styles and everything below apply to this channel.</p>
        </>
      )}
      {ig?.error && <p className="error">{ig.error}</p>}

      <p className="section-title">looks</p>
      <section className="card">
        <div className="looks">
          {builtIn.map((t) => (
            <div key={t.id} className="look">
              <TemplatePreview layout={t.layout} />
              <span>{t.label}</span>
            </div>
          ))}
        </div>
      </section>

      <p className="section-title">your styles · {saved.length} / 5</p>
      {!saved.length ? (
        <p className="section-foot">open a post you love and tap “save style”. it appears here and when you choose a look.</p>
      ) : (
        <div className="list">
          {saved.map((t) => (
            <div key={t.id}>
              <span>{t.label}</span>
              <span className="row" style={{ gap: 4 }}>
                <button
                  className="link small-btn"
                  onClick={async () => {
                    const name = prompt('rename', t.label);
                    if (!name) return;
                    await api('/api/templates', { method: 'PATCH', json: { id: t.id.replace('saved:', ''), name } });
                    load();
                  }}
                >
                  rename
                </button>
                <button
                  className="link small-btn"
                  onClick={async () => {
                    if (!confirm(`delete “${t.label}”?`)) return;
                    await api(`/api/templates?id=${encodeURIComponent(t.id.replace('saved:', ''))}`, { method: 'DELETE' });
                    load();
                  }}
                >
                  delete
                </button>
              </span>
            </div>
          ))}
        </div>
      )}

      <p className="section-title">account</p>
      <div className="list">
        <div>
          <span>signed in as</span>
          <span className="value">{brands?.user?.name ? `@${brands.user.name}` : 'owner'}</span>
        </div>
        <button onClick={() => setPwOpen(!pwOpen)}>
          <span>change password</span>
          <span className="value">{pwOpen ? '–' : ''}</span>
        </button>
        {pwOpen && (
          <form
            className="pw-form"
            onSubmit={async (e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              try {
                await api('/api/account', { method: 'PATCH', json: { current: f.get('current'), next: f.get('next') } });
                setPwOpen(false);
                setMsg('password changed');
              } catch (err) {
                setError((err as Error).message);
              }
            }}
          >
            <input name="current" type="password" placeholder="current password" autoComplete="current-password" />
            <input name="next" type="password" placeholder="new password (8+ characters)" autoComplete="new-password" minLength={8} />
            <button className="primary wide">save</button>
          </form>
        )}
        <button
          onClick={async () => {
            await fetch('/api/login', { method: 'DELETE' });
            window.location.href = '/login';
          }}
        >
          <span style={{ color: 'var(--error)' }}>log out</span>
        </button>
      </div>

      <p className="section-title">general</p>
      <details className="card more">
        <summary>more</summary>

        <label htmlFor="tz">timezone</label>
        <input id="tz" type="text" defaultValue={s.timezone} onBlur={(e) => e.target.value !== s.timezone && save({ timezone: e.target.value })} />

        <label>signature</label>
        <div className="sig">
          <div style={{ background: '#fff' }}>{s.signatureUrl ? <img src={s.signatureUrl} alt="" /> : <span className="muted small">none</span>}</div>
          <div style={{ background: '#111' }}>{s.signatureUrl && <img src={s.signatureUrl} alt="" style={{ filter: 'invert(1)' }} />}</div>
        </div>
        <label className="btn wide" style={{ marginTop: 10 }}>
          upload signature (transparent png)
          <input
            type="file"
            accept="image/png"
            hidden
            onChange={async (e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              setMsg('uploading…');
              await save({ signatureUrl: await uploadOne(f, 'signature.png') }, 'signature saved');
            }}
          />
        </label>

        <label htmlFor="rules">what cutcake has learned about your cuts</label>
        <textarea id="rules" defaultValue={s.cutRules} key={s.cutRules} onBlur={(e) => e.target.value !== s.cutRules && save({ cutRules: e.target.value })} />
        <button
          className="wide ghost"
          style={{ marginTop: 8 }}
          disabled={!s.openFeedback}
          onClick={async () => {
            await api('/api/settings/learn', { method: 'POST' });
            await load();
            setMsg('learned');
          }}
        >
          learn from {s.openFeedback} new corrections now
        </button>

        <label>share from your iphone</label>
        <p className="muted small">a shortcut in the share sheet sends photos and videos straight in. it needs a personal key ({s.keys} active).</p>
        {key ? (
          <p>
            <span className="code">{key}</span>
            <br />
            <span className="muted small">copy it now — it is shown once. endpoint: {origin}/api/ingest</span>
          </p>
        ) : (
          <button className="wide ghost" onClick={async () => setKey((await api<{ key: string }>('/api/keys', { method: 'POST' })).key)}>
            create personal key
          </button>
        )}

        <label>claude connector</label>
        <p className="muted small">claude → customize → connectors → add custom connector:</p>
        <p>
          <span className="code">{origin}/api/mcp</span>
        </p>

        <button
          className="ghost wide"
          style={{ marginTop: 24 }}
          onClick={async () => {
            await fetch('/api/login', { method: 'DELETE' });
            window.location.href = '/login';
          }}
        >
          log out
        </button>
      </details>
    </>
  );
}
