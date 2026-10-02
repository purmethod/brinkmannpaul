// zero — calm email. Serves the app, handles google sign-in, exposes a tiny json api,
// and cleans every connected inbox on a schedule. Node 22+, one dependency (@anthropic-ai/sdk).

import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { assertLiveConfig, loadConfig, mayUse } from './lib/config.js';
import { ensureLabels, authUrl, createGmail, exchangeCode, GmailError, revokeToken } from './lib/gmail.js';
import { createStore, DEFAULT_NOTES } from './lib/store.js';
import { cookie, createSigner, parseCookies } from './lib/session.js';
import { runTriage } from './lib/triage.js';
import { discardDraft, draftCards, rewriteDraft, saveDraft, sendDraft, threadView, unsubscribe } from './lib/inbox.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const APP_DIR = path.join(here, 'app');
const STATIC = {
  '/': ['index.html', 'text/html; charset=utf-8'],
  '/styles.css': ['styles.css', 'text/css; charset=utf-8'],
  '/app.js': ['app.js', 'text/javascript; charset=utf-8'],
  '/manifest.webmanifest': ['manifest.webmanifest', 'application/manifest+json'],
  '/icon.svg': ['icon.svg', 'image/svg+xml'],
};
const SESSION_DAYS = 30;
const DEMO_EMAIL = 'paul@example.com';

const SECURITY_HEADERS = {
  'content-security-policy': "default-src 'self'; img-src 'self' data:; style-src 'self'; script-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'",
  'x-content-type-options': 'nosniff',
  'referrer-policy': 'no-referrer',
  'permissions-policy': 'camera=(), microphone=(), geolocation=()',
};

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export function createApp(config, deps) {
  const { store, claude, gmailFor, fetchImpl = fetch, log = console.log } = deps;
  const sessions = createSigner(config.appSecret, 'session');
  const states = createSigner(config.appSecret, 'oauth-state');
  const secure = config.baseUrl.startsWith('https://');
  const runs = new Map();
  const labelCache = new Map();

  const labelsFor = async (email, gmail) => {
    if (!labelCache.has(email)) labelCache.set(email, await ensureLabels(gmail));
    return labelCache.get(email);
  };

  function startRun(email) {
    if (runs.has(email)) return runs.get(email);
    const run = (async () => {
      const doc = await store.read(email);
      if (!doc?.token) return null;
      try {
        const report = await runTriage({
          gmail: await gmailFor(email, doc),
          claude,
          store,
          email,
          options: {
            dryRun: config.triageDryRun,
            maxThreads: config.triageMaxThreads,
            archiveOlderThanDays: config.archiveOlderThanDays,
            log,
          },
        });
        if (doc.lastError) await store.update(email, d => { delete d.lastError; });
        log(`[zero] ${email}: ${report.drafted.length} drafts, ${report.fyi.length} fyi, ${report.noise.length} noise, ${report.archived} archived, ${report.errors.length} errors${report.dryRun ? ' (dry run)' : ''}`);
        return report;
      } catch (error) {
        log(`[zero] ${email}: run failed: ${error.message}`);
        await store.update(email, d => {
          d.lastError = { at: new Date().toISOString(), message: error.message, reauth: error.code === 'reauth' };
        });
        return null;
      } finally {
        runs.delete(email);
      }
    })();
    runs.set(email, run);
    return run;
  }

  async function tick() {
    if (config.triageEveryMinutes <= 0) return;
    for (const email of await store.emails()) {
      const doc = await store.read(email);
      if (!doc?.token || doc.lastError?.reauth) continue;
      const last = Date.parse(doc.report?.startedAt || 0) || 0;
      if (Date.now() - last >= config.triageEveryMinutes * 60 * 1000) startRun(email);
    }
  }

  async function readBody(req) {
    const chunks = [];
    let size = 0;
    for await (const chunk of req) {
      size += chunk.length;
      if (size > 1_000_000) throw new HttpError(413, 'too large');
      chunks.push(chunk);
    }
    if (!size) return {};
    try {
      return JSON.parse(Buffer.concat(chunks).toString('utf8'));
    } catch {
      throw new HttpError(400, 'invalid json');
    }
  }

  function send(res, status, data, headers = {}) {
    res.writeHead(status, { ...SECURITY_HEADERS, 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...headers });
    res.end(JSON.stringify(data));
  }

  function redirect(res, location, headers = {}) {
    res.writeHead(302, { ...SECURITY_HEADERS, location, 'cache-control': 'no-store', ...headers });
    res.end();
  }

  const sessionCookie = email => cookie('zero_session', sessions.sign({ email }, SESSION_DAYS * 86400), { maxAge: SESSION_DAYS * 86400, secure });
  const clearSession = cookie('zero_session', '', { maxAge: 0, secure });

  async function serveStatic(res, pathname) {
    const [file, type] = STATIC[pathname];
    const body = await fs.readFile(path.join(APP_DIR, file));
    res.writeHead(200, { ...SECURITY_HEADERS, 'content-type': type, 'cache-control': pathname === '/' ? 'no-cache' : 'public, max-age=300' });
    res.end(body);
  }

  async function auth(req, res, url) {
    if (url.pathname === '/auth/login') {
      if (config.demo) return redirect(res, '/', { 'set-cookie': sessionCookie(DEMO_EMAIL) });
      const nonce = crypto.randomBytes(16).toString('base64url');
      const state = states.sign({ nonce }, 600);
      return redirect(res, authUrl(config, nonce), { 'set-cookie': cookie('zero_state', state, { maxAge: 600, secure }) });
    }

    if (url.pathname === '/auth/callback') {
      const expected = states.verify(parseCookies(req.headers.cookie).zero_state);
      const clearState = cookie('zero_state', '', { maxAge: 0, secure });
      if (url.searchParams.get('error')) return redirect(res, '/?error=declined', { 'set-cookie': clearState });
      if (!expected || expected.nonce !== url.searchParams.get('state')) return redirect(res, '/?error=state', { 'set-cookie': clearState });
      let tokens;
      let email;
      try {
        tokens = await exchangeCode(config, url.searchParams.get('code') || '', fetchImpl);
        const gmail = createGmail({ config, refreshToken: tokens.refresh_token, accessToken: tokens.access_token, fetchImpl });
        email = (await gmail.profile()).emailAddress.toLowerCase();
      } catch (error) {
        log(`[zero] sign-in failed: ${error.message}`);
        return redirect(res, '/?error=failed', { 'set-cookie': clearState });
      }
      if (!mayUse(config, email)) {
        await revokeToken(tokens.refresh_token || tokens.access_token, fetchImpl);
        return redirect(res, '/?error=not-allowed', { 'set-cookie': clearState });
      }
      if (!tokens.refresh_token) return redirect(res, '/?error=no-refresh-token', { 'set-cookie': clearState });
      await store.saveToken(email, tokens.refresh_token);
      await store.update(email, d => { delete d.lastError; });
      startRun(email);
      return redirect(res, '/', { 'set-cookie': [clearState, sessionCookie(email)] });
    }

    if (url.pathname === '/auth/logout' && req.method === 'POST') {
      return send(res, 200, { ok: true }, { 'set-cookie': clearSession });
    }
    throw new HttpError(404, 'not found');
  }

  async function api(req, res, url, email) {
    const doc = await store.read(email);
    if (!doc?.token) {
      if (req.method === 'GET' && url.pathname === '/api/me') return send(res, 200, { signedIn: false });
      throw new HttpError(401, 'signed out');
    }
    const gmail = await gmailFor(email, doc);
    const me = doc.email;
    const [, , resource, id, action, extra] = url.pathname.split('/');
    if (extra !== undefined || (id !== undefined && !/^[A-Za-z0-9_-]{1,128}$/.test(id))) throw new HttpError(404, 'not found');
    const route = `${req.method} /api/${resource}${id ? '/:id' : ''}${action ? `/${action}` : ''}`;

    switch (route) {
      case 'GET /api/me':
        return send(res, 200, {
          signedIn: true,
          email,
          name: doc.profile?.name || email.split('@')[0],
          demo: config.demo,
          dryRun: config.triageDryRun,
          everyMinutes: config.triageEveryMinutes,
          running: runs.has(email),
          lastError: doc.lastError || null,
        });
      case 'GET /api/drafts':
        return send(res, 200, { drafts: await draftCards({ gmail, doc, me }) });
      case 'PUT /api/drafts/:id': {
        const { body } = await readBody(req);
        if (typeof body !== 'string') throw new HttpError(400, 'body missing');
        return send(res, 200, await saveDraft({ gmail, draftId: id, body }));
      }
      case 'POST /api/drafts/:id/send': {
        const { body } = await readBody(req);
        return send(res, 200, await sendDraft({ gmail, labels: await labelsFor(email, gmail), draftId: id, body }));
      }
      case 'POST /api/drafts/:id/rewrite': {
        const { instruction, body } = await readBody(req);
        if (!String(instruction || '').trim()) throw new HttpError(400, 'instruction missing');
        return send(res, 200, await rewriteDraft({ gmail, claude, doc, me, draftId: id, body, instruction: String(instruction) }));
      }
      case 'DELETE /api/drafts/:id':
        return send(res, 200, await discardDraft({ gmail, labels: await labelsFor(email, gmail), draftId: id }));
      case 'GET /api/threads/:id':
        return send(res, 200, await threadView({ gmail, me, threadId: id }));
      case 'POST /api/threads/:id/unsubscribe': {
        const result = await unsubscribe({ gmail, me, threadId: id, fetchImpl });
        if (result.ok) await store.update(email, d => { d.unsubscribed[result.sender] = new Date().toISOString(); });
        return send(res, 200, result);
      }
      case 'GET /api/brief':
        return send(res, 200, { report: doc.report, running: runs.has(email), unsubscribed: Object.keys(doc.unsubscribed || {}) });
      case 'POST /api/run':
        startRun(email);
        return send(res, 202, { running: true });
      case 'GET /api/profile':
        return send(res, 200, { name: doc.profile?.name || '', notes: doc.profile?.notes ?? DEFAULT_NOTES });
      case 'PUT /api/profile': {
        const { name, notes } = await readBody(req);
        await store.update(email, d => {
          d.profile = { name: String(name ?? '').slice(0, 80), notes: String(notes ?? '').slice(0, 4000) };
        });
        return send(res, 200, { ok: true });
      }
      case 'POST /api/disconnect': {
        const token = store.refreshToken(doc);
        if (!config.demo && token) await revokeToken(token, fetchImpl);
        await store.remove(email);
        return send(res, 200, { ok: true }, { 'set-cookie': clearSession });
      }
      default:
        throw new HttpError(404, 'not found');
    }
  }

  async function handle(req, res) {
    const url = new URL(req.url, config.baseUrl);
    try {
      if (req.method === 'GET' && STATIC[url.pathname]) return await serveStatic(res, url.pathname);
      if (req.method === 'GET' && url.pathname === '/healthz') return send(res, 200, { ok: true });

      // state-changing calls must carry a custom header, which other sites cannot send
      const mutating = !['GET', 'HEAD'].includes(req.method);
      if (mutating && req.headers['x-zero'] !== '1') throw new HttpError(403, 'missing x-zero header');

      if (url.pathname.startsWith('/auth/')) return await auth(req, res, url);
      if (url.pathname.startsWith('/api/')) {
        const session = sessions.verify(parseCookies(req.headers.cookie).zero_session);
        if (!session && req.method === 'GET' && url.pathname === '/api/me') return send(res, 200, { signedIn: false });
        if (!session) throw new HttpError(401, 'signed out');
        return await api(req, res, url, session.email);
      }
      throw new HttpError(404, 'not found');
    } catch (error) {
      if (error.code === 'reauth') return send(res, 401, { error: 'reauth' });
      if (error instanceof HttpError) return send(res, error.status, { error: error.message });
      if (error instanceof GmailError && error.status === 404) return send(res, 404, { error: 'gone' });
      log(`[zero] ${req.method} ${url.pathname} failed: ${error.stack || error.message}`);
      return send(res, 500, { error: 'something went wrong' });
    }
  }

  return { handle, startRun, tick, runs };
}

export async function main() {
  const config = loadConfig();
  assertLiveConfig(config);
  const store = createStore({ dir: config.demo ? null : config.dataDir, secret: config.appSecret });
  let deps;

  if (config.demo) {
    const { createFakeClaude, createFakeGmail } = await import('./lib/demo.js');
    const gmail = createFakeGmail({ me: DEMO_EMAIL });
    deps = { store, claude: createFakeClaude({ delayMs: 120 }), gmailFor: async () => gmail };
    await store.saveToken(DEMO_EMAIL, 'demo');
    await store.update(DEMO_EMAIL, d => { d.profile.name = 'paul'; });
  } else {
    const { createClaude } = await import('./lib/claude.js');
    const clients = new Map();
    deps = {
      store,
      claude: createClaude({ model: config.claudeModel }),
      gmailFor: async (email, doc) => {
        const token = store.refreshToken(doc);
        const cached = clients.get(email);
        if (cached?.token === token) return cached.gmail;
        const gmail = createGmail({ config, refreshToken: token });
        clients.set(email, { token, gmail });
        return gmail;
      },
    };
  }

  const app = createApp(config, deps);
  if (config.demo) await app.startRun(DEMO_EMAIL);
  http.createServer(app.handle).listen(config.port, () => {
    console.log(`[zero] ${config.demo ? 'demo ' : ''}listening on ${config.baseUrl}`);
    if (config.triageDryRun) console.log('[zero] TRIAGE_DRY_RUN=1: gmail is only read, nothing is changed.');
  });
  setInterval(() => app.tick().catch(e => console.error('[zero] tick', e)), 60 * 1000).unref?.();
  app.tick().catch(() => {});
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch(error => {
    console.error(error.message);
    process.exit(1);
  });
}
