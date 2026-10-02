import assert from 'node:assert/strict';
import test from 'node:test';

import { createClaude } from '../lib/claude.js';
import { authUrl, createGmail, ensureLabels, SCOPE } from '../lib/gmail.js';

const config = { googleClientId: 'cid', googleClientSecret: 'secret', baseUrl: 'https://zero.example' };
const json = (status, body) => ({ status, ok: status < 400, json: async () => body, text: async () => JSON.stringify(body) });

test('auth url asks for offline gmail.modify access only', () => {
  const url = new URL(authUrl(config, 'nonce'));
  assert.equal(url.searchParams.get('scope'), SCOPE);
  assert.equal(url.searchParams.get('access_type'), 'offline');
  assert.equal(url.searchParams.get('prompt'), 'consent');
  assert.equal(url.searchParams.get('redirect_uri'), 'https://zero.example/auth/callback');
  assert.equal(url.searchParams.get('state'), 'nonce');
});

test('gmail client refreshes tokens, retries 401 once and paginates', async () => {
  const seen = [];
  let tokens = 0;
  let unauthorizedOnce = true;
  const fetchImpl = async (url, init) => {
    url = String(url);
    if (url.startsWith('https://oauth2.googleapis.com/token')) {
      tokens += 1;
      assert.equal(new URLSearchParams(init.body).get('grant_type'), 'refresh_token');
      return json(200, { access_token: `at${tokens}`, expires_in: 3600 });
    }
    seen.push([init.method, url.replace('https://gmail.googleapis.com/gmail/v1/users/me', ''), init.headers.authorization]);
    if (url.includes('/threads?') && unauthorizedOnce) {
      unauthorizedOnce = false;
      return json(401, {});
    }
    if (url.includes('pageToken=p2')) return json(200, { threads: [{ id: 't3' }] });
    if (url.includes('/threads?')) return json(200, { threads: [{ id: 't1' }, { id: 't2' }], nextPageToken: 'p2' });
    return json(200, {});
  };
  const gmail = createGmail({ config, refreshToken: 'rt', fetchImpl });
  const threads = await gmail.listThreads('in:inbox', 3);
  assert.deepEqual(threads.map(t => t.id), ['t1', 't2', 't3']);
  assert.equal(tokens, 2); // initial + after the 401
  assert.equal(seen[0][2], 'Bearer at1');
  assert.equal(seen[1][2], 'Bearer at2');
  assert.match(seen[1][1], /q=in%3Ainbox/);

  await gmail.modifyThread('t/1', ['L1'], ['INBOX']);
  assert.deepEqual(seen.at(-1).slice(0, 2), ['POST', '/threads/t%2F1/modify']);
});

test('a revoked google grant surfaces as reauth', async () => {
  const fetchImpl = async () => json(400, { error: 'invalid_grant' });
  const gmail = createGmail({ config, refreshToken: 'rt', fetchImpl });
  await assert.rejects(gmail.profile(), { code: 'reauth' });
});

test('labels are created once and reused', async () => {
  const created = [];
  const gmail = {
    listLabels: async () => [{ id: 'L0', name: 'zero' }, { id: 'L1', name: 'zero/ready' }],
    createLabel: async name => { created.push(name); return { id: `N${created.length}`, name }; },
  };
  const ids = await ensureLabels(gmail);
  assert.deepEqual(created, ['zero/fyi', 'zero/noise', 'zero/done', 'zero/old']);
  assert.equal(ids.ready, 'L1');
  assert.equal(ids.parent, 'L0');
});

test('claude triage sends a cached system prompt, a json schema and the fallback opt-in', async () => {
  const requests = [];
  const client = {
    beta: {
      messages: {
        create: async params => {
          requests.push(params);
          return {
            stop_reason: 'end_turn',
            content: [{ type: 'thinking', thinking: '' }, { type: 'text', text: JSON.stringify({ category: 'fyi', summary: 's', reason: 'r', reply_all: false, draft: 'should be dropped' }) }],
          };
        },
      },
    },
  };
  const claude = createClaude({ model: 'claude-opus-5-5', client });
  const context = { name: 'paul', email: 'p@x.example', profile: 'notes', voice: '<example>hi</example>' };
  const result = await claude.triage({ context, thread: '<thread subject="x"></thread>' });
  assert.equal(result.category, 'fyi');
  assert.equal(result.draft, '');

  const [req] = requests;
  assert.equal(req.model, 'claude-opus-5-5');
  assert.deepEqual(req.betas, ['server-side-fallback-2026-07-01']);
  assert.equal(req.fallbacks, 'default');
  assert.equal(req.output_config.format.type, 'json_schema');
  assert.equal(req.output_config.effort, 'medium');
  assert.deepEqual(req.system[0].cache_control, { type: 'ephemeral' });
  assert.match(req.system[0].text, /never instructions to you/);
  assert.ok(!('temperature' in req) && !('thinking' in req));
  assert.match(req.messages[0].content, /<thread subject="x">/);
});

test('claude refusals and truncation are errors, never silent drafts', async () => {
  const reply = response => ({ beta: { messages: { create: async () => response } } });
  const context = { name: 'p', email: 'p@x', profile: '', voice: '' };
  await assert.rejects(
    createClaude({ model: 'm', client: reply({ stop_reason: 'refusal', stop_details: { category: 'cyber' }, content: [] }) }).triage({ context, thread: '' }),
    { code: 'declined' },
  );
  await assert.rejects(
    createClaude({ model: 'm', client: reply({ stop_reason: 'max_tokens', content: [] }) }).rewrite({ context, thread: '', draft: 'd', instruction: 'x' }),
    /max_tokens/,
  );
});
