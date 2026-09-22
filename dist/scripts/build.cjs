'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');
const output = path.join(root, 'public');
// Only public website assets enter the static output. APIs and catalog stay server-side.
const files = [
  'index.html', 'styles.css', 'app.js', 'shop.mjs', 'cart-state.mjs',
  'order.html', 'order.mjs',
  'assets/intro-handwriting-split.mp4',
  'assets/intro-handwriting-split-complete.png',
];
for (const file of [...files.filter((name) => /\.(js|mjs)$/.test(name)), 'api/catalog.js', 'api/checkout.js', 'api/order.js', 'lib/shop.js']) {
  execFileSync(process.execPath, ['--check', path.join(root, file)], { stdio: 'inherit' });
}
for (const file of files) {
  if (!fs.statSync(path.join(root, file)).isFile()) throw new Error(`Missing public file: ${file}`);
}
fs.rmSync(output, { recursive: true, force: true });
for (const file of files) {
  const target = path.join(output, file);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(path.join(root, file), target);
}
console.log(`Built ${files.length} public files. Server code and configuration excluded.`);
