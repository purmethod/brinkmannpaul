// Thin Gmail REST client + Google OAuth (web server flow). Plain fetch, no SDK.
// Scope: gmail.modify = read, label, archive, draft, send. It can never delete permanently.

const API = 'https://gmail.googleapis.com/gmail/v1/users/me';
const AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const REVOKE_URL = 'https://oauth2.googleapis.com/revoke';
export const SCOPE = 'https://www.googleapis.com/auth/gmail.modify';

export const LABELS = {
  parent: 'zero',
  ready: 'zero/ready', // a draft waits for you; stays in the inbox
  fyi: 'zero/fyi', // worth knowing, no reply needed; archived
  noise: 'zero/noise', // newsletters, promos, notifications; archived + read
  done: 'zero/done', // you sent or discarded the draft; archived
  old: 'zero/old', // bulk archived by age, never seen by ai
};

export class GmailError extends Error {
  constructor(status, detail) {
    super(`gmail ${status}: ${String(detail).slice(0, 300)}`);
    this.status = status;
  }
}

export class ReauthError extends Error {
  constructor() {
    super('google access was revoked or expired. sign in again.');
    this.code = 'reauth';
  }
}

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

export function authUrl(config, state) {
  const params = new URLSearchParams({
    client_id: config.googleClientId,
    redirect_uri: `${config.baseUrl}/auth/callback`,
    response_type: 'code',
    scope: SCOPE,
    access_type: 'offline',
    prompt: 'consent',
    include_granted_scopes: 'true',
    state,
  });
  return `${AUTH_URL}?${params}`;
}

async function tokenRequest(fields, fetchImpl) {
  const res = await fetchImpl(TOKEN_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(fields),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (data.error === 'invalid_grant') throw new ReauthError();
    throw new GmailError(res.status, data.error_description || data.error || 'token request failed');
  }
  return data;
}

export function exchangeCode(config, code, fetchImpl = fetch) {
  return tokenRequest({
    code,
    client_id: config.googleClientId,
    client_secret: config.googleClientSecret,
    redirect_uri: `${config.baseUrl}/auth/callback`,
    grant_type: 'authorization_code',
  }, fetchImpl);
}

export async function revokeToken(token, fetchImpl = fetch) {
  await fetchImpl(REVOKE_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ token }),
  }).catch(() => {});
}

export function createGmail({ config, refreshToken, accessToken = null, fetchImpl = fetch }) {
  let access = accessToken;
  let expiresAt = accessToken ? Date.now() + 50 * 60 * 1000 : 0;

  async function token(force = false) {
    if (!force && access && Date.now() < expiresAt) return access;
    const data = await tokenRequest({
      client_id: config.googleClientId,
      client_secret: config.googleClientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }, fetchImpl);
    access = data.access_token;
    expiresAt = Date.now() + (Number(data.expires_in || 3600) - 120) * 1000;
    return access;
  }

  async function call(method, path, { query, body } = {}, attempt = 0) {
    const url = `${API}${path}${query ? `?${new URLSearchParams(query)}` : ''}`;
    const headers = { authorization: `Bearer ${await token()}` };
    if (body) headers['content-type'] = 'application/json';
    const res = await fetchImpl(url, { method, headers, body: body ? JSON.stringify(body) : undefined });
    if (res.status === 401 && attempt === 0) {
      await token(true);
      return call(method, path, { query, body }, 1);
    }
    if ((res.status === 429 || res.status >= 500) && attempt < 3) {
      await sleep(2 ** attempt * 1000 + Math.random() * 400);
      return call(method, path, { query, body }, attempt + 1);
    }
    if (!res.ok) throw new GmailError(res.status, await res.text().catch(() => ''));
    if (res.status === 204) return null;
    const text = await res.text();
    return text ? JSON.parse(text) : null;
  }

  async function paginate(path, key, query, max) {
    const items = [];
    let pageToken;
    do {
      const page = await call('GET', path, {
        query: { ...query, maxResults: String(Math.min(100, max - items.length)), ...(pageToken ? { pageToken } : {}) },
      });
      items.push(...(page?.[key] || []));
      pageToken = page?.nextPageToken;
    } while (pageToken && items.length < max);
    return items.slice(0, max);
  }

  const id = value => encodeURIComponent(value);

  return {
    profile: () => call('GET', '/profile'),
    listThreads: (q, max = 50) => paginate('/threads', 'threads', { q }, max),
    getThread: (threadId, format = 'full') => call('GET', `/threads/${id(threadId)}`, { query: { format } }),
    modifyThread: (threadId, add = [], remove = []) =>
      call('POST', `/threads/${id(threadId)}/modify`, { body: { addLabelIds: add, removeLabelIds: remove } }),
    listMessages: (q, max = 20) => paginate('/messages', 'messages', { q }, max),
    getMessage: (messageId, format = 'full') => call('GET', `/messages/${id(messageId)}`, { query: { format } }),
    listDrafts: (max = 100) => paginate('/drafts', 'drafts', {}, max),
    getDraft: draftId => call('GET', `/drafts/${id(draftId)}`, { query: { format: 'full' } }),
    createDraft: (threadId, raw) => call('POST', '/drafts', { body: { message: { threadId, raw } } }),
    updateDraft: (draftId, threadId, raw) =>
      call('PUT', `/drafts/${id(draftId)}`, { body: { id: draftId, message: { threadId, raw } } }),
    sendDraft: draftId => call('POST', '/drafts/send', { body: { id: draftId } }),
    deleteDraft: draftId => call('DELETE', `/drafts/${id(draftId)}`),
    listLabels: async () => (await call('GET', '/labels'))?.labels || [],
    createLabel: name => call('POST', '/labels', {
      body: { name, labelListVisibility: 'labelShow', messageListVisibility: 'show' },
    }),
  };
}

// Make sure every zero/* label exists; returns { ready: 'Label_12', ... }.
export async function ensureLabels(gmail) {
  const existing = new Map((await gmail.listLabels()).map(l => [l.name, l.id]));
  const ids = {};
  for (const [key, name] of Object.entries(LABELS)) {
    if (!existing.has(name)) {
      const created = await gmail.createLabel(name);
      existing.set(name, created.id);
    }
    ids[key] = existing.get(name);
  }
  return ids;
}
