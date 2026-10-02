// Reading Gmail API message payloads and writing RFC 5322 replies.
// No dependencies: Gmail hands us a parsed MIME tree, we only decode bodies.

export const fromB64url = data => Buffer.from(String(data).replace(/-/g, '+').replace(/_/g, '/'), 'base64');
export const toB64url = data => Buffer.from(data).toString('base64url');

// --- headers -------------------------------------------------------------

export function header(source, name) {
  const headers = source?.payload?.headers || source?.headers || [];
  const wanted = name.toLowerCase();
  const hit = headers.find(h => h.name.toLowerCase() === wanted);
  return hit ? decodeWords(hit.value) : '';
}

// RFC 2047 encoded words (=?utf-8?B?...?=). Gmail usually decodes these already.
export function decodeWords(value) {
  return String(value ?? '')
    .replace(/\?=\s+=\?/g, '?==?')
    .replace(/=\?([^?]+)\?([bqBQ])\?([^?]*)\?=/g, (_, charset, enc, text) => {
      const bytes = enc.toUpperCase() === 'B'
        ? Buffer.from(text, 'base64')
        : Buffer.from(text.replace(/_/g, ' ').replace(/=([0-9a-fA-F]{2})/g, (_, h) => String.fromCharCode(parseInt(h, 16))), 'latin1');
      return decodeBytes(bytes, charset);
    });
}

const oneLine = value => String(value ?? '').replace(/[\r\n]+/g, ' ').trim();

function encodeWord(value) {
  const text = oneLine(value);
  if (/^[\x20-\x7e]*$/.test(text)) return text;
  // Keep every encoded word under 75 chars without splitting a multibyte character.
  const words = [];
  let chunk = '';
  for (const ch of text) {
    if (Buffer.byteLength(chunk + ch) > 45) {
      words.push(chunk);
      chunk = '';
    }
    chunk += ch;
  }
  if (chunk) words.push(chunk);
  return words.map(w => `=?UTF-8?B?${Buffer.from(w).toString('base64')}?=`).join('\r\n ');
}

// --- addresses -----------------------------------------------------------

export function parseAddressList(value) {
  const parts = [];
  let current = '';
  let quoted = false;
  let angle = false;
  for (const ch of String(value ?? '')) {
    if (ch === '"') quoted = !quoted;
    if (!quoted && ch === '<') angle = true;
    if (!quoted && ch === '>') angle = false;
    if (ch === ',' && !quoted && !angle) {
      parts.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  parts.push(current);
  return parts.map(parseAddress).filter(a => a.email);
}

export function parseAddress(raw) {
  const text = oneLine(raw);
  const match = text.match(/^(.*)<([^>]+)>\s*$/);
  if (match) {
    const name = match[1].trim().replace(/^"(.*)"$/, '$1').replace(/\\"/g, '"').trim();
    return { name, email: match[2].trim().toLowerCase() };
  }
  return { name: '', email: text.replace(/^mailto:/i, '').toLowerCase() };
}

export function formatAddress({ name, email }) {
  const cleanEmail = oneLine(email).replace(/[<>,]/g, '');
  if (!name) return cleanEmail;
  const display = /^[\x20-\x7e]*$/.test(name)
    ? (/[(),.:;<>@[\]\\"]/.test(name) ? `"${oneLine(name).replace(/["\\]/g, '\\$&')}"` : oneLine(name))
    : encodeWord(name);
  return `${display} <${cleanEmail}>`;
}

// --- bodies --------------------------------------------------------------

function decodeBytes(bytes, charset = 'utf-8') {
  try {
    return new TextDecoder(charset.trim().toLowerCase() || 'utf-8').decode(bytes);
  } catch {
    return new TextDecoder('utf-8').decode(bytes);
  }
}

function partCharset(part) {
  const type = (part.headers || []).find(h => h.name.toLowerCase() === 'content-type')?.value || '';
  return type.match(/charset="?([^";\s]+)"?/i)?.[1] || 'utf-8';
}

export function messageText(payload) {
  const plain = [];
  const html = [];
  const walk = part => {
    if (!part) return;
    const type = (part.mimeType || '').toLowerCase();
    if (type.startsWith('multipart/')) {
      (part.parts || []).forEach(walk);
      return;
    }
    if (part.filename) return; // attachment
    const data = part.body?.data;
    if (!data) return;
    const text = decodeBytes(fromB64url(data), partCharset(part));
    if (type === 'text/plain') plain.push(text);
    else if (type === 'text/html') html.push(text);
  };
  walk(payload);
  const text = plain.length ? plain.join('\n') : html.map(htmlToText).join('\n');
  return text.replace(/\r\n/g, '\n').replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
}

const ENTITIES = { nbsp: ' ', amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", '#39': "'" };

export function htmlToText(html) {
  return String(html)
    .replace(/<(script|style|head|title)[\s\S]*?<\/\1>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<li[^>]*>/gi, '\n- ')
    .replace(/<\/(p|div|tr|h[1-6]|blockquote|table|section|article|ul|ol)>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&(#x?[0-9a-f]+|[a-z]+|#39);/gi, (all, code) => {
      if (code[0] === '#') {
        const n = code[1].toLowerCase() === 'x' ? parseInt(code.slice(2), 16) : parseInt(code.slice(1), 10);
        return Number.isFinite(n) ? String.fromCodePoint(n) : all;
      }
      return ENTITIES[code.toLowerCase()] ?? all;
    })
    .split('\n')
    .map(line => line.replace(/\s+/g, ' ').trim())
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

// Cut the quoted history below a reply so prompts only carry what is new.
export function stripQuoted(text) {
  const lines = String(text).split('\n');
  const out = [];
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i].trim();
    const pair = `${line} ${(lines[i + 1] || '').trim()}`;
    if (/^on .+wrote:$/i.test(line) || /^on .+wrote:$/i.test(pair)) break;
    if (/^am .+schrieb.*:$/i.test(line) || /^am .+schrieb.*:$/i.test(pair)) break;
    if (/^-{2,}\s*(original message|ursprüngliche nachricht|forwarded message|weitergeleitete nachricht)/i.test(line)) break;
    if (/^(from|von):\s.+/i.test(line) && lines.slice(i + 1, i + 5).some(l => /^(sent|gesendet|date|datum):/i.test(l.trim()))) break;
    if (line.startsWith('>')) continue;
    out.push(lines[i]);
  }
  return out.join('\n').trim();
}

export function clip(text, max) {
  const value = String(text);
  return value.length > max ? `${value.slice(0, max)}\n[… ${value.length - max} more characters not shown]` : value;
}

// --- message summary -----------------------------------------------------

export function readMessage(msg) {
  const from = parseAddressList(header(msg, 'From'))[0] || { name: '', email: '' };
  return {
    id: msg.id,
    threadId: msg.threadId,
    labelIds: msg.labelIds || [],
    date: Number(msg.internalDate) || 0,
    from,
    to: parseAddressList(header(msg, 'To')),
    cc: parseAddressList(header(msg, 'Cc')),
    bcc: parseAddressList(header(msg, 'Bcc')),
    replyTo: parseAddressList(header(msg, 'Reply-To')),
    subject: header(msg, 'Subject'),
    messageId: header(msg, 'Message-ID') || header(msg, 'Message-Id'),
    inReplyTo: header(msg, 'In-Reply-To'),
    references: header(msg, 'References'),
    listUnsubscribe: header(msg, 'List-Unsubscribe'),
    listUnsubscribePost: header(msg, 'List-Unsubscribe-Post'),
    snippet: decodeWords(msg.snippet || ''),
    text: messageText(msg.payload),
  };
}

// --- writing -------------------------------------------------------------

export function replySubject(subject) {
  const s = oneLine(subject);
  return /^(re|aw|antw|sv|vs)\s*:/i.test(s) ? s : `Re: ${s}`.trim();
}

export function buildRaw({ to = [], cc = [], bcc = [], subject = '', inReplyTo = '', references = '', body = '' }) {
  const lines = [];
  if (to.length) lines.push(`To: ${to.map(formatAddress).join(', ')}`);
  if (cc.length) lines.push(`Cc: ${cc.map(formatAddress).join(', ')}`);
  if (bcc.length) lines.push(`Bcc: ${bcc.map(formatAddress).join(', ')}`);
  lines.push(`Subject: ${encodeWord(subject)}`);
  if (inReplyTo) lines.push(`In-Reply-To: ${oneLine(inReplyTo)}`);
  if (references) lines.push(`References: ${oneLine(references)}`);
  lines.push('MIME-Version: 1.0', 'Content-Type: text/plain; charset="UTF-8"', 'Content-Transfer-Encoding: base64', '');
  const encoded = Buffer.from(String(body).replace(/\r?\n/g, '\r\n')).toString('base64');
  lines.push(encoded.replace(/.{1,76}/g, '$&\r\n').trimEnd());
  return toB64url(lines.join('\r\n'));
}
