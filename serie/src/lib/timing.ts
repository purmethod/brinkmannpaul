import audio from '../data/audio.json';
import {PARTS, STORY, TIMING} from '../data/story';
import {FPS} from '../theme';

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

/** Standardstimme: freigegebene, sonst erste vorhandene. */
export const defaultVoice = (): string | null => AUDIO.selected ?? Object.keys(AUDIO.voices)[0] ?? null;

export const clean = (w: string) => w.toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');

/** Schätzung ohne Audio: ruhiges Erzähltempo mit Pausen an Satzzeichen. */
const estimateWords = (text: string): Word[] => {
  const out: Word[] = [];
  let t = 0;
  for (const raw of text.split(/\s+/)) {
    if (!/\p{L}/u.test(raw)) {
      t += 0.35;
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

/** Erzählung einer Szene: Wortzeiten ab Stimmbeginn (0 s), Dauer, Datei. */
export const sceneNarration = (scene: number, voice: string | null) => {
  const s = STORY.find((e) => e.nr === scene);
  if (!s) throw new Error(`Szene ${scene} fehlt in story.ts`);
  const rec = voice ? AUDIO.voices[voice]?.episodes[String(scene)] : undefined;
  const words = rec ? rec.words : estimateWords(s.narration);
  const duration = rec ? rec.duration : (words[words.length - 1]?.end ?? 5);
  return {words, duration, file: rec?.file ?? null, mood: s.mood};
};

export type Segment = {
  scene: number;
  mood: string;
  /** Szene sichtbar ab (Sekunden in der Folge). */
  start: number;
  /** Stimme der Szene beginnt (Sekunden in der Folge). */
  voiceStart: number;
  voiceEnd: number;
  /** Szene endet (= Start der nächsten bzw. Ende der Folge). */
  end: number;
  /** Wortzeiten relativ zum Szenenstart. */
  localWords: Word[];
  voiceFile: string | null;
};

export type PartTiming = {
  nr: number;
  voice: string | null;
  segments: Segment[];
  /** alle Wörter in Folgen-Sekunden (für Musik-Ducking). */
  words: Word[];
  narrationEnd: number;
  outroStart: number;
  total: number;
  durationInFrames: number;
  outroVoiceFile: string | null;
  estimated: boolean;
};

export const partTiming = (nr: number, voice: string | null = defaultVoice()): PartTiming => {
  const part = PARTS.find((p) => p.nr === nr);
  if (!part) throw new Error(`Folge ${nr} fehlt in PARTS`);
  const segments: Segment[] = [];
  const words: Word[] = [];
  let t = TIMING.lead;
  let estimated = false;
  part.scenes.forEach((scene, i) => {
    const n = sceneNarration(scene, voice);
    if (!n.file) estimated = true;
    const lead = i === 0 ? TIMING.lead : TIMING.sceneLead;
    const start = t - lead;
    const voiceStart = t;
    const voiceEnd = t + n.duration;
    segments.push({
      scene,
      mood: n.mood,
      start,
      voiceStart,
      voiceEnd,
      end: 0,
      localWords: n.words.map((w) => ({...w, start: w.start + lead, end: w.end + lead})),
      voiceFile: n.file,
    });
    n.words.forEach((w) => words.push({...w, start: w.start + voiceStart, end: w.end + voiceStart}));
    t = voiceEnd + (i < part.scenes.length - 1 ? TIMING.gap : 0);
  });
  const narrationEnd = t;
  const total = narrationEnd + TIMING.tail + TIMING.outro;
  segments.forEach((s, i) => (s.end = i < segments.length - 1 ? segments[i + 1].start : total));
  return {
    nr,
    voice,
    segments,
    words,
    narrationEnd,
    outroStart: total - TIMING.outro,
    total,
    durationInFrames: Math.round(total * FPS),
    outroVoiceFile: voice ? (AUDIO.voices[voice]?.outro?.file ?? null) : null,
    estimated,
  };
};

/** Frame eines Wortes in einer Wortliste (n-tes Vorkommen). */
export const wordFrameIn = (words: Word[], word: string, occurrence = 0, edge: 'start' | 'end' = 'start', where = '') => {
  const target = clean(word);
  let n = 0;
  for (const w of words) {
    if (clean(w.word) === target) {
      if (n === occurrence) return Math.round(w[edge] * FPS);
      n++;
    }
  }
  throw new Error(`${where}: Wort "${word}" nicht in der Erzählung`);
};

export const isSpeakingIn = (words: Word[], frame: number, pad = 0.2) => {
  const s = frame / FPS;
  return words.some((w) => s >= w.start - pad && s <= w.end + pad);
};
