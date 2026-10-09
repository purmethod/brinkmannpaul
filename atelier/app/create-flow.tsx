'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { zoned } from '@/lib/time';
import { parseWhen } from '@/lib/when';
import { api, uploadFiles, useMic, type MediaItem } from './client';
import { Icon, Wheel, type WheelItem } from './ui';

type Step = 'media' | 'speak' | 'ready' | 'sending' | 'done';
type Format = 'reel' | 'carousel' | 'photo';
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
  style: { look?: string; text?: string; photos?: 'reel' | 'carousel' };
  looks: { id: string; label: string }[];
  textStyles: string[];
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

const nowIn = (tz: string) => {
  const z = zoned(tz);
  return `${z.date}T${z.time}`;
};

/** "cinematic", "schwarz-weiß", "als karussell" — the look and the format can be said too. */
// letter-aware edges: \b knows no umlauts ("schwarz-weiß")
const L = (src: string) => new RegExp(`(?<![a-zäöüß])(?:${src})(?![a-zäöüß])`, 'i');
const SAID_LOOKS: [RegExp, string][] = [
  [L('cinematic|kinematisch|wie im kino|film ?look'), 'cinematic'],
  [L('schwarz[- ]?wei(?:ß|ss)|black and white|b/w|mono'), 'mono'],
  [L('warm(?:er)? look|warme farben|golden'), 'warm'],
  [L('knallig|vivid|kräftige farben|bunt'), 'vivid'],
];
const SAID_FORMAT = /\b(?:(?:als|as)\s+(?:an?\s+|ein\s+)?)?(karussell|carousel|slides|reel)\b/i;
function saidStyle(text: string) {
  const hit = SAID_LOOKS.find(([re]) => re.test(text));
  const f = SAID_FORMAT.exec(text)?.[1]?.toLowerCase();
  const format: Format | undefined = f ? (f === 'reel' ? 'reel' : 'carousel') : undefined;
  // the style words steer the picture, they are not part of the story
  let rest = text;
  if (hit) rest = rest.replace(new RegExp(`(?:\\b(?:in|im|als|mit|as|with)\\s+(?:an?\\s+|einem\\s+|einen\\s+|ein\\s+)?)?${hit[0].source}(?:\\s+(?:look|filter|style|stil))?`, 'i'), ' ');
  if (f) rest = rest.replace(SAID_FORMAT, ' ');
  rest = rest.replace(/\s+([,.!?;:])/g, '$1').replace(/([,;:])(?=\s*[,.!?;:]|\s*$)/g, '').replace(/^[\s,;:]+/, '').replace(/\s{2,}/g, ' ').trim();
  return { look: hit?.[1], format, rest };
}

/**
 * Create: pick or shoot → say what it is and when → post.
 * One spoken sentence carries the content, the time ("morgen um 18 uhr", "jetzt") and even the look;
 * the one screen after it shows what was understood, every choice one tap away.
 * Uploads start the moment media is picked, so talking hides the wait.
 */
export default function CreateFlow({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [step, setStep] = useState<Step>('media');
  const [setup, setSetup] = useState<Setup | null>(null);
  const [picked, setPicked] = useState<Picked[]>([]);
  const [about, setAbout] = useState('');
  const [typing, setTyping] = useState(false);
  const [editing, setEditing] = useState(false);
  const [at, setAt] = useState('');
  const [now, setNow] = useState(false);
  const [suggested, setSuggested] = useState(''); // the heard time, else the next free slot
  const [wheels, setWheels] = useState(false);
  const [format, setFormat] = useState<Format>('reel');
  const [look, setLook] = useState('natural');
  const [words, setWords] = useState('clean');
  const [template, setTemplate] = useState('');
  const [progress, setProgress] = useState('');
  const [error, setError] = useState('');
  const [planned, setPlanned] = useState('');
  const uploads = useRef<Promise<MediaItem[]> | null>(null);

  const loadSetup = useCallback(async () => {
    const s = await api<Setup>('/api/create');
    setSetup(s);
    setAt(s.slot);
    setSuggested(s.slot);
    setLook(s.style.look ?? 'natural');
    setWords(s.style.text ?? 'clean');
    setTemplate(s.templates[0]?.id ?? '');
  }, []);
  useEffect(() => {
    loadSetup().catch((e) => setError(e.message));
  }, [loadSetup]);

  function restart() {
    picked.forEach((p) => URL.revokeObjectURL(p.preview));
    setPicked([]);
    setAbout('');
    setTyping(false);
    setEditing(false);
    setNow(false);
    setWheels(false);
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
    // a reel takes its videos; photos become a reel or a carousel
    const use = video ? files.filter((f) => f.type.startsWith('video/')) : files.slice(0, 10);
    setPicked(use.map((file) => ({ file, preview: URL.createObjectURL(file), video: file.type.startsWith('video/') })));
    setFormat(video ? 'reel' : (setup?.style.photos ?? 'reel'));
    setError('');
    uploads.current = uploadFiles(use, setProgress);
    uploads.current.catch((e) => setError((e as Error).message));
    setStep('speak');
  }

  /** what was said → content, time, look, format */
  const understand = useCallback(
    (text: string) => {
      if (!setup) return setAbout(text);
      const w = parseWhen(text, nowIn(setup.timezone), setup.slot);
      const s = saidStyle(w.rest);
      setAbout(s.rest);
      if (w.at) {
        setAt(w.at);
        setSuggested(w.at);
        setNow(w.now);
        setWheels(false);
      }
      if (s.look) setLook(s.look);
      if (s.format && !picked.some((p) => p.video)) setFormat(s.format === 'carousel' && picked.length === 1 ? 'photo' : s.format);
      setStep('ready');
    },
    [setup, picked],
  );
  const mic = useMic(understand);

  async function post() {
    setStep('sending');
    setError('');
    try {
      const media = await uploads.current!;
      const reel = format === 'reel';
      await api('/api/create', {
        method: 'POST',
        json: {
          media: media.map((m) => m.id),
          description: about,
          at: now ? 'now' : at,
          format: hasVideo ? 'auto' : format === 'reel' ? 'reel' : 'carousel',
          ...(reel ? { look, textStyle: words } : { template }),
        },
      });
      setPlanned(now ? 'now' : setup ? describeSlot(at, setup.timezone) : at);
      setStep('done');
      onCreated();
    } catch (e) {
      setError((e as Error).message);
      setStep('ready');
    }
  }

  const days = useMemo(() => (setup ? dayItems(new Intl.DateTimeFormat('en-CA', { timeZone: setup.timezone }).format(new Date())) : []), [setup]);
  const hasVideo = picked.some((p) => p.video);
  const steps: Step[] = ['media', 'speak', 'ready'];
  const stepIndex = steps.indexOf(step === 'sending' ? 'ready' : step);
  const when = now ? 'now' : setup && at ? describeSlot(at, setup.timezone) : '';

  function back() {
    if (stepIndex > 0) setStep(steps[stepIndex - 1]);
    else onClose();
  }

  return (
    <div className="flow" role="dialog" aria-modal="true" aria-label="new post">
      <header className="flow-top">
        <button className="icon-btn" onClick={step === 'done' ? onClose : back} aria-label={stepIndex > 0 && step !== 'done' ? 'back' : 'close'}>
          <Icon name={stepIndex > 0 && step !== 'done' ? 'back' : 'close'} />
        </button>
        <div className="dots" aria-hidden="true">
          {steps.map((s, i) => (
            <span key={s} className={i <= stepIndex || step === 'done' ? 'on' : ''} />
          ))}
        </div>
        <span className="icon-btn" />
      </header>

      <section className="flow-body" key={step === 'sending' ? 'ready' : step}>
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
            <p className="hint">a photo or a video — cutcake cuts, writes and posts it.</p>
          </>
        )}

        {step === 'speak' && (
          <>
            <Strip picked={picked} />
            <h1 className="q">what is it — and when?</h1>
            {!typing ? (
              <>
                {mic.supported ? (
                  <button className={`mic-xl ${mic.listening ? 'on' : ''}`} onClick={mic.toggle} aria-label={mic.listening ? 'stop' : 'speak'}>
                    <Icon name="mic" size={36} stroke={1.2} />
                  </button>
                ) : null}
                <p className="live">
                  {mic.listening ? mic.interim || 'listening…' : mic.supported ? '“bread fresh from the oven — post it tomorrow at 6 pm”' : ''}
                </p>
                {mic.listening && <p className="muted small center-text">take your time — tap the mic when you are done</p>}
                <div className="row center">
                  <button className="link" onClick={() => setTyping(true)}>
                    type instead
                  </button>
                  <span className="sep" />
                  <button className="link" onClick={() => setStep('ready')}>
                    skip
                  </button>
                </div>
              </>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  understand(String(new FormData(e.currentTarget).get('t') || ''));
                }}
              >
                <input className="big-input" name="t" autoFocus defaultValue={about} placeholder="what is it, and when…" enterKeyHint="done" />
              </form>
            )}
          </>
        )}

        {(step === 'ready' || step === 'sending') && setup && (
          <>
            <Strip picked={picked} />

            <div className="said">
              {editing ? (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    setEditing(false);
                  }}
                >
                  <input className="big-input" autoFocus value={about} onChange={(e) => setAbout(e.target.value)} onBlur={() => setEditing(false)} enterKeyHint="done" />
                </form>
              ) : (
                <button className="said-text" onClick={() => setEditing(true)}>
                  {about || <span className="muted">nothing said — cutcake reads the picture</span>}
                </button>
              )}
              {mic.supported && (
                <button className={`mic-xl small ${mic.listening ? 'on' : ''}`} onClick={mic.toggle} aria-label={mic.listening ? 'stop' : 'say it again'}>
                  <Icon name="mic" size={24} stroke={1.3} />
                </button>
              )}
            </div>
            {mic.listening && <p className="live">{mic.interim || 'listening…'}</p>}

            <p className="kicker">when</p>
            <div className="chips">
              <button aria-pressed={now} onClick={() => (setNow(true), setWheels(false))}>
                now
              </button>
              <button aria-pressed={!now && !wheels} onClick={() => (setNow(false), setWheels(false), setAt(suggested))}>
                {describeSlot(suggested, setup.timezone)}
              </button>
              <button aria-pressed={wheels} onClick={() => (setNow(false), setWheels(true))}>
                {wheels ? when : 'other…'}
              </button>
            </div>
            {wheels && (
              <div className="wheels compact">
                <div className="wheel-band" aria-hidden="true" />
                <Wheel items={days} value={at.slice(0, 10)} onChange={(v) => setAt(`${v}T${at.slice(11)}`)} width="50%" />
                <Wheel items={HOURS} value={at.slice(11, 13)} onChange={(v) => setAt(`${at.slice(0, 11)}${v}:${at.slice(14, 16)}`)} width="25%" />
                <Wheel items={MINUTES} value={at.slice(14, 16)} onChange={(v) => setAt(`${at.slice(0, 14)}${v}`)} width="25%" />
              </div>
            )}

            {!hasVideo && (
              <>
                <p className="kicker">becomes</p>
                <div className="chips">
                  <button aria-pressed={format === 'reel'} onClick={() => setFormat('reel')}>
                    reel
                  </button>
                  <button aria-pressed={format !== 'reel'} onClick={() => setFormat(picked.length > 1 ? 'carousel' : 'photo')}>
                    {picked.length > 1 ? 'carousel' : 'photo'}
                  </button>
                </div>
              </>
            )}

            {format === 'reel' ? (
              <>
                <p className="kicker">look</p>
                <div className="chips">
                  {setup.looks.map((l) => (
                    <button key={l.id} aria-pressed={look === l.id} onClick={() => setLook(l.id)}>
                      {l.label}
                    </button>
                  ))}
                </div>
                <p className="kicker">words</p>
                <div className="chips">
                  {setup.textStyles.map((t) => (
                    <button key={t} aria-pressed={words === t} onClick={() => setWords(t)} className={`ts-${t}`}>
                      {t}
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <>
                <p className="kicker">design</p>
                <div className="chips">
                  {setup.templates.map((t) => (
                    <button key={t.id} aria-pressed={template === t.id} onClick={() => setTemplate(t.id)}>
                      {t.label.toLowerCase()}
                    </button>
                  ))}
                </div>
              </>
            )}

            <div className="post-bar">
              <button className="primary wide post-btn" disabled={step === 'sending'} onClick={post}>
                {step === 'sending' ? (progress ? `uploading ${progress}` : 'saving…') : now ? 'post now' : `post · ${when}`}
              </button>
            </div>
          </>
        )}

        {step === 'done' && (
          <div className="done">
            <span className="done-mark">
              <Icon name="check" size={30} stroke={1.3} />
            </span>
            <h1 className="q">{planned === 'now' ? 'on its way' : 'planned'}</h1>
            {planned !== 'now' && <p className="done-when">{planned}</p>}
            <p className="hint">
              {planned === 'now'
                ? 'it is being cut and written now and goes out the moment it is ready.'
                : 'cutting, words and caption happen in the background. it goes out on its own.'}
            </p>
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

function Strip({ picked }: { picked: Picked[] }) {
  return (
    <div className="strip">
      {picked.map((p) => (p.video ? <video key={p.preview} src={p.preview} muted playsInline /> : <img key={p.preview} src={p.preview} alt="" />))}
    </div>
  );
}
