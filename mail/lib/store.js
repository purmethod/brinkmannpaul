// One small JSON document per user. Google refresh tokens are encrypted (AES-256-GCM).
// Gmail itself stays the source of truth for mail; this only keeps tokens, settings,
// the last run report, and the one-line summaries claude wrote.

import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

const THREAD_MEMORY_DAYS = 45;

export function createStore({ dir = null, secret }) {
  const key = crypto.scryptSync(secret, 'zero-mail-store-v1', 32);
  const memory = new Map();
  const locks = new Map();
  const usersDir = dir ? path.join(dir, 'users') : null;
  const fileFor = email => path.join(usersDir, `${crypto.createHash('sha256').update(email.toLowerCase()).digest('hex').slice(0, 32)}.json`);

  function encrypt(text) {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
    const data = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
    return ['v1', iv, cipher.getAuthTag(), data].map(x => (typeof x === 'string' ? x : x.toString('base64url'))).join(':');
  }

  function decrypt(value) {
    const [version, iv, tag, data] = String(value).split(':');
    if (version !== 'v1') throw new Error('unknown token format');
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(iv, 'base64url'));
    decipher.setAuthTag(Buffer.from(tag, 'base64url'));
    return Buffer.concat([decipher.update(Buffer.from(data, 'base64url')), decipher.final()]).toString('utf8');
  }

  async function read(email) {
    if (!usersDir) return structuredClone(memory.get(email.toLowerCase()) ?? null);
    try {
      return JSON.parse(await fs.readFile(fileFor(email), 'utf8'));
    } catch (error) {
      if (error.code === 'ENOENT') return null;
      throw error;
    }
  }

  async function write(email, doc) {
    if (!usersDir) {
      memory.set(email.toLowerCase(), structuredClone(doc));
      return;
    }
    await fs.mkdir(usersDir, { recursive: true, mode: 0o700 });
    const target = fileFor(email);
    const tmp = `${target}.${process.pid}.tmp`;
    await fs.writeFile(tmp, JSON.stringify(doc, null, 2), { mode: 0o600 });
    await fs.rename(tmp, target);
  }

  // Serialize read-modify-write per user so the scheduler and the app never clobber each other.
  function update(email, change) {
    const id = email.toLowerCase();
    const run = (locks.get(id) || Promise.resolve()).then(async () => {
      const doc = (await read(id)) || blankUser(id);
      const next = (await change(doc)) || doc;
      pruneThreads(next);
      await write(id, next);
      return next;
    });
    locks.set(id, run.catch(() => {}));
    return run;
  }

  async function emails() {
    if (!usersDir) return [...memory.keys()];
    const files = await fs.readdir(usersDir).catch(() => []);
    const docs = await Promise.all(files.filter(f => f.endsWith('.json')).map(f => fs.readFile(path.join(usersDir, f), 'utf8').then(JSON.parse).catch(() => null)));
    return docs.filter(Boolean).map(d => d.email);
  }

  async function remove(email) {
    if (!usersDir) {
      memory.delete(email.toLowerCase());
      return;
    }
    await fs.rm(fileFor(email), { force: true });
  }

  return {
    read,
    update,
    emails,
    remove,
    saveToken: (email, refreshToken) => update(email, doc => { doc.token = encrypt(refreshToken); }),
    refreshToken: doc => (doc?.token ? decrypt(doc.token) : null),
  };
}

export function blankUser(email) {
  return {
    email,
    createdAt: new Date().toISOString(),
    token: null,
    profile: { name: '', notes: DEFAULT_NOTES },
    voice: null,
    threads: {},
    report: null,
    unsubscribed: {},
  };
}

export const DEFAULT_NOTES = `language: reply in the sender's language.
tone: short, warm, direct. no filler, no corporate phrases.
never: commit to dates, prices, or meetings without asking me first.
always reply to: family, clients, partners, anyone i already wrote to.`;

function pruneThreads(doc) {
  const cutoff = Date.now() - THREAD_MEMORY_DAYS * 864e5;
  for (const [id, meta] of Object.entries(doc.threads || {})) {
    if (Date.parse(meta.at) < cutoff) delete doc.threads[id];
  }
}
