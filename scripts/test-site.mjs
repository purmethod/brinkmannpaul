import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const code = fs.readFileSync(path.join(root, 'dist/app.js'), 'utf8');
const html = fs.readFileSync(path.join(root, 'dist/index.html'), 'utf8');
const notFound = fs.readFileSync(path.join(root, 'dist/404.html'), 'utf8');

function element(extra = {}) {
  const classes = new Set(), attrs = new Map(), events = new Map();
  return {
    attrs, events, inert: false, tabIndex: -1,
    classList: { add: (...x) => x.forEach(v => classes.add(v)), remove: (...x) => x.forEach(v => classes.delete(v)), contains: x => classes.has(x) },
    setAttribute: (k, v) => attrs.set(k, v), removeAttribute: k => attrs.delete(k),
    addEventListener: (k, cb) => events.set(k, cb),
    focus() { this.focused = true; },
    ...extra,
  };
}

function video(options) {
  const source = element();
  const v = element({
    readyState: 0, playbackRate: 1, paused: true, plays: 0, source,
    querySelector: sel => (sel === 'source' ? source : null),
    canPlayType: () => (options.noH264 ? '' : 'probably'),
    pause() { this.paused = true; },
    play() {
      this.plays += 1;
      if (options.rejectPlay) return Promise.reject(new Error('blocked'));
      this.paused = false;
      return Promise.resolve();
    },
  });
  if (options.ready) v.readyState = 4;
  return v;
}

function boot(options = {}) {
  const gate = element(), animation = video(options), page = element(), main = element(), skip = element(), body = element();
  const elems = { '#intro-gate': gate, '#intro-animation': animation, '#site-page': page, '#main-content': main, '.skip-link': skip };
  const events = new Map(), timers = new Map();
  let nextTimer = 0;
  const motion = { matches: !!options.reduced, [options.legacy ? 'addListener' : 'addEventListener']: (...args) => { motion.listener = args.at(-1); } };
  const document = { body, activeElement: gate, querySelector: sel => (options.missing === sel ? null : elems[sel]) };
  const window = {
    matchMedia: () => motion, location: { hash: options.hash || '' },
    addEventListener: (k, cb) => events.set(k, cb), removeEventListener: k => events.delete(k),
    setTimeout: (cb, ms) => { nextTimer += 1; timers.set(nextTimer, { cb, ms }); return nextTimer; },
    clearTimeout: id => timers.delete(id),
  };
  vm.runInNewContext(code, { window, document });
  const runTimers = ms => [...timers.entries()].filter(([, t]) => t.ms === ms).forEach(([id, t]) => { timers.delete(id); t.cb(); });
  return { gate, animation, page, main, skip, body, motion, events, timers, runTimers };
}

const flush = () => new Promise(resolve => setImmediate(resolve));
const released = s => {
  assert.equal(s.page.inert, false);
  assert.equal(s.page.attrs.has('aria-hidden'), false);
  assert.equal(s.body.classList.contains('intro-locked'), false);
  assert.equal(s.gate.tabIndex, -1);
  assert.equal(s.events.size, 0);
};
const still = s => s.gate.classList.contains('is-complete');

// Gate locks the page and every exit releases it.
let s = boot();
assert.equal(s.page.inert, true);
assert.equal(still(s), false);
s.gate.events.get('click')(); released(s); assert.ok(s.main.focused);
s.gate.events.get('click')(); released(s);
s.runTimers(600); assert.ok(s.animation.paused, 'video pauses after leaving the gate');
s = boot(); s.skip.events.get('click')(); released(s);
for (const key of ['Enter', ' ', 'Escape', 'ArrowDown', 'PageDown']) {
  s = boot(); let prevented = false;
  s.events.get('keydown')({ key, preventDefault() { prevented = true; } });
  released(s); assert.ok(prevented); assert.ok(s.main.focused);
}
s = boot(); s.events.get('keydown')({ key: 'Tab' }); assert.equal(s.page.inert, true);
s.events.get('wheel')({ ctrlKey: true, deltaY: 10 }); assert.equal(s.page.inert, true);
s.events.get('wheel')({ deltaY: 10, preventDefault() {} }); released(s);
s = boot(); s.events.get('touchstart')({ touches: [{ clientY: 100 }] });
s.events.get('touchmove')({ touches: [{ clientY: 105 }] }); assert.equal(s.page.inert, true);
s.events.get('touchmove')({ touches: [{ clientY: 130 }], cancelable: true, preventDefault() {} }); released(s);

// Playback paths.
s = boot(); assert.equal(s.animation.plays, 0);
s.animation.events.get('loadeddata')(); assert.equal(s.animation.plays, 1); assert.equal(s.animation.playbackRate, 1.25);
assert.equal([...s.timers.values()].filter(t => t.ms === 10000).length, 0, 'load fallback cleared once playing');
s = boot({ ready: true }); assert.equal(s.animation.plays, 1, 'already-loaded video still gets play() and rate');
assert.equal(s.animation.playbackRate, 1.25);
s = boot({ rejectPlay: true }); s.animation.events.get('loadeddata')(); await flush(); assert.ok(still(s));
s = boot(); s.animation.source.events.get('error')(); assert.ok(still(s), '<source> failure shows the still');
s = boot(); s.animation.events.get('error')(); assert.ok(still(s));
s = boot(); s.animation.events.get('ended')(); assert.ok(still(s));
s = boot({ noH264: true }); assert.ok(still(s), 'no H.264 support shows the still at once');
s = boot(); s.runTimers(10000); assert.ok(still(s)); s.animation.events.get('loadeddata')(); assert.equal(s.animation.plays, 0, 'no late playback behind the still');
s.gate.events.get('click')(); released(s);

// Reduced motion, legacy API, direct anchors, missing markup.
s = boot({ reduced: true }); assert.ok(still(s)); assert.equal(s.animation.plays, 0); s.gate.events.get('click')(); released(s);
s = boot({ legacy: true }); s.motion.listener({ matches: true }); assert.ok(still(s));
s = boot({ hash: '#main-content' }); released(s); assert.ok(s.animation.paused);
s = boot({ missing: '#intro-animation' }); released(s);

// Content: every project row opens, has copy and an action.
const list = html.slice(html.indexOf('<div class="project-list">'), html.indexOf('</section>'));
const items = list.split(/<details class="project-item">/).slice(1);
assert.ok(!/class="project-item brand-row"/.test(list), 'no static, unclickable project rows');
assert.equal(items.length, 8);
for (const item of items) {
  const name = item.match(/<h2 class="item-name">([^<]+)/)[1].trim();
  const story = item.slice(item.indexOf('class="item-story"'));
  assert.ok(/<p[ >]/.test(story), `${name} has copy`);
  assert.ok(/<a href="(mailto:|https:)/.test(story), `${name} has a call to action`);
}
assert.ok(!html.includes('souralf<'), 'link label uses the âlf name');
assert.ok(html.includes('<noscript>'));
assert.ok(html.includes('<p>i build.</p>'));

// Every local asset referenced by the pages exists and stays small.
for (const [page, source] of [['dist', html], ['dist', notFound]]) {
  for (const [, local] of source.matchAll(/(?:src|href)="([^"#]+)"/g)) {
    if (/^(https?:|mailto:|data:)/.test(local) || local === '/') continue;
    const file = path.join(root, page, local.replace(/^\//, '').split('?')[0]);
    assert.ok(fs.existsSync(file), `Missing ${local}`);
    assert.ok(fs.statSync(file).size < 300 * 1024, `${local} exceeds 300 KB`);
  }
}
const ogImage = html.match(/property="og:image" content="https:\/\/brinkmannpaul\.com\/([^"]+)"/)[1];
assert.ok(fs.existsSync(path.join(root, 'dist', ogImage)), 'og:image exists');

console.log('PASS: intro exits, keyboard, swipe, pinch guard, playback, source error, codec, timeout, reduced motion, legacy API, direct anchor, missing element, 8 clickable projects with copy and actions, local assets, og image.');
