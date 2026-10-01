'use client';

import { useEffect, useState } from 'react';
import { api, uploadOne } from '../client';

interface S {
  timezone: string;
  handle: string;
  autoApprove: boolean;
  captionRules: string;
  cutRules: string;
  subtitleLanguage: string;
  defaultTemplate: string;
  signatureUrl: string | null;
  templates: { id: string; label: string }[];
  connections: { platform: string; username: string | null; status: string; error: string | null; expires_at: string | null }[];
  keys: number;
  openFeedback: number;
}

export default function Settings() {
  const [s, setS] = useState<S | null>(null);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [key, setKey] = useState('');
  const [origin, setOrigin] = useState('');

  const load = () => api<S>('/api/settings').then(setS).catch((e) => setError(e.message));
  useEffect(() => {
    load();
    setOrigin(location.origin);
    const ig = new URLSearchParams(location.search).get('instagram');
    if (ig) setMsg(ig);
  }, []);

  async function save(patch: Partial<S>, done = 'saved') {
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

  return (
    <>
      <h1>settings</h1>
      {msg && <p className="muted">{msg}</p>}
      {error && <p className="error">{error}</p>}

      <h2>instagram</h2>
      {ig ? (
        <p>
          connected as <strong>@{ig.username}</strong>
          {ig.error && <span className="error"><br />{ig.error}</span>}
        </p>
      ) : (
        <p className="muted">one click. your instagram professional account must be linked to a facebook page.</p>
      )}
      <a className={`btn wide ${ig ? '' : 'primary'}`} href="/api/auth/instagram">{ig ? 'reconnect' : 'connect instagram'}</a>
      <p className="muted small">tiktok — coming later.</p>

      <h2>publishing</h2>
      <label className="check">
        <input type="checkbox" checked={s.autoApprove} onChange={(e) => save({ autoApprove: e.target.checked })} />
        approve automatically
      </label>
      <label htmlFor="tz">timezone</label>
      <input id="tz" type="text" defaultValue={s.timezone} onBlur={(e) => e.target.value !== s.timezone && save({ timezone: e.target.value })} />
      <label htmlFor="tpl">default template</label>
      <div className="seg" id="tpl">
        {s.templates.map((t) => (
          <button key={t.id} aria-pressed={s.defaultTemplate === t.id} onClick={() => save({ defaultTemplate: t.id })}>{t.label}</button>
        ))}
      </div>
      <label htmlFor="lang">subtitle language</label>
      <select id="lang" value={s.subtitleLanguage} onChange={(e) => save({ subtitleLanguage: e.target.value })}>
        {['en', 'de', 'es', 'fr', 'it'].map((l) => (
          <option key={l} value={l}>{l}</option>
        ))}
      </select>

      <h2>signature</h2>
      <div className="sig">
        <div style={{ background: '#fff' }}>{s.signatureUrl ? <img src={s.signatureUrl} alt="" /> : <span className="muted small">from the repo</span>}</div>
        <div style={{ background: '#000' }}>{s.signatureUrl && <img src={s.signatureUrl} alt="" style={{ filter: 'invert(1)' }} />}</div>
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
            await save({ signatureUrl: await uploadOne(f, 'signature.png') }, 'signature saved — re-render posts to apply');
          }}
        />
      </label>

      <h2>editing rules</h2>
      <p className="muted small">every cut follows these. your feedback is folded in automatically every 5 notes ({s.openFeedback} open).</p>
      <textarea defaultValue={s.cutRules} key={s.cutRules} onBlur={(e) => e.target.value !== s.cutRules && save({ cutRules: e.target.value })} />
      <button className="wide" style={{ marginTop: 8 }} disabled={!s.openFeedback} onClick={async () => { await api('/api/settings/learn', { method: 'POST' }); await load(); setMsg('rules updated'); }}>
        learn from feedback now
      </button>

      <h2>caption rules</h2>
      <textarea defaultValue={s.captionRules} onBlur={(e) => e.target.value !== s.captionRules && save({ captionRules: e.target.value })} />

      <h2>share from your phone</h2>
      <p className="muted small">android: install atelier to the home screen, then share any video or photo to “atelier”.</p>
      <p className="muted small">iphone: a shortcut in the share sheet. it needs a personal key ({s.keys} active).</p>
      {key ? (
        <p>
          <span className="code">{key}</span>
          <br />
          <span className="muted small">copy it now — it is shown once.</span>
        </p>
      ) : (
        <button className="wide" onClick={async () => setKey((await api<{ key: string }>('/api/keys', { method: 'POST' })).key)}>create personal key</button>
      )}
      <details style={{ marginTop: 12 }}>
        <summary className="muted">build the ios shortcut (once, 2 minutes)</summary>
        <ol className="steps">
          <li>shortcuts app → new shortcut → info (i) → “show in share sheet”, accepts: images, media.</li>
          <li>add “dictate text” (optional — what should happen, e.g. “post this at 18:00”).</li>
          <li>add “get contents of url”: <span className="code">{origin}/api/ingest</span>, method post, header <span className="code">authorization: Bearer your-key</span>, json body: <span className="code">filename</span> = name of shortcut input, <span className="code">type</span> = “video/mp4” or “image/jpeg”, <span className="code">say</span> = dictated text.</li>
          <li>add “get dictionary value” <span className="code">upload</span> from the result.</li>
          <li>add “get contents of url”: url = upload → url, method put, request body: file = shortcut input, headers = the five values in upload → headers (authorization, x-api-version, x-vercel-blob-access, x-content-type, x-add-random-suffix).</li>
          <li>done: the file appears as the next #number; your dictated plan waits in “plan” for “passt”.</li>
        </ol>
      </details>

      <h2>claude connector</h2>
      <p className="muted small">claude → customize → connectors → add custom connector → url:</p>
      <p><span className="code">{origin}/api/mcp</span></p>

      <hr className="rule" />
      <button className="ghost wide" onClick={async () => { await fetch('/api/login', { method: 'DELETE' }); window.location.href = '/login'; }}>log out</button>
    </>
  );
}
