// The cleaner. Runs on a schedule: looks at every inbox thread once, decides, acts.
//
//   gmail already says promotions/social  → zero/noise, archived (no ai call)
//   you had the last word                 → zero/done, archived
//   claude: someone expects an answer     → draft written, zero/ready, stays in inbox
//   claude: worth knowing                 → zero/fyi, archived
//   claude: noise                         → zero/noise, archived, marked read
//
// Never sends, never deletes mail. Any error leaves the thread untouched in the inbox.

import { LABELS, ensureLabels } from './gmail.js';
import { buildRaw, clip, readMessage, replySubject, stripQuoted } from './mime.js';
import { threadBlock } from './claude.js';

const GMAIL_NOISE = ['CATEGORY_PROMOTIONS', 'CATEGORY_SOCIAL'];
const VOICE_TTL = 24 * 3600 * 1000;

export const who = a => (a?.name ? `${a.name} <${a.email}>` : a?.email || '');

export function readThread(thread, me) {
  const all = (thread.messages || []).map(readMessage);
  const drafts = all.filter(m => m.labelIds.includes('DRAFT'));
  const real = all.filter(m => !m.labelIds.includes('DRAFT'));
  for (const m of real) m.mine = m.labelIds.includes('SENT') || m.from.email === me;
  const last = real.at(-1) || null;
  const lastIncoming = [...real].reverse().find(m => !m.mine) || null;
  const subject = real[0]?.subject || drafts[0]?.subject || '';
  return { id: thread.id, all, drafts, real, last, lastIncoming, subject };
}

export function plan(t, { now = Date.now(), archiveOlderThanDays = 0 } = {}) {
  if (!t.last) return 'skip';
  if (t.last.mine) return 'archive-own';
  if (t.drafts.some(d => d.date >= t.last.date)) return 'keep-ready';
  if (archiveOlderThanDays > 0 && now - t.last.date > archiveOlderThanDays * 864e5) return 'archive-old';
  if (GMAIL_NOISE.some(l => t.last.labelIds.includes(l)) && !t.last.labelIds.includes('STARRED')) return 'gmail-noise';
  return 'ask-claude';
}

export function userContext(doc, voice = doc.voice?.text) {
  return {
    name: doc.profile?.name || doc.email.split('@')[0],
    email: doc.email,
    profile: doc.profile?.notes || '',
    voice: voice || '',
  };
}

export function promptThread(t) {
  const last = t.last || t.real.at(-1);
  return threadBlock({
    subject: t.subject,
    labels: (last?.labelIds || []).filter(l => l.startsWith('CATEGORY_') || l === 'IMPORTANT' || l === 'STARRED'),
    bulk: Boolean(last?.listUnsubscribe),
    messages: t.real.slice(-6).map(m => ({ ...m, text: clip(stripQuoted(m.text), 8000) })),
  });
}

export function replyRaw(t, me, { reply_all: replyAll, draft }) {
  const target = t.lastIncoming;
  const notMe = a => a.email !== me;
  let to = (target.replyTo.length ? target.replyTo : [target.from]).filter(notMe);
  if (!to.length) to = [target.from];
  const seen = new Set(to.map(a => a.email));
  const cc = replyAll
    ? [...target.to, ...target.cc].filter(a => notMe(a) && !seen.has(a.email) && seen.add(a.email))
    : [];
  return buildRaw({
    to,
    cc,
    subject: replySubject(target.subject || t.subject),
    inReplyTo: target.messageId,
    references: [target.references, target.messageId].filter(Boolean).join(' '),
    body: draft,
  });
}

async function loadVoice(gmail, doc) {
  if (doc.voice && Date.now() - Date.parse(doc.voice.at) < VOICE_TTL) return { text: doc.voice.text, fresh: false };
  const refs = await gmail.listMessages('in:sent -in:chats', 12);
  const examples = [];
  for (const { id } of refs) {
    const m = readMessage(await gmail.getMessage(id));
    const text = clip(stripQuoted(m.text), 1200);
    if (text.length < 20) continue;
    examples.push(`<example to="${who(m.to[0]).replace(/"/g, "'")}" subject="${m.subject.replace(/"/g, "'")}">\n${text}\n</example>`);
  }
  return { text: examples.join('\n'), fresh: true };
}

async function eachLimit(items, limit, fn) {
  let next = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) {
      const item = items[next];
      next += 1;
      await fn(item);
    }
  });
  await Promise.all(workers);
}

export async function runTriage({ gmail, claude, store, email, options = {} }) {
  const { dryRun = false, maxThreads = 50, archiveOlderThanDays = 0, log = () => {} } = options;
  const report = {
    startedAt: new Date().toISOString(),
    finishedAt: null,
    dryRun,
    scanned: 0,
    drafted: [],
    fyi: [],
    noise: [],
    archived: 0,
    waiting: 0,
    errors: [],
  };

  const labels = dryRun ? Object.fromEntries(Object.keys(LABELS).map(k => [k, `dry:${k}`])) : await ensureLabels(gmail);
  const me = (await gmail.profile()).emailAddress.toLowerCase();
  const doc = await store.read(email);
  const voice = await loadVoice(gmail, doc);
  const context = userContext(doc, voice.text);
  const draftIdOf = new Map((await gmail.listDrafts(200)).map(d => [d.message.id, d.id]));
  const refs = await gmail.listThreads('in:inbox', maxThreads);
  const memory = {};
  const modify = (id, add, remove) => (dryRun ? null : gmail.modifyThread(id, add, remove));

  await eachLimit(refs, 4, async ({ id }) => {
    try {
      const t = readThread(await gmail.getThread(id), me);
      report.scanned += 1;
      const step = plan(t, { archiveOlderThanDays });
      log(`[triage] ${id} ${step} "${t.subject}"`);

      if (step === 'skip') return;
      if (step === 'keep-ready') {
        report.waiting += 1;
        if (!t.all.some(m => m.labelIds.includes(labels.ready))) await modify(id, [labels.ready], []);
        return;
      }
      if (step === 'archive-own') {
        report.archived += 1;
        await modify(id, [labels.done], ['INBOX', labels.ready]);
        return;
      }
      if (step === 'archive-old') {
        report.archived += 1;
        await modify(id, [labels.old], ['INBOX']);
        return;
      }

      const incoming = t.lastIncoming;
      const item = {
        threadId: id,
        from: incoming.from,
        subject: t.subject,
        date: incoming.date,
        unsubscribe: Boolean(incoming.listUnsubscribe),
      };

      if (step === 'gmail-noise') {
        report.noise.push({ ...item, summary: incoming.snippet.slice(0, 120), reason: 'gmail: promotions or social' });
        await modify(id, [labels.noise], ['INBOX', 'UNREAD']);
        return;
      }

      const result = await claude.triage({ context, thread: promptThread(t) });
      Object.assign(item, { summary: result.summary, reason: result.reason });

      // a draft claude wrote earlier for this thread, now outdated by a newer message
      const previous = doc.threads?.[id]?.draftId;
      const stale = previous && t.drafts.some(d => draftIdOf.get(d.id) === previous) ? previous : null;

      if (result.category === 'reply' && result.draft.trim()) {
        const raw = replyRaw(t, me, result);
        let draftId = stale;
        if (!dryRun) {
          const saved = stale ? await gmail.updateDraft(stale, id, raw) : await gmail.createDraft(id, raw);
          draftId = saved.id;
          await modify(id, [labels.ready], []);
        }
        report.drafted.push(dryRun ? { ...item, draft: result.draft } : item);
        memory[id] = { category: 'reply', summary: result.summary, reason: result.reason, draftId, at: new Date().toISOString() };
        return;
      }

      if (stale && !dryRun) await gmail.deleteDraft(stale);
      if (result.category === 'noise') {
        report.noise.push(item);
        await modify(id, [labels.noise], ['INBOX', 'UNREAD', labels.ready]);
      } else {
        report.fyi.push(item);
        await modify(id, [labels.fyi], ['INBOX', labels.ready]);
      }
      memory[id] = { category: result.category, summary: result.summary, reason: result.reason, at: new Date().toISOString() };
    } catch (error) {
      if (error.code === 'reauth') throw error;
      log(`[triage] ${id} left in inbox: ${error.message}`);
      report.errors.push({ threadId: id, error: error.message.slice(0, 200) });
    }
  });

  report.finishedAt = new Date().toISOString();
  await store.update(email, d => {
    if (voice.fresh) d.voice = { at: new Date().toISOString(), text: voice.text };
    if (!dryRun) Object.assign(d.threads, memory);
    d.report = report;
  });
  return report;
}
