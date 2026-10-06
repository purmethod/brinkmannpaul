// Browser tests for the built site. Run from tools/: npm run e2e
// Builds the site, starts scripts/dev.mjs, then checks every page in Chromium:
// status, console errors, broken requests, links, one h1, axe accessibility, no sideways scroll on phones,
// mobile menu, order flow with a stubbed Stripe.js, email fallback, thank-you states, no-JS rendering.
// Stripe itself is never contacted: /api/checkout and js.stripe.com are intercepted in the browser.
import { chromium } from "playwright";
import AxeBuilder from "@axe-core/playwright";
import { spawn, execFileSync } from "node:child_process";
import path from "node:path";
import { createRequire } from "node:module";

const root = path.resolve(import.meta.dirname, "..");
const require = createRequire(import.meta.url);
const routes = require("../routes.json");
const shop = require("../shop.json");
delete routes._note;
const PORT = Number(process.env.E2E_PORT || 4310);
const BASE = `http://localhost:${PORT}`;
const failures = [];
let passed = 0;

function check(cond, msg) {
  if (cond) passed++;
  else failures.push(msg);
}

async function step(name, fn) {
  const before = failures.length;
  try {
    await fn();
  } catch (err) {
    failures.push(`${name}: threw ${err.stack || err.message}`);
  }
  console.log(`${failures.length === before ? "ok  " : "FAIL"} ${name}`);
}

execFileSync(process.execPath, [path.join(root, "scripts/build.mjs")], { stdio: "inherit" });
const server = spawn(process.execPath, [path.join(root, "scripts/dev.mjs")], {
  env: {
    ...process.env,
    PORT: String(PORT),
    STRIPE_SECRET_KEY: "sk_test_51E2eTestAccount00000",
    STRIPE_PUBLISHABLE_KEY: "pk_test_51E2eTestAccount00000",
    STRIPE_API_BASE: process.env.STRIPE_MOCK_URL ? `${process.env.STRIPE_MOCK_URL}/v1/` : "http://127.0.0.1:9/v1/",
  },
  stdio: ["ignore", "pipe", "inherit"],
});
await new Promise((resolve) => server.stdout.once("data", resolve));

const browser = await chromium.launch();
const allPages = Object.entries(routes).flatMap(([lang, r]) => Object.entries(r).map(([key, p]) => ({ lang, key, path: p })));

// A stand-in for Stripe.js: records the calls and mounts a visible fake form.
const STRIPE_STUB = `
  window.__stripe = { calls: [] };
  window.Stripe = function (pk, opts) {
    window.__stripe.calls.push({ pk: pk, opts: opts });
    return {
      initEmbeddedCheckout: function (o) {
        return o.fetchClientSecret().then(function (secret) {
          window.__stripe.secret = secret;
          return {
            mount: function (el) { el.innerHTML = '<div id="fake-stripe">stripe checkout ' + secret + '</div>'; window.__stripe.mounted = true; },
            destroy: function () { window.__stripe.destroyed = true; },
          };
        });
      },
    };
  };`;

async function newPage(opts = {}) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, ...opts });
  const page = await ctx.newPage();
  const log = { console: [], failed: [] };
  page.on("console", (m) => {
    if (m.type() === "error") log.console.push(m.text());
  });
  page.on("pageerror", (e) => log.console.push("pageerror: " + e.message));
  page.on("requestfailed", (r) => log.failed.push(`${r.url()} ${r.failure()?.errorText}`));
  page.on("response", (r) => {
    if (r.status() >= 400 && !r.url().includes("/nope")) log.failed.push(`${r.status()} ${r.url()}`);
  });
  return { ctx, page, log };
}

/* ---------------- every page, desktop ---------------- */

const seenLinks = new Set();
await step(`all ${allPages.length} pages: 200, no console errors, no failed requests, one h1, lang, axe`, async () => {
  const { ctx, page, log } = await newPage();
  for (const p of allPages) {
    log.console.length = 0;
    log.failed.length = 0;
    const res = await page.goto(BASE + p.path, { waitUntil: "networkidle" });
    check(res.status() === 200, `${p.path}: status ${res.status()}`);
    check(log.console.length === 0, `${p.path}: console errors ${JSON.stringify(log.console)}`);
    check(log.failed.length === 0, `${p.path}: failed requests ${JSON.stringify(log.failed)}`);
    check((await page.locator("h1").count()) === 1, `${p.path}: h1 count`);
    check((await page.getAttribute("html", "lang")) === p.lang, `${p.path}: html lang`);
    const fontsOk = await page.evaluate(async () => {
      await document.fonts.ready;
      return [...document.fonts].some((f) => f.family.replace(/"/g, "") === "Fraunces" && f.status === "loaded");
    });
    check(fontsOk, `${p.path}: Fraunces did not load`);
    // Measure contrast on the final state, not halfway through a fade-in.
    await page.evaluate(() => document.querySelectorAll(".reveal").forEach((el) => el.classList.add("is-in")));
    await page.waitForTimeout(1100);
    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "best-practice"]).analyze();
    for (const v of results.violations) {
      check(false, `${p.path}: axe ${v.id} (${v.impact}): ${v.help} → ${v.nodes.slice(0, 3).map((n) => n.target.join(" ")).join(" | ")}`);
    }
    for (const href of await page.$$eval("a[href]", (as) => as.map((a) => a.getAttribute("href")))) {
      if (href.startsWith("/")) seenLinks.add(href.split("#")[0] || "/");
    }
  }
  await ctx.close();
});

await step(`every internal link resolves (${seenLinks.size || "?"} links)`, async () => {
  for (const href of seenLinks) {
    const res = await fetch(BASE + href, { redirect: "manual" });
    check(res.status === 200, `link ${href}: ${res.status}`);
  }
});

await step("404 page: status 404, both languages, no JS errors", async () => {
  const { ctx, page, log } = await newPage();
  const res = await page.goto(BASE + "/does-not-exist", { waitUntil: "networkidle" });
  check(res.status() === 404, `404 status ${res.status()}`);
  check((await page.locator("text=diese seite gibt es nicht").count()) === 1, "404 has German line");
  check(log.console.filter((c) => !c.includes("404")).length === 0, `404 console ${JSON.stringify(log.console)}`);
  await ctx.close();
});

await step("SEO basics: canonical, hreflang pairs, sitemap, robots, JSON-LD parses", async () => {
  const { ctx, page } = await newPage();
  for (const p of allPages.filter((x) => x.key !== "thanks")) {
    await page.goto(BASE + p.path);
    const canonical = await page.getAttribute('link[rel="canonical"]', "href");
    check(canonical === "https://qefyr.com" + (p.path === "/" ? "/" : p.path), `${p.path}: canonical ${canonical}`);
    const alt = await page.$$eval('link[rel="alternate"]', (ls) => ls.map((l) => l.hreflang + "=" + l.href));
    check(alt.length === 3, `${p.path}: hreflang count ${alt.length}`);
    for (const json of await page.$$eval('script[type="application/ld+json"]', (s) => s.map((x) => x.textContent))) {
      try { JSON.parse(json); } catch { check(false, `${p.path}: JSON-LD does not parse`); }
    }
  }
  const sm = await (await fetch(BASE + "/sitemap.xml")).text();
  check((sm.match(/<loc>/g) || []).length === (allPages.length - 2), "sitemap url count");
  check(/Sitemap: https:\/\/qefyr\.com\/sitemap\.xml/.test(await (await fetch(BASE + "/robots.txt")).text()), "robots.txt");
  await ctx.close();
});

await step("language switch points to the same page in the other language", async () => {
  const { ctx, page } = await newPage();
  for (const p of allPages) {
    await page.goto(BASE + p.path);
    const other = p.lang === "en" ? "de" : "en";
    const href = await page.getAttribute(".head .lang-link", "href");
    check(href === routes[other][p.key], `${p.path}: switch → ${href}, want ${routes[other][p.key]}`);
  }
  await ctx.close();
});

/* ---------------- phones ---------------- */

await step("phones (320, 360, 390, 430 px): no sideways scroll, header fits, CTA visible on load", async () => {
  for (const width of [320, 360, 390, 430]) {
    const { ctx, page } = await newPage({ viewport: { width, height: 760 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
    for (const p of allPages) {
      await page.goto(BASE + p.path, { waitUntil: "networkidle" });
      const over = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      check(over <= 0, `${width}px ${p.path}: page is ${over}px wider than the screen`);
      const wide = await page.evaluate(() =>
        [...document.querySelectorAll("body *")]
          .filter((el) => {
            const r = el.getBoundingClientRect();
            const cs = getComputedStyle(el);
            if (!(r.width > 0 && r.right > window.innerWidth + 1) || cs.position === "fixed" || el.closest(".table-wrap, .menu, [hidden]")) return false;
            // Clipped by an ancestor that itself fits on screen? Then nobody can scroll to it.
            for (let a = el.parentElement; a && a !== document.body; a = a.parentElement) {
              const o = getComputedStyle(a).overflowX;
              if ((o === "hidden" || o === "clip") && a.getBoundingClientRect().right <= window.innerWidth + 1) return false;
            }
            return true;
          })
          .slice(0, 3)
          .map((el) => el.tagName + "." + el.className)
      );
      check(wide.length === 0, `${width}px ${p.path}: elements past the right edge ${JSON.stringify(wide)}`);
    }
    await page.goto(BASE + "/");
    const cta = await page.locator(".hero .btn").first().boundingBox();
    check(cta && cta.y + cta.height <= 760, `${width}px: hero order button below the fold (y=${cta && Math.round(cta.y)})`);
    const head = await page.evaluate(() => {
      const h = document.querySelector(".head-inner");
      return h.scrollWidth <= h.clientWidth;
    });
    check(head, `${width}px: header overflows`);
    await ctx.close();
  }
});

await step("mobile menu: opens, traps focus, Escape closes, link navigates", async () => {
  const { ctx, page } = await newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  await page.goto(BASE + "/");
  await page.click("[data-menu-open]");
  check(await page.isVisible("#menu"), "menu visible after open");
  check((await page.getAttribute("[data-menu-open]", "aria-expanded")) === "true", "aria-expanded true");
  check(await page.evaluate(() => document.activeElement.matches("[data-menu-close]")), "focus moved to close button");
  for (let i = 0; i < 12; i++) await page.keyboard.press("Tab");
  check(await page.evaluate(() => !!document.activeElement.closest("#menu")), "focus stays inside the menu");
  await page.keyboard.press("Escape");
  check(await page.isHidden("#menu"), "Escape closes menu");
  check(await page.evaluate(() => document.activeElement.matches("[data-menu-open]")), "focus returns to menu button");
  await page.click("[data-menu-open]");
  await page.click('#menu a[href="/story"]');
  await page.waitForURL(BASE + "/story");
  check(true, "menu link navigates");
  await ctx.close();
});

await step("floating order button: hidden on the hero, shown mid-page, hidden at the footer", async () => {
  const { ctx, page } = await newPage({ viewport: { width: 390, height: 844 }, isMobile: true, reducedMotion: "reduce" });
  await page.goto(BASE + "/", { waitUntil: "networkidle" });
  const visible = () => page.evaluate(() => document.querySelector("[data-dock]").classList.contains("is-visible"));
  check(!(await visible()), "dock hidden on hero");
  await page.evaluate(() => window.scrollTo(0, document.querySelector(".method").offsetTop));
  await page.waitForTimeout(300);
  check(await visible(), "dock visible mid-page");
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(300);
  check(!(await visible()), "dock hidden at footer");
  await ctx.close();
});

/* ---------------- order flow ---------------- */

async function orderPage(lang, apiReply) {
  const { ctx, page, log } = await newPage({ viewport: { width: 1280, height: 900 } });
  const sent = [];
  await page.route("**/api/checkout", async (route) => {
    sent.push(JSON.parse(route.request().postData()));
    await route.fulfill(apiReply);
  });
  await page.route("https://js.stripe.com/**", (route) => route.fulfill({ contentType: "text/javascript", body: STRIPE_STUB }));
  await page.goto(BASE + routes[lang].order, { waitUntil: "networkidle" });
  return { ctx, page, log, sent };
}

const ok = { status: 200, contentType: "application/json", body: JSON.stringify({ clientSecret: "cs_test_e2e_secret_1", publishableKey: "pk_test_51E2eTestAccount00000" }) };

await step("order: quantity and zone update the total; limits enforced", async () => {
  const { ctx, page } = await orderPage("en", ok);
  const total = () => page.textContent("[data-total]");
  const [de, eu, world] = shop.shipping;
  const p = shop.product.amount;
  const eur = (c) => "€" + (c % 100 ? (c / 100).toFixed(2) : c / 100);
  check((await total()) === eur(p + de.amount), `initial total ${await total()}`);
  await page.click('[data-step="1"]');
  check((await total()) === eur(2 * p + de.amount), `2× total ${await total()}`);
  await page.check(`input[value="${eu.id}"]`);
  check((await total()) === eur(2 * p + eu.amount), `eu total ${await total()}`);
  await page.check(`input[value="${world.id}"]`);
  check((await total()) === eur(2 * p + world.amount), `world total ${await total()}`);
  check(await page.isEnabled('[data-step="-1"]'), "minus enabled at 2");
  await page.click('[data-step="-1"]');
  check(await page.isDisabled('[data-step="-1"]'), "minus disabled at 1");
  for (let i = 0; i < 10; i++) if (await page.isEnabled('[data-step="1"]')) await page.click('[data-step="1"]');
  check((await page.textContent("[data-qty]")) === String(shop.max_quantity), "quantity capped at max");
  check(await page.isDisabled('[data-step="1"]'), "plus disabled at max");
  await ctx.close();
});

await step("order: checkout opens embedded Stripe with the right session request (EN + DE)", async () => {
  for (const lang of ["en", "de"]) {
    const { ctx, page, log, sent } = await orderPage(lang, ok);
    await page.click('[data-step="1"]');
    await page.check('input[value="eu"]');
    await page.click("[data-checkout]");
    await page.waitForSelector("#fake-stripe", { timeout: 5000 });
    check(sent.length === 1, `${lang}: one checkout request`);
    check(JSON.stringify(sent[0]) === JSON.stringify({ quantity: 2, zone: "eu", lang }), `${lang}: body ${JSON.stringify(sent[0])}`);
    const stripe = await page.evaluate(() => window.__stripe);
    check(stripe.calls[0].pk === "pk_test_51E2eTestAccount00000", `${lang}: publishable key passed to Stripe`);
    check(stripe.calls[0].opts.locale === lang, `${lang}: Stripe locale`);
    check(stripe.secret === "cs_test_e2e_secret_1", `${lang}: client secret handed over`);
    check(await page.isHidden("[data-checkout]"), `${lang}: order button hidden while checkout is open`);
    check(await page.isVisible("[data-back]"), `${lang}: back link visible`);
    await page.click("[data-back]");
    check(await page.evaluate(() => window.__stripe.destroyed === true), `${lang}: checkout destroyed on back`);
    check(await page.isVisible("[data-checkout]"), `${lang}: order button back`);
    check(await page.isHidden("#checkout"), `${lang}: checkout box hidden after back`);
    check(log.console.length === 0, `${lang}: console errors ${JSON.stringify(log.console)}`);
    await ctx.close();
  }
});

await step("order: not configured (503) shows the email fallback with quantity and zone", async () => {
  const { ctx, page } = await orderPage("de", { status: 503, contentType: "application/json", body: JSON.stringify({ error: "STRIPE_PUBLISHABLE_KEY is not set" }) });
  await page.click('[data-step="1"]');
  await page.check('input[value="world"]');
  await page.click("[data-checkout]");
  await page.waitForSelector("[data-note]:not([hidden])");
  const text = await page.textContent("[data-note-text]");
  check(/eingerichtet/.test(text), `notReady text: ${text}`);
  const href = decodeURIComponent(await page.getAttribute("[data-mail-link]", "href"));
  check(href.startsWith("mailto:"), "mailto link");
  check(href.includes("Menge: 2") && href.includes("Versand: Weltweit"), `mail body carries order: ${href}`);
  check(await page.isEnabled("[data-checkout]"), "button usable again");
  check((await page.textContent("[data-checkout]")).trim() === "jetzt bestellen", "button label restored");
  await ctx.close();
});

await step("order: Stripe failure shows a retryable error, not a dead end", async () => {
  const { ctx, page } = await orderPage("en", { status: 401, contentType: "application/json", body: JSON.stringify({ error: "Invalid API Key provided" }) });
  await page.click("[data-checkout]");
  await page.waitForSelector("[data-note]:not([hidden])");
  check(/could not load/.test(await page.textContent("[data-note-text]")), "failed text");
  check(await page.isVisible("[data-mail-link]"), "email fallback offered");
  await ctx.close();
});

await step("order: the real /api/checkout validates input (dev server)", async () => {
  const bad = await fetch(BASE + "/api/checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ zone: "moon" }) });
  check(bad.status === 400, `unknown zone → ${bad.status}`);
  const get = await fetch(BASE + "/api/checkout");
  check(get.status === 405, `GET → ${get.status}`);
  const health = await (await fetch(BASE + "/api/health")).json();
  check(health.secret_key_mode === "test" && health.keys_same_account === true, `health ${JSON.stringify(health)}`);
});

/* ---------------- thank-you page ---------------- */

await step("thank-you page: complete vs. open session", async () => {
  for (const [status, expectOpen] of [["complete", false], ["open", true]]) {
    const { ctx, page } = await newPage();
    await page.route("**/api/session-status*", (route) =>
      route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ status, payment_status: status === "complete" ? "paid" : "unpaid" }) })
    );
    await page.goto(BASE + "/de/danke?session_id=cs_test_abc", { waitUntil: "networkidle" });
    const openVisible = await page.isVisible('[data-state="open"]');
    check(openVisible === expectOpen, `thanks ${status}: open block visible=${openVisible}`);
    const h1 = await page.textContent("h1");
    check(expectOpen ? /nicht abgeschlossen/.test(h1) : /vielen/.test(h1), `thanks ${status}: h1 "${h1}"`);
    await ctx.close();
  }
});

/* ---------------- tracking ---------------- */

await step("tracking form posts the number to DHL", async () => {
  const { ctx, page } = await newPage();
  for (const lang of ["en", "de"]) {
    await page.goto(BASE + routes[lang].tracking);
    const action = await page.getAttribute("form.track", "action");
    check(/^https:\/\/www\.dhl\.de\/(en|de)\/privatkunden\/pakete-empfangen\/verfolgen\.html$/.test(action), `${lang} action ${action}`);
    check((await page.getAttribute("#piececode", "name")) === "piececode", "field name piececode");
    check((await page.getAttribute("form.track", "target")) === "_blank", "opens in new tab");
  }
  await ctx.close();
});

/* ---------------- resilience ---------------- */

await step("without JavaScript: all content visible, email order link present", async () => {
  const { ctx, page } = await newPage({ javaScriptEnabled: false });
  for (const p of ["/", "/de/bestellen", "/story"]) {
    await page.goto(BASE + p);
    const hidden = await page.$$eval(".reveal", (els) => els.filter((e) => getComputedStyle(e).opacity !== "1").length);
    check(hidden === 0, `${p}: ${hidden} reveal blocks invisible without JS`);
  }
  await page.goto(BASE + "/order");
  check((await page.locator('noscript').count()) === 1, "noscript fallback on order page");
  await ctx.close();
});

await step("reduced motion: no animations running, content visible", async () => {
  const { ctx, page } = await newPage({ reducedMotion: "reduce" });
  await page.goto(BASE + "/", { waitUntil: "networkidle" });
  const anim = await page.evaluate(() => document.getAnimations().filter((a) => a.playState === "running" && a.effect.getTiming().duration > 50).length);
  check(anim === 0, `${anim} animations running with reduced motion`);
  const hidden = await page.$$eval(".reveal", (els) => els.filter((e) => getComputedStyle(e).opacity !== "1").length);
  check(hidden === 0, "reveals visible with reduced motion");
  await ctx.close();
});

await step("keyboard: skip link works and focus is visible", async () => {
  const { ctx, page } = await newPage();
  await page.goto(BASE + "/");
  await page.keyboard.press("Tab");
  check(await page.evaluate(() => document.activeElement.classList.contains("skip")), "first Tab lands on skip link");
  const visible = await page.evaluate(() => document.activeElement.getBoundingClientRect().top >= 0);
  check(visible, "skip link visible on focus");
  await page.keyboard.press("Enter");
  check(await page.evaluate(() => location.hash === "#main"), "skip link jumps to main");
  await page.keyboard.press("Tab");
  const outline = await page.evaluate(() => getComputedStyle(document.activeElement).outlineStyle);
  check(outline !== "none", `focus outline on ${await page.evaluate(() => document.activeElement.outerHTML.slice(0, 60))}`);
  await ctx.close();
});

await browser.close();
server.kill();

console.log(`\n${passed} checks passed, ${failures.length} failed`);
if (failures.length) {
  console.log("\n" + failures.map((f) => "✗ " + f).join("\n"));
  process.exit(1);
}
