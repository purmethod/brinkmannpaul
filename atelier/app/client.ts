'use client';

import { upload, uploadPresigned } from '@vercel/blob/client';
import { useCallback, useEffect, useRef, useState } from 'react';

export async function api<T = Record<string, unknown>>(url: string, init?: RequestInit & { json?: unknown }): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { ...(init?.json !== undefined ? { 'content-type': 'application/json' } : {}), ...init?.headers },
    body: init?.json !== undefined ? JSON.stringify(init.json) : init?.body,
    cache: 'no-store',
  });
  if (res.status === 401) {
    window.location.href = `/login?next=${encodeURIComponent(location.pathname)}`;
    throw new Error('login required');
  }
  const json = (await res.json().catch(() => ({}))) as T & { error?: string };
  if (!res.ok) throw new Error(json.error || `http ${res.status}`);
  return json;
}

export interface MediaItem {
  id: string;
  number: number;
  kind: 'video' | 'photo';
  url: string;
  status: string;
  filename: string | null;
}

/** Phone → vercel blob directly (large files), then register in upload order → #numbers. */
async function uploadReady(): Promise<'token' | 'presigned'> {
  const r = await fetch('/api/upload', { cache: 'no-store' }).then((x) => x.json()).catch(() => ({ ok: true, mode: 'token' }));
  if (!r.ok) throw new Error(r.reason || 'upload not available');
  return r.mode === 'presigned' ? 'presigned' : 'token';
}

const rnd = () => Math.random().toString(36).slice(2, 10);

/** Uploads one file with whichever mode the blob store supports. */
async function put(pathname: string, file: Blob, mode: 'token' | 'presigned', onProgress?: (p: number) => void) {
  const big = file.size > 20 * 1024 * 1024;
  const progress = onProgress ? { onUploadProgress: ({ percentage }: { percentage: number }) => onProgress(percentage) } : {};
  if (mode === 'presigned') {
    // presigned uploads cannot add a random suffix client-side, so the path is unique already
    const [base, ext] = [pathname.replace(/\.[^.]+$/, ''), pathname.split('.').pop()];
    return uploadPresigned(`${base}-${rnd()}.${ext}`, file, { access: 'public', handleUploadUrl: '/api/upload', multipart: big, ...progress });
  }
  return upload(pathname, file, { access: 'public', handleUploadUrl: '/api/upload', multipart: big, ...progress });
}

export async function uploadFiles(files: File[], onProgress: (msg: string) => void): Promise<MediaItem[]> {
  const mode = await uploadReady();
  const items: { url: string; filename: string; type: string }[] = [];
  for (let i = 0; i < files.length; i++) {
    const f = files[i];
    const ext = (f.name.split('.').pop() || 'bin').toLowerCase();
    const blob = await put(`media/${Date.now()}-${i}.${ext}`, f, mode, (p) => onProgress(`${i + 1} / ${files.length} · ${Math.round(p)}%`));
    items.push({ url: blob.url, filename: f.name, type: f.type });
  }
  const { media } = await api<{ media: MediaItem[] }>('/api/media', { method: 'POST', json: { items } });
  return media;
}

export async function uploadOne(file: Blob, name: string): Promise<string> {
  const mode = await uploadReady();
  const blob = await put(`media/${Date.now()}-${name}`, file, mode);
  return blob.url;
}

/** One file at a time: share sheet on phones (→ save to photos), download elsewhere. */
export async function saveFile(url: string, name: string) {
  try {
    const blob = await (await fetch(url)).blob();
    const file = new File([blob], name, { type: blob.type });
    if (navigator.canShare?.({ files: [file] })) {
      await navigator.share({ files: [file] });
      return;
    }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 10_000);
  } catch (e) {
    if ((e as Error).name !== 'AbortError') window.open(`${url}?download=1`, '_blank');
  }
}

type Recognition = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  start(): void;
  stop(): void;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }> }) => void) | null;
  onend: (() => void) | null;
  onerror: ((e: { error: string }) => void) | null;
};

/** Browser speech recognition, any language (device language). */
export function useMic(onFinal: (text: string) => void) {
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState('');
  const [supported, setSupported] = useState(false);
  const rec = useRef<Recognition | null>(null);
  const finalRef = useRef('');

  useEffect(() => {
    const w = window as unknown as { SpeechRecognition?: new () => Recognition; webkitSpeechRecognition?: new () => Recognition };
    setSupported(Boolean(w.SpeechRecognition || w.webkitSpeechRecognition));
  }, []);

  const toggle = useCallback(() => {
    if (listening) {
      rec.current?.stop();
      return;
    }
    const w = window as unknown as { SpeechRecognition?: new () => Recognition; webkitSpeechRecognition?: new () => Recognition };
    const R = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!R) return;
    const r = new R();
    r.lang = navigator.language || 'de-DE';
    r.interimResults = true;
    r.continuous = true;
    finalRef.current = '';
    r.onresult = (e) => {
      let fin = '';
      let tmp = '';
      for (let i = 0; i < e.results.length; i++) {
        const res = e.results[i];
        if (res.isFinal) fin += res[0].transcript;
        else tmp += res[0].transcript;
      }
      finalRef.current = fin;
      setInterim(fin + tmp);
    };
    r.onerror = () => setListening(false);
    r.onend = () => {
      setListening(false);
      const text = (finalRef.current || '').trim();
      setInterim('');
      if (text) onFinal(text);
    };
    rec.current = r;
    r.start();
    setListening(true);
  }, [listening, onFinal]);

  return { listening, interim, supported, toggle };
}
