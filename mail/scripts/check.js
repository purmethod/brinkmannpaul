// node --check on every source file (AGENTS.md §5: verification before every push).
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const files = ['server.js', ...['lib', 'app', 'scripts', 'test'].flatMap(dir =>
  fs.readdirSync(path.join(root, dir)).filter(f => /\.(m?js)$/.test(f)).map(f => path.join(dir, f)))];
for (const file of files) execFileSync(process.execPath, ['--check', path.join(root, file)], { stdio: 'inherit' });
console.log(`syntax ok: ${files.length} files`);
