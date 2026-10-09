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
    ...(options.switched ? { sessionStorage: { getItem: key => (key === 'bs-language-switch' ? '{}' : null) } } : {}),
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
s = boot({ switched: true }); released(s); assert.ok(s.animation.paused, 'a language switch skips the intro');
s = boot({ missing: '#intro-animation' }); released(s);

// Content: every project row opens and has copy; every product has an action.
// The wheel and reader are built from these rows, so their ids are deep links.
const list = html.slice(html.indexOf('<div class="project-list">'), html.indexOf('</section>'));
const items = [...list.matchAll(/<details class="project-item" id="([a-z0-9-]+)">([\s\S]*?)(?=<details class="project-item"|$)/g)];
assert.ok(!/class="project-item brand-row"/.test(list), 'no static, unclickable project rows');
assert.equal(items.length, 9, 'nine projects, each with an id');
assert.equal(new Set(items.map(item => item[1])).size, 9, 'project ids are unique');
for (const [, id, item] of items) {
  const story = item.slice(item.indexOf('class="item-story"'));
  assert.ok(/<p[ >]/.test(story), `${id} has copy`);
  if (id !== 'art') assert.ok(/<a href="(mailto:|https:|weekends\/|skyn\/)/.test(story), `${id} has a call to action`);
}
assert.ok(!html.includes('souralf<'), 'link label uses the âlf name');
assert.ok(html.includes('<noscript>'));

// Picker wheel and brain dive: valid script, its drawings exist and stay small.
// The deep-zoom drawings (neuro-*) are fetched only when the dive nears them and
// are drawn up to ~4x, so they may be larger; everything else keeps the 300 KB rule.
const wheel = fs.readFileSync(path.join(root, 'dist/brain-scroll.js'), 'utf8');
new vm.Script(wheel, { filename: 'brain-scroll.js' });
assert.ok(html.includes('brain-scroll.js'), 'page loads the wheel');
assert.ok(wheel.includes("matchMedia('(prefers-reduced-motion: reduce)')"), 'wheel respects reduced motion');
for (const [, local] of wheel.matchAll(/'\/?(assets\/[^']+)'/g)) {
  const file = path.join(root, 'dist', local);
  const limit = /^assets\/neuro-/.test(local) ? 700 : 300;
  assert.ok(fs.existsSync(file), `Missing ${local}`);
  assert.ok(fs.statSync(file).size < limit * 1024, `${local} exceeds ${limit} KB`);
}
assert.ok(/depth > level\.handover - [\d.]+ && depth < level\.until \+ [\d.]+\) load\(level\)/.test(wheel), 'deep-zoom drawings load on demand, turning either way');
assert.ok(/function stay\(passed, handover, depth, next\)/.test(wheel), 'a drawing whose successor has not arrived gives way to paper instead of growing into grey or black');
for (const [, local] of wheel.matchAll(/'\/(assets\/neuro-[a-z]+\.webp)'/g)) {
  assert.ok(fs.readFileSync(path.join(root, 'dist', local)).includes('brinkmannpaul: edges baked'), `${local} has its edges baked (scripts/bake_dive_edges.py)`);
}
assert.ok(!wheel.includes('function soften'), 'drawings are not softened in the browser, which stalled the dive');
assert.ok(wheel.includes('context.fillRect(0, 0, backingWidth, backingHeight);'), 'a resized canvas is painted paper at once, never left black');
assert.ok(wheel.includes('dive.draw(depthAt(eased) + drift);'), 'a resize redraws the dive in the same frame');
assert.ok(/if \(reduced\.matches\) \{\s*if \(gate > 0\.01\) light/.test(wheel), 'with reduced motion the depth field stays still: only the threshold light remains');
assert.ok(wheel.includes("make('button', 'bs-head-close'"), 'an open project can be closed where the + was');
assert.ok(wheel.includes('bs-language-switch'), 'a language switch keeps the wheel and skips the intro');

// Six languages: English at the root, the others one folder down, all built
// from the English page by scripts/i18n.py with the same projects and links.
const LANGS = ['de', 'fr', 'es', 'ar', 'ru'];
const pages = [['dist', html], ['dist', notFound]];
const ids = page => [...page.matchAll(/<details class="project-item" id="([a-z0-9-]+)">/g)].map(m => m[1]).join();
const links = page => [...page.matchAll(/href="(mailto:[^"]+|https:\/\/www\.instagram[^"]+)"/g)].map(m => m[1]).join();
for (const lang of ['en', ...LANGS]) assert.ok(html.includes(`hreflang="${lang}" href="https://brinkmannpaul.com/${lang === 'en' ? '' : lang + '/'}"`), `alternate link for ${lang}`);
assert.ok(html.includes('aria-current="page">en</a>'), 'english marked in the selector');
assert.ok(!html.includes('>contact</a>'), 'the language selector replaces contact');
for (const [code, label] of [['en', 'en'], ['de', 'de'], ['fr', 'fr'], ['es', 'es'], ['ar', 'ع'], ['ru', 'ру']]) assert.ok(new RegExp(`hreflang="${code}" lang="${code}" aria-label="[^"]+"[^>]*>${label}</a>`).test(html), `${code} shown in its own script`);
// Footer: e-mail, whatsapp business and instagram as icons on the left, languages on the right.
for (const [name, page] of [['index', html], ['404', notFound]]) {
  const contact = page.slice(page.indexOf('<nav class="contact-links"'), page.indexOf('</footer>'));
  const targets = [...contact.matchAll(/<a href="([^"]+)"[^>]*aria-label="([^"]+)"><svg /g)].map(m => m[2] + ' ' + m[1].split(/[/:?]/).filter(Boolean)[1]);
  assert.deepEqual(targets, ['e-mail brinkmannbuild@gmail.com', 'whatsapp wa.me', 'instagram www.instagram.com'], `${name}: contact icons in order`);
  assert.ok(contact.includes('href="https://wa.me/491756257788"'), `${name}: whatsapp business number`);
  assert.ok(!/491788884486|tel:/.test(page), `${name}: no private number, no tel: link`);
  const footer = page.slice(page.indexOf('<footer'));
  assert.ok(footer.indexOf('contact-links') < footer.indexOf('footer-langs'), `${name}: contact first, languages second`);
  assert.ok(!/<footer[^>]*>\s*<p>/.test(page), `${name}: no repeated name in the footer`);
}
for (const lang of LANGS) {
  const file = path.join(root, 'dist', lang, 'index.html');
  assert.ok(fs.existsSync(file), `dist/${lang}/index.html exists (run python3 scripts/i18n.py build)`);
  const page = fs.readFileSync(file, 'utf8');
  assert.ok(page.includes(`<html lang="${lang}"${lang === 'ar' ? ' dir="rtl"' : ''}>`), `${lang} page language`);
  assert.ok(page.includes(`<link rel="canonical" href="https://brinkmannpaul.com/${lang}/" />`), `${lang} canonical`);
  assert.ok(new RegExp(`hreflang="${lang}" lang="${lang}"[^>]*aria-current="page"`).test(page), `${lang} marked in the selector`);
  assert.equal(page.match(/aria-current="page"/g).length, 1, `${lang}: one language marked`);
  assert.equal(ids(page), ids(html), `${lang} has the same projects in the same order`);
  assert.equal(links(page), links(html), `${lang} keeps every order link`);
  assert.ok(!/(src|href|srcset)="(?![a-z]+:|\/|#)/.test(page), `${lang} addresses local files from the site root`);
  pages.push(['dist', page]);
}

// The weekends booking page: in every language, linked from the wim hof row,
// with price, safety notes before any request and links that stay in the language.
const weekends = fs.readFileSync(path.join(root, 'dist/weekends/index.html'), 'utf8');
assert.ok(html.includes('<a href="weekends/">'), 'the wim hof row links to the booking page');
assert.ok(weekends.includes('490 € per person'), 'weekends: price shown');
assert.ok(weekends.indexOf('id="agree"') < weekends.indexOf('class="request"'), 'weekends: safety notes come before the requests');
assert.ok(weekends.includes('href="https://wa.me/491756257788"') && weekends.includes('mailto:brinkmannbuild@gmail.com'), 'weekends: requests by whatsapp and e-mail');
pages.push(['dist', weekends]);
for (const lang of LANGS) {
  const file = path.join(root, 'dist', lang, 'weekends', 'index.html');
  assert.ok(fs.existsSync(file), `dist/${lang}/weekends/index.html exists (run python3 scripts/i18n.py build)`);
  const page = fs.readFileSync(file, 'utf8');
  assert.ok(page.includes(`<link rel="canonical" href="https://brinkmannpaul.com/${lang}/weekends/" />`), `${lang} weekends canonical`);
  assert.ok(new RegExp(`href="/${lang}/weekends/" hreflang="${lang}"[^>]*aria-current="page"`).test(page), `${lang} weekends marked in the selector`);
  assert.ok(page.includes(`href="/${lang}/#wim-hof-weekends"`), `${lang} weekends closes back to its own language`);
  assert.ok(fs.readFileSync(path.join(root, 'dist', lang, 'index.html'), 'utf8').includes(`<a href="/${lang}/weekends/">`), `${lang} row links to its weekends page`);
  pages.push(['dist', page]);
}

// The skyn pre-order page: in every language, linked from the skyn row, with
// pre-orders by e-mail and whatsapp and links that stay in the language.
const skyn = fs.readFileSync(path.join(root, 'dist/skyn/index.html'), 'utf8');
assert.ok(html.includes('<a href="skyn/">'), 'the skyn row links to the pre-order page');
assert.ok(skyn.includes('id="order"') && skyn.includes("fetch('/api/checkout'") && skyn.includes("fetch('/api/shop')"), 'skyn: pre-order through the embedded stripe checkout');
assert.ok(!/subject=skyn%20pre-order|pre-order on whatsapp/.test(skyn), 'skyn: no pre-orders by e-mail or whatsapp');
for (const api of ['_stripe', 'checkout', 'shop', 'session-status']) new vm.Script(fs.readFileSync(path.join(root, 'dist', 'api', api + '.js'), 'utf8').replace(/^/, '(function (require, module) {').concat('\n})'), { filename: api + '.js' });
const shopJson = JSON.parse(fs.readFileSync(path.join(root, 'dist', 'shop.json'), 'utf8'));
assert.ok(shopJson.shipping.length && shopJson.product.currency, 'skyn: shop.json has shipping zones and a currency');
assert.ok(fs.existsSync(path.join(root, 'dist/skyn/thanks/index.html')), 'skyn: thank-you page');
pages.push(['dist', skyn]);
for (const lang of LANGS) {
  const file = path.join(root, 'dist', lang, 'skyn', 'index.html');
  assert.ok(fs.existsSync(file), `dist/${lang}/skyn/index.html exists (run python3 scripts/i18n.py build)`);
  const page = fs.readFileSync(file, 'utf8');
  assert.ok(page.includes(`<link rel="canonical" href="https://brinkmannpaul.com/${lang}/skyn/" />`), `${lang} skyn canonical`);
  assert.ok(new RegExp(`href="/${lang}/skyn/" hreflang="${lang}"[^>]*aria-current="page"`).test(page), `${lang} skyn marked in the selector`);
  assert.ok(page.includes(`href="/${lang}/#skyn"`), `${lang} skyn closes back to its own language`);
  assert.ok(fs.readFileSync(path.join(root, 'dist', lang, 'index.html'), 'utf8').includes(`<a href="/${lang}/skyn/">`), `${lang} row links to its skyn page`);
  pages.push(['dist', page]);
}

// Every local asset referenced by the pages exists and stays small.
for (const [page, source] of pages) {
  for (const [, local] of source.matchAll(/(?:src|srcset|href|poster)="([^"#]+)"/g)) {
    if (/^(https?:|mailto:|data:)/.test(local) || local === '/') continue;
    const file = path.join(root, page, local.replace(/^\//, '').split('?')[0]);
    assert.ok(fs.existsSync(file), `Missing ${local}`);
    // A looping clip loads only when it comes near while reading, so it may be larger.
    const limit = /^\/?assets\/video-[a-z-]+\.mp4$/.test(local.split('?')[0]) ? 600 : 300;
    assert.ok(fs.statSync(file).size < limit * 1024, `${local} exceeds ${limit} KB`);
  }
}
const ogImage = html.match(/property="og:image" content="https:\/\/brinkmannpaul\.com\/([^"]+)"/)[1];
assert.ok(fs.existsSync(path.join(root, 'dist', ogImage)), 'og:image exists');

// Search engines: robots.txt points to a sitemap the i18n build writes,
// with every indexable page in every language and none of the thank-you pages.
const robots = fs.readFileSync(path.join(root, 'dist/robots.txt'), 'utf8');
assert.ok(robots.includes('Sitemap: https://brinkmannpaul.com/sitemap.xml') && robots.includes('Disallow: /api/'), 'robots.txt names the sitemap and keeps /api/ out');
const sitemap = fs.readFileSync(path.join(root, 'dist/sitemap.xml'), 'utf8');
const locs = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]);
assert.equal(locs.length, 18, 'sitemap lists home, weekends and skyn in six languages');
assert.ok(!sitemap.includes('thanks'), 'thank-you pages stay out of the sitemap');
for (const loc of locs) assert.ok(fs.existsSync(path.join(root, 'dist', new URL(loc).pathname, 'index.html')), `sitemap page exists: ${loc}`);

console.log('PASS: intro exits, keyboard, swipe, pinch guard, playback, source error, codec, timeout, reduced motion, legacy API, direct anchor, language switch, missing element, 9 projects with ids, copy and actions, wheel script and drawing, six languages, weekends booking page, skyn pre-order page, local assets, og image, robots and sitemap.');
