'use client';

import { useEffect, useState } from 'react';
import { api, uploadFiles } from '../client';

// android share target: the service worker parks shared files in cache storage, this page uploads them
export default function Share() {
  const [msg, setMsg] = useState('receiving…');
  useEffect(() => {
    (async () => {
      const params = new URLSearchParams(location.search);
      const n = Number(params.get('n') || 0);
      const text = params.get('text') || '';
      const cache = await caches.open('atelier-share');
      const files: File[] = [];
      for (let i = 0; i < n; i++) {
        const res = await cache.match(`/shared/${i}`);
        if (!res) continue;
        const blob = await res.blob();
        files.push(new File([blob], decodeURIComponent(res.headers.get('x-filename') || `shared-${i}`), { type: blob.type }));
        await cache.delete(`/shared/${i}`);
      }
      if (!files.length) return (window.location.href = '/?new=1');
      const media = await uploadFiles(files, (m) => setMsg(`uploading ${m}`));
      // shared from another app: next free slot, last used look — adjustable afterwards
      const setup = await api<{ slot: string; templates: { id: string }[] }>('/api/create');
      setMsg('planning…');
      const { post } = await api<{ post: { id: string } }>('/api/create', {
        method: 'POST',
        json: { media: media.map((m) => m.id), description: text, at: setup.slot, template: setup.templates[0]?.id },
      });
      window.location.href = `/p/${post.id}`;
    })().catch((e) => setMsg((e as Error).message));
  }, []);
  return <p className="muted">{msg}</p>;
}
