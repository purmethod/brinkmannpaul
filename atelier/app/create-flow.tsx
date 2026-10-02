'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { api, uploadFiles, useMic, type MediaItem } from './client';
import { Icon, TemplatePreview, Wheel, type WheelItem } from './ui';

type Step = 'media' | 'about' | 'time' | 'template' | 'sending' | 'done';
interface Tpl {
  id: string;
  label: string;
  layout: string;
  saved: boolean;
}
interface Setup {
  timezone: string;
  slot: string;
  templates: Tpl[];
}
interface Picked {
  file: File;
  preview: string;
  video: boolean;
}

const pad = (n: number) => String(n).padStart(2, '0');
const WD = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

function dayItems(from: string, n = 60): WheelItem[] {
  const out: WheelItem[] = [];
  const base = new Date(`${from}T12:00:00Z`);
  for (let i = 0; i < n; i++) {
    const d = new Date(base.getTime() + i * 864e5);
    const value = `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
    const label = i === 0 ? 'today' : i === 1 ? 'tomorrow' : `${WD[d.getUTCDay()]} ${pad(d.getUTCDate())}.${pad(d.getUTCMonth() + 1)}.`;
    out.push({ value, label });
  }
  return out;
}
const HOURS: WheelItem[] = Array.from({ length: 24 }, (_, h) => ({ value: pad(h), label: pad(h) }));
const MINUTES: WheelItem[] = Array.from({ length: 12 }, (_, m) => ({ value: pad(m * 5), label: pad(m * 5) }));

export function describeSlot(local: string, tz: string) {
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: tz }).format(new Date());
  const days = dayItems(today, 400);
  const day = days.find((d) => d.value === local.slice(0, 10))?.label ?? local.slice(0, 10);
  return `${day} · ${local.slice(11, 16)}`;
}

/**
 * The create interview: one question per screen, every choice moves on by itself.
 * Uploads start the moment media is picked, so the rest of the interview hides the wait.
 */
export default function CreateFlow({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [step, setStep] = useState<Step>('media');
  const [setup, setSetup] = useState<Setup | null>(null);
  const [picked, setPicked] = useState<Picked[]>([]);
  const [about, setAbout] = useState('');
  const [typing, setTyping] = useState(false);
  const [at, setAt] = useState('');
  const [progress, setProgress] = useState('');
  const [error, setError] = useState('');
  const [planned, setPlanned] = useState('');
  const uploads = useRef<Promise<MediaItem[]> | null>(null);

  const loadSetup = useCallback(async () => {
    const s = await api<Setup>('/api/create');
    setSetup(s);
    setAt(s.slot);
  }, []);
  useEffect(() => {
    loadSetup().catch((e) => setError(e.message));
  }, [loadSetup]);

  function restart() {
    picked.forEach((p) => URL.revokeObjectURL(p.preview));
    setPicked([]);
    setAbout('');
    setTyping(false);
    setProgress('');
    setError('');
    uploads.current = null;
    setStep('media');
    loadSetup().catch((e) => setError(e.message));
  }

  function pick(list: FileList | null) {
    const files = Array.from(list ?? []);
    if (!files.length) return;
    const video = files.some((f) => f.type.startsWith('video/'));
    // a reel takes its videos; photos-only becomes a carousel or a single photo
    const use = video ? files.filter((f) => f.type.startsWith('video/')) : files.slice(0, 10);
    setPicked(use.map((file) => ({ file, preview: URL.createObjectURL(file), video: file.type.startsWith('video/') })));
    setError('');
    uploads.current = uploadFiles(use, setProgress);
    uploads.current.catch((e) => setError((e as Error).message));
    setStep('about');
  }

  const mic = useMic(
    useCallback((text: string) => {
      setAbout(text);
      setStep('time');
    }, []),
  );

  async function finish(templateId: string) {
    setStep('sending');
    setError('');
    try {
      const media = await uploads.current!;
      await api('/api/create', { method: 'POST', json: { media: media.map((m) => m.id), description: about, at, template: templateId } });
      setPlanned(setup ? describeSlot(at, setup.timezone) : at);
      setStep('done');
      onCreated();
    } catch (e) {
      setError((e as Error).message);
      setStep('template');
    }
  }

  const days = useMemo(() => (setup ? dayItems(new Intl.DateTimeFormat('en-CA', { timeZone: setup.timezone }).format(new Date())) : []), [setup]);
  const kind = picked.some((p) => p.video) ? 'reel' : picked.length > 1 ? 'carousel' : 'photo';
  const firstPhoto = picked.find((p) => !p.video)?.preview ?? null;
  const steps: Step[] = ['media', 'about', 'time', 'template'];
  const stepIndex = steps.indexOf(step);

  function back() {
    if (stepIndex > 0) setStep(steps[stepIndex - 1]);
    else onClose();
  }

  return (
    <div className="flow" role="dialog" aria-modal="true" aria-label="new post">
      <header className="flow-top">
        <button className="icon-btn" onClick={step === 'done' ? onClose : back} aria-label={stepIndex > 0 ? 'back' : 'close'}>
          <Icon name={stepIndex > 0 && step !== 'done' ? 'back' : 'close'} />
        </button>
        <div className="dots" aria-hidden="true">
          {steps.map((s, i) => (
            <span key={s} className={i <= stepIndex || step === 'done' || step === 'sending' ? 'on' : ''} />
          ))}
        </div>
        <span className="icon-btn" />
      </header>

      <section className="flow-body" key={step}>
        {step === 'media' && (
          <>
            <h1 className="q">what do you want to share?</h1>
            <div className="pick">
              <label className="pick-btn">
                <Icon name="camera" size={34} stroke={1.1} />
                <span>camera</span>
                <input type="file" accept="image/*,video/*" capture="environment" hidden onChange={(e) => pick(e.target.files)} />
              </label>
              <label className="pick-btn">
                <Icon name="library" size={34} stroke={1.1} />
                <span>library</span>
                <input type="file" accept="image/*,video/*" multiple hidden onChange={(e) => pick(e.target.files)} />
              </label>
            </div>
            <p className="hint">a video becomes a reel. several photos become a carousel.</p>
          </>
        )}

        {step === 'about' && (
          <>
            <div className="strip">
              {picked.map((p) =>
                p.video ? <video key={p.preview} src={p.preview} muted playsInline /> : <img key={p.preview} src={p.preview} alt="" />,
              )}
            </div>
            <p className="kicker">{kind}</p>
            <h1 className="q">what is it about?</h1>
            {!typing ? (
              <>
                {mic.supported ? (
                  <button className={`mic-xl ${mic.listening ? 'on' : ''}`} onClick={mic.toggle} aria-label={mic.listening ? 'stop' : 'speak'}>
                    <Icon name="mic" size={36} stroke={1.2} />
                  </button>
                ) : null}
                <p className="live">{mic.listening ? mic.interim || 'listening…' : mic.supported ? 'tap and tell me — any language' : ''}</p>
                {mic.listening && <p className="muted small">take your time — tap the mic when you are done</p>}
                <div className="row center">
                  <button className="link" onClick={() => setTyping(true)}>type instead</button>
                  <span className="sep" />
                  <button className="link" onClick={() => setStep('time')}>skip</button>
                </div>
              </>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setStep('time');
                }}
              >
                <input className="big-input" autoFocus value={about} onChange={(e) => setAbout(e.target.value)} placeholder="a few words…" enterKeyHint="done" />
              </form>
            )}
          </>
        )}

        {step === 'time' && setup && (
          <>
            <h1 className="q">when should it go out?</h1>
            <p className="hint">the next free slot is set. turn the wheel to change it, tap the highlighted time to confirm.</p>
            <div className="wheels" onClick={(e) => (e.target as HTMLElement).classList.contains('on') && setStep('template')}>
              <div className="wheel-band" aria-hidden="true" />
              <Wheel items={days} value={at.slice(0, 10)} onChange={(v) => setAt(`${v}T${at.slice(11)}`)} width="50%" />
              <Wheel items={HOURS} value={at.slice(11, 13)} onChange={(v) => setAt(`${at.slice(0, 11)}${v}:${at.slice(14, 16)}`)} width="25%" />
              <Wheel items={MINUTES} value={at.slice(14, 16)} onChange={(v) => setAt(`${at.slice(0, 14)}${v}`)} width="25%" />
            </div>
            <button className="slot-confirm" onClick={() => setStep('template')}>
              {describeSlot(at, setup.timezone)}
            </button>
          </>
        )}

        {(step === 'template' || step === 'sending') && setup && (
          <>
            <h1 className="q">which look?</h1>
            <div className="templates">
              {setup.templates.map((t, i) => (
                <button key={t.id} className="tpl" disabled={step === 'sending'} onClick={() => finish(t.id)}>
                  <TemplatePreview layout={t.layout} photo={firstPhoto} line={about ? about.split(/[.!?]/)[0].toLowerCase().slice(0, 40) : undefined} />
                  <span className="tpl-name">
                    {t.label}
                    {i === 0 && <em> · last used</em>}
                  </span>
                </button>
              ))}
            </div>
            {step === 'sending' && <p className="live">{progress ? `uploading ${progress}` : 'saving…'}</p>}
          </>
        )}

        {step === 'done' && (
          <div className="done">
            <span className="done-mark">
              <Icon name="check" size={30} stroke={1.3} />
            </span>
            <h1 className="q">planned</h1>
            <p className="done-when">{planned}</p>
            <p className="hint">cutting, subtitles and caption happen in the background. it goes out on its own.</p>
            <div className="stack wide">
              <button className="primary wide" onClick={restart}>
                next post
              </button>
              <button className="wide ghost" onClick={onClose}>
                done
              </button>
            </div>
          </div>
        )}

        {error && <p className="error center-text">{error}</p>}
      </section>
    </div>
  );
}
