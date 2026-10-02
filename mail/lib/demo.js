// An in-memory Gmail and a scripted Claude, so the app can be designed, reviewed and
// tested without a Google account or an API key. People and companies are fictional.

import { GmailError } from './gmail.js';
import { decodeWords, fromB64url, toB64url } from './mime.js';

const H = 3600 * 1000;

// --- fake gmail ----------------------------------------------------------

function parseRaw(raw) {
  const text = fromB64url(raw).toString('utf8');
  const split = text.indexOf('\r\n\r\n');
  const head = text.slice(0, split).replace(/\r\n[ \t]+/g, ' ');
  const bodyRaw = text.slice(split + 4);
  const headers = head.split('\r\n').map(line => {
    const i = line.indexOf(':');
    return { name: line.slice(0, i), value: line.slice(i + 1).trim() };
  });
  const base64 = headers.some(h => /content-transfer-encoding/i.test(h.name) && /base64/i.test(h.value));
  const body = base64 ? Buffer.from(bodyRaw.replace(/\s+/g, ''), 'base64').toString('utf8') : bodyRaw;
  return { headers, body: body.replace(/\r\n/g, '\n') };
}

function payloadFor({ headers, body, html = false, extraParts = [] }) {
  const part = { mimeType: html ? 'text/html' : 'text/plain', filename: '', headers: [{ name: 'Content-Type', value: `${html ? 'text/html' : 'text/plain'}; charset="UTF-8"` }], body: { data: toB64url(body) } };
  if (!extraParts.length) return { ...part, headers: [...headers, ...part.headers] };
  return { mimeType: 'multipart/mixed', filename: '', headers, body: {}, parts: [part, ...extraParts] };
}

export function createFakeGmail({ me = 'paul@example.com', name = 'paul', seed = demoSeed() } = {}) {
  const messages = new Map();
  const drafts = new Map();
  const labels = [
    'INBOX', 'SENT', 'DRAFT', 'UNREAD', 'STARRED', 'IMPORTANT', 'SPAM', 'TRASH',
    'CATEGORY_PERSONAL', 'CATEGORY_PROMOTIONS', 'CATEGORY_SOCIAL', 'CATEGORY_UPDATES', 'CATEGORY_FORUMS',
  ].map(id => ({ id, name: id, type: 'system' }));
  let counter = 0;
  const nextId = prefix => `${prefix}${(counter += 1).toString(16).padStart(6, '0')}`;
  const calls = [];

  function add({ threadId, from, to = [`${name} <${me}>`], cc = [], subject, body, html, labelIds, date, extra = {}, attachment }) {
    const id = nextId('m');
    const headers = [
      { name: 'From', value: from },
      { name: 'To', value: to.join(', ') },
      ...(cc.length ? [{ name: 'Cc', value: cc.join(', ') }] : []),
      { name: 'Subject', value: subject },
      { name: 'Message-ID', value: `<${id}@mail.example.com>` },
      ...Object.entries(extra).map(([k, v]) => ({ name: k, value: v })),
    ];
    const extraParts = attachment ? [{ mimeType: 'application/pdf', filename: attachment, headers: [], body: { attachmentId: 'att1', size: 1000 } }] : [];
    messages.set(id, {
      id,
      threadId: threadId || id,
      labelIds: new Set(labelIds),
      internalDate: String(date),
      snippet: body.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').slice(0, 140),
      payload: payloadFor({ headers, body, html, extraParts }),
    });
    return messages.get(id);
  }

  for (const thread of seed({ me, name })) {
    let threadId = null;
    for (const m of thread) {
      const msg = add({ ...m, threadId });
      threadId = msg.threadId;
    }
  }

  const out = m => ({ ...structuredClone({ ...m, labelIds: [] }), labelIds: [...m.labelIds] });
  const threadMessages = threadId => [...messages.values()].filter(m => m.threadId === threadId).sort((a, b) => a.internalDate - b.internalDate);
  const notFound = () => { throw new GmailError(404, 'not found'); };

  function matches(m, q) {
    if (/in:inbox/.test(q) && !m.labelIds.has('INBOX')) return false;
    if (/in:sent/.test(q) && !m.labelIds.has('SENT')) return false;
    return true;
  }

  function fromRaw(threadId, raw) {
    const parsed = parseRaw(raw);
    const id = nextId('m');
    const msg = {
      id,
      threadId: threadId || id,
      labelIds: new Set(['DRAFT']),
      internalDate: String(Date.now()),
      snippet: parsed.body.slice(0, 140),
      payload: payloadFor({ headers: [...parsed.headers.filter(h => !/^content-|^mime-/i.test(h.name)), { name: 'From', value: `${name} <${me}>` }], body: parsed.body }),
    };
    messages.set(id, msg);
    return msg;
  }

  const api = {
    calls,
    me,
    async profile() { return { emailAddress: me }; },
    async listThreads(q, max = 50) {
      const ids = new Map();
      for (const m of messages.values()) {
        if (matches(m, q)) ids.set(m.threadId, Math.max(ids.get(m.threadId) || 0, Number(m.internalDate)));
      }
      return [...ids.entries()].sort((a, b) => b[1] - a[1]).slice(0, max).map(([id]) => ({ id }));
    },
    async getThread(threadId) {
      const list = threadMessages(threadId);
      if (!list.length) notFound();
      return { id: threadId, messages: list.map(out) };
    },
    async modifyThread(threadId, addIds = [], removeIds = []) {
      const list = threadMessages(threadId);
      if (!list.length) notFound();
      calls.push(['modifyThread', threadId, addIds, removeIds]);
      for (const m of list) {
        addIds.forEach(l => m.labelIds.add(l));
        removeIds.forEach(l => m.labelIds.delete(l));
      }
      return { id: threadId };
    },
    async listMessages(q, max = 20) {
      return [...messages.values()].filter(m => matches(m, q)).sort((a, b) => b.internalDate - a.internalDate).slice(0, max).map(m => ({ id: m.id, threadId: m.threadId }));
    },
    async getMessage(id) { return messages.has(id) ? out(messages.get(id)) : notFound(); },
    async listDrafts() {
      return [...drafts.entries()].map(([id, messageId]) => ({ id, message: { id: messageId, threadId: messages.get(messageId).threadId } }));
    },
    async getDraft(id) {
      if (!drafts.has(id)) notFound();
      return { id, message: out(messages.get(drafts.get(id))) };
    },
    async createDraft(threadId, raw) {
      const msg = fromRaw(threadId, raw);
      const id = nextId('r');
      drafts.set(id, msg.id);
      calls.push(['createDraft', threadId, id]);
      return { id, message: { id: msg.id, threadId: msg.threadId } };
    },
    async updateDraft(id, threadId, raw) {
      if (!drafts.has(id)) notFound();
      messages.delete(drafts.get(id));
      const msg = fromRaw(threadId, raw);
      drafts.set(id, msg.id);
      calls.push(['updateDraft', id]);
      return { id, message: { id: msg.id, threadId: msg.threadId } };
    },
    async sendDraft(id) {
      if (!drafts.has(id)) notFound();
      const msg = messages.get(drafts.get(id));
      drafts.delete(id);
      msg.labelIds = new Set(['SENT']);
      msg.internalDate = String(Date.now());
      calls.push(['sendDraft', id]);
      return { id: msg.id, threadId: msg.threadId, labelIds: [...msg.labelIds] };
    },
    async deleteDraft(id) {
      if (!drafts.has(id)) notFound();
      messages.delete(drafts.get(id));
      drafts.delete(id);
      calls.push(['deleteDraft', id]);
    },
    async listLabels() { return structuredClone(labels); },
    async createLabel(labelName) {
      const label = { id: `Label_${labels.length}`, name: labelName, type: 'user' };
      labels.push(label);
      return label;
    },
    // test helper: what the inbox looks like now
    inbox() {
      return [...new Set([...messages.values()].filter(m => m.labelIds.has('INBOX')).map(m => m.threadId))];
    },
    labelIdsOf(threadId) {
      return [...new Set(threadMessages(threadId).flatMap(m => [...m.labelIds]))];
    },
    addIncoming(threadId, message) {
      return add({ ...message, threadId });
    },
  };
  return api;
}

// --- fake claude ---------------------------------------------------------

export function createFakeClaude({ drafts = DEMO_DRAFTS, delayMs = 0 } = {}) {
  const calls = [];
  const wait = () => (delayMs ? new Promise(r => setTimeout(r, delayMs)) : null);
  return {
    calls,
    async triage({ thread }) {
      calls.push(['triage', thread]);
      await wait();
      const subject = decodeWords(thread.match(/<thread subject="([^"]*)"/)?.[1] || '');
      const from = thread.match(/<message from="([^"]*)"[^>]*>(?![\s\S]*<message from)/)?.[1] || '';
      const known = Object.entries(drafts).find(([key]) => subject.toLowerCase().includes(key));
      if (/bulk_mail="yes"/.test(thread) || /grow your|followers/i.test(thread)) {
        return { category: 'noise', summary: subject.toLowerCase(), reason: 'bulk mail', reply_all: false, draft: '' };
      }
      if (/no-?reply|notifications|security/i.test(from)) {
        return { category: 'fyi', summary: subject.toLowerCase(), reason: 'automated, but relevant', reply_all: false, draft: '' };
      }
      const [, entry] = known || [null, { summary: subject.toLowerCase(), draft: 'hi,\n\nthanks for your message. [answer]\n\nbest,\npaul' }];
      return { category: 'reply', summary: entry.summary, reason: 'a person is waiting for an answer', reply_all: false, draft: entry.draft };
    },
    async rewrite({ draft, instruction }) {
      calls.push(['rewrite', instruction]);
      await wait();
      const lines = draft.split('\n');
      if (/short|kurz/i.test(instruction)) {
        const paragraphs = draft.split(/\n\s*\n/);
        return [paragraphs[0], paragraphs[1], paragraphs.at(-1)].filter(Boolean).join('\n\n');
      }
      if (/formal|förmlich|sie/i.test(instruction)) {
        return lines.map((l, i) => (i === 0 ? l.replace(/^(hi|hey|hallo)\b/i, 'dear') : l)).join('\n');
      }
      return draft;
    },
  };
}

const DEMO_DRAFTS = {
  'site visit': {
    summary: 'lena wants to move the site visit to thursday or friday morning.',
    draft: 'hi lena,\n\nthursday works for me. 9:30 on site?\n\nif friday suits the client better, friday 10:00 is fine too. just tell me which one.\n\nbest,\npaul',
  },
  'zusammenarbeit': {
    summary: 'markus fragt nach einem kurzen call zur zusammenarbeit im herbst.',
    draft: 'hallo markus,\n\ndanke dir, klingt spannend. lass uns gern kurz sprechen.\n\npasst dir [tag] um [uhrzeit]? 20 minuten reichen für den anfang.\n\nbeste grüße\npaul',
  },
  'rechnung 2026-114': {
    summary: 'steuerbüro braucht den beleg zur rechnung 2026-114 bis freitag.',
    draft: 'hallo frau keller,\n\ndanke für den hinweis. den beleg zur rechnung 2026-114 schicke ich ihnen bis [datum].\n\nviele grüße\npaul brinkmann',
  },
};

function demoSeed() {
  return ({ me, name }) => {
    const now = Date.now();
    const meAddr = `${name} <${me}>`;
    return [
      [{
        from: 'Lena Weber <lena@studio-north.example>',
        subject: 'site visit next week',
        body: 'hi paul,\n\nthe client asked if we can move the site visit from tuesday to thursday or friday morning. the contractor can do both.\n\nwhat works for you?\n\nlena',
        labelIds: ['INBOX', 'UNREAD', 'CATEGORY_PERSONAL', 'IMPORTANT'],
        date: now - 7 * H,
      }],
      [{
        from: 'Markus Hoffmann <markus@hoffmann-bau.example>',
        subject: 'Zusammenarbeit im Herbst',
        body: 'Hallo Paul,\n\nwir planen im Herbst ein neues Projekt und würden dich gern früh mit an Bord holen. Hättest du nächste Woche Zeit für einen kurzen Call?\n\nViele Grüße\nMarkus',
        labelIds: ['INBOX', 'UNREAD', 'CATEGORY_PERSONAL'],
        date: now - 5 * H,
      }],
      [{
        from: 'Sabine Keller <keller@steuerbuero.example>',
        subject: 'Rechnung 2026-114, fehlender Beleg',
        body: 'Sehr geehrter Herr Brinkmann,\n\nfür die Buchhaltung September fehlt uns noch der Beleg zur Rechnung 2026-114. Könnten Sie ihn uns bis Freitag zukommen lassen?\n\nMit freundlichen Grüßen\nSabine Keller',
        labelIds: ['INBOX', 'CATEGORY_PERSONAL'],
        date: now - 26 * H,
        attachment: 'mahnung.pdf',
      }],
      [{
        from: 'Design Weekly <hello@designweekly.example>',
        subject: '10 interiors that changed how we think about light',
        body: '<html><body><h1>this week</h1><p>ten interiors, one idea: light first.</p><a href="https://designweekly.example/u">unsubscribe</a></body></html>',
        html: true,
        labelIds: ['INBOX', 'UNREAD', 'CATEGORY_PROMOTIONS'],
        date: now - 3 * H,
        extra: { 'List-Unsubscribe': '<https://designweekly.example/unsubscribe?u=1>, <mailto:unsubscribe@designweekly.example>', 'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click' },
      }],
      [{
        from: 'Shop <no-reply@shop.example>',
        subject: 'your order has shipped',
        body: 'your order #48213 is on its way. expected delivery: monday.',
        labelIds: ['INBOX', 'UNREAD', 'CATEGORY_UPDATES'],
        date: now - 9 * H,
      }],
      [{
        from: 'Network <notifications@network.example>',
        subject: 'you appeared in 9 searches this week',
        body: 'see who is looking at your profile.',
        labelIds: ['INBOX', 'UNREAD', 'CATEGORY_SOCIAL'],
        date: now - 11 * H,
        extra: { 'List-Unsubscribe': '<https://network.example/unsub/123>' },
      }],
      [{
        from: 'Account Security <security@accounts.example>',
        subject: 'new sign-in on mac',
        body: 'we noticed a new sign-in to your account on a mac in berlin. if this was you, you can ignore this email.',
        labelIds: ['INBOX', 'UNREAD', 'CATEGORY_UPDATES'],
        date: now - 13 * H,
      }],
      [{
        from: 'Growth Agency <ceo@growth-agency.example>',
        subject: 'quick question',
        body: 'hi paul, we help architects grow your instagram to 100k followers in 90 days. open to a 15 min chat?',
        labelIds: ['INBOX', 'UNREAD', 'CATEGORY_PERSONAL'],
        date: now - 15 * H,
      }],
      [
        {
          from: 'Jonas Richter <jonas@example.org>',
          subject: 'plans',
          body: 'are the revised plans ready?',
          labelIds: ['INBOX', 'CATEGORY_PERSONAL'],
          date: now - 50 * H,
        },
        {
          from: meAddr,
          to: ['Jonas Richter <jonas@example.org>'],
          subject: 'Re: plans',
          body: 'yes, sending them tonight.\n\npaul',
          labelIds: ['SENT'],
          date: now - 49 * H,
        },
      ],
      [{
        from: meAddr,
        to: ['Mira <mira@example.org>'],
        subject: 'dinner',
        body: 'hey mira,\n\nsaturday at 8 works. i will bring the wine.\n\npaul',
        labelIds: ['SENT'],
        date: now - 72 * H,
      }],
    ];
  };
}
