'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { api, useMic } from '../client';

interface Msg {
  id: string;
  role: 'user' | 'assistant' | 'system';
  text: string;
  proposal: { lines?: string[]; actions?: unknown[]; applied?: boolean } | null;
}

export default function Chat() {
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [mediaHint, setMediaHint] = useState<number[]>([]);
  const end = useRef<HTMLDivElement>(null);

  const load = useCallback(() => api<{ messages: Msg[] }>('/api/planner').then((r) => setMsgs(r.messages)), []);
  useEffect(() => {
    load().catch((e) => setError(e.message));
    const m = new URLSearchParams(location.search).get('media');
    if (m) {
      const nums = m.split(',').map(Number).filter(Boolean);
      setMediaHint(nums);
      setInput(`${nums.map((n) => `#${n}`).join(' ')} `);
    }
  }, [load]);
  useEffect(() => end.current?.scrollIntoView({ behavior: 'smooth' }), [msgs]);

  const send = useCallback(
    async (text: string) => {
      if (!text.trim()) return;
      setBusy(true);
      setError('');
      setInput('');
      setMsgs((m) => [...m, { id: `tmp${Date.now()}`, role: 'user', text, proposal: null }]);
      try {
        await api('/api/planner', { method: 'POST', json: { message: text, media: mediaHint } });
        await load();
      } catch (e) {
        setError((e as Error).message);
      }
      setBusy(false);
    },
    [load, mediaHint],
  );

  const mic = useMic(send);

  async function confirm(id: string) {
    setBusy(true);
    setError('');
    try {
      await api('/api/planner/apply', { method: 'POST', json: { messageId: id } });
      await load();
    } catch (e) {
      setError((e as Error).message);
    }
    setBusy(false);
  }

  return (
    <>
      <h1>plan</h1>
      {!msgs.length && (
        <p className="muted">
          speak or type, in any language. “video 1 monday 15:00, video 2 monday 18:00, sunday #5 #6 #7 at 19, 20 and 21.” you confirm before anything is saved.
        </p>
      )}
      <div className="msgs">
        {msgs.map((m) => (
          <div key={m.id} className={`msg ${m.role}`}>
            {m.text}
            {m.proposal?.lines && m.proposal.lines.length > 0 && (
              <div className="plan">
                <ul>
                  {m.proposal.lines.map((l, i) => (
                    <li key={i}>{l}</li>
                  ))}
                </ul>
                {m.proposal.applied ? (
                  <span className="muted small">saved</span>
                ) : (
                  <button className="primary wide" disabled={busy} onClick={() => confirm(m.id)}>
                    passt
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
        {(busy || mic.interim) && <div className="msg system">{mic.interim || 'thinking…'}</div>}
        {error && <p className="error">{error}</p>}
        <div ref={end} />
      </div>

      <form
        className="composer"
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
      >
        <div className="inner">
          {mic.supported && (
            <button type="button" className={`mic ${mic.listening ? 'on' : ''}`} onClick={mic.toggle} aria-label={mic.listening ? 'stop' : 'speak'}>
              {mic.listening ? 'stop' : 'speak'}
            </button>
          )}
          <input type="text" value={input} onChange={(e) => setInput(e.target.value)} placeholder="when should what go out?" enterKeyHint="send" />
          <button type="submit" className="primary" disabled={busy || !input.trim()}>
            send
          </button>
        </div>
      </form>
    </>
  );
}
