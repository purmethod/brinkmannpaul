// API tests: node --test tests/
// Unit tests stub fetch. With STRIPE_MOCK_URL (stripe-mock serving the 2024-06-20 spec, e.g. v0.187.0)
// the same requests are also validated against Stripe's real OpenAPI schema.
import { test } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const shop = require("../shop.json");

function load(name) {
  const file = require.resolve(`../api/${name}.js`);
  delete require.cache[file];
  delete require.cache[require.resolve("../api/_stripe.js")];
  return require(file);
}

function call(handler, { method = "POST", body, query = {}, headers = {} } = {}) {
  return new Promise((resolve, reject) => {
    const res = {
      statusCode: 200,
      headers: {},
      setHeader(k, v) { this.headers[k.toLowerCase()] = v; },
      status(code) { this.statusCode = code; return this; },
      json(obj) { resolve({ status: this.statusCode, body: obj, headers: this.headers }); return this; },
    };
    const req = { method, body, query, headers: { host: "qefyr.com", "x-forwarded-proto": "https", ...headers } };
    Promise.resolve(handler(req, res)).catch(reject);
  });
}

function withEnv(env, fn) {
  const old = {};
  for (const k of Object.keys(env)) { old[k] = process.env[k]; if (env[k] === undefined) delete process.env[k]; else process.env[k] = env[k]; }
  return Promise.resolve(fn()).finally(() => {
    for (const k of Object.keys(old)) { if (old[k] === undefined) delete process.env[k]; else process.env[k] = old[k]; }
  });
}

const KEYS = { STRIPE_SECRET_KEY: "sk_test_51QefyrTestAccount00000", STRIPE_PUBLISHABLE_KEY: "pk_test_51QefyrTestAccount00000" };

function stubFetch(reply = { client_secret: "cs_test_abc_secret_xyz" }) {
  const calls = [];
  const original = globalThis.fetch;
  globalThis.fetch = async (url, init = {}) => {
    calls.push({ url: String(url), init, params: new URLSearchParams(init.body || "") });
    return new Response(JSON.stringify(reply), { status: 200, headers: { "Content-Type": "application/json" } });
  };
  return { calls, restore: () => (globalThis.fetch = original) };
}

test("checkout: rejects GET", async () => {
  const r = await call(load("checkout"), { method: "GET" });
  assert.equal(r.status, 405);
});

test("checkout: 503 without keys, never calls Stripe", async () => {
  const f = stubFetch();
  try {
    await withEnv({ STRIPE_SECRET_KEY: undefined, STRIPE_PUBLISHABLE_KEY: undefined }, async () => {
      const r = await call(load("checkout"), { body: { quantity: 1, zone: "de" } });
      assert.equal(r.status, 503);
      assert.match(r.body.error, /PUBLISHABLE/);
    });
    assert.equal(f.calls.length, 0);
  } finally { f.restore(); }
});

test("checkout: unknown zone is a 400", async () => {
  await withEnv(KEYS, async () => {
    const r = await call(load("checkout"), { body: { quantity: 1, zone: "mars" } });
    assert.equal(r.status, 400);
  });
});

test("checkout: builds the session from shop.json, server-side prices only", async () => {
  const f = stubFetch();
  try {
    await withEnv(KEYS, async () => {
      const r = await call(load("checkout"), { body: JSON.stringify({ quantity: 99, zone: "eu", lang: "de", unit_amount: 1 }) });
      assert.equal(r.status, 200);
      assert.equal(r.body.clientSecret, "cs_test_abc_secret_xyz");
      assert.equal(r.body.publishableKey, KEYS.STRIPE_PUBLISHABLE_KEY);
    });
    assert.equal(f.calls.length, 1);
    const { url, init, params: p } = f.calls[0];
    assert.equal(url, "https://api.stripe.com/v1/checkout/sessions");
    assert.equal(init.headers["Stripe-Version"], "2024-06-20");
    assert.equal(init.headers.Authorization, `Bearer ${KEYS.STRIPE_SECRET_KEY}`);
    assert.equal(p.get("ui_mode"), "embedded");
    assert.equal(p.get("mode"), "payment");
    assert.equal(p.get("locale"), "de");
    assert.equal(p.get("return_url"), "https://qefyr.com/de/danke?session_id={CHECKOUT_SESSION_ID}");
    assert.equal(p.get("line_items[0][quantity]"), String(shop.max_quantity), "quantity is clamped");
    assert.equal(p.get("line_items[0][price_data][unit_amount]"), String(shop.product.amount), "price comes from shop.json");
    assert.equal(p.get("line_items[0][price_data][currency]"), shop.currency);
    assert.equal(p.get("line_items[0][price_data][product_data][images][0]"), "https://qefyr.com/img/product.jpg");
    const eu = shop.shipping.find((z) => z.id === "eu");
    assert.equal(p.get("shipping_options[0][shipping_rate_data][fixed_amount][amount]"), String(eu.amount));
    const countries = [...p.entries()].filter(([k]) => k.startsWith("shipping_address_collection[allowed_countries]")).map(([, v]) => v);
    assert.deepEqual(countries, eu.countries);
    assert.match(p.get("custom_text[submit][message]"), /https:\/\/qefyr\.com\/de\/agb/);
    assert.equal(p.get("metadata[shipping_zone]"), "eu");
  } finally { f.restore(); }
});

test("checkout: defaults to English, quantity at least 1, no image on http origins", async () => {
  const f = stubFetch();
  try {
    await withEnv(KEYS, async () => {
      await call(load("checkout"), { body: { quantity: -4, zone: "de" }, headers: { host: "localhost:3000", "x-forwarded-proto": undefined } });
    });
    const p = f.calls[0].params;
    assert.equal(p.get("locale"), "en");
    assert.equal(p.get("line_items[0][quantity]"), "1");
    assert.equal(p.get("return_url"), "http://localhost:3000/thanks?session_id={CHECKOUT_SESSION_ID}");
    assert.equal(p.get("line_items[0][price_data][product_data][images][0]"), null);
    assert.deepEqual(p.getAll("shipping_address_collection[allowed_countries][0]"), ["DE"]);
  } finally { f.restore(); }
});

test("checkout: Stripe errors are passed on without leaking a 2xx", async () => {
  const original = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify({ error: { message: "Invalid API Key provided" } }), { status: 401 });
  try {
    await withEnv(KEYS, async () => {
      const r = await call(load("checkout"), { body: { quantity: 1, zone: "de" } });
      assert.equal(r.status, 401);
      assert.match(r.body.error, /Invalid API Key/);
    });
  } finally { globalThis.fetch = original; }
});

test("checkout: a session without client secret is an error, not a broken checkout", async () => {
  const f = stubFetch({ id: "cs_test_x", client_secret: null });
  try {
    await withEnv(KEYS, async () => {
      const r = await call(load("checkout"), { body: { quantity: 1, zone: "de" } });
      assert.equal(r.status, 502);
    });
  } finally { f.restore(); }
});

test("session-status: validates the id", async () => {
  const r = await call(load("session-status"), { method: "GET", query: { session_id: "../../v1/charges" } });
  assert.equal(r.status, 400);
});

test("session-status: returns only status fields", async () => {
  const f = stubFetch({ status: "complete", payment_status: "paid", customer_details: { email: "a@b.c" } });
  try {
    await withEnv(KEYS, async () => {
      const r = await call(load("session-status"), { method: "GET", query: { session_id: "cs_test_a1B2" } });
      assert.equal(r.status, 200);
      assert.deepEqual(r.body, { status: "complete", payment_status: "paid" });
    });
    assert.equal(f.calls[0].url, "https://api.stripe.com/v1/checkout/sessions/cs_test_a1B2");
  } finally { f.restore(); }
});

test("health: reports modes and mismatches without exposing keys", async () => {
  const f = stubFetch({ data: [] });
  try {
    await withEnv({ STRIPE_SECRET_KEY: "sk_live_51AAAAAAAAAAAAAAAAxx", STRIPE_PUBLISHABLE_KEY: "pk_test_51BBBBBBBBBBBBBBBByy" }, async () => {
      const r = await call(load("health"), { method: "GET" });
      assert.equal(r.body.secret_key_mode, "live");
      assert.equal(r.body.publishable_key_mode, "test");
      assert.equal(r.body.keys_same_mode, false);
      assert.equal(r.body.keys_same_account, false);
      assert.equal(r.body.ready, false);
      assert.ok(!JSON.stringify(r.body).includes("51AAAA"), "no key material in the response");
    });
  } finally { f.restore(); }
});

test("health: ready with a matching pair", async () => {
  const f = stubFetch({ data: [] });
  try {
    await withEnv(KEYS, async () => {
      const r = await call(load("health"), { method: "GET" });
      assert.equal(r.body.ready, true);
    });
  } finally { f.restore(); }
});

// Contract test against stripe-mock: every parameter we send must exist in Stripe's schema.
const MOCK = process.env.STRIPE_MOCK_URL;
test("contract: Stripe accepts every checkout parameter (stripe-mock)", { skip: !MOCK && "set STRIPE_MOCK_URL" }, async () => {
  await withEnv({ ...KEYS, STRIPE_API_BASE: `${MOCK.replace(/\/$/, "")}/v1/` }, async () => {
    for (const zone of shop.shipping) {
      for (const lang of ["en", "de"]) {
        const r = await call(load("checkout"), { body: { quantity: 2, zone: zone.id, lang } });
        // stripe-mock validates every parameter against the schema but returns client_secret: null,
        // so a schema error shows up as 400 while a valid request ends at our 502 guard.
        assert.notEqual(r.status, 400, `${zone.id}/${lang}: ${JSON.stringify(r.body)}`);
        assert.ok([200, 502].includes(r.status), `${zone.id}/${lang}: ${JSON.stringify(r.body)}`);
      }
    }
    const s = await call(load("session-status"), { method: "GET", query: { session_id: "cs_test_a1B2" } });
    assert.equal(s.status, 200, JSON.stringify(s.body));
    const h = await call(load("health"), { method: "GET" });
    assert.equal(h.body.stripe_reachable, true, JSON.stringify(h.body));
  });
});
