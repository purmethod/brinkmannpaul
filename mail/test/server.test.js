import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { loadConfig, mayUse } from '../lib/config.js';
import { createFakeClaude, createFakeGmail } from '../lib/demo.js';
import { createSigner } from '../lib/session.js';
import { createStore } from '../lib/store.js';
import { createApp } from '../server.js';

async function start() {
  const config = loadConfig({ DEMO: '1', TRIAGE_EVERY_MINUTES: '0' });
  const store = createStore({ secret: config.appSecret });
  const gmail = createFakeGmail({ me: 'paul@example.com' });
  await store.saveToken('paul@example.com', 'demo');
  const app = createApp(config, { store, claude: createFakeClaude(), gmailFor: async () => gmail, log: () => {} });
  await app.startRun('paul@example.com');
  const server = http.createServer(app.handle);
  await new Promise(r => server.listen(0, r));
  const base = `http://localhost:${server.address().port}`;
  let cookie = '';
  const call = async (pathname, { method = 'GET', body, headers = {} } = {}) => {
    const res = await fetch(base + pathname, {
      method,
      redirect: 'manual',
      headers: { cookie, ...(method !== 'GET' ? { 'x-zero': '1' } : {}), ...(body ? { 'content-type': 'application/json' } : {}), ...headers },
      body: body ? JSON.stringify(body) : undefined,
    });
    const set = res.headers.getSetCookie();
    if (set.length) cookie = set.map(c => c.split(';')[0]).join('; ');
    const type = res.headers.get('content-type') || '';
    return { res, data: type.includes('json') ? await res.json() : await res.text() };
  };
  return { server, call, gmail, setCookie: c => { cookie = c; } };
}

test('static app is served with a strict content security policy', async t => {
  const { server, call } = await start();
  t.after(() => server.close());
  const { res, data } = await call('/');
  assert.equal(res.status, 200);
  assert.match(data, /<title>zero<\/title>/);
  assert.match(res.headers.get('content-security-policy'), /script-src 'self'/);
  assert.equal(res.headers.get('x-content-type-options'), 'nosniff');
  assert.equal((await call('/../server.js')).res.status, 404);
});

test('signed out, then demo sign-in, then the full draft flow', async t => {
  const { server, call, gmail } = await start();
  t.after(() => server.close());

  assert.deepEqual((await call('/api/me')).data, { signedIn: false });
  assert.equal((await call('/api/drafts')).res.status, 401);

  const login = await call('/auth/login');
  assert.equal(login.res.status, 302);
  assert.match(login.res.headers.get('set-cookie'), /HttpOnly; SameSite=Lax/);

  const me = await call('/api/me');
  assert.equal(me.data.signedIn, true);
  assert.equal(me.data.email, 'paul@example.com');

  const { data } = await call('/api/drafts');
  assert.equal(data.drafts.length, 3);
  const [first, second] = data.drafts;

  // mutations need the custom header (csrf)
  assert.equal((await call(`/api/drafts/${first.draftId}/send`, { method: 'POST', headers: { 'x-zero': '0' } })).res.status, 403);

  assert.equal((await call(`/api/drafts/${first.draftId}`, { method: 'PUT', body: { body: 'new text' } })).res.status, 200);
  const rewrite = await call(`/api/drafts/${second.draftId}/rewrite`, { method: 'POST', body: { instruction: 'shorter' } });
  assert.equal(rewrite.res.status, 200);
  assert.equal((await call(`/api/drafts/${second.draftId}/rewrite`, { method: 'POST', body: {} })).res.status, 400);

  assert.equal((await call(`/api/drafts/${first.draftId}/send`, { method: 'POST', body: {} })).res.status, 200);
  assert.ok(gmail.calls.some(([name, id]) => name === 'sendDraft' && id === first.draftId));
  assert.equal((await call(`/api/drafts/${second.draftId}`, { method: 'DELETE' })).res.status, 200);
  assert.equal((await call(`/api/drafts/${second.draftId}`, { method: 'DELETE' })).res.status, 404);
  assert.equal((await call('/api/drafts')).data.drafts.length, 1);

  const brief = await call('/api/brief');
  assert.equal(brief.data.report.fyi.length, 2);
  const thread = await call(`/api/threads/${brief.data.report.fyi[0].threadId}`);
  assert.match(thread.data.messages[0].text, /\S/);

  await call('/api/profile', { method: 'PUT', body: { name: 'paul', notes: 'sign with p.' } });
  assert.deepEqual((await call('/api/profile')).data, { name: 'paul', notes: 'sign with p.' });

  assert.equal((await call('/api/nope/x/y/z')).res.status, 404);
  assert.equal((await call('/api/drafts/..%2f..')).res.status, 404);
});

test('a forged session cookie is rejected', async t => {
  const { server, call, setCookie } = await start();
  t.after(() => server.close());
  const forged = createSigner('another-secret-another-secret-123', 'session').sign({ email: 'paul@example.com' }, 3600);
  setCookie(`zero_session=${forged}`);
  assert.equal((await call('/api/drafts')).res.status, 401);
});

test('sessions expire and must match their signature', () => {
  const signer = createSigner('s'.repeat(32), 'session');
  const token = signer.sign({ email: 'a@b.example' }, 60);
  assert.equal(signer.verify(token).email, 'a@b.example');
  assert.equal(signer.verify(`${token}x`), null);
  assert.equal(signer.verify(signer.sign({ email: 'a@b.example' }, -1)), null);
  assert.equal(createSigner('s'.repeat(32), 'oauth-state').verify(token), null);
});

test('stored google tokens are encrypted at rest and private to the owner', async t => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'zero-store-'));
  t.after(() => fs.rm(dir, { recursive: true, force: true }));
  const store = createStore({ dir, secret: 'k'.repeat(32) });
  await store.saveToken('Paul@Example.com', '1//refresh-token');
  const [file] = await fs.readdir(path.join(dir, 'users'));
  const raw = await fs.readFile(path.join(dir, 'users', file), 'utf8');
  assert.ok(!raw.includes('refresh-token'));
  assert.equal((await fs.stat(path.join(dir, 'users', file))).mode & 0o777, 0o600);
  assert.equal(store.refreshToken(await store.read('paul@example.com')), '1//refresh-token');
  assert.deepEqual(await store.emails(), ['paul@example.com']);
  const wrongKey = createStore({ dir, secret: 'w'.repeat(32) });
  assert.throws(() => wrongKey.refreshToken(JSON.parse(raw)));
});

test('only listed accounts may sign in unless signup is open', () => {
  const closed = loadConfig({ ALLOWED_EMAILS: 'Paul@Example.com, x@y.example' });
  assert.equal(mayUse(closed, 'paul@example.com'), true);
  assert.equal(mayUse(closed, 'stranger@example.com'), false);
  assert.equal(mayUse(loadConfig({}), 'paul@example.com'), false);
  assert.equal(mayUse(loadConfig({ OPEN_SIGNUP: '1' }), 'anyone@example.com'), true);
});
