'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { Readable } = require('node:stream');
const { createHandlers } = require('../dist/lib/shop');
const drafts = require('../dist/shop/products.json');

const requestId = '9b0ce323-e0b5-42e4-a1e7-bb28c238bcbc';
const sessionId = 'cs_test_1234567890abcdefghijklmnopqrstuvwxyz';
const env = {
  SITE_URL: 'https://brinkmannpaul.com',
  STRIPE_SECRET_KEY: 'sk_test_FAKE1234567890',
  SHOP_ENABLED: 'true',
  SHOP_FULFILLMENT_READY: 'true',
  SHOP_POLICIES_READY: 'true',
  SHIPPING_ALLOWED_COUNTRIES: 'DE,AT',
  STRIPE_SHIPPING_RATE_IDS: 'shr_confirmed',
};
const confirmed = drafts.map((product) => ({
  ...product,
  active: true,
  confirmed: true,
  kind: product.kind === 'unspecified' ? 'physical' : product.kind,
  unitAmount: 1200,
  currency: 'eur',
  stripePriceId: `price_${product.id}`,
  maxQuantity: product.id === 'pdf' ? 1 : 3,
}));

function noStripe() { assert.fail('this request must not contact Stripe'); }

function priceFor(id) {
  const product = confirmed.find((item) => item.stripePriceId === id);
  return {
    id,
    active: true,
    type: 'one_time',
    billing_scheme: 'per_unit',
    unit_amount: product.unitAmount,
    currency: product.currency,
    livemode: false,
    product: { id: `prod_${product.id}`, active: true },
  };
}

function orderFixture(overrides = {}) {
  return {
    id: sessionId,
    livemode: false,
    mode: 'payment',
    status: 'complete',
    payment_status: 'paid',
    metadata: { shop_site: env.SITE_URL, shop_version: '1' },
    line_items: { has_more: false, data: [{ description: 'pdf blueprints', quantity: 1, private_field: 'hidden' }] },
    customer_details: { email: 'private@example.invalid', name: 'Private Customer' },
    shipping_details: { address: { line1: 'private street' } },
    payment_intent: 'pi_private',
    ...overrides,
  };
}

function stripeMock(overrides = {}) {
  const calls = [];
  const fetch = async (url, options) => {
    calls.push({ url, ...options });
    assert.equal(new URL(url).origin, 'https://api.stripe.com');
    assert.equal(options.redirect, 'error');
    let result;
    if (url.includes('/prices/')) {
      const id = new URL(url).pathname.split('/').at(-1);
      result = overrides.price ? overrides.price(priceFor(id)) : priceFor(id);
    } else if (url.includes('/shipping_rates/')) {
      result = {
        id: 'shr_confirmed', active: true, type: 'fixed_amount', livemode: false,
        fixed_amount: { amount: 600, currency: 'eur' }, ...overrides.shipping,
      };
    } else if (options.method === 'POST') {
      result = { url: 'https://checkout.stripe.com/c/pay/cs_test_approved', livemode: false, ...overrides.checkout };
    } else {
      result = orderFixture(overrides.order);
    }
    return { ok: true, status: 200, json: async () => result };
  };
  return { calls, fetch };
}

async function invoke(handler, { method = 'GET', url = '/api/catalog', body, headers = {}, chunks } = {}) {
  const req = chunks ? Readable.from(chunks) : {};
  Object.assign(req, { method, url, headers: { 'content-type': 'application/json', origin: env.SITE_URL, ...headers } });
  if (!chunks) req.body = body;
  const res = { headers: {}, setHeader(name, value) { this.headers[name.toLowerCase()] = value; }, end(value) { this.body = JSON.parse(value); } };
  await handler(req, res);
  assert.equal(res.headers['cache-control'], 'no-store');
  return res;
}

function checkoutRequest(items = [{ id: 'pdf', quantity: 1 }], extra = {}) {
  return { method: 'POST', url: '/api/checkout', body: { items, requestId }, ...extra };
}

test('draft catalog is publicly useful, closed and contains no private fields', async () => {
  const handlers = createHandlers({ env: {}, products: drafts, fetch: noStripe });
  const result = await invoke(handlers.catalog);
  assert.equal(result.statusCode, 200);
  assert.equal(result.body.checkoutEnabled, false);
  assert.equal(result.body.products.length, 4);
  assert.ok(result.body.products.every((product) => !product.available && product.unitAmount === null && product.currency === null));
  assert.deepEqual(Object.keys(result.body.products[0]), ['id', 'name', 'description', 'kind', 'unitAmount', 'currency', 'available', 'maxQuantity']);
  assert.equal(result.body.products[3].kind, 'unspecified');
  assert.equal(JSON.stringify(result.body).includes('stripePriceId'), false);
});

test('default sales and incomplete launch settings never contact the payment provider', async (t) => {
  for (const patch of [
    { SHOP_ENABLED: 'false' }, { SHOP_FULFILLMENT_READY: 'false' }, { SHOP_POLICIES_READY: 'false' },
    { STRIPE_SECRET_KEY: '' }, { SITE_URL: '' }, { SITE_URL: 'https://brinkmannpaul.com/other' },
    { SITE_URL: 'https://user:password@brinkmannpaul.com' }, { SITE_URL: 'http://brinkmannpaul.com' },
  ]) {
    await t.test(JSON.stringify(Object.keys(patch)), async () => {
      const handlers = createHandlers({ env: { ...env, ...patch }, products: confirmed, fetch: noStripe });
      assert.equal((await invoke(handlers.checkout, checkoutRequest())).statusCode, 503);
      assert.equal((await invoke(handlers.catalog)).body.checkoutEnabled, false);
    });
  }
});

test('unconfirmed offers, unspecified books and unsupported currency cannot be sold', async (t) => {
  for (const patch of [{ active: false }, { confirmed: false }, { kind: 'unspecified' }, { unitAmount: null }, { unitAmount: 0 }, { currency: 'jpy' }, { stripePriceId: null }]) {
    await t.test(JSON.stringify(patch), async () => {
      const products = [{ ...confirmed[0], ...patch }];
      const handlers = createHandlers({ env, products, fetch: noStripe });
      assert.equal((await invoke(handlers.checkout, checkoutRequest())).statusCode, 503);
      assert.equal((await invoke(handlers.catalog)).body.products[0].available, false);
    });
  }
});

test('cross-origin or missing-origin creation is rejected before provider calls', async () => {
  const handlers = createHandlers({ env, products: confirmed, fetch: noStripe });
  for (const origin of ['https://attacker.invalid', '', 'null', 'https://brinkmannpaul.com.attacker.invalid']) {
    const result = await invoke(handlers.checkout, checkoutRequest(undefined, { headers: { origin } }));
    assert.equal(result.statusCode, 403);
  }
});

test('cart rejects tampering, duplicates, invalid quantities and unknown products', async (t) => {
  const invalid = [
    { items: [] },
    { items: [{ id: 'missing', quantity: 1 }] },
    { items: [{ id: 'pdf', quantity: 0 }] },
    { items: [{ id: 'pdf', quantity: -1 }] },
    { items: [{ id: 'pdf', quantity: 0.5 }] },
    { items: [{ id: 'pdf', quantity: '1' }] },
    { items: [{ id: 'pdf', quantity: 2 }] },
    { items: [{ id: 'pdf', quantity: 1 }, { id: 'pdf', quantity: 1 }] },
    { items: [{ id: 'pdf', quantity: 1, unitAmount: 1 }] },
    { items: [{ id: 'pdf', quantity: 1 }], currency: 'usd' },
    { items: [{ id: 'pdf', quantity: 1 }], shipping: 0 },
    { requestId: 'not-a-uuid' },
    { requestId: [requestId] },
  ];
  const handlers = createHandlers({ env, products: confirmed, fetch: noStripe });
  for (const patch of invalid) {
    await t.test(JSON.stringify(patch), async () => {
      const request = checkoutRequest();
      request.body = { ...request.body, ...patch };
      assert.equal((await invoke(handlers.checkout, request)).statusCode, 400);
    });
  }
});

test('currency-mixed carts are rejected before Stripe requests', async () => {
  const products = confirmed.map((product) => ({ ...product, currency: product.id === 'kefir' ? 'usd' : 'eur' }));
  const handlers = createHandlers({ env, products, fetch: noStripe });
  const result = await invoke(handlers.checkout, checkoutRequest([{ id: 'pdf', quantity: 1 }, { id: 'kefir', quantity: 1 }]));
  assert.equal(result.statusCode, 400);
});

test('methods, content type, body size and malformed JSON are constrained', async () => {
  const handlers = createHandlers({ env, products: confirmed, fetch: noStripe });
  const methodResult = await invoke(handlers.checkout);
  assert.equal(methodResult.statusCode, 405);
  assert.equal(methodResult.headers.allow, 'POST');
  assert.equal((await invoke(handlers.catalog, { method: 'POST' })).statusCode, 405);
  assert.equal((await invoke(handlers.checkout, checkoutRequest(undefined, { headers: { 'content-type': 'text/plain' } }))).statusCode, 415);
  assert.equal((await invoke(handlers.checkout, checkoutRequest(undefined, { body: 'broken json' }))).statusCode, 400);
  assert.equal((await invoke(handlers.checkout, checkoutRequest(undefined, { headers: { 'content-length': '4097' } }))).statusCode, 413);
  assert.equal((await invoke(handlers.checkout, checkoutRequest(undefined, { chunks: [' '.repeat(4097)] }))).statusCode, 413);
});

test('digital checkout uses server prices, stable idempotency and configured origin only', async () => {
  const mock = stripeMock();
  const handlers = createHandlers({ env, products: confirmed, fetch: mock.fetch });
  const request = checkoutRequest(undefined, { headers: { host: 'attacker.invalid', 'x-forwarded-host': 'attacker.invalid' } });
  const result = await invoke(handlers.checkout, request);
  assert.equal(result.statusCode, 200);
  assert.deepEqual(result.body, { url: 'https://checkout.stripe.com/c/pay/cs_test_approved' });
  const post = mock.calls.find((call) => call.method === 'POST');
  const params = new URLSearchParams(post.body);
  assert.equal(params.get('line_items[0][price]'), 'price_pdf');
  assert.equal(params.get('line_items[0][quantity]'), '1');
  assert.equal(params.get('success_url'), `${env.SITE_URL}/order.html?session_id={CHECKOUT_SESSION_ID}`);
  assert.equal(params.get('metadata[shop_site]'), env.SITE_URL);
  assert.equal(params.has('shipping_options[0][shipping_rate]'), false);
  assert.equal(params.has('shipping_address_collection[allowed_countries][0]'), false);
  assert.ok(post.headers['Idempotency-Key'].endsWith(requestId));
  assert.equal(post.body.includes('attacker.invalid'), false);
  await invoke(handlers.checkout, request);
  const posts = mock.calls.filter((call) => call.method === 'POST');
  assert.equal(posts[0].headers['Idempotency-Key'], posts[1].headers['Idempotency-Key']);
  assert.equal(posts[0].body, posts[1].body);
});

test('streamed JSON body works for the local server', async () => {
  const mock = stripeMock();
  const handlers = createHandlers({ env, products: confirmed, fetch: mock.fetch });
  const request = checkoutRequest();
  request.chunks = [JSON.stringify(request.body)];
  assert.equal((await invoke(handlers.checkout, request)).statusCode, 200);
});

test('mismatched, inactive or recurring Stripe prices never create checkout', async (t) => {
  for (const patch of [
    { unit_amount: 1 }, { currency: 'usd' }, { active: false }, { type: 'recurring' },
    { livemode: true }, { billing_scheme: 'tiered' }, { transform_quantity: { divide_by: 5 } },
    { product: { active: false } }, { product: { active: true, deleted: true } },
  ]) {
    await t.test(JSON.stringify(patch), async () => {
      const mock = stripeMock({ price: (price) => ({ ...price, ...patch }) });
      const handlers = createHandlers({ env, products: confirmed, fetch: mock.fetch });
      assert.equal((await invoke(handlers.checkout, checkoutRequest())).statusCode, 503);
      assert.equal(mock.calls.some((call) => call.method === 'POST'), false);
    });
  }
});

test('physical checkout requires confirmed shipping countries and rates', async () => {
  for (const patch of [{ SHIPPING_ALLOWED_COUNTRIES: '' }, { STRIPE_SHIPPING_RATE_IDS: '' }]) {
    const handlers = createHandlers({ env: { ...env, ...patch }, products: confirmed, fetch: noStripe });
    assert.equal((await invoke(handlers.checkout, checkoutRequest([{ id: 'kefir', quantity: 1 }]))).statusCode, 503);
    const catalog = (await invoke(handlers.catalog)).body;
    assert.equal(catalog.products.find((product) => product.id === 'kefir').available, false);
    assert.equal(catalog.products.find((product) => product.id === 'pdf').available, true);
  }
  const mock = stripeMock();
  const handlers = createHandlers({ env, products: confirmed, fetch: mock.fetch });
  const result = await invoke(handlers.checkout, checkoutRequest([{ id: 'pdf', quantity: 1 }, { id: 'kefir', quantity: 2 }]));
  assert.equal(result.statusCode, 200);
  assert.ok(mock.calls.some((call) => call.url.includes('/shipping_rates/shr_confirmed')));
  const params = new URLSearchParams(mock.calls.find((call) => call.method === 'POST').body);
  assert.equal(params.get('shipping_options[0][shipping_rate]'), 'shr_confirmed');
  assert.equal(params.get('shipping_address_collection[allowed_countries][0]'), 'DE');
  assert.equal(params.get('shipping_address_collection[allowed_countries][1]'), 'AT');
});

test('unverified shipping rates cannot start physical checkout', async (t) => {
  for (const shipping of [{ active: false }, { livemode: true }, { fixed_amount: { amount: 600, currency: 'usd' } }]) {
    await t.test(JSON.stringify(shipping), async () => {
      const mock = stripeMock({ shipping });
      const handlers = createHandlers({ env, products: confirmed, fetch: mock.fetch });
      assert.equal((await invoke(handlers.checkout, checkoutRequest([{ id: 'kefir', quantity: 1 }]))).statusCode, 503);
      assert.equal(mock.calls.some((call) => call.method === 'POST'), false);
    });
  }
});

test('only verified Stripe-hosted checkout redirects are exposed', async () => {
  for (const checkout of [{ url: 'https://attacker.invalid/pay' }, { url: 'javascript:alert(1)' }, { livemode: true }]) {
    const mock = stripeMock({ checkout });
    const handlers = createHandlers({ env, products: confirmed, fetch: mock.fetch });
    assert.equal((await invoke(handlers.checkout, checkoutRequest())).statusCode, 503);
  }
});

test('provider failures return generic safe errors, never key or provider error content', async () => {
  for (const fetch of [
    async () => { throw new Error(env.STRIPE_SECRET_KEY); },
    async () => ({ ok: false, status: 401, json: async () => ({ error: { message: env.STRIPE_SECRET_KEY } }) }),
  ]) {
    const handlers = createHandlers({ env, products: confirmed, fetch });
    const result = await invoke(handlers.checkout, checkoutRequest());
    assert.equal(result.statusCode, 503);
    assert.equal(JSON.stringify(result.body).includes(env.STRIPE_SECRET_KEY), false);
  }
});

test('order verification returns payment status and product names only, even with sales disabled', async () => {
  const mock = stripeMock();
  const handlers = createHandlers({ env: { ...env, SHOP_ENABLED: 'false' }, products: confirmed, fetch: mock.fetch });
  const result = await invoke(handlers.order, { url: `/api/order?session_id=${sessionId}` });
  assert.equal(result.statusCode, 200);
  assert.deepEqual(result.body, { status: 'paid', items: [{ name: 'pdf blueprints', quantity: 1 }] });
  assert.equal(JSON.stringify(result.body).includes('private'), false);
});

test('success query cannot fake payment and mismatched shop or mode is rejected', async (t) => {
  for (const order of [
    { metadata: { shop_site: 'https://other.invalid', shop_version: '1' } },
    { metadata: {} }, { mode: 'subscription' }, { livemode: true }, { id: 'cs_test_different' },
  ]) {
    await t.test(JSON.stringify(order), async () => {
      const mock = stripeMock({ order });
      const handlers = createHandlers({ env, products: confirmed, fetch: mock.fetch });
      assert.equal((await invoke(handlers.order, { url: `/api/order?session_id=${sessionId}` })).statusCode, 404);
    });
  }
  const handlers = createHandlers({ env, products: confirmed, fetch: noStripe });
  for (const query of ['success=true', `session_id=${sessionId}&paid=true`, `session_id=${sessionId}&session_id=${sessionId}`, 'session_id=../../secrets', 'session_id=cs_live_1234567890abcdef']) {
    assert.equal((await invoke(handlers.order, { url: `/api/order?${query}` })).statusCode, 400);
  }
});

test('unpaid/open sessions stay pending; expired sessions are not paid', async () => {
  for (const [order, expected] of [
    [{ status: 'open', payment_status: 'unpaid' }, 'pending'],
    [{ status: 'complete', payment_status: 'unpaid' }, 'pending'],
    [{ status: 'expired', payment_status: 'unpaid' }, 'not_paid'],
    [{ status: 'open', payment_status: 'paid' }, 'pending'],
  ]) {
    const mock = stripeMock({ order });
    const handlers = createHandlers({ env, products: confirmed, fetch: mock.fetch });
    assert.equal((await invoke(handlers.order, { url: `/api/order?session_id=${sessionId}` })).body.status, expected);
  }
});

test('truncated or malformed line items cannot yield a paid confirmation', async () => {
  for (const line_items of [{ has_more: true, data: [{ description: 'pdf', quantity: 1 }] }, { data: [] }, { data: [{ description: 'pdf', quantity: -1 }] }]) {
    const mock = stripeMock({ order: { line_items } });
    const handlers = createHandlers({ env, products: confirmed, fetch: mock.fetch });
    assert.equal((await invoke(handlers.order, { url: `/api/order?session_id=${sessionId}` })).statusCode, 503);
  }
});
