'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
let checked = 0;
function inspect(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (['public', 'assets', 'node_modules'].includes(entry.name)) continue;
    const filename = path.join(dir, entry.name);
    if (entry.isDirectory()) inspect(filename);
    else if (entry.isFile() && /\.(?:js|mjs|cjs)$/.test(entry.name)) {
      execFileSync(process.execPath, ['--check', filename], { stdio: 'inherit' });
      checked++;
    }
  }
}
for (const dir of ['dist', 'scripts', 'tests']) inspect(path.join(__dirname, '..', dir));
console.log(`Syntax passed: ${checked} JavaScript files.`);
