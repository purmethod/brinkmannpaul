import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const code = fs.readFileSync(path.join(root, 'dist/app.js'), 'utf8');
const html = fs.readFileSync(path.join(root, 'dist/index.html'), 'utf8');
function element() {
  const classes = new Set(), attrs = new Map(), events = new Map();
  return {
    attrs, events, inert: false, tabIndex: -1,
    classList: { add: (...x) => x.forEach(v => classes.add(v)), remove: (...x) => x.forEach(v => classes.delete(v)), contains: x => classes.has(x) },
    setAttribute: (k, v) => attrs.set(k, v), removeAttribute: k => attrs.delete(k),
    addEventListener: (k, cb) => events.set(k, cb),
    focus() { this.focused = true; },
  };
}
function boot(options = {}) {
  const gate = element(), animation = element(), page = element(), main = element(), skip = element(), body = element();
  Object.assign(animation, { complete: true, naturalWidth: 900 }, options.image);
  const elems = { '#intro-gate': gate, '#intro-animation': animation, '#site-page': page, '#main-content': main, '.skip-link': skip };
  const events = new Map(), timers = new Map();
  const motion = { matches: !!options.reduced, [options.legacy ? 'addListener' : 'addEventListener']: (...args) => { motion.listener = args.at(-1); } };
  const document = { body, activeElement: gate, querySelector: sel => options.missing === sel ? null : elems[sel] };
  const window = {
    matchMedia: () => motion, location: { hash: options.hash || '' },
    addEventListener: (k, cb) => events.set(k, cb), removeEventListener: k => events.delete(k),
    setTimeout: cb => { const id = timers.size + 1; timers.set(id, cb); return id; }, clearTimeout: id => timers.delete(id),
  };
  vm.runInNewContext(code, { window, document });
  return { gate, animation, page, main, skip, body, motion, events, timers };
}
const released = s => {
  assert.equal(s.page.inert, false);
  assert.equal(s.page.attrs.has('aria-hidden'), false);
  assert.equal(s.body.classList.contains('intro-locked'), false);
  assert.equal(s.gate.tabIndex, -1);
  assert.equal(s.events.size, 0);
};
let s = boot();
assert.equal(s.page.inert, true);
assert.equal(s.gate.classList.contains('is-complete'), false);
s.gate.events.get('click')(); released(s); assert.ok(s.main.focused);
s.gate.events.get('click')(); released(s);
s = boot(); s.skip.events.get('click')(); released(s);
for (const key of ['Enter', ' ', 'Escape', 'ArrowDown', 'PageDown']) {
  s = boot(); let prevented = false;
  s.events.get('keydown')({ key, preventDefault() { prevented = true; } });
  released(s); assert.ok(prevented); assert.ok(s.main.focused);
}
s = boot(); s.events.get('keydown')({key:'Tab'}); assert.equal(s.page.inert, true);
s.events.get('wheel')({ctrlKey:true, deltaY:10}); assert.equal(s.page.inert,true);
s.events.get('wheel')({deltaY:10,preventDefault(){}}); released(s);
s = boot(); s.events.get('touchstart')({touches:[{clientY:100}]});
s.events.get('touchmove')({touches:[{clientY:105}]}); assert.equal(s.page.inert,true);
s.events.get('touchmove')({touches:[{clientY:130}],cancelable:true,preventDefault(){}}); released(s);
s = boot({reduced:true}); assert.ok(s.gate.classList.contains('is-complete')); s.gate.events.get('click')(); released(s);
s = boot({legacy:true}); s.motion.listener({matches:true}); assert.ok(s.gate.classList.contains('is-complete'));
s = boot({image:{complete:true,naturalWidth:0}}); assert.ok(s.gate.classList.contains('is-complete'));
s = boot({image:{complete:false}}); assert.equal(s.timers.size,1); s.animation.events.get('load')(); assert.equal(s.timers.size,0);
s = boot({image:{complete:false}}); [...s.timers.values()][0](); assert.ok(s.gate.classList.contains('is-complete')); s.gate.events.get('click')(); released(s);
s = boot(); s.animation.events.get('error')(); assert.ok(s.gate.classList.contains('is-complete'));
s = boot({hash:'#main-content'}); released(s);
s = boot({missing:'#intro-animation'}); released(s);
assert.equal((html.match(/<details /g) || []).length, 6);
assert.equal((html.match(/class="item-story"/g) || []).length, 6);
assert.ok(!html.includes('<video'));
assert.ok(html.includes('<noscript>'));
assert.ok(html.includes('one man, one purpose: build'));
for (const [, local] of html.matchAll(/(?:src|href)="([^"#]+)"/g)) {
  if (/^(https?:|mailto:|data:)/.test(local)) continue;
  assert.ok(fs.existsSync(path.join(root, 'dist', local.split('?')[0])), `Missing ${local}`);
}
assert.ok(fs.statSync(path.join(root,'dist/assets/intro-handwriting-split.webp')).size < 300 * 1024);
console.log('PASS: intro exits, keyboard, swipe, pinch guard, reduced motion, legacy API, load failure/timeout, direct anchor, missing element, six sections and local assets.');
