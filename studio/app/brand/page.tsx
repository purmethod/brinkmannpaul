'use client';

import { useEffect, useState } from 'react';
import { upload } from '@vercel/blob/client';

export default function BrandPage() {
  const [autoApprove, setAutoApprove] = useState<boolean | null>(null);
  const [custom, setCustom] = useState(false);
  const [v, setV] = useState(0); // cache-buster for the preview
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  async function load() {
    const res = await fetch('/api/brand', { cache: 'no-store' });
    const json = await res.json();
    setAutoApprove(json.autoApprove);
    setCustom(Boolean(json.overrides?.assets?.[json.signatureFile]));
  }
  useEffect(() => {
    load();
  }, []);

  async function patch(body: Record<string, unknown>, done: string) {
    setBusy(true);
    setError('');
    setMsg('');
    const res = await fetch('/api/brand', { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
    const json = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) return setError(json.error || `http ${res.status}`);
    await load();
    setV(Date.now());
    setMsg(done);
  }

  async function uploadSignature(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    setError('');
    try {
      const blob = await upload(`brand/signature-${Date.now()}.png`, file, { access: 'public', handleUploadUrl: '/api/upload' });
      await patch({ signatureUrl: blob.url }, 'signature saved — re-render drafts to apply it');
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  }

  return (
    <div>
      <h1>brand kit</h1>

      <h2>signature</h2>
      <p className="muted">transparent png, dark ink. it is inverted automatically on black and photo.</p>
      <div className="sig-preview">
        <div style={{ background: '#fff' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`/api/brand/signature?v=${v}`} alt="signature on white" onError={(e) => ((e.target as HTMLImageElement).style.visibility = 'hidden')} />
        </div>
        <div style={{ background: '#000' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`/api/brand/signature?v=${v}`} alt="signature on black" style={{ filter: 'invert(1)' }} onError={(e) => ((e.target as HTMLImageElement).style.visibility = 'hidden')} />
        </div>
      </div>
      <label htmlFor="sig">upload new signature</label>
      <input id="sig" type="file" accept="image/png" disabled={busy} onChange={(e) => uploadSignature(e.target.files?.[0])} />
      {custom && (
        <p>
          <button disabled={busy} onClick={() => patch({ signatureUrl: null }, 'using the signature from the repo again')}>
            use repo signature
          </button>
        </p>
      )}

      <h2>publishing</h2>
      {autoApprove !== null && (
        <label className="toggle">
          <input type="checkbox" checked={autoApprove} disabled={busy} onChange={(e) => patch({ autoApprove: e.target.checked }, 'saved')} />
          auto-approve new posts (skip the review step)
        </label>
      )}

      {msg && <p className="muted">{msg}</p>}
      {error && <p className="error">{error}</p>}
    </div>
  );
}
