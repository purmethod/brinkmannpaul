'use strict';

const { createHash } = require('node:crypto');
const defaultProducts = require('../shop/products.json');

const MAX_BODY_BYTES = 4096;
const MAX_ITEMS = 4;
const MAX_QUANTITY = 20;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const UNAVAILABLE = 'checkout is not available yet. please request product details.';

class ShopError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function reply(res, status, data) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.end(JSON.stringify(data));
}

function header(req, name) {
  const value = req.headers && req.headers[name];
  return typeof value === 'string' ? value : '';
}

function method(req, res, expected) {
  if (req.method !== expected) {
    res.setHeader('Allow', expected);
    throw new ShopError(405, 'method not allowed.');
  }
}

function plainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function onlyKeys(value, keys) {
  return Object.keys(value).every((key) => keys.includes(key));
}

function configuredOrigin(env) {
  try {
    const url = new URL(env.SITE_URL);
    const local = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
    const allowLocal = local && ['development', 'test'].includes(env.NODE_ENV)
      && /^(sk|rk)_test_/.test(env.STRIPE_SECRET_KEY || '');
    if ((url.protocol !== 'https:' && !(allowLocal && url.protocol === 'http:'))
      || url.username || url.password || url.pathname !== '/' || url.search || url.hash) return null;
    return url.origin;
  } catch {
    return null;
  }
}

function config(env) {
  const secret = env.STRIPE_SECRET_KEY || '';
  const keyMatch = secret.match(/^(?:sk|rk)_(test|live)_[a-zA-Z0-9]{8,}$/);
  const site = configuredOrigin(env);
  const countries = (env.SHIPPING_ALLOWED_COUNTRIES || '').split(',').map((item) => item.trim()).filter(Boolean);
  const shippingRates = (env.STRIPE_SHIPPING_RATE_IDS || '').split(',').map((item) => item.trim()).filter(Boolean);
  return {
    site,
    secret,
    live: keyMatch ? keyMatch[1] === 'live' : null,
    readable: Boolean(keyMatch && site),
    enabled: Boolean(keyMatch && site && env.SHOP_ENABLED === 'true'
      && env.SHOP_FULFILLMENT_READY === 'true' && env.SHOP_POLICIES_READY === 'true'),
    countries,
    shippingRates,
    shippingReady: countries.length > 0 && countries.length <= 100
      && countries.every((country) => /^[A-Z]{2}$/.test(country))
      && new Set(countries).size === countries.length
      && shippingRates.length > 0 && shippingRates.length <= 5
      && shippingRates.every((rate) => /^shr_[a-zA-Z0-9]+$/.test(rate))
      && new Set(shippingRates).size === shippingRates.length,
  };
}

function validProduct(product) {
  return plainObject(product) && /^[a-z][a-z0-9-]{0,39}$/.test(product.id)
    && typeof product.name === 'string' && product.name.length > 0 && product.name.length <= 100
    && typeof product.description === 'string' && product.description.length <= 1000
    && ['digital', 'physical'].includes(product.kind)
    && product.active === true && product.confirmed === true
    && Number.isSafeInteger(product.unitAmount) && product.unitAmount > 0 && product.unitAmount <= 99999999
    // The storefront currently formats minor units with two decimal places.
    && ['eur', 'usd', 'gbp', 'chf'].includes(product.currency)
    && /^price_[a-zA-Z0-9]+$/.test(product.stripePriceId || '')
    && Number.isInteger(product.maxQuantity) && product.maxQuantity >= 1 && product.maxQuantity <= MAX_QUANTITY;
}

function available(product, settings) {
  return settings.enabled && validProduct(product)
    && (product.kind !== 'physical' || settings.shippingReady);
}

async function readJson(req) {
  if (!/^application\/json(?:\s*;\s*charset=utf-8)?$/i.test(header(req, 'content-type'))) {
    throw new ShopError(415, 'send a json request.');
  }
  const length = header(req, 'content-length');
  if (length && (!/^\d+$/.test(length) || Number(length) > MAX_BODY_BYTES)) {
    throw new ShopError(413, 'request is too large.');
  }
  let body = req.body;
  if (body === undefined) {
    const chunks = [];
    let size = 0;
    for await (const chunk of req) {
      const bytes = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
      size += bytes.length;
      if (size > MAX_BODY_BYTES) throw new ShopError(413, 'request is too large.');
      chunks.push(bytes);
    }
    body = Buffer.concat(chunks).toString('utf8');
  }
  if (Buffer.isBuffer(body)) body = body.toString('utf8');
  try {
    if (Buffer.byteLength(typeof body === 'string' ? body : JSON.stringify(body)) > MAX_BODY_BYTES) {
      throw new ShopError(413, 'request is too large.');
    }
    const parsed = typeof body === 'string' ? JSON.parse(body) : body;
    if (!plainObject(parsed)) throw new Error('invalid json');
    return parsed;
  } catch (error) {
    if (error instanceof ShopError) throw error;
    throw new ShopError(400, 'invalid request.');
  }
}

function cartFrom(body, products, settings) {
  if (!onlyKeys(body, ['items', 'requestId']) || typeof body.requestId !== 'string' || !UUID.test(body.requestId)
    || !Array.isArray(body.items) || body.items.length < 1 || body.items.length > MAX_ITEMS) {
    throw new ShopError(400, 'invalid cart.');
  }
  const seen = new Set();
  const cart = body.items.map((item) => {
    if (!plainObject(item) || !onlyKeys(item, ['id', 'quantity']) || typeof item.id !== 'string'
      || !Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > MAX_QUANTITY
      || seen.has(item.id)) throw new ShopError(400, 'invalid cart.');
    seen.add(item.id);
    const product = products.find((entry) => entry.id === item.id);
    if (!product) throw new ShopError(400, 'unknown product.');
    if (!available(product, settings)) throw new ShopError(503, UNAVAILABLE);
    if (item.quantity > product.maxQuantity) throw new ShopError(400, 'requested quantity is unavailable.');
    return { product, quantity: item.quantity };
  });
  if (new Set(cart.map((item) => item.product.currency)).size !== 1) {
    throw new ShopError(400, 'these products cannot be checked out together.');
  }
  return cart.sort((a, b) => a.product.id.localeCompare(b.product.id));
}

function createHandlers({ env = process.env, products = defaultProducts, fetch: fetcher = globalThis.fetch } = {}) {
  async function stripe(settings, path, { body, idempotencyKey } = {}) {
    const headers = { Authorization: `Bearer ${settings.secret}` };
    if (body) headers['Content-Type'] = 'application/x-www-form-urlencoded';
    if (idempotencyKey) headers['Idempotency-Key'] = idempotencyKey;
    try {
      const response = await fetcher(`https://api.stripe.com/v1/${path}`, {
        method: body ? 'POST' : 'GET',
        headers,
        body: body ? body.toString() : undefined,
        signal: AbortSignal.timeout(10000),
        redirect: 'error',
      });
      if (!response.ok) {
        if (response.status === 409) throw new ShopError(409, 'checkout is already being prepared. please try again.');
        throw new ShopError(503, 'checkout could not be verified. please try again later.');
      }
      return await response.json();
    } catch (error) {
      if (error instanceof ShopError) throw error;
      throw new ShopError(503, 'checkout could not be verified. please try again later.');
    }
  }

  const safe = (handler) => async (req, res) => {
    try {
      if (!Array.isArray(products) || new Set(products.map((item) => item.id)).size !== products.length) {
        throw new ShopError(503, UNAVAILABLE);
      }
      await handler(req, res);
    } catch (error) {
      reply(res, error instanceof ShopError ? error.status : 503,
        { error: error instanceof ShopError ? error.message : UNAVAILABLE });
    }
  };

  return {
    catalog: safe(async (req, res) => {
      method(req, res, 'GET');
      const settings = config(env);
      const result = products.map((product) => ({
        id: product.id,
        name: product.name,
        description: product.description,
        kind: product.kind,
        unitAmount: validProduct(product) ? product.unitAmount : null,
        currency: validProduct(product) ? product.currency : null,
        available: available(product, settings),
        maxQuantity: Number.isInteger(product.maxQuantity) ? product.maxQuantity : 1,
      }));
      reply(res, 200, { checkoutEnabled: result.some((product) => product.available), products: result });
    }),

    checkout: safe(async (req, res) => {
      method(req, res, 'POST');
      const settings = config(env);
      if (!settings.enabled) throw new ShopError(503, UNAVAILABLE);
      if (header(req, 'origin') !== settings.site) throw new ShopError(403, 'request origin is not allowed.');
      const body = await readJson(req);
      const cart = cartFrom(body, products, settings);
      const currency = cart[0].product.currency;
      for (const { product } of cart) {
        const price = await stripe(settings, `prices/${encodeURIComponent(product.stripePriceId)}?expand[]=product`);
        if (price.id !== product.stripePriceId || price.active !== true || price.type !== 'one_time'
          || price.billing_scheme !== 'per_unit' || price.unit_amount !== product.unitAmount
          || price.currency !== currency || price.livemode !== settings.live || price.transform_quantity
          || !plainObject(price.product) || price.product.active !== true || price.product.deleted) {
          throw new ShopError(503, UNAVAILABLE);
        }
      }
      const physical = cart.some(({ product }) => product.kind === 'physical');
      if (physical) {
        for (const id of settings.shippingRates) {
          const rate = await stripe(settings, `shipping_rates/${encodeURIComponent(id)}`);
          if (rate.id !== id || rate.active !== true || rate.type !== 'fixed_amount'
            || rate.livemode !== settings.live || rate.fixed_amount?.currency !== currency
            || !Number.isSafeInteger(rate.fixed_amount.amount) || rate.fixed_amount.amount < 0) {
            throw new ShopError(503, UNAVAILABLE);
          }
        }
      }
      const params = new URLSearchParams({
        mode: 'payment',
        'payment_method_types[0]': 'card',
        success_url: `${settings.site}/order.html?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${settings.site}/?checkout=cancelled#products`,
        'metadata[shop_site]': settings.site,
        'metadata[shop_version]': '1',
        'payment_intent_data[metadata][shop_site]': settings.site,
        client_reference_id: body.requestId.toLowerCase(),
      });
      cart.forEach(({ product, quantity }, index) => {
        params.set(`line_items[${index}][price]`, product.stripePriceId);
        params.set(`line_items[${index}][quantity]`, String(quantity));
      });
      if (physical) {
        settings.countries.forEach((country, index) => params.set(`shipping_address_collection[allowed_countries][${index}]`, country));
        settings.shippingRates.forEach((rate, index) => params.set(`shipping_options[${index}][shipping_rate]`, rate));
      }
      const siteHash = createHash('sha256').update(settings.site).digest('hex').slice(0, 16);
      const session = await stripe(settings, 'checkout/sessions', {
        body: params,
        idempotencyKey: `bp-checkout-${siteHash}-${body.requestId.toLowerCase()}`,
      });
      let checkoutUrl;
      try { checkoutUrl = new URL(session.url); } catch { throw new ShopError(503, UNAVAILABLE); }
      if (checkoutUrl.protocol !== 'https:' || checkoutUrl.hostname !== 'checkout.stripe.com'
        || checkoutUrl.username || checkoutUrl.password || checkoutUrl.port
        || session.livemode !== settings.live) throw new ShopError(503, UNAVAILABLE);
      reply(res, 200, { url: checkoutUrl.href });
    }),

    order: safe(async (req, res) => {
      method(req, res, 'GET');
      const settings = config(env);
      if (!settings.readable) throw new ShopError(503, 'order status is not available right now.');
      const query = new URL(req.url, settings.site).searchParams;
      const id = query.get('session_id');
      if ([...query.keys()].some((key) => key !== 'session_id') || query.getAll('session_id').length !== 1
        || !/^cs_(test|live)_[a-zA-Z0-9]{10,200}$/.test(id || '')
        || id.startsWith('cs_live_') !== settings.live) throw new ShopError(400, 'invalid order reference.');
      const session = await stripe(settings, `checkout/sessions/${encodeURIComponent(id)}?expand[]=line_items`);
      if (session.id !== id || session.mode !== 'payment' || session.livemode !== settings.live
        || session.metadata?.shop_site !== settings.site || session.metadata?.shop_version !== '1') {
        throw new ShopError(404, 'order could not be found.');
      }
      const lines = session.line_items;
      if (!Array.isArray(lines?.data) || lines.has_more || lines.data.length < 1 || lines.data.length > MAX_ITEMS
        || lines.data.some((line) => typeof line.description !== 'string' || line.description.length > 1000
          || !Number.isInteger(line.quantity) || line.quantity < 1 || line.quantity > MAX_QUANTITY)) {
        throw new ShopError(503, 'order status is not available right now.');
      }
      const status = session.status === 'complete' && session.payment_status === 'paid' ? 'paid'
        : session.status === 'expired' ? 'not_paid'
          : ['open', 'complete'].includes(session.status) ? 'pending' : 'not_paid';
      reply(res, 200, {
        status,
        items: lines.data.map((line) => ({ name: line.description, quantity: line.quantity })),
      });
    }),
  };
}

module.exports = { createHandlers };
