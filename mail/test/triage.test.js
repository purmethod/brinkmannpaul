import assert from 'node:assert/strict';
import test from 'node:test';

import { createFakeClaude, createFakeGmail } from '../lib/demo.js';
import { ReauthError } from '../lib/gmail.js';
import { discardDraft, draftCards, rewriteDraft, safePublicUrl, sendDraft, unsubscribe } from '../lib/inbox.js';
import { fromB64url } from '../lib/mime.js';
import { createStore } from '../lib/store.js';
import { plan, readThread, replyRaw, runTriage } from '../lib/triage.js';

const ME = 'paul@example.com';

async function setup() {
  const gmail = createFakeGmail({ me: ME });
  const claude = createFakeClaude();
  const store = createStore({ secret: 'x'.repeat(32) });
  await store.saveToken(ME, 'token');
  const run = (options = {}) => runTriage({ gmail, claude, store, email: ME, options });
  return { gmail, claude, store, run };
}

const labelId = async (gmail, name) => (await gmail.listLabels()).find(l => l.name === name).id;
const subjectOf = async (gmail, threadId) => readThread(await gmail.getThread(threadId), ME).subject;

test('a run leaves only threads with a waiting draft in the inbox', async () => {
  const { gmail, run } = await setup();
  const report = await run();

  assert.equal(report.drafted.length, 3);
  assert.equal(report.fyi.length, 2);
  assert.equal(report.noise.length, 3);
  assert.equal(report.archived, 1);
  assert.deepEqual(report.errors, []);

  const inbox = await Promise.all(gmail.inbox().map(id => subjectOf(gmail, id)));
  assert.deepEqual(inbox.sort(), ['Rechnung 2026-114, fehlender Beleg', 'Zusammenarbeit im Herbst', 'site visit next week']);
  assert.equal((await gmail.listDrafts()).length, 3);

  const ready = await labelId(gmail, 'zero/ready');
  for (const id of gmail.inbox()) assert.ok(gmail.labelIdsOf(id).includes(ready));

  const noise = await labelId(gmail, 'zero/noise');
  const newsletter = report.noise.find(n => n.subject.startsWith('10 interiors'));
  assert.ok(gmail.labelIdsOf(newsletter.threadId).includes(noise));
  assert.ok(!gmail.labelIdsOf(newsletter.threadId).includes('UNREAD'));

  // nothing is ever sent or deleted by the cleaner
  assert.ok(!gmail.calls.some(([name]) => name === 'sendDraft' || name === 'deleteDraft'));
});

test('gmail promotions and social never reach claude', async () => {
  const { claude, run } = await setup();
  await run();
  const asked = claude.calls.map(([, thread]) => thread.match(/subject="([^"]*)"/)[1]);
  assert.ok(!asked.includes('10 interiors that changed how we think about light'));
  assert.ok(!asked.includes('you appeared in 9 searches this week'));
  assert.equal(asked.length, 6);
});

test('dry run reads and reports but changes nothing', async () => {
  const { gmail, run, store } = await setup();
  const before = gmail.inbox().length;
  const report = await run({ dryRun: true });
  assert.equal(report.dryRun, true);
  assert.equal(report.drafted.length, 3);
  assert.match(report.drafted[0].draft, /\S/);
  assert.equal(gmail.inbox().length, before);
  assert.deepEqual(gmail.calls, []);
  assert.deepEqual((await store.read(ME)).threads, {});
});

test('a second run does not draft twice', async () => {
  const { claude, run } = await setup();
  await run();
  const calls = claude.calls.length;
  const second = await run();
  assert.equal(second.drafted.length, 0);
  assert.equal(second.waiting, 3);
  assert.equal(claude.calls.length, calls);
});

test('a new message on a drafted thread updates the old draft instead of adding one', async () => {
  const { gmail, claude, run } = await setup();
  const first = await run();
  const lena = first.drafted.find(d => d.subject === 'site visit next week').threadId;
  gmail.addIncoming(lena, {
    from: 'Lena Weber <lena@studio-north.example>',
    subject: 'Re: site visit next week',
    body: 'also: can you bring the facade samples?',
    labelIds: ['INBOX', 'UNREAD'],
    date: Date.now() + 1000,
  });
  const before = claude.calls.length;
  const second = await run();
  assert.equal(second.drafted.length, 1);
  assert.equal(claude.calls.length, before + 1);
  assert.equal((await gmail.listDrafts()).length, 3);
  assert.ok(gmail.calls.some(([name]) => name === 'updateDraft'));
});

test('if claude fails, the thread stays in the inbox untouched', async () => {
  const { gmail, claude, run } = await setup();
  claude.triage = async () => { throw new Error('overloaded'); };
  const report = await run();
  assert.equal(report.errors.length, 6);
  assert.equal(gmail.inbox().length, 6); // two gmail-noise and one own thread were still archived
});

test('an expired google grant stops the run', async () => {
  const { gmail, run } = await setup();
  gmail.getThread = async () => { throw new ReauthError(); };
  await assert.rejects(run(), { code: 'reauth' });
});

test('plan: own last word, fresh draft, age cut-off', () => {
  const msg = (extra) => ({ labelIds: ['INBOX'], date: 1000, mine: false, ...extra });
  assert.equal(plan({ last: msg({ mine: true }), drafts: [] }), 'archive-own');
  assert.equal(plan({ last: msg(), drafts: [{ date: 2000 }] }), 'keep-ready');
  assert.equal(plan({ last: msg({ date: Date.now() - 40 * 864e5 }), drafts: [] }, { archiveOlderThanDays: 30 }), 'archive-old');
  assert.equal(plan({ last: msg({ labelIds: ['INBOX', 'CATEGORY_PROMOTIONS', 'STARRED'] }), drafts: [] }), 'ask-claude');
  assert.equal(plan({ last: null, drafts: [] }), 'skip');
});

test('reply-all addresses everyone except me, reply-to wins', () => {
  const lastIncoming = {
    from: { name: 'Lena', email: 'lena@x.example' },
    replyTo: [{ name: 'Team', email: 'team@x.example' }],
    to: [{ name: 'Paul', email: ME }, { name: 'Ana', email: 'ana@x.example' }],
    cc: [{ name: '', email: 'team@x.example' }, { name: '', email: 'bo@x.example' }],
    subject: 'visit',
    messageId: '<1@x>',
    references: '',
  };
  const head = fromB64url(replyRaw({ lastIncoming, subject: 'visit' }, ME, { reply_all: true, draft: 'ok' })).toString().split('\r\n\r\n')[0];
  assert.match(head, /^To: Team <team@x\.example>$/m);
  assert.match(head, /^Cc: Ana <ana@x\.example>, bo@x\.example$/m);
  assert.match(head, /^Subject: Re: visit$/m);
});

test('app actions: cards, rewrite, send with edits, discard', async () => {
  const { gmail, claude, store, run } = await setup();
  await run();
  const labels = Object.fromEntries(await Promise.all(['ready', 'done'].map(async k => [k, await labelId(gmail, `zero/${k}`)])));
  const doc = await store.read(ME);

  const cards = await draftCards({ gmail, doc, me: ME });
  assert.equal(cards.length, 3);
  assert.ok(cards.every(c => c.byClaude && c.summary && c.incoming));
  assert.deepEqual(cards.map(c => c.waitingSince), [...cards.map(c => c.waitingSince)].sort((a, b) => a - b));

  const [first, second, third] = cards;
  const rewritten = await rewriteDraft({ gmail, claude, doc, me: ME, draftId: first.draftId, instruction: 'shorter' });
  assert.ok(rewritten.body.length <= first.body.length);
  assert.equal((await draftCards({ gmail, doc, me: ME }))[0].body, rewritten.body);

  await sendDraft({ gmail, labels, draftId: second.draftId, body: 'edited by paul' });
  assert.ok(!gmail.inbox().includes(second.threadId));
  assert.ok(gmail.labelIdsOf(second.threadId).includes(labels.done));
  const sent = (await gmail.getThread(second.threadId)).messages.at(-1);
  assert.ok(sent.labelIds.includes('SENT'));
  assert.equal(fromB64url(sent.payload.body.data).toString(), 'edited by paul');

  await discardDraft({ gmail, labels, draftId: third.draftId });
  assert.ok(!gmail.inbox().includes(third.threadId));
  assert.equal((await gmail.listDrafts()).length, 1);
});

test('unsubscribe uses rfc 8058 one-click only on public https hosts', async () => {
  const { gmail, run } = await setup();
  const report = await run();
  const posts = [];
  const fetchImpl = async (url, init) => { posts.push([String(url), init.body]); return { status: 200 }; };
  const newsletter = report.noise.find(n => n.subject.startsWith('10 interiors'));
  const result = await unsubscribe({ gmail, me: ME, threadId: newsletter.threadId, fetchImpl });
  assert.equal(result.ok, true);
  assert.deepEqual(posts, [['https://designweekly.example/unsubscribe?u=1', 'List-Unsubscribe=One-Click']]);

  const social = report.noise.find(n => n.subject.startsWith('you appeared'));
  const noPost = await unsubscribe({ gmail, me: ME, threadId: social.threadId, fetchImpl });
  assert.equal(noPost.ok, false);
  assert.equal(noPost.open, 'https://network.example/unsub/123');

  for (const bad of ['http://x.example/u', 'https://127.0.0.1/u', 'https://localhost/u', 'https://[::1]/u', 'https://nas.local/u', 'https://user:pw@x.example/u', 'https://intranet/u']) {
    assert.equal(safePublicUrl(bad), null, bad);
  }
  assert.ok(safePublicUrl('https://list.example.com/u?id=1'));
});
