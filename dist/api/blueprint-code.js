// POST /api/blueprint-code { code, step: "check" | "claim" } → { ok } for a free code to the pure blueprint.
// Paul's codes for tests and gifts. Each code writes one book (MAX_BOOKS), like one payment.
// No code is stored as text anywhere: BLUEPRINT_CODE_HASHES (Vercel only) holds a salted scrypt fingerprint
// per code, "salt.hash" in hex, comma separated. Make one with scripts/blueprint-code-hash.js.
// The book server (purmethod.com) asks "check" before writing a book and "claim" once it is written, so a
// failed book is not counted. A used code is marked on an archived Stripe product, so no database is needed.
const crypto = require("crypto");
const { stripe } = require("./_stripe");
const { MAX_BOOKS } = require("./_blueprint");

// case and spaces do not matter: "abc 123" is ABC123
const norm = (s) => String(s || "").toUpperCase().replace(/\s+/g, "").slice(0, 40);

function fingerprint(code, salt) {
  return crypto.scryptSync(norm(code), salt, 32).toString("hex");
}

function makeHash(code) {
  const salt = crypto.randomBytes(16);
  return `${salt.toString("hex")}.${fingerprint(code, salt)}`;
}

// the stored fingerprint that matches this code, or null
function match(code) {
  if (!norm(code)) return null;
  for (const entry of String(process.env.BLUEPRINT_CODE_HASHES || "").split(",")) {
    const [salt, hash] = entry.trim().split(".");
    if (!/^[0-9a-f]{32}$/.test(salt || "") || !/^[0-9a-f]{64}$/.test(hash || "")) continue;
    const got = Buffer.from(fingerprint(code, Buffer.from(salt, "hex")), "hex");
    if (crypto.timingSafeEqual(got, Buffer.from(hash, "hex"))) return hash;
  }
  return null;
}

// wrong codes per address and hour, per instance: guessing stays slow
const wrong = new Map();
function guessing(ip) {
  const now = Date.now();
  const recent = (wrong.get(ip) || []).filter((t) => now - t < 3600000);
  wrong.set(ip, recent);
  return recent.length >= 10;
}

module.exports = async (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }
  let body = req.body || {};
  if (typeof body === "string") {
    try { body = JSON.parse(body); } catch { body = {}; }
  }
  const ip = String(req.headers["x-forwarded-for"] || "").split(",")[0].trim() || "unknown";
  if (guessing(ip)) return res.status(429).json({ ok: false, error: "rate_limited" });
  const hash = match(body.code);
  if (!hash) {
    wrong.get(ip).push(Date.now());
    return res.status(402).json({ ok: false, error: "code_invalid" });
  }

  const id = `bp_code_${hash.slice(0, 24)}`;
  try {
    let marker = null;
    try {
      marker = await stripe("GET", `products/${id}`);
    } catch (err) {
      if (err.status !== 404) throw err;
    }
    const books = marker ? parseInt(marker.metadata && marker.metadata.books, 10) || 0 : 0;
    if (books >= MAX_BOOKS) return res.status(409).json({ ok: false, error: "code_used" });
    const metadata = { product: "blueprint-code", books: String(body.step === "claim" ? books + 1 : books) };
    // the marker is made on the first check, which also proves the key may write it before any book is written
    if (!marker) {
      await stripe("POST", "products", {
        id,
        name: "pure blueprint · free code",
        description: "marks one of paul's free blueprint codes. books counts the books written with it. do not delete.",
        active: false,
        metadata,
      });
    } else if (body.step === "claim") {
      await stripe("POST", `products/${id}`, { metadata });
    }
    return res.status(200).json({ ok: true });
  } catch (err) {
    // no marker, no free book: a code must never write more than one
    console.error("blueprint code not checked", err.status, err.message);
    return res.status(503).json({ ok: false, error: "busy" });
  }
};

module.exports.makeHash = makeHash;
module.exports.match = match;
