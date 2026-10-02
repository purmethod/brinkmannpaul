// Browser smoke test on the demo: desktop + mobile, every view, send/undo/discard/rewrite.
// Playwright is not a dependency: run with a global install, e.g.
//   PLAYWRIGHT=$(npm root -g)/playwright/index.mjs npm run smoke
// Screenshots go to SMOKE_OUT (default: ./).

import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const { chromium } = await import(process.env.PLAYWRIGHT || 'playwright');
const out = process.env.SMOKE_OUT || process.cwd();
const port = 8700 + Math.floor(Math.random() * 90);
const base = `http://localhost:${port}`;

async function startServer() {
  const child = spawn(process.execPath, [path.join(here, '..', 'server.js')], {
    env: { ...process.env, DEMO: '1', PORT: String(port), BASE_URL: base },
    stdio: ['ignore', 'pipe', 'inherit'],
  });
  await new Promise((resolve, reject) => {
    child.stdout.on('data', d => String(d).includes('listening') && resolve());
    child.on('exit', code => reject(new Error(`server exited ${code}`)));
  });
  return child;
}

const browser = await chromium.launch();
const errors = [];

async function noOverflow(page, label) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  assert.ok(overflow <= 0, `${label}: horizontal overflow ${overflow}px`);
}

async function run(name, viewport, isMobile) {
  const context = await browser.newContext({ viewport, isMobile, hasTouch: isMobile, deviceScaleFactor: 2 });
  const page = await context.newPage();
  page.on('console', m => m.type() === 'error' && errors.push(`${name}: ${m.text()}`));
  page.on('pageerror', e => errors.push(`${name}: ${e.message}`));
  const shot = async step => (await page.waitForTimeout(650), page).screenshot({ path: path.join(out, `smoke-${name}-${step}.png`), fullPage: true });

  await page.goto(base);
  await page.getByText('sign in with google').waitFor();
  await noOverflow(page, `${name} signin`);
  await shot('1-signin');

  await page.getByText('sign in with google').click();
  await page.getByRole('heading', { name: '3 drafts.' }).waitFor();
  await page.locator('.original summary').click();
  await noOverflow(page, `${name} queue`);
  await shot('2-queue');

  // edit + ask claude to shorten
  await page.getByRole('button', { name: 'edit' }).click();
  await page.getByLabel('tell claude what to change').fill('shorter');
  await page.getByRole('button', { name: 'rewrite' }).click();
  await page.getByText('rewritten and saved in gmail.').waitFor();
  await shot('3-edit');

  // send with undo, then undo
  await page.getByRole('button', { name: 'send' }).click();
  await page.getByRole('heading', { name: '2 drafts.' }).waitFor();
  await page.locator('#toast-action').click();
  await page.getByRole('heading', { name: '3 drafts.' }).waitFor();

  // send for real (wait out the undo window)
  await page.getByRole('button', { name: 'send' }).click();
  await page.waitForTimeout(5600);
  await page.getByText(/^sent to /).waitFor();
  await page.getByRole('button', { name: 'discard' }).click();
  await page.waitForTimeout(5600);
  await page.getByRole('heading', { name: '1 draft.' }).waitFor();

  await page.goto(`${base}/#/brief`);
  await page.getByRole('heading', { name: 'brief.' }).waitFor();
  await page.locator('.row details summary').first().click();
  await page.locator('.row details .mailtext').first().filter({ hasNotText: 'loading.' }).waitFor();
  await noOverflow(page, `${name} brief`);
  await shot('4-brief');

  await page.goto(`${base}/#/settings`);
  await page.getByRole('heading', { name: 'settings.' }).waitFor();
  await noOverflow(page, `${name} settings`);
  await shot('5-settings');
  await context.close();
}

try {
  // every viewport gets a fresh demo inbox
  for (const [name, viewport, mobile] of [
    ['desktop', { width: 1366, height: 900 }, false],
    ['mobile', { width: 390, height: 844 }, true],
    ['small', { width: 320, height: 640 }, true],
  ]) {
    const server = await startServer();
    try {
      await run(name, viewport, mobile);
    } finally {
      server.kill();
      await new Promise(r => server.once('exit', r));
    }
  }
  assert.deepEqual(errors, [], 'console errors');
  console.log(`smoke ok, screenshots in ${out}`);
} finally {
  await browser.close();
}
