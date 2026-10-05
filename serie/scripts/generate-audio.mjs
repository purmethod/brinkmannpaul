#!/usr/bin/env node
// ElevenLabs-Ton für die Märchenserie. Liest die Erzählungen aus src/data/episodes.ts
// (eine Datenquelle) und schreibt Dateien + Wortzeiten nach public/ und src/data/audio.json.
//
//   node scripts/generate-audio.mjs voices --episodes 1-3      Kandidaten-Stimmen (config/voice.json) für Folgen 1–3
//   node scripts/generate-audio.mjs voices --episodes 4-11     nur die freigegebene Stimme ("selected")
//   node scripts/generate-audio.mjs select old-wizard          Stimme freigeben -> public/voice/teil-XX.mp3
//   node scripts/generate-audio.mjs music                      4 Varianten des Spieluhr-Liebesthemas + Outro-Jingle
//   node scripts/generate-audio.mjs sfx                        Schallplatten-Knistern (Loop)
//
// Key: ELEVENLABS_API_KEY (Umgebungsvariable oder serie/.env). Benötigt Node >= 22.18 (Type-Stripping) und ffmpeg.

import {copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync} from 'node:fs';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {EPISODES, OUTRO_LINE, episodeId} from '../src/data/episodes.ts';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const PUB = join(ROOT, 'public');
const MANIFEST = join(ROOT, 'src', 'data', 'audio.json');
const VOICE_CONFIG = join(ROOT, 'config', 'voice.json');
const API = 'https://api.elevenlabs.io';

if (existsSync(join(ROOT, '.env'))) process.loadEnvFile(join(ROOT, '.env'));
const KEY = process.env.ELEVENLABS_API_KEY;

// Freigabe (Variante A): ruhiges Tempo hat Vorrang vor 8–10 s — Folgen dürfen 11–14 s lang werden.
// Folge = 0,3 s Hook + Erzählung + 0,4 s Luft + 1,5 s Outro.
const MAX_NARRATION = Number(process.env.MAX_NARRATION ?? 11.8);
const START_SPEED = Number(process.env.START_SPEED ?? 0.95); // ruhig, langsam
const MAX_SPEED = Number(process.env.MAX_SPEED ?? 1.05);

const readJson = (p) => JSON.parse(readFileSync(p, 'utf8'));
const writeJson = (p, d) => writeFileSync(p, JSON.stringify(d, null, 2) + '\n');
const save = (rel, buf) => {
  const p = join(PUB, rel);
  mkdirSync(dirname(p), {recursive: true});
  writeFileSync(p, buf);
  console.log(`  -> public/${rel}`);
};

const api = async (path, {method = 'GET', body, query, binary = false} = {}) => {
  if (!KEY) throw new Error('ELEVENLABS_API_KEY fehlt');
  const url = new URL(API + path);
  for (const [k, v] of Object.entries(query ?? {})) if (v !== undefined) url.searchParams.set(k, String(v));
  let res;
  for (let attempt = 0; ; attempt++) {
    res = await fetch(url, {
      method,
      headers: {'xi-api-key': KEY, ...(body ? {'Content-Type': 'application/json'} : {})},
      body: body ? JSON.stringify(body) : undefined,
    });
    if (![429, 500, 502, 503].includes(res.status) || attempt >= 5) break;
    await new Promise((r) => setTimeout(r, 2000 * 2 ** attempt));
  }
  if (!res.ok) throw new Error(`${method} ${path} -> ${res.status}: ${(await res.text()).slice(0, 400)}`);
  return binary ? Buffer.from(await res.arrayBuffer()) : res.json();
};

// --- Stimmen ---------------------------------------------------------------

const findLibraryVoice = async (excludeId) => {
  const attempts = [
    {language: 'en', age: 'old', use_cases: 'narrative_story'},
    {language: 'en', age: 'old'},
    {language: 'en', age: 'middle_aged', use_cases: 'narrative_story'},
  ];
  for (const q of attempts) {
    const {voices = []} = await api('/v1/shared-voices', {query: {page_size: 40, sort: 'cloned_by_count', ...q}});
    const ok = voices.filter((v) => v.voice_id !== excludeId);
    const warm = ok.filter((v) =>
      /warm|grand|fairy|bedtime|story|gentle|soothing|cozy|kind/i.test(`${v.descriptive ?? ''} ${v.description ?? ''} ${v.name}`),
    );
    const pick = warm[0] ?? ok[0];
    if (pick) return {id: pick.voice_id, name: pick.name};
  }
  throw new Error('Keine passende Erzählstimme in der Voice Library gefunden');
};

const slugify = (s) =>
  s
    .toLowerCase()
    .split(/[–-]/)[0]
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

const resolveCandidates = async () => {
  const cfg = readJson(VOICE_CONFIG);
  let changed = false;
  for (const c of cfg.candidates) {
    if (c.id === 'auto') {
      const other = cfg.candidates.find((o) => o !== c && o.id !== 'auto');
      const v = await findLibraryVoice(other?.id);
      c.id = v.id;
      c.name = v.name;
      c.slug = slugify(v.name);
      changed = true;
      console.log(`  Zweite Stimme aus der Library: ${v.name} (${v.id})`);
    }
  }
  if (changed) writeJson(VOICE_CONFIG, cfg);
  return cfg;
};

const toWords = (alignment) => {
  const {characters, character_start_times_seconds: st, character_end_times_seconds: en} = alignment;
  const words = [];
  let cur = null;
  characters.forEach((ch, i) => {
    if (/\s/.test(ch)) {
      if (cur) words.push(cur);
      cur = null;
      return;
    }
    if (!cur) cur = {word: '', start: st[i], end: en[i]};
    cur.word += ch;
    cur.end = en[i];
  });
  if (cur) words.push(cur);
  return words.filter((w) => /\p{L}/u.test(w.word));
};

const tts = async (voiceId, model, text, maxSeconds) => {
  let speed = START_SPEED;
  for (;;) {
    const res = await api(`/v1/text-to-speech/${voiceId}/with-timestamps`, {
      method: 'POST',
      query: {output_format: 'mp3_44100_128'},
      body: {
        text,
        model_id: model,
        voice_settings: {stability: 0.6, similarity_boost: 0.8, style: 0.3, use_speaker_boost: true, speed},
      },
    });
    const words = toWords(res.alignment ?? res.normalized_alignment);
    const duration = words.length ? words[words.length - 1].end : 0;
    if (duration <= maxSeconds || speed >= MAX_SPEED) {
      return {audio: Buffer.from(res.audio_base64, 'base64'), words, duration: Number(duration.toFixed(3)), speed};
    }
    speed = Math.min(MAX_SPEED, Math.ceil(speed * (duration / maxSeconds) * 100) / 100);
  }
};

const parseRange = (s) => {
  if (!s) return EPISODES.map((e) => e.nr);
  const [a, b] = s.split('-').map(Number);
  return EPISODES.map((e) => e.nr).filter((n) => n >= a && n <= (b ?? a));
};

const voicesCmd = async (args) => {
  const nrs = parseRange(args[args.indexOf('--episodes') + 1]);
  const cfg = await resolveCandidates();
  const voices = cfg.selected ? cfg.candidates.filter((c) => c.slug === cfg.selected) : cfg.candidates;
  const manifest = readJson(MANIFEST);
  for (const v of voices) {
    console.log(`Stimme ${v.name} (${v.slug})`);
    const entry = (manifest.voices[v.slug] ??= {id: v.id, name: v.name, episodes: {}, outro: null});
    if (!entry.outro || args.includes('--force')) {
      const o = await tts(v.id, cfg.model, OUTRO_LINE, 1.6);
      const file = `voice/${v.slug}/outro.mp3`;
      save(file, o.audio);
      entry.outro = {file, duration: o.duration, speed: o.speed};
    }
    for (const nr of nrs) {
      const ep = EPISODES.find((e) => e.nr === nr);
      const r = await tts(v.id, cfg.model, ep.narration, MAX_NARRATION);
      const file = `voice/${v.slug}/${episodeId(nr)}.mp3`;
      save(file, r.audio);
      entry.episodes[nr] = {file, words: r.words, duration: r.duration, speed: r.speed};
      const flag = r.duration > MAX_NARRATION ? '  !! länger als Ziel' : '';
      console.log(`  ${episodeId(nr)}: ${r.duration.toFixed(2)} s @ ${r.speed}${flag}`);
      writeJson(MANIFEST, manifest);
    }
    if (cfg.selected === v.slug) copySelected(manifest, v.slug);
  }
  writeJson(MANIFEST, manifest);
};

const copySelected = (manifest, slug) => {
  const entry = manifest.voices[slug];
  for (const [nr, e] of Object.entries(entry.episodes)) {
    copyFileSync(join(PUB, e.file), join(PUB, 'voice', `${episodeId(Number(nr))}.mp3`));
  }
  if (entry.outro) copyFileSync(join(PUB, entry.outro.file), join(PUB, 'voice', 'outro.mp3'));
};

const selectCmd = (args) => {
  const slug = args[0];
  const cfg = readJson(VOICE_CONFIG);
  if (!cfg.candidates.some((c) => c.slug === slug)) throw new Error(`Unbekannte Stimme "${slug}"`);
  cfg.selected = slug;
  writeJson(VOICE_CONFIG, cfg);
  const manifest = readJson(MANIFEST);
  manifest.selected = slug;
  writeJson(MANIFEST, manifest);
  if (manifest.voices[slug]) copySelected(manifest, slug);
  console.log(`Freigegeben: ${slug}`);
};

// --- Musik + Geräusche -----------------------------------------------------

const THEME =
  'A tender recurring music-box love theme for an old fairy tale, the same simple lullaby melody in 3/4, music box lead with celesta and soft strings, nostalgic, like a storybook in a 1930s animated film. Instrumental, no vocals, no drums.';
const VARIANTS = {
  playful: 'Playful and light: bouncy pizzicato strings, twinkling music box, a smile in every note.',
  longing: 'Longing and wistful: slower, minor-tinged, gentle sustained strings under the music box.',
  dramatic: 'Dramatic: darker minor harmony, tremolo strings and soft timpani swells, the music box melody tense but still tender.',
  festive: 'Festive and joyful: bright major key, sleigh-bell sparkle, warm full strings, the music box melody triumphant.',
};

const musicCmd = async () => {
  const manifest = readJson(MANIFEST);
  for (const [mood, extra] of Object.entries(VARIANTS)) {
    console.log(`Musik ${mood}`);
    const buf = await api('/v1/music', {
      method: 'POST',
      binary: true,
      query: {output_format: 'mp3_44100_128'},
      body: {prompt: `${THEME} ${extra}`, music_length_ms: 10000, model_id: 'music_v1', force_instrumental: true},
    });
    const file = `music/theme-${mood}.mp3`;
    save(file, buf);
    manifest.music[mood] = file;
    writeJson(MANIFEST, manifest);
  }
  console.log('Outro-Jingle');
  const jingle = await api('/v1/sound-generation', {
    method: 'POST',
    binary: true,
    body: {
      text: 'A short delicate music box glissando, rising sparkling notes, soft and magical, ending on a sweet chime',
      duration_seconds: 1.5,
      prompt_influence: 0.7,
    },
  });
  save('sfx/outro-jingle.mp3', jingle);
  manifest.jingle = 'sfx/outro-jingle.mp3';
  writeJson(MANIFEST, manifest);
};

const sfxCmd = async () => {
  const manifest = readJson(MANIFEST);
  const body = {
    text: 'Continuous soft vinyl record crackle and surface noise, quiet gentle pops, old gramophone, no music',
    duration_seconds: 20,
    prompt_influence: 0.6,
  };
  let buf;
  try {
    buf = await api('/v1/sound-generation', {method: 'POST', binary: true, body: {...body, loop: true}});
  } catch {
    buf = await api('/v1/sound-generation', {method: 'POST', binary: true, body});
  }
  save('sfx/crackle.mp3', buf);
  manifest.crackle = 'sfx/crackle.mp3';
  writeJson(MANIFEST, manifest);
};

const [cmd, ...args] = process.argv.slice(2);
const cmds = {voices: voicesCmd, select: selectCmd, music: musicCmd, sfx: sfxCmd};
if (!cmds[cmd]) {
  console.error('Befehl: voices --episodes 1-3 | select <slug> | music | sfx');
  process.exit(1);
}
Promise.resolve(cmds[cmd](args)).catch((e) => {
  console.error(e);
  process.exit(1);
});
