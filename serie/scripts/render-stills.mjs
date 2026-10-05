#!/usr/bin/env node
// Zwei Prüf-Standbilder pro Folge (bei ~40 % und ~75 % der Erzählung): out/stills/teil-XX-a.png / -b.png
//   npm run stills -- --only 1-3 [--voice old-wizard]
import {execFileSync} from 'node:child_process';
import {mkdirSync} from 'node:fs';

const args = process.argv.slice(2);
const opt = (name) => (args.includes(name) ? args[args.indexOf(name) + 1] : undefined);
const only = opt('--only');
const voice = opt('--voice');
const props = voice ? ['--props', JSON.stringify({voice, vintage: true})] : [];

const rows = execFileSync('npx', ['remotion', 'compositions', ...props], {encoding: 'utf8'})
  .split('\n')
  .map((l) => l.match(/^(teil-\d\d)\s+\d+\s+\d+x\d+\s+(\d+)/))
  .filter(Boolean)
  .map((m) => ({id: m[1], frames: Number(m[2])}));

mkdirSync('out/stills', {recursive: true});
for (const {id, frames} of rows) {
  const n = Number(id.slice(5));
  if (only) {
    const [a, b] = only.split('-').map(Number);
    if (n < a || n > (b ?? a)) continue;
  }
  const story = frames - 45; // ohne Outro
  for (const [tag, f] of [
    ['a', Math.round(story * 0.4)],
    ['b', Math.round(story * 0.8)],
  ]) {
    execFileSync('npx', ['remotion', 'still', id, `out/stills/${id}-${tag}.png`, `--frame=${f}`, ...props], {stdio: 'ignore'});
    console.log(`  ${id}-${tag} @ Frame ${f}`);
  }
}
