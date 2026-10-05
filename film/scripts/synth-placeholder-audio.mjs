#!/usr/bin/env node
// Platzhalter-Ton ohne API: Spieluhr + Celesta + leise Streicher (15 s) und
// Schallplatten-Knistern, prozedural synthetisiert. Deterministisch.
// Ersetzt durch echte ElevenLabs-Dateien via `npm run audio:elevenlabs`.
//
//   node scripts/synth-placeholder-audio.mjs
//
// Benötigt ffmpeg (WAV -> MP3).

import {execFileSync} from 'node:child_process';
import {mkdirSync, unlinkSync, writeFileSync} from 'node:fs';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SR = 44100;
const LEN = 15;
const N = SR * LEN;

// --- Hilfen ---------------------------------------------------------------
let seed = 1234567;
const random = () => {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  return seed / 4294967296;
};
const midi = (m) => 440 * Math.pow(2, (m - 69) / 12);
const NOTE = {C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, Bb: 10, B: 11};
const n = (name, oct) => 12 * (oct + 1) + NOTE[name];

const writeWav = (path, L, R) => {
  const data = Buffer.alloc(N * 4);
  for (let i = 0; i < N; i++) {
    data.writeInt16LE(Math.max(-1, Math.min(1, L[i])) * 32767, i * 4);
    data.writeInt16LE(Math.max(-1, Math.min(1, R[i])) * 32767, i * 4 + 2);
  }
  const h = Buffer.alloc(44);
  h.write('RIFF', 0);
  h.writeUInt32LE(36 + data.length, 4);
  h.write('WAVE', 8);
  h.write('fmt ', 12);
  h.writeUInt32LE(16, 16);
  h.writeUInt16LE(1, 20);
  h.writeUInt16LE(2, 22);
  h.writeUInt32LE(SR, 24);
  h.writeUInt32LE(SR * 4, 28);
  h.writeUInt16LE(4, 32);
  h.writeUInt16LE(16, 34);
  h.write('data', 36);
  h.writeUInt32LE(data.length, 40);
  writeFileSync(path, Buffer.concat([h, data]));
};

const toMp3 = (wav, mp3) => {
  mkdirSync(dirname(mp3), {recursive: true});
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', wav, '-codec:a', 'libmp3lame', '-b:a', '128k', mp3]);
  unlinkSync(wav);
};

const normalize = (L, R, peakDb) => {
  let peak = 0;
  for (let i = 0; i < N; i++) peak = Math.max(peak, Math.abs(L[i]), Math.abs(R[i]));
  const g = Math.pow(10, peakDb / 20) / (peak || 1);
  for (let i = 0; i < N; i++) {
    L[i] *= g;
    R[i] *= g;
  }
};

// Ton mit Partialtönen, je eigenem Abklingen (Glocken-/Spieluhrcharakter)
const pluck = (buf, t0, freq, amp, partials, pan, out) => {
  const start = Math.floor(t0 * SR);
  const dur = Math.max(...partials.map((p) => p[2])) * 5;
  const end = Math.min(N, start + Math.floor(dur * SR));
  for (let i = start; i < end; i++) {
    const t = (i - start) / SR;
    const att = Math.min(1, t / 0.003);
    let v = 0;
    for (const [ratio, a, decay] of partials) v += a * Math.sin(2 * Math.PI * freq * ratio * t) * Math.exp(-t / decay);
    v *= amp * att;
    out[0][i] += v * (1 - pan);
    out[1][i] += v * pan;
  }
};

const pad = (t0, t1, freq, amp, out) => {
  const s = Math.floor(t0 * SR);
  const e = Math.min(N, Math.floor((t1 + 1.2) * SR));
  const ph = random() * 6.28;
  for (let i = s; i < e; i++) {
    const t = (i - s) / SR;
    const env = Math.min(1, t / 0.9) * (i / SR > t1 ? Math.exp(-(i / SR - t1) / 0.5) : 1);
    const vib = 1 + 0.003 * Math.sin(2 * Math.PI * 5.2 * t + ph);
    let v = 0;
    for (let h = 1; h <= 6; h++) {
      const det = h % 2 ? 1.002 : 0.998;
      v += Math.sin(2 * Math.PI * freq * h * vib * det * t + ph * h) / (h * 1.4);
    }
    v *= amp * env;
    out[0][i] += v * 0.55;
    out[1][i] += v * 0.45;
  }
};

const reverb = (x, mix) => {
  const combs = [1557, 1617, 1491, 1422].map((d) => ({d, buf: new Float32Array(d), i: 0}));
  const aps = [225, 556].map((d) => ({d, buf: new Float32Array(d), i: 0}));
  const out = new Float32Array(N);
  for (let n0 = 0; n0 < N; n0++) {
    let s = 0;
    for (const c of combs) {
      const y = c.buf[c.i];
      c.buf[c.i] = x[n0] + y * 0.82;
      c.i = (c.i + 1) % c.d;
      s += y;
    }
    s /= combs.length;
    for (const a of aps) {
      const y = a.buf[a.i];
      const v = -s * 0.5 + y;
      a.buf[a.i] = s + y * 0.5;
      a.i = (a.i + 1) % a.d;
      s = v;
    }
    out[n0] = x[n0] * (1 - mix) + s * mix;
  }
  return out;
};

// --- Musik: Spieluhr + Celesta + Streicher ---------------------------------
const music = () => {
  const L = new Float32Array(N);
  const R = new Float32Array(N);
  const out = [L, R];
  const beat = 60 / 76; // 3/4-Wiegenlied
  const t0 = 0.35;

  // Eigene Melodie (F-Dur), [Ton, Oktave, Schläge]
  const melody = [
    ['A', 5, 1], ['C', 6, 1], ['F', 6, 1],
    ['E', 6, 1.5], ['D', 6, 0.5], ['C', 6, 1],
    ['D', 6, 1], ['Bb', 5, 1], ['G', 5, 1],
    ['A', 5, 3],
    ['C', 6, 1], ['A', 5, 1], ['F', 5, 1],
    ['G', 5, 1.5], ['A', 5, 0.5], ['Bb', 5, 1],
    ['A', 5, 1], ['G', 5, 1], ['E', 5, 1],
    ['F', 5, 3],
  ];
  const box = [
    [1, 1, 1.6],
    [2, 0.22, 0.6],
    [4.16, 0.1, 0.22],
    [6.8, 0.05, 0.12],
  ];
  let t = t0;
  for (const [nm, oc, b] of melody) {
    if (t > LEN - 0.3) break;
    pluck(null, t, midi(n(nm, oc)), 0.32, box, 0.58, out);
    t += b * beat;
  }

  // Celesta: gebrochene Akkorde in Achteln
  const chords = [
    ['F', 'A', 'C'], ['C', 'E', 'G'], ['G', 'Bb', 'D'], ['F', 'A', 'C'],
    ['D', 'F', 'A'], ['C', 'E', 'G'], ['C', 'E', 'G'], ['F', 'A', 'C'],
  ];
  const cel = [
    [1, 1, 1.0],
    [2, 0.35, 0.45],
    [3, 0.12, 0.25],
    [4.1, 0.05, 0.15],
  ];
  chords.forEach((ch, bar) => {
    for (let k = 0; k < 6; k++) {
      const tt = t0 + (bar * 3 + k * 0.5) * beat;
      if (tt > LEN - 0.4) return;
      const pattern = [0, 1, 2, 1, 2, 1];
      pluck(null, tt, midi(n(ch[pattern[k]], 4)), 0.1, cel, 0.38, out);
    }
  });

  // Leise Streicher: liegende Akkorde
  chords.forEach((ch, bar) => {
    const a = t0 + bar * 3 * beat;
    const b = a + 3 * beat;
    if (a > LEN) return;
    pad(a, Math.min(b, LEN - 0.8), midi(n(ch[0], 3)), 0.022, out);
    pad(a, Math.min(b, LEN - 0.8), midi(n(ch[2], 3)), 0.016, out);
  });

  const l = reverb(L, 0.35);
  const r = reverb(R, 0.35);
  // Ausblenden
  for (let i = 0; i < N; i++) {
    const tt = i / SR;
    const fade = Math.min(1, tt / 0.2, (LEN - tt) / 1.2);
    l[i] *= fade;
    r[i] *= fade;
  }
  normalize(l, r, -3);
  return [l, r];
};

// --- Schallplatten-Knistern -------------------------------------------------
const crackle = () => {
  const L = new Float32Array(N);
  const R = new Float32Array(N);
  // Grundrauschen (tiefpassgefiltert)
  let lp = 0;
  for (let i = 0; i < N; i++) {
    lp += (random() * 2 - 1 - lp) * 0.08;
    L[i] = lp * 0.14;
    R[i] = lp * 0.14;
  }
  // Knackser: Poisson-verteilt, kurze abklingende Impulse
  const clicks = Math.floor(LEN * 45);
  for (let c = 0; c < clicks; c++) {
    const at = Math.floor(random() * N);
    const big = random() < 0.04;
    const amp = (big ? 0.3 : 0.08 + Math.pow(random(), 3) * 0.25) * (random() < 0.5 ? -1 : 1);
    const len = Math.floor(SR * (big ? 0.004 : 0.0008 + random() * 0.0015));
    const pan = random();
    for (let k = 0; k < len && at + k < N; k++) {
      const v = amp * Math.exp(-k / (len / 4)) * (random() * 2 - 1);
      L[at + k] += v * (1 - pan * 0.5);
      R[at + k] += v * (0.5 + pan * 0.5);
    }
  }
  // Langsame Umdrehungs-Modulation (33⅓ U/min)
  for (let i = 0; i < N; i++) {
    const m = 0.85 + 0.15 * Math.sin((2 * Math.PI * i) / SR / 1.8);
    L[i] *= m;
    R[i] *= m;
  }
  normalize(L, R, -6);
  return [L, R];
};

const pub = join(ROOT, 'public');
const [ml, mr] = music();
writeWav(join(pub, 'music', 'test.wav'), ml, mr);
toMp3(join(pub, 'music', 'test.wav'), join(pub, 'music', 'test.mp3'));
const [cl, cr] = crackle();
writeWav(join(pub, 'sfx', 'knistern.wav'), cl, cr);
toMp3(join(pub, 'sfx', 'knistern.wav'), join(pub, 'sfx', 'knistern.mp3'));
console.log('Platzhalter erzeugt: public/music/test.mp3, public/sfx/knistern.mp3');
