'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
let checked = 0;
for (const dir of ['dist', 'api', 'lib', 'scripts', 'tests']) {
  for (const name of fs.readdirSync(path.join(__dirname, '..', dir))) {
    if (!/\.(?:js|mjs|cjs)$/.test(name)) continue;
    execFileSync(process.execPath, ['--check', path.join(__dirname, '..', dir, name)], { stdio: 'inherit' });
    checked++;
  }
}
console.log(`Syntax passed: ${checked} JavaScript files.`);
