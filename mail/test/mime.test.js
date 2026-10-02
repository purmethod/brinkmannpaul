import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildRaw, decodeWords, formatAddress, fromB64url, htmlToText, messageText,
  parseAddressList, readMessage, replySubject, stripQuoted, toB64url,
} from '../lib/mime.js';

const part = (mimeType, text, charset = 'utf-8', extra = {}) => ({
  mimeType,
  filename: '',
  headers: [{ name: 'Content-Type', value: `${mimeType}; charset="${charset}"` }],
  body: { data: Buffer.from(text, charset === 'iso-8859-1' ? 'latin1' : 'utf8').toString('base64url') },
  ...extra,
});

test('address lists keep commas inside quotes and angle brackets', () => {
  assert.deepEqual(parseAddressList('"Weber, Lena" <Lena@Studio.example>, bob@example.com'), [
    { name: 'Weber, Lena', email: 'lena@studio.example' },
    { name: '', email: 'bob@example.com' },
  ]);
});

test('formatAddress quotes specials and encodes non-ascii names', () => {
  assert.equal(formatAddress({ name: 'Weber, Lena', email: 'l@x.example' }), '"Weber, Lena" <l@x.example>');
  assert.match(formatAddress({ name: 'Jürgen', email: 'j@x.example' }), /^=\?UTF-8\?B\?[^?]+\?= <j@x\.example>$/);
});

test('encoded words decode in both B and Q form', () => {
  assert.equal(decodeWords('=?UTF-8?B?R3LDvMOfZQ==?='), 'Grüße');
  assert.equal(decodeWords('=?iso-8859-1?Q?Gr=FC=DFe_aus_K=F6ln?='), 'Grüße aus Köln');
});

test('messageText prefers plain text, skips attachments, honours charset', () => {
  const payload = {
    mimeType: 'multipart/mixed',
    parts: [
      { mimeType: 'multipart/alternative', parts: [part('text/plain', 'Grüße aus Köln', 'iso-8859-1'), part('text/html', '<p>html</p>')] },
      part('text/plain', 'attachment text', 'utf-8', { filename: 'notes.txt' }),
    ],
  };
  assert.equal(messageText(payload), 'Grüße aus Köln');
});

test('html is turned into readable text', () => {
  const text = htmlToText('<style>p{}</style><h1>Hi</h1><p>one&nbsp;&amp; two</p><ul><li>a</li><li>b</li></ul>&#8364;');
  assert.equal(text, 'Hi\none & two\n\n- a\n- b\n€');
});

test('quoted history is cut in english, german and outlook style', () => {
  assert.equal(stripQuoted('yes!\n\nOn Mon, 1 Sep 2026 at 10:00, Lena <l@x>\nwrote:\n> old'), 'yes!');
  assert.equal(stripQuoted('ja\nAm 01.09.2026 um 10:00 schrieb Lena <l@x>:\n> alt'), 'ja');
  assert.equal(stripQuoted('ok\n\nFrom: Lena\nSent: Monday\nSubject: x\n\nold'), 'ok');
  assert.equal(stripQuoted('keep\n> quoted\nmore'), 'keep\nmore');
});

test('reply subjects are not doubled', () => {
  assert.equal(replySubject('site visit'), 'Re: site visit');
  assert.equal(replySubject('AW: Termin'), 'AW: Termin');
  assert.equal(replySubject('re:x'), 're:x');
});

test('buildRaw writes a valid utf-8 reply and blocks header injection', () => {
  const raw = buildRaw({
    to: [{ name: 'Lena', email: 'lena@x.example' }],
    cc: [{ name: '', email: 'cc@x.example' }],
    subject: 'Re: Grüße\r\nBcc: evil@x.example',
    inReplyTo: '<a@x>',
    references: '<z@x> <a@x>',
    body: 'hallo lena,\n\nbis donnerstag.\npaul',
  });
  const text = fromB64url(raw).toString('utf8');
  const [head, body] = text.split('\r\n\r\n');
  assert.ok(!/^Bcc:/m.test(head), 'no injected header');
  assert.match(head, /^To: Lena <lena@x\.example>$/m);
  assert.match(head, /^Cc: cc@x\.example$/m);
  assert.match(head, /^In-Reply-To: <a@x>$/m);
  assert.match(head, /^References: <z@x> <a@x>$/m);
  assert.equal(decodeWords(head.match(/^Subject: (.*(?:\r\n .*)*)/m)[1].replace(/\r\n /g, ' ')), 'Re: Grüße Bcc: evil@x.example');
  assert.equal(Buffer.from(body.replace(/\s+/g, ''), 'base64').toString('utf8'), 'hallo lena,\r\n\r\nbis donnerstag.\r\npaul');
});

test('readMessage collects what triage needs', () => {
  const m = readMessage({
    id: 'm1',
    threadId: 't1',
    labelIds: ['INBOX'],
    internalDate: '1700000000000',
    snippet: 'hi',
    payload: {
      ...part('text/plain', 'hello'),
      headers: [
        { name: 'From', value: 'Lena <lena@x.example>' },
        { name: 'Reply-To', value: 'team@x.example' },
        { name: 'Subject', value: 'visit' },
        { name: 'Message-ID', value: '<m1@x>' },
        { name: 'List-Unsubscribe', value: '<https://x.example/u>' },
      ],
    },
  });
  assert.equal(m.from.email, 'lena@x.example');
  assert.equal(m.replyTo[0].email, 'team@x.example');
  assert.equal(m.messageId, '<m1@x>');
  assert.equal(m.date, 1700000000000);
  assert.equal(m.text, 'hello');
  assert.equal(toB64url('a'), 'YQ');
});
