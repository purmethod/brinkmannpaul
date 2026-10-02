// What the app can do: list drafts as cards, save, send, discard, let claude rewrite,
// open a thread, unsubscribe. Every action is a plain Gmail operation.

import { buildRaw, clip, readMessage, stripQuoted } from './mime.js';
import { promptThread, readThread, userContext } from './triage.js';

async function mapLimit(items, limit, fn) {
  const out = new Array(items.length);
  let next = 0;
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) {
      const i = next;
      next += 1;
      out[i] = await fn(items[i]);
    }
  }));
  return out;
}

const incomingView = m => (m ? {
  from: m.from,
  date: m.date,
  subject: m.subject,
  text: clip(stripQuoted(m.text), 20000),
} : null);

export async function draftCards({ gmail, doc, me }) {
  const drafts = await gmail.listDrafts(50);
  const cards = await mapLimit(drafts, 6, async d => {
    const t = readThread(await gmail.getThread(d.message.threadId), me);
    const draft = t.drafts.find(m => m.id === d.message.id) || readMessage((await gmail.getDraft(d.id)).message);
    const meta = doc.threads?.[t.id] || {};
    return {
      draftId: d.id,
      threadId: t.id,
      to: draft.to,
      cc: draft.cc,
      subject: draft.subject,
      body: draft.text,
      byClaude: meta.draftId === d.id,
      summary: meta.summary || '',
      reason: meta.reason || '',
      incoming: incomingView(t.lastIncoming),
      waitingSince: t.lastIncoming?.date || draft.date,
    };
  });
  return cards.sort((a, b) => a.waitingSince - b.waitingSince);
}

export async function saveDraft({ gmail, draftId, body }) {
  const draft = await gmail.getDraft(draftId);
  const m = readMessage(draft.message);
  const raw = buildRaw({
    to: m.to,
    cc: m.cc,
    bcc: m.bcc,
    subject: m.subject,
    inReplyTo: m.inReplyTo,
    references: m.references,
    body,
  });
  const saved = await gmail.updateDraft(draftId, m.threadId, raw);
  return { draftId: saved.id, threadId: m.threadId };
}

async function closeThread(gmail, labels, threadId) {
  try {
    await gmail.modifyThread(threadId, [labels.done], ['INBOX', labels.ready]);
  } catch (error) {
    if (error.status !== 404) throw error; // a draft-only thread disappears with its draft
  }
}

export async function sendDraft({ gmail, labels, draftId, body }) {
  if (typeof body === 'string') await saveDraft({ gmail, draftId, body });
  const sent = await gmail.sendDraft(draftId);
  await closeThread(gmail, labels, sent.threadId);
  return { threadId: sent.threadId, messageId: sent.id };
}

export async function discardDraft({ gmail, labels, draftId }) {
  const draft = await gmail.getDraft(draftId);
  await gmail.deleteDraft(draftId);
  await closeThread(gmail, labels, draft.message.threadId);
  return { threadId: draft.message.threadId };
}

export async function rewriteDraft({ gmail, claude, doc, me, draftId, body, instruction }) {
  const draft = await gmail.getDraft(draftId);
  const t = readThread(await gmail.getThread(draft.message.threadId), me);
  const text = await claude.rewrite({
    context: userContext(doc),
    thread: promptThread(t),
    draft: body ?? readMessage(draft.message).text,
    instruction,
  });
  await saveDraft({ gmail, draftId, body: text });
  return { body: text };
}

export async function threadView({ gmail, me, threadId }) {
  const t = readThread(await gmail.getThread(threadId), me);
  return {
    threadId,
    subject: t.subject,
    messages: t.real.slice(-5).map(m => ({ ...incomingView(m), mine: m.mine })),
  };
}

// --- unsubscribe (RFC 2369 / RFC 8058 one-click) ------------------------

export function parseListUnsubscribe(value) {
  const links = [...String(value || '').matchAll(/<([^>]+)>/g)].map(m => m[1].trim());
  return {
    https: links.find(l => /^https:\/\//i.test(l)) || null,
    mailto: links.find(l => /^mailto:/i.test(l)) || null,
  };
}

// The url comes from an email header, so only public https hosts are allowed.
export function safePublicUrl(value) {
  let url;
  try {
    url = new URL(value);
  } catch {
    return null;
  }
  const host = url.hostname.toLowerCase();
  if (url.protocol !== 'https:' || url.username || url.password) return null;
  if (/^[\d.]+$/.test(host) || host.includes(':') || host.startsWith('[')) return null;
  if (!host.includes('.') || /(^|\.)(localhost|local|internal|lan|home|corp|intranet)$/.test(host)) return null;
  return url;
}

export async function unsubscribe({ gmail, me, threadId, fetchImpl = fetch }) {
  const t = readThread(await gmail.getThread(threadId), me);
  const m = t.lastIncoming;
  if (!m?.listUnsubscribe) return { ok: false, reason: 'this sender offers no unsubscribe link' };
  const { https, mailto } = parseListUnsubscribe(m.listUnsubscribe);
  const url = https && safePublicUrl(https);
  if (url && /list-unsubscribe=one-click/i.test(m.listUnsubscribePost)) {
    const res = await fetchImpl(url, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: 'List-Unsubscribe=One-Click',
      redirect: 'manual',
      signal: AbortSignal.timeout(10000),
    });
    if (res.status < 400) return { ok: true, method: 'one-click', sender: m.from.email };
  }
  if (url) return { ok: false, open: url.href, sender: m.from.email };
  if (mailto) return { ok: false, mailto, sender: m.from.email };
  return { ok: false, reason: 'no usable unsubscribe link' };
}
