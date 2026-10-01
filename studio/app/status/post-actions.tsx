'use client';

import { useState } from 'react';
import type { PostStatus } from '@/lib/types';

export default function PostActions({ id, status }: { id: string; status: PostStatus }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function call(url: string, init: RequestInit, confirmText?: string) {
    if (confirmText && !confirm(confirmText)) return;
    setBusy(true);
    setError('');
    const res = await fetch(url, init);
    const json = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) setError(json.error || json.post?.error || `http ${res.status}`);
    else window.location.reload();
  }
  const patch = (action: string) =>
    call(`/api/posts/${id}`, { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ action }) });

  if (status === 'posted') return null;
  return (
    <div>
      <div className="row" style={{ marginTop: 8 }}>
        {status === 'draft' && <button disabled={busy} onClick={() => patch('approve')}>approve</button>}
        {status === 'approved' && (
          <>
            <button disabled={busy} onClick={() => call(`/api/posts/${id}/publish`, { method: 'POST' }, 'post this to instagram now?')}>
              post now
            </button>
            <button disabled={busy} onClick={() => patch('unapprove')}>unapprove</button>
          </>
        )}
        {status === 'error' && <button disabled={busy} onClick={() => patch('retry')}>retry</button>}
      </div>
      {busy && <p className="muted">working…</p>}
      {error && <p className="error">{error}</p>}
    </div>
  );
}
