#!/usr/bin/env node
// Rendert alle registrierten Folgen: out/teil-XX.mp4 + Thumbnail (Standbild bei 1 s) out/thumbs/teil-XX.jpg
//   npm run render:all                      alle Folgen, freigegebene Stimme
//   npm run render:all -- --only 1-3        Bereich
//   npm run render:all -- --voice spuds-oxley --suffix -spuds   Stimmen-Variante (Dateiname teil-XX-spuds.mp4)
import {execFileSync} from 'node:child_process';
import {mkdirSync} from 'node:fs';

const args = process.argv.slice(2);
const opt = (name) => (args.includes(name) ? args[args.indexOf(name) + 1] : undefined);
const only = opt('--only');
const voice = opt('--voice');
const suffix = opt('--suffix') ?? '';
const noThumbs = args.includes('--no-thumbs');

const list = execFileSync('npx', ['remotion', 'compositions', '--quiet'], {encoding: 'utf8'})
  .trim()
  .split(/\s+/)
  .filter((id) => /^teil-\d\d$/.test(id));
const inRange = (id) => {
  if (!only) return true;
  const n = Number(id.slice(5));
  const [a, b] = only.split('-').map(Number);
  return n >= a && n <= (b ?? a);
};

mkdirSync('out/thumbs', {recursive: true});
const props = voice ? ['--props', JSON.stringify({voice, vintage: true})] : [];
for (const id of list.filter(inRange)) {
  console.log(`▶ ${id}${suffix}`);
  execFileSync('npx', ['remotion', 'render', id, `out/${id}${suffix}.mp4`, '--codec=h264', ...props], {stdio: 'inherit'});
  if (!noThumbs) {
    execFileSync('npx', ['remotion', 'still', id, `out/thumbs/${id}${suffix}.jpg`, '--frame=30', '--image-format=jpeg', ...props], {stdio: 'inherit'});
  }
}
