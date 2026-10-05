import timing from '../../public/voice/test-erzaehlung.timing.json';
import {FPS} from '../theme';

/** Wortgetreu aus dem Original-Buch. */
export const NARRATION_TEXT =
  'Es war einmal … ein junges Mädchen voller Träume, das gerade in eine neue, unbekannte Stadt gezogen war. Jede Gasse und jedes Gebäude schienen ihr Versprechen von Überraschungen und Abenteuern zu flüstern.';

export type Word = {word: string; start: number; end: number};

type TimingFile = {
  source: 'estimate' | 'elevenlabs';
  offsetSeconds: number;
  audio: {voice: string | null; music: string | null; sfx: string | null; musicSource: string};
  voiceChoice: unknown;
  phrases: {text: string; start: number; end: number}[];
  words: Word[];
};

const file = timing as TimingFile;

const clean = (w: string) => w.toLowerCase().replace(/[^a-zäöüß]/g, '');

/** Schätzt Wortzeiten aus Phrasen-Fenstern (gewichtet nach Buchstaben). */
const estimateWords = (): Word[] => {
  const out: Word[] = [];
  for (const p of file.phrases) {
    const words = p.text.split(/\s+/).filter((w) => clean(w).length > 0);
    const weights = words.map((w) => clean(w).length + 2);
    const sum = weights.reduce((a, b) => a + b, 0);
    let t = p.start;
    words.forEach((w, i) => {
      const d = ((p.end - p.start) * weights[i]) / sum;
      out.push({word: w, start: t, end: t + d * 0.92});
      t += d;
    });
  }
  return out;
};

/** Wortzeiten in Clip-Sekunden (inkl. Offset der Stimme). */
export const WORDS: Word[] =
  file.words.length > 0
    ? file.words.map((w) => ({...w, start: w.start + file.offsetSeconds, end: w.end + file.offsetSeconds}))
    : estimateWords();

export const AUDIO = file.audio;
export const VOICE_OFFSET_FRAMES = Math.round(file.offsetSeconds * FPS);
export const TIMING_SOURCE = file.source;

/** Frame, an dem das n-te Vorkommen eines Wortes beginnt. */
export const wordFrame = (word: string, occurrence = 0, edge: 'start' | 'end' = 'start') => {
  const target = clean(word);
  let n = 0;
  for (const w of WORDS) {
    if (clean(w.word) === target) {
      if (n === occurrence) return Math.round(w[edge] * FPS);
      n++;
    }
  }
  throw new Error(`Wort "${word}" nicht in der Erzählung gefunden`);
};

/** Liegt Sprache auf diesem Frame? (für Musik-Ducking) */
export const isSpeaking = (frame: number, padSeconds = 0.25) => {
  const t = frame / FPS;
  return WORDS.some((w) => t >= w.start - padSeconds && t <= w.end + padSeconds);
};

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/**
 * Szenen-Cues, getimt auf die Erzählung. Geklemmt auf das Storyboard-Raster,
 * damit der Ablauf auch bei abweichender Sprechgeschwindigkeit stimmt.
 */
export const CUES = (() => {
  const s = (sec: number) => Math.round(sec * FPS);
  const titleStart = clamp(wordFrame('Es') - 4, s(0.6), s(1.4));
  const titleEnd = clamp(wordFrame('einmal', 0, 'end') + 6, titleStart + s(1.2), s(2.9));
  const girl = clamp(wordFrame('ein') - 6, s(2.2), s(3.6));
  const dreams = clamp(wordFrame('Träume'), girl + s(0.8), s(6.5));
  const city = clamp(wordFrame('neue') - 8, s(4.6), s(7.6));
  const unknown = clamp(wordFrame('unbekannte'), city + 10, s(9.2));
  const faces = clamp(wordFrame('Jede') - 6, s(7.4), s(11.2));
  const whisper = clamp(wordFrame('flüstern'), faces + s(1.5), s(14));
  const versprechen = clamp(wordFrame('Versprechen'), faces + s(0.6), whisper - s(0.5));
  // Iris schließt erst, wenn „flüstern“ verklungen ist
  const irisClose = clamp(wordFrame('flüstern', 0, 'end') + 2, s(13.2), s(14.2));
  return {titleStart, titleEnd, girl, dreams, city, unknown, faces, versprechen, whisper, irisClose};
})();
