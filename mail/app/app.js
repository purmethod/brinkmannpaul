'use strict';

(() => {
  const UNDO_MS = 5000;
  const main = document.querySelector('#main');
  const nav = document.querySelector('.nav');
  const navCount = document.querySelector('#nav-count');
  const toastEl = document.querySelector('#toast');
  const toastText = document.querySelector('#toast-text');
  const toastAction = document.querySelector('#toast-action');

  const state = {
    me: null,
    signedOut: false,
    loaded: false,
    drafts: [],
    index: 0,
    brief: null,
    unsubscribed: new Set(),
    running: false,
    editing: false,
    busy: false,
    pending: null,
    view: 'queue',
  };

  // --- tiny dom helper: text only, never html from mail -----------------

  function h(tag, props, ...children) {
    const el = document.createElement(tag);
    for (const [key, value] of Object.entries(props || {})) {
      if (value == null || value === false) continue;
      if (key === 'class') el.className = value;
      else if (key === 'text') el.textContent = value;
      else if (key === 'value') el.value = value;
      else if (key.startsWith('on')) el.addEventListener(key.slice(2), value);
      else el.setAttribute(key, value === true ? '' : value);
    }
    for (const child of children.flat()) {
      if (child == null || child === false) continue;
      el.append(child instanceof Node ? child : String(child));
    }
    return el;
  }

  async function api(path, { method = 'GET', body, keepalive = false } = {}) {
    const res = await fetch(path, {
      method,
      keepalive,
      credentials: 'same-origin',
      headers: { 'x-zero': '1', ...(body ? { 'content-type': 'application/json' } : {}) },
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = await res.json().catch(() => ({}));
    if (res.status === 401) {
      state.signedOut = true;
      state.reauth = data.error === 'reauth';
      render();
      throw new Error('signed out');
    }
    if (!res.ok) throw new Error(data.error || `error ${res.status}`);
    return data;
  }

  // --- words -------------------------------------------------------------

  const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;
  const nameOf = a => (a ? a.name || a.email : '');
  const firstName = a => nameOf(a).split(/[\s@]/)[0].toLowerCase();

  function ago(ms) {
    const minutes = Math.max(0, Math.round((Date.now() - ms) / 60000));
    if (minutes < 2) return 'just now';
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.round(minutes / 60);
    if (hours < 36) return `${hours} h`;
    return plural(Math.round(hours / 24), 'day', 'days');
  }

  function clock(iso) {
    const d = new Date(iso);
    const sameDay = d.toDateString() === new Date().toDateString();
    const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
    return sameDay ? `today ${time}` : `${d.toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'short' }).toLowerCase()} ${time}`;
  }

  function greeting() {
    const hour = new Date().getHours();
    if (hour < 5) return 'still up.';
    if (hour < 12) return 'good morning.';
    if (hour < 18) return 'good afternoon.';
    return 'good evening.';
  }

  const cleared = r => (r ? r.fyi.length + r.noise.length + r.archived : 0);

  const SIGNIN_ERRORS = {
    declined: 'sign-in was cancelled. nothing changed.',
    state: 'that sign-in link expired. try again.',
    'not-allowed': 'this google account is not on the list for this app.',
    'no-refresh-token': 'google did not grant offline access. try again.',
    failed: 'google sign-in did not go through. try again.',
  };

  // --- toast + undo -------------------------------------------------------

  let toastTimer = null;

  function toast(text, action, onAction, ms = 3200) {
    clearTimeout(toastTimer);
    toastText.textContent = text;
    toastAction.hidden = !action;
    toastAction.textContent = action || '';
    toastAction.onclick = () => {
      hideToast();
      onAction?.();
    };
    toastEl.hidden = false;
    toastTimer = setTimeout(hideToast, ms);
  }

  function hideToast() {
    toastEl.hidden = true;
  }

  function later(kind, extra = {}) {
    flushPending();
    const card = state.drafts.splice(state.index, 1)[0];
    if (!card) return;
    const at = state.index;
    state.index = Math.min(state.index, Math.max(0, state.drafts.length - 1));
    state.editing = false;
    const pending = { kind, card, at, ...extra };
    pending.timer = setTimeout(() => fire(pending), UNDO_MS);
    state.pending = pending;
    render();
    const label = kind === 'send' ? `sending to ${firstName(card.to[0])}.` : 'draft discarded.';
    toast(label, 'undo', () => undo(pending), UNDO_MS);
  }

  function undo(pending) {
    if (state.pending !== pending) return;
    clearTimeout(pending.timer);
    state.pending = null;
    state.drafts.splice(pending.at, 0, pending.card);
    state.index = pending.at;
    render();
    toast('undone. nothing left your outbox.');
  }

  function fire(pending, keepalive = false) {
    if (state.pending !== pending) return;
    clearTimeout(pending.timer);
    state.pending = null;
    const request = pending.kind === 'send'
      ? api(`/api/drafts/${pending.card.draftId}/send`, { method: 'POST', body: pending.body == null ? {} : { body: pending.body }, keepalive })
      : api(`/api/drafts/${pending.card.draftId}`, { method: 'DELETE', keepalive });
    request
      .then(() => {
        if (!keepalive) toast(pending.kind === 'send' ? `sent to ${firstName(pending.card.to[0])}.` : 'discarded. thread archived.');
      })
      .catch(error => {
        if (error.message === 'signed out') return;
        state.drafts.splice(Math.min(pending.at, state.drafts.length), 0, pending.card);
        render();
        toast(`could not ${pending.kind}: ${error.message}`);
      });
  }

  function flushPending(keepalive = false) {
    if (state.pending) fire(state.pending, keepalive);
  }

  window.addEventListener('pagehide', () => flushPending(true));

  // --- actions --------------------------------------------------------------

  const current = () => state.drafts[state.index];
  const editor = () => main.querySelector('.editor');

  function send() {
    const card = current();
    if (!card || state.busy) return;
    const body = state.editing ? editor().value : null;
    if (body != null) card.body = body;
    later('send', { body });
  }

  function discard() {
    if (current() && !state.busy) later('discard');
  }

  function skip() {
    if (state.drafts.length < 2) {
      toast('this is the only draft.');
      return;
    }
    state.drafts.push(state.drafts.splice(state.index, 1)[0]);
    state.editing = false;
    render();
  }

  function edit() {
    if (!current()) return;
    state.editing = true;
    render();
    const area = editor();
    area.focus();
    area.setSelectionRange(area.value.length, area.value.length);
  }

  async function save() {
    const card = current();
    const body = editor().value;
    state.busy = true;
    render();
    try {
      await api(`/api/drafts/${card.draftId}`, { method: 'PUT', body: { body } });
      card.body = body;
      state.editing = false;
      toast('saved in gmail.');
    } catch (error) {
      if (error.message !== 'signed out') toast(`could not save: ${error.message}`);
    } finally {
      state.busy = false;
      render();
    }
  }

  async function rewrite(instruction) {
    const card = current();
    const text = instruction.trim();
    if (!text) return;
    const draft = editor().value;
    state.busy = true;
    render();
    editor().value = draft;
    toast('claude is rewriting.', null, null, 60000);
    let next = draft;
    try {
      const result = await api(`/api/drafts/${card.draftId}/rewrite`, { method: 'POST', body: { instruction: text, body: draft } });
      next = result.body;
      card.body = next;
      toast('rewritten and saved in gmail.');
    } catch (error) {
      if (error.message !== 'signed out') toast(`could not rewrite: ${error.message}`);
    } finally {
      state.busy = false;
      render();
      if (editor()) editor().value = next;
    }
  }

  async function cleanNow() {
    try {
      await api('/api/run', { method: 'POST' });
      state.running = true;
      render();
      poll();
    } catch (error) {
      if (error.message !== 'signed out') toast(error.message);
    }
  }

  async function unsubscribe(item) {
    try {
      const result = await api(`/api/threads/${item.threadId}/unsubscribe`, { method: 'POST' });
      if (result.ok) {
        state.unsubscribed.add(item.from.email);
        toast(`unsubscribed from ${nameOf(item.from).toLowerCase()}.`);
        render();
      } else if (result.open) {
        window.open(result.open, '_blank', 'noopener');
      } else if (result.mailto) {
        window.location.href = result.mailto;
      } else {
        toast(result.reason || 'no unsubscribe link.');
      }
    } catch (error) {
      if (error.message !== 'signed out') toast(error.message);
    }
  }

  async function saveProfile(form) {
    const data = new FormData(form);
    try {
      await api('/api/profile', { method: 'PUT', body: { name: data.get('name'), notes: data.get('notes') } });
      if (state.me) state.me.name = data.get('name') || state.me.name;
      toast('saved. claude uses this from the next run on.');
    } catch (error) {
      if (error.message !== 'signed out') toast(error.message);
    }
  }

  async function signOut(disconnect) {
    if (disconnect && !window.confirm('disconnect gmail? zero forgets your account. your mail stays in gmail.')) return;
    flushPending();
    await api(disconnect ? '/api/disconnect' : '/auth/logout', { method: 'POST' }).catch(() => {});
    window.location.href = '/';
  }

  // --- views ----------------------------------------------------------------

  function viewSignin() {
    const error = new URLSearchParams(window.location.search).get('error');
    const message = state.reauth ? 'google access expired. sign in once more.' : SIGNIN_ERRORS[error];
    return h('section', { class: 'view signin' },
      h('h1', { class: 'hero' }, 'your inbox,', h('br'), 'handled.'),
      h('p', { class: 'lede' }, 'gmail stays underneath. claude reads everything, clears the noise and writes your replies. you only decide.'),
      message && h('p', { class: 'error-line', role: 'alert', text: message }),
      h('div', { class: 'rule' }),
      h('div', { class: 'signin-row' },
        h('p', { text: 'sign in once. every morning only the drafts are waiting.' }),
        h('a', { class: 'button', href: '/auth/login' }, 'sign in with google')));
  }

  function viewEmpty() {
    const r = state.brief;
    return h('section', { class: 'view' },
      h('h1', { class: 'hero' }, 'inbox zero.'),
      h('p', { class: 'lede' },
        state.running ? 'claude is going through your inbox right now.' : 'nothing waits for you.',
        r && !state.running ? ` ${plural(cleared(r), 'mail', 'mails')} cleared in the last run.` : ''),
      h('div', { class: 'actions' },
        h('a', { class: 'button ghost', href: '#/brief' }, 'read the brief')));
  }

  function viewQueue() {
    if (!state.drafts.length) return viewEmpty();
    const card = current();
    const n = state.drafts.length;
    const r = state.brief;
    const from = card.incoming?.from || card.to[0];
    const subject = card.incoming?.subject || card.subject.replace(/^(re|aw):\s*/i, '');

    const body = state.editing
      ? [
        h('textarea', { class: 'editor', 'aria-label': 'your reply', value: card.body, disabled: state.busy, rows: Math.min(18, card.body.split('\n').length + 3) }),
        h('form', {
          class: 'ask',
          onsubmit: event => {
            event.preventDefault();
            rewrite(event.target.elements.instruction.value);
          },
        },
        h('input', { name: 'instruction', 'aria-label': 'tell claude what to change', placeholder: 'tell claude: shorter, more formal, say no kindly', autocomplete: 'off', disabled: state.busy }),
        h('button', { class: 'quiet', type: 'submit', disabled: state.busy }, 'rewrite')),
      ]
      : h('p', { class: 'draft-body', text: card.body });

    const actions = state.editing
      ? [
        h('button', { class: 'button', type: 'button', onclick: send, disabled: state.busy }, 'send'),
        h('button', { class: 'quiet', type: 'button', onclick: save, disabled: state.busy }, 'save'),
        h('button', { class: 'quiet', type: 'button', onclick: () => { state.editing = false; render(); }, disabled: state.busy }, 'cancel'),
      ]
      : [
        h('button', { class: 'button', type: 'button', onclick: send }, 'send'),
        h('button', { class: 'quiet', type: 'button', onclick: edit }, 'edit'),
        h('button', { class: 'quiet', type: 'button', onclick: skip }, 'later'),
        h('button', { class: 'quiet', type: 'button', onclick: discard }, 'discard'),
      ];

    return h('section', { class: 'view' },
      h('h1', { class: 'hero' }, `${plural(n, 'draft', 'drafts')}.`),
      h('p', { class: 'lede' },
        greeting(),
        r ? ` ${plural(cleared(r), 'mail', 'mails')} cleared, last run ${clock(r.finishedAt || r.startedAt).replace('today ', '')}.` : '',
        state.running ? ' claude is cleaning right now.' : ''),
      h('article', { class: 'card', 'aria-label': `draft ${state.index + 1} of ${n}` },
        h('div', { class: 'rule' }),
        h('div', { class: 'meta' },
          h('span', null, `${state.index + 1} / ${n}`),
          h('span', null, card.incoming ? `waiting ${ago(card.waitingSince)}` : 'your draft')),
        h('div', { class: 'from' },
          h('span', { class: 'from-name', text: nameOf(from).toLowerCase() }),
          h('span', { class: 'from-mail', text: from?.email || '' })),
        h('h2', { class: 'subject', text: subject || '(no subject)' }),
        card.summary && h('p', { class: 'summary', text: card.summary }),
        card.incoming && h('details', { class: 'original' },
          h('summary', null, `${firstName(card.incoming.from)}'s message`, h('span', { class: 'plus', 'aria-hidden': 'true' })),
          h('div', { class: 'mailtext', text: card.incoming.text || '(empty)' })),
        h('div', { class: 'draft' },
          h('div', { class: 'draft-head' },
            h('p', { class: 'label' }, card.byClaude ? 'claude wrote' : 'your draft'),
            h('span', { class: 'draft-to', text: `to ${[...card.to, ...card.cc].map(nameOf).join(', ').toLowerCase()}` })),
          body),
        h('div', { class: 'actions' }, actions),
        h('p', { class: 'keys' }, state.editing ? '⌘ enter send · esc cancel' : '⌘ enter send · e edit · l later · ⌫ discard')));
  }

  function row(item, side) {
    let loaded = false;
    const text = h('div', { class: 'mailtext', text: item.draft || 'loading.' });
    return h('li', { class: 'row' },
      h('details', {
        ontoggle: async event => {
          if (!event.target.open || loaded || item.draft) return;
          loaded = true;
          try {
            const thread = await api(`/api/threads/${item.threadId}`);
            text.textContent = thread.messages.map(m => `${nameOf(m.from).toLowerCase()} · ${clock(new Date(m.date).toISOString())}\n\n${m.text}`).join('\n\n———\n\n');
          } catch (error) {
            text.textContent = `could not load: ${error.message}`;
          }
        },
      },
      h('summary', null,
        h('span', { class: 'row-from', text: nameOf(item.from).toLowerCase() }),
        h('span', { class: 'row-text', text: item.summary || item.subject }),
        h('span', { class: 'row-side' }, side)),
      text));
  }

  function noiseRow(item) {
    const done = state.unsubscribed.has(item.from.email);
    return h('li', { class: 'row' },
      h('div', { class: 'row-line' },
        h('span', { class: 'row-from', text: nameOf(item.from).toLowerCase() }),
        h('span', { class: 'row-text', text: item.subject }),
        item.unsubscribe
          ? h('button', { class: 'quiet row-side', type: 'button', disabled: done, onclick: () => unsubscribe(item) }, done ? 'unsubscribed' : 'unsubscribe')
          : h('span', { class: 'row-side' }, 'archived')));
  }

  function section(title, count, rows, empty) {
    return h('section', { class: 'section' },
      h('div', { class: 'section-head' },
        h('h2', null, title),
        h('span', { class: 'label' }, String(count))),
      rows.length ? h('ul', { class: 'rows' }, rows) : h('p', { class: 'empty-row', text: empty }));
  }

  function viewBrief() {
    const r = state.brief;
    if (!r) {
      return h('section', { class: 'view' },
        h('h1', { class: 'hero' }, 'brief.'),
        h('p', { class: 'lede' }, state.running ? 'the first run is happening right now.' : 'no run yet.'),
        h('div', { class: 'actions' }, h('button', { class: 'button', type: 'button', onclick: cleanNow, disabled: state.running }, state.running ? 'cleaning' : 'clean now')));
    }
    return h('section', { class: 'view' },
      h('h1', { class: 'hero' }, 'brief.'),
      h('p', { class: 'lede' },
        `last run ${clock(r.finishedAt || r.startedAt)}. ${plural(r.scanned, 'thread', 'threads')} read, ${plural(r.drafted.length, 'draft', 'drafts')} written, ${cleared(r)} cleared.`),
      r.dryRun && h('p', { class: 'note' }, 'dry run: nothing was changed in gmail. this is what claude would do.'),
      r.dryRun && section('drafts claude would write', r.drafted.length, r.drafted.map(i => row(i, ago(i.date))), 'none.'),
      section('worth knowing', r.fyi.length, r.fyi.map(i => row(i, ago(i.date))), 'nothing to know today.'),
      section('cleared', r.noise.length, r.noise.map(noiseRow), 'no noise.'),
      r.errors.length > 0 && h('p', { class: 'note' }, `${plural(r.errors.length, 'thread', 'threads')} could not be handled and stayed in your gmail inbox.`),
      h('div', { class: 'actions' },
        h('button', { class: 'button', type: 'button', onclick: cleanNow, disabled: state.running }, state.running ? 'cleaning' : 'clean now'),
        h('span', { class: 'label' }, state.me?.everyMinutes > 0 ? `runs by itself every ${state.me.everyMinutes} min` : 'runs only when you ask')));
  }

  function viewSettings() {
    const me = state.me;
    const form = h('form', {
      onsubmit: event => {
        event.preventDefault();
        saveProfile(event.target);
      },
    },
    h('label', { class: 'field' },
      h('span', null, 'your name, as claude signs'),
      h('input', { name: 'name', autocomplete: 'name', value: state.profile?.name || '' })),
    h('label', { class: 'field' },
      h('span', null, 'how claude should handle your mail'),
      h('textarea', { name: 'notes', value: state.profile?.notes || '', rows: 9 })),
    h('p', { class: 'note' }, 'claude also learns your tone from your last sent emails.'),
    h('div', { class: 'actions plain' }, h('button', { class: 'button', type: 'submit' }, 'save')));

    return h('section', { class: 'view' },
      h('h1', { class: 'hero' }, 'settings.'),
      h('p', { class: 'lede', text: `signed in as ${me.email}${me.demo ? ' (demo)' : ''}` }),
      h('section', { class: 'section' },
        h('div', { class: 'section-head' }, h('h2', null, 'voice and rules')),
        form),
      h('section', { class: 'section' },
        h('div', { class: 'section-head' }, h('h2', null, 'rhythm')),
        h('p', { class: 'note' }, me.everyMinutes > 0 ? `claude cleans your inbox every ${me.everyMinutes} minutes, day and night.` : 'automatic cleaning is off. use clean now in the brief.'),
        me.dryRun && h('p', { class: 'note' }, 'dry run is on: claude only reads and reports. set TRIAGE_DRY_RUN=0 on the server when the brief looks right.')),
      h('section', { class: 'section' },
        h('div', { class: 'section-head' }, h('h2', null, 'account')),
        h('div', { class: 'actions plain' },
          h('button', { class: 'button ghost', type: 'button', onclick: () => signOut(false) }, 'sign out'),
          h('button', { class: 'quiet', type: 'button', onclick: () => signOut(true) }, 'disconnect gmail'))));
  }

  function render() {
    const signedIn = !state.signedOut && state.me;
    nav.hidden = !signedIn;
    navCount.textContent = signedIn && state.drafts.length ? String(state.drafts.length) : '';
    for (const link of nav.querySelectorAll('a')) {
      if (link.dataset.view === state.view) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    }
    let view;
    if (!signedIn) view = state.loaded || state.signedOut ? viewSignin() : h('section', { class: 'view' }, h('p', { class: 'lede' }, 'one moment.'));
    else if (state.view === 'brief') view = viewBrief();
    else if (state.view === 'settings') view = viewSettings();
    else view = viewQueue();

    // animate only when the screen or the draft changes, not on every click
    const key = `${signedIn ? state.view : 'signin'}`;
    if (key === lastKey) view.classList.add('still');
    const card = view.querySelector('.card');
    if (card && current()?.draftId !== lastDraft) card.classList.add('enter');
    lastKey = key;
    lastDraft = signedIn && state.view === 'queue' ? current()?.draftId : null;

    const keep = editor();
    const draftText = keep && state.editing ? keep.value : null;
    main.replaceChildren(view);
    if (draftText != null && editor()) editor().value = draftText;
  }

  let lastKey = null;
  let lastDraft = null;

  // --- data ------------------------------------------------------------------

  async function loadAll() {
    const [drafts, brief] = await Promise.all([api('/api/drafts'), api('/api/brief')]);
    const keepId = current()?.draftId;
    state.drafts = drafts.drafts.filter(d => d.draftId !== state.pending?.card.draftId);
    const i = state.drafts.findIndex(d => d.draftId === keepId);
    state.index = i >= 0 ? i : 0;
    state.brief = brief.report;
    state.running = brief.running;
    state.unsubscribed = new Set(brief.unsubscribed);
  }

  let polling = false;

  async function poll() {
    if (polling) return;
    polling = true;
    try {
      while (state.running) {
        await new Promise(r => setTimeout(r, 2500));
        const brief = await api('/api/brief');
        state.running = brief.running;
      }
      if (!state.editing) await loadAll();
      render();
      if (state.brief) toast(`done. ${plural(state.drafts.length, 'draft', 'drafts')} waiting.`);
    } catch {
      // signed out or offline; render already shows the state
    } finally {
      polling = false;
    }
  }

  async function boot() {
    try {
      state.me = await api('/api/me');
      if (!state.me.signedIn) {
        state.me = null;
        state.signedOut = true;
        render();
        return;
      }
      if (state.me.lastError?.reauth) {
        state.signedOut = true;
        state.reauth = true;
        render();
        return;
      }
      const [profile] = await Promise.all([api('/api/profile'), loadAll()]);
      state.profile = profile;
      state.loaded = true;
      if (window.location.search) window.history.replaceState(null, '', `/${window.location.hash}`);
      render();
      if (state.running || state.me.running) {
        state.running = true;
        poll();
      }
    } catch (error) {
      state.loaded = true;
      if (error.message !== 'signed out') {
        main.replaceChildren(h('section', { class: 'view' },
          h('h1', { class: 'hero' }, 'not now.'),
          h('p', { class: 'lede', text: `zero could not reach gmail: ${error.message}. your mail is safe in gmail.` })));
      }
    }
  }

  function route() {
    const hash = window.location.hash.replace(/^#\/?/, '');
    state.view = ['brief', 'settings'].includes(hash) ? hash : 'queue';
    state.editing = false;
    render();
    main.focus({ preventScroll: true });
    window.scrollTo(0, 0);
  }

  window.addEventListener('hashchange', route);

  document.addEventListener('keydown', event => {
    if (!state.me || state.view !== 'queue' || !current()) return;
    const typing = /^(input|textarea)$/i.test(event.target.tagName);
    if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
      event.preventDefault();
      send();
      return;
    }
    if (event.key === 'Escape' && state.editing) {
      state.editing = false;
      render();
      return;
    }
    if (typing || event.metaKey || event.ctrlKey || event.altKey) return;
    if (event.key === 'e') { event.preventDefault(); edit(); }
    if (event.key === 'l') skip();
    if (event.key === 'Backspace' || event.key === 'Delete') { event.preventDefault(); discard(); }
  });

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && state.loaded && state.me && !state.editing && !state.pending) {
      loadAll().then(render).catch(() => {});
    }
  });

  const hash = window.location.hash.replace(/^#\/?/, '');
  state.view = ['brief', 'settings'].includes(hash) ? hash : 'queue';
  boot();
})();
