'use client';

import { useState } from 'react';
import { upload } from '@vercel/blob/client';

type Tpl = { id: string; label: string; media: boolean };

export default function UploadForm({ templates, defaultTemplate }: { templates: Tpl[]; defaultTemplate: string }) {
  const [mode, setMode] = useState<'carousel' | 'reel'>('carousel');
  const [templateId, setTemplateId] = useState(defaultTemplate);
  const [text, setText] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [date, setDate] = useState('');
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState('');
  const [error, setError] = useState('');

  const tpl = templates.find((t) => t.id === templateId);

  function addFiles(list: FileList | null) {
    if (list) setFiles((prev) => [...prev, ...Array.from(list)]);
  }
  function move(i: number, d: -1 | 1) {
    setFiles((prev) => {
      const next = [...prev];
      const j = i + d;
      if (j < 0 || j >= next.length) return prev;
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  }
  function switchMode(m: 'carousel' | 'reel') {
    setMode(m);
    setFiles([]);
  }

  const canSubmit = !busy && (mode === 'reel' ? files.length > 0 : text.trim().length > 0 || files.length > 0) && !(mode === 'carousel' && tpl?.media && !files.length);

  async function submit() {
    setBusy(true);
    setError('');
    try {
      const urls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const f = files[i];
        const ext = (f.name.split('.').pop() || 'bin').toLowerCase();
        const blob = await upload(`uploads/${mode}-${Date.now()}-${i + 1}.${ext}`, f, {
          access: 'public',
          handleUploadUrl: '/api/upload',
          multipart: f.size > 20 * 1024 * 1024,
          onUploadProgress: ({ percentage }) => setProgress(`uploading ${i + 1}/${files.length} · ${Math.round(percentage)}%`),
        });
        urls.push(blob.url);
      }
      setProgress(mode === 'carousel' ? 'rendering slides…' : 'starting video pipeline…');
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ type: mode, templateId, text, media: urls, scheduledFor: date || undefined }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || `http ${res.status}`);
      window.location.href = `/preview/${json.post.id}`;
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
      setProgress('');
    }
  }

  return (
    <div>
      <div className="seg" role="group" aria-label="format">
        <button type="button" aria-pressed={mode === 'carousel'} onClick={() => switchMode('carousel')}>carousel</button>
        <button type="button" aria-pressed={mode === 'reel'} onClick={() => switchMode('reel')}>reel</button>
      </div>

      <label>template</label>
      <div className="seg" role="group" aria-label="template">
        {templates.map((t) => (
          <button key={t.id} type="button" aria-pressed={templateId === t.id} onClick={() => setTemplateId(t.id)}>
            {t.label}
          </button>
        ))}
      </div>

      {mode === 'carousel' && (
        <>
          <label htmlFor="text">slides — one line per slide · | new line · **bold**</label>
          <textarea
            id="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={'you think you have no ego. | **that thought is your ego.**\nmost men think ego means being loud. | **but the quiet ones have it too.**'}
            autoCapitalize="none"
          />
        </>
      )}

      <label htmlFor="files">
        {mode === 'reel' ? 'videos — joined in this order' : tpl?.media ? 'photos — background, one per slide' : 'photos (optional) — without text they become photo slides'}
      </label>
      <input
        id="files"
        type="file"
        multiple
        accept={mode === 'reel' ? 'video/*' : 'image/jpeg,image/png,image/webp'}
        onChange={(e) => {
          addFiles(e.target.files);
          e.target.value = '';
        }}
      />
      {files.length > 0 && (
        <ul className="files">
          {files.map((f, i) => (
            <li key={`${f.name}-${i}`}>
              <span>{i + 1}. {f.name} · {(f.size / 1024 / 1024).toFixed(1)} mb</span>
              <span className="row">
                <button type="button" aria-label="move up" onClick={() => move(i, -1)}>↑</button>
                <button type="button" aria-label="move down" onClick={() => move(i, 1)}>↓</button>
                <button type="button" aria-label="remove" onClick={() => setFiles(files.filter((_, j) => j !== i))}>×</button>
              </span>
            </li>
          ))}
        </ul>
      )}

      <label htmlFor="date">desired date (optional)</label>
      <input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />

      <div className="sticky" style={{ marginTop: 28 }}>
        <button className="primary" disabled={!canSubmit} onClick={submit} style={{ width: '100%' }}>
          {busy ? progress || 'working…' : 'create'}
        </button>
        {error && <p className="error">{error}</p>}
      </div>
    </div>
  );
}
