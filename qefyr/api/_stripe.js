// Minimal Stripe REST client for Vercel functions. No SDK, no dependencies.
// Keys live only in Vercel's environment variables, never in the repo.
const API = process.env.STRIPE_API_BASE || "https://api.stripe.com/v1/";
// Pinned API version: Stripe renamed ui_mode "embedded" to "embedded_page" in 2026-03-25.
// Pinning keeps every parameter below valid, whatever the account's default version is.
const VERSION = "2024-06-20";

function encode(params, prefix = "", out = []) {
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null) continue;
    const key = prefix ? `${prefix}[${k}]` : k;
    if (typeof v === "object") encode(v, key, out);
    else out.push(`${encodeURIComponent(key)}=${encodeURIComponent(v)}`);
  }
  return out.join("&");
}

async function stripe(method, path, params) {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    const err = new Error("STRIPE_SECRET_KEY is not set");
    err.status = 503;
    throw err;
  }
  const query = method === "GET" && params ? `?${encode(params)}` : "";
  const res = await fetch(API + path + query, {
    method,
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/x-www-form-urlencoded",
      "Stripe-Version": VERSION,
    },
    body: method === "GET" ? undefined : encode(params || {}),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error?.message || `Stripe request failed (${res.status})`);
    err.status = res.status >= 500 ? 502 : res.status;
    throw err;
  }
  return data;
}

// Stripe expects arrays as indexed objects: { 0: "DE", 1: "AT" }.
const list = (arr) => Object.fromEntries(arr.map((v, i) => [i, v]));

// Vercel parses JSON bodies; other hosts may hand over a string or nothing.
function readBody(req) {
  let body = req.body || {};
  if (typeof body === "string") {
    try { body = JSON.parse(body); } catch { body = {}; }
  }
  return body && typeof body === "object" ? body : {};
}

function origin(req) {
  if (process.env.SITE_URL) return process.env.SITE_URL.replace(/\/$/, "");
  const host = req.headers["x-forwarded-host"] || req.headers.host;
  const proto = req.headers["x-forwarded-proto"] || (/^(localhost|127\.)/.test(host || "") ? "http" : "https");
  return `${String(proto).split(",")[0]}://${host}`;
}

module.exports = { stripe, encode, list, readBody, origin, VERSION };
