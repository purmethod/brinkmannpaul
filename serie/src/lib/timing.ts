import audio from '../data/audio.json';
import {EPISODES, OUTRO_SECONDS} from '../data/episodes';
import {FPS, HOOK_LEAD, TAIL} from '../theme';

export type Word = {word: string; start: number; end: number};

type VoiceEntry = {
  id: string;
  name: string;
  episodes: Record<string, {file: string; words: Word[]; duration: number; speed: number}>;
  outro: {file: string; duration: number} | null;
};
type AudioManifest = {
  voices: Record<string, VoiceEntry>;
  selected: string | null;
  music: Partial<Record<'playful' | 'longing' | 'dramatic' | 'festive', string>>;
  jingle: string | null;
  crackle: string | null;
};

export const AUDIO = audio as AudioManifest;
export const MIN_SECONDS = 8;

/** Standardstimme: freigegebene, sonst erste vorhandene. */
export const defaultVoice = (): string | null => AUDIO.selected ?? Object.keys(AUDIO.voices)[0] ?? null;

export const clean = (w: string) => w.toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');

/** Schätzung ohne Audio: ruhiges Erzähltempo mit Pausen an Satzzeichen. */
const estimateWords = (text: string): Word[] => {
  const out: Word[] = [];
  let t = 0;
  for (const raw of text.split(/\s+/)) {
    if (!/\p{L}/u.test(raw)) {
      t += 0.35; // "…" als eigenes Token
      continue;
    }
    const d = 0.16 + clean(raw).length * 0.055;
    out.push({word: raw, start: t, end: t + d});
    t += d + 0.06;
    if (/[,;:]$/.test(raw)) t += 0.22;
    if (/[.!?'’]$/.test(raw)) t += 0.38;
    if (/…$/.test(raw)) t += 0.35;
  }
  return out;
};

export type EpisodeTiming = {
  nr: number;
  voice: string | null;
  voiceFile: string | null;
  outroVoiceFile: string | null;
  /** Wortzeiten in Clip-Sekunden (inkl. Hook-Vorlauf). */
  words: Word[];
  narrationEnd: number;
  outroStart: number;
  total: number;
  durationInFrames: number;
  estimated: boolean;
};

export const episodeTiming = (nr: number, voice: string | null = defaultVoice()): EpisodeTiming => {
  const ep = EPISODES.find((e) => e.nr === nr);
  if (!ep) throw new Error(`Folge ${nr} fehlt in episodes.ts`);
  const entry = voice ? AUDIO.voices[voice] : undefined;
  const rec = entry?.episodes[String(nr)];
  const raw = rec ? rec.words : estimateWords(ep.narration);
  const dur = rec ? rec.duration : (raw[raw.length - 1]?.end ?? 5);
  const words = raw.map((w) => ({...w, start: w.start + HOOK_LEAD, end: w.end + HOOK_LEAD}));
  const narrationEnd = HOOK_LEAD + dur;
  const total = Math.max(MIN_SECONDS, narrationEnd + TAIL + OUTRO_SECONDS);
  return {
    nr,
    voice: rec ? voice : null,
    voiceFile: rec?.file ?? null,
    outroVoiceFile: entry?.outro?.file ?? null,
    words,
    narrationEnd,
    outroStart: total - OUTRO_SECONDS,
    total,
    durationInFrames: Math.round(total * FPS),
    estimated: !rec,
  };
};

/** Frame, an dem das n-te Vorkommen eines Wortes beginnt/endet. */
export const wordFrame = (t: EpisodeTiming, word: string, occurrence = 0, edge: 'start' | 'end' = 'start') => {
  const target = clean(word);
  let n = 0;
  for (const w of t.words) {
    if (clean(w.word) === target) {
      if (n === occurrence) return Math.round(w[edge] * FPS);
      n++;
    }
  }
  throw new Error(`Folge ${t.nr}: Wort "${word}" nicht in der Erzählung`);
};

export const isSpeaking = (t: EpisodeTiming, frame: number, pad = 0.2) => {
  const s = frame / FPS;
  return t.words.some((w) => s >= w.start - pad && s <= w.end + pad);
};
