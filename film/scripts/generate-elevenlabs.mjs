#!/usr/bin/env node
// ElevenLabs-Pipeline für den Testclip:
//   1. zwei warme, ältere deutsche Erzählerstimmen aus der Voice Library wählen
//      (Großvater + Großmutter; überschreibbar via VOICE_ID_A / VOICE_ID_B)
//   2. Erzählung mit beiden Stimmen über /with-timestamps erzeugen
//   3. die wärmere Stimme wählen (niedrigerer spektraler Schwerpunkt), die andere als Alternative speichern
//   4. Wort-Zeitstempel -> public/voice/test-erzaehlung.timing.json (steuert die Animation)
//   5. Eleven Music (15 s, instrumental) -> public/music/test.mp3
//   6. Schallplatten-Knistern (Sound Effects) -> public/sfx/knistern.mp3
//
//   ELEVENLABS_API_KEY in film/.env, dann: npm run audio:elevenlabs
//
// Benötigt Node >= 20.12 (process.loadEnvFile) und ffmpeg (für die Wärme-Analyse).

import {execFileSync} from 'node:child_process';
import {existsSync, mkdirSync, readFileSync, writeFileSync} from 'node:fs';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const PUB = join(ROOT, 'public');
const API = 'https://api.elevenlabs.io';

if (existsSync(join(ROOT, '.env'))) process.loadEnvFile(join(ROOT, '.env'));
const KEY = process.env.ELEVENLABS_API_KEY;
if (!KEY) {
  console.error('ELEVENLABS_API_KEY fehlt (film/.env, siehe .env.example).');
  process.exit(1);
}

// Wortgetreu aus dem Original-Buch
const TEXT =
  'Es war einmal … ein junges Mädchen voller Träume, das gerade in eine neue, unbekannte Stadt gezogen war. Jede Gasse und jedes Gebäude schienen ihr Versprechen von Überraschungen und Abenteuern zu flüstern.';

const CLIP_SECONDS = 15;
const VOICE_OFFSET = 0.6; // Stimme setzt nach der Iris-Blende ein
const MAX_VOICE_SECONDS = 14.1; // + Offset => endet vor der Abblende
const MODEL = 'eleven_multilingual_v2';

const api = async (path, {method = 'GET', body, query, binary = false} = {}) => {
  const url = new URL(API + path);
  for (const [k, v] of Object.entries(query ?? {})) if (v !== undefined) url.searchParams.set(k, String(v));
  let res;
  for (let attempt = 0; ; attempt++) {
    res = await fetch(url, {
      method,
      headers: {'xi-api-key': KEY, ...(body ? {'Content-Type': 'application/json'} : {})},
      body: body ? JSON.stringify(body) : undefined,
    });
    if (res.status !== 429 || attempt >= 5) break; // system_busy / Rate-Limit: mit Backoff erneut
    await new Promise((r) => setTimeout(r, 2000 * 2 ** attempt));
  }
  if (!res.ok) throw new Error(`${method} ${path} -> ${res.status}: ${(await res.text()).slice(0, 400)}`);
  return binary ? Buffer.from(await res.arrayBuffer()) : res.json();
};

// --- 1. Stimmen wählen -------------------------------------------------------

const findSharedVoice = async (gender) => {
  const attempts = [
    {language: 'de', gender, age: 'old', use_cases: 'narrative_story'},
    {language: 'de', gender, age: 'old'},
    {language: 'de', gender, age: 'middle_aged', use_cases: 'narrative_story'},
  ];
  for (const q of attempts) {
    const {voices = []} = await api('/v1/shared-voices', {query: {page_size: 30, sort: 'cloned_by_count', ...q}});
    const warm = voices.filter((v) => /warm|calm|gentle|soft|story|märchen|erzähl|grand|ruhig|sanft/i.test(`${v.descriptive ?? ''} ${v.description ?? ''} ${v.name}`));
    const pick = warm[0] ?? voices[0];
    if (pick) return pick;
  }
  throw new Error(`Keine passende ${gender}-Stimme in der Voice Library gefunden`);
};

const ensureInAccount = async (shared) => {
  const {voices = []} = await api('/v2/voices', {query: {page_size: 100}});
  const existing = voices.find((v) => v.voice_id === shared.voice_id || v.sharing?.original_voice_id === shared.voice_id);
  if (existing) return existing.voice_id;
  try {
    const added = await api(`/v1/voices/add/${shared.public_owner_id}/${shared.voice_id}`, {
      method: 'POST',
      body: {new_name: `Märchen – ${shared.name}`},
    });
    return added.voice_id;
  } catch (e) {
    // Key ohne voices_write: Library-Stimme direkt über ihre voice_id nutzen
    if (!/missing_permissions|voices_write/.test(e.message)) throw e;
    return shared.voice_id;
  }
};

const chooseVoices = async () => {
  if (process.env.VOICE_ID_A && process.env.VOICE_ID_B) {
    return [
      {id: process.env.VOICE_ID_A, name: process.env.VOICE_ID_A, label: 'A'},
      {id: process.env.VOICE_ID_B, name: process.env.VOICE_ID_B, label: 'B'},
    ];
  }
  const out = [];
  for (const [gender, label] of [
    ['male', 'Großvater'],
    ['female', 'Großmutter'],
  ]) {
    const shared = await findSharedVoice(gender);
    const id = await ensureInAccount(shared);
    out.push({id, name: shared.name, label, description: shared.description ?? shared.descriptive ?? ''});
    console.log(`Stimme ${label}: ${shared.name} (${id})`);
  }
  return out;
};

// --- 2. Erzählung mit Zeitstempeln -----------------------------------------

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
  // reine Satzzeichen (z. B. "…") sind keine Wörter
  return words.filter((w) => /[\p{L}]/u.test(w.word));
};

const narrate = async (voice) => {
  let speed = 0.88; // ruhig, langsam
  for (let attempt = 0; attempt < 6; attempt++) {
    const res = await api(`/v1/text-to-speech/${voice.id}/with-timestamps`, {
      method: 'POST',
      query: {output_format: 'mp3_44100_128'},
      body: {
        text: TEXT,
        model_id: MODEL,
        language_code: 'de',
        voice_settings: {stability: 0.62, similarity_boost: 0.8, style: 0.25, use_speaker_boost: true, speed},
      },
    });
    const alignment = res.alignment ?? res.normalized_alignment;
    const words = toWords(alignment);
    const duration = words[words.length - 1].end;
    console.log(`  ${voice.label}: ${duration.toFixed(2)} s bei speed ${speed}`);
    if (duration <= MAX_VOICE_SECONDS) {
      return {audio: Buffer.from(res.audio_base64, 'base64'), words, duration, speed};
    }
    if (speed >= 1.2) continue; // API-Maximum: Take neu würfeln (Dauer streut)
    speed = Math.min(1.2, Math.max(speed + 0.02, Math.round(speed * (duration / MAX_VOICE_SECONDS) * 100 + 1) / 100));
  }
  throw new Error('Erzählung passt nicht in 15 s');
};

// --- 3. Wärme: spektraler Schwerpunkt (niedriger = wärmer) -----------------

const spectralCentroid = (mp3) => {
  const pcm = execFileSync('ffmpeg', ['-loglevel', 'error', '-i', 'pipe:0', '-ac', '1', '-ar', '16000', '-f', 'f32le', 'pipe:1'], {
    input: mp3,
    maxBuffer: 64 * 1024 * 1024,
  });
  const x = new Float32Array(pcm.buffer, pcm.byteOffset, pcm.length / 4);
  const size = 1024;
  let num = 0;
  let den = 0;
  for (let off = 0; off + size <= x.length; off += size) {
    let energy = 0;
    for (let i = 0; i < size; i++) energy += x[off + i] * x[off + i];
    if (energy < 1e-3) continue; // Pausen ignorieren
    for (let k = 1; k < size / 2; k++) {
      let re = 0;
      let im = 0;
      for (let i = 0; i < size; i++) {
        const w = 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / size);
        const a = (-2 * Math.PI * k * i) / size;
        re += x[off + i] * w * Math.cos(a);
        im += x[off + i] * w * Math.sin(a);
      }
      const mag = Math.hypot(re, im);
      num += mag * ((k * 16000) / size);
      den += mag;
    }
  }
  return num / (den || 1);
};

// --- 5./6. Musik + Knistern ----------------------------------------------

const music = () =>
  api('/v1/music', {
    method: 'POST',
    binary: true,
    query: {output_format: 'mp3_44100_128'},
    body: {
      prompt:
        'Gentle, dreamy instrumental lullaby for an old fairy tale: a delicate music box melody with celesta and soft, quiet strings. Nostalgic, warm, slow 3/4 waltz feel, like a storybook opening in a 1930s animated film. No vocals, no drums.',
      music_length_ms: CLIP_SECONDS * 1000,
      model_id: 'music_v1',
      force_instrumental: true,
    },
  });

const crackle = async () => {
  const body = {
    text: 'Continuous soft vinyl record crackle and surface noise, quiet gentle pops, old gramophone, no music',
    duration_seconds: CLIP_SECONDS,
    prompt_influence: 0.6,
  };
  try {
    return await api('/v1/sound-generation', {method: 'POST', binary: true, body: {...body, loop: true}});
  } catch {
    return api('/v1/sound-generation', {method: 'POST', binary: true, body});
  }
};

// --- Ablauf ------------------------------------------------------------------

const write = (rel, buf) => {
  const p = join(PUB, rel);
  mkdirSync(dirname(p), {recursive: true});
  writeFileSync(p, buf);
  console.log(`  -> public/${rel}`);
};

const main = async () => {
  console.log('1) Stimmen wählen');
  const voices = await chooseVoices();

  console.log('2) Erzählung mit Zeitstempeln');
  const takes = [];
  for (const v of voices) takes.push({voice: v, ...(await narrate(v))});

  console.log('3) Wärmere Stimme wählen');
  for (const t of takes) {
    t.centroid = spectralCentroid(t.audio);
    console.log(`  ${t.voice.label} (${t.voice.name}): Schwerpunkt ${t.centroid.toFixed(0)} Hz`);
  }
  takes.sort((a, b) => a.centroid - b.centroid);
  const [chosen, alt] = takes;
  write('voice/test-erzaehlung.mp3', chosen.audio);
  write('voice/test-erzaehlung-alt.mp3', alt.audio);
  writeFileSync(
    join(PUB, 'voice', 'test-erzaehlung-alt.words.json'),
    JSON.stringify({voice: alt.voice, words: alt.words}, null, 2),
  );

  console.log('4) Musik (Eleven Music)');
  let musicSource = 'elevenlabs';
  try {
    write('music/test.mp3', await music());
  } catch (e) {
    musicSource = 'placeholder';
    console.warn(`  Musik fehlgeschlagen, Platzhalter bleibt: ${e.message}`);
  }

  console.log('5) Schallplatten-Knistern');
  try {
    write('sfx/knistern.mp3', await crackle());
  } catch (e) {
    console.warn(`  Knistern fehlgeschlagen, Platzhalter bleibt: ${e.message}`);
  }

  const timingPath = join(PUB, 'voice', 'test-erzaehlung.timing.json');
  const timing = JSON.parse(readFileSync(timingPath, 'utf8'));
  const describe = (t) => ({
    id: t.voice.id,
    name: t.voice.name,
    role: t.voice.label,
    description: t.voice.description,
    centroidHz: Math.round(t.centroid),
    seconds: Number(t.duration.toFixed(2)),
    speed: t.speed,
  });
  writeFileSync(
    timingPath,
    JSON.stringify(
      {
        ...timing,
        source: 'elevenlabs',
        note: 'Erzeugt von scripts/generate-elevenlabs.mjs (with-timestamps).',
        offsetSeconds: VOICE_OFFSET,
        audio: {voice: 'voice/test-erzaehlung.mp3', music: 'music/test.mp3', sfx: 'sfx/knistern.mp3', musicSource},
        voiceChoice: {chosen: describe(chosen), alternative: {...describe(alt), file: 'voice/test-erzaehlung-alt.mp3'}},
        words: chosen.words,
      },
      null,
      2,
    ) + '\n',
  );
  console.log(`Fertig. Gewählt: ${chosen.voice.name} (${chosen.voice.label}), Alternative: ${alt.voice.name}.`);
  console.log('Weiter: npm run stills && npm run render');
};

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
