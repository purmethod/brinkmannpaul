// /api/news · foyo club: sign-ups for the newsletter (one short mail on sundays, and a note before the
// next session or retreat). POST { email, lang, from } → { ok }
// Paul (header x-soma-key = SOMA_ADMIN_KEY): GET → { subscribers: [{ id, email, lang, from, at }] }, POST { remove: id } → { ok }
// Each address is a customer in Paul's Stripe account (metadata.foyo_news = "1"), like the sign-ups to the
// sessions: no database, never twice. Nothing is sent from here yet: "confirmed" stays "no" until the person
// has confirmed the address by mail (double opt-in), which the sending will do before its first letter.
const crypto = require("crypto");
const { stripe } = require("./_stripe");
const { limited, note, clear, ipOf } = require("./_limit");

const ORIGINS = ["https://myfoyo.com", "https://www.myfoyo.com"];
const LANGS = ["en", "de", "fr", "es", "ar", "ru"];
const HOUR = 60 * 60 * 1000;
const FROM = ["home", "newsletter"]; // the start page, or myfoyo.com/newsletter (the link in a story)
function isAdmin(req) {
  const key = process.env.SOMA_ADMIN_KEY || "";
  const given = String(req.headers["x-soma-key"] || "");
  if (!key || !given) return false;
  return crypto.timingSafeEqual(crypto.createHash("sha256").update(key).digest(), crypto.createHash("sha256").update(given).digest());
}
// every address on the list, through stripe's search; where search is not there, through the plain list
async function subscribers() {
  const out = [];
  try {
    let page;
    for (let i = 0; i < 20; i++) {
      const r = await stripe("GET", "customers/search", { query: "metadata['foyo_news']:'1'", limit: 100, page });
      out.push(...(r.data || []));
      if (!r.has_more || !r.next_page) return out;
      page = r.next_page;
    }
    return out;
  } catch (err) {
    console.error("news search", err.status, err.message);
    out.length = 0;
    let after;
    for (let i = 0; i < 50; i++) {
      const list = await stripe("GET", "customers", { limit: 100, starting_after: after });
      for (const c of list.data || []) if (c.metadata && c.metadata.foyo_news === "1") out.push(c);
      if (!list.has_more || !list.data.length) break;
      after = list.data[list.data.length - 1].id;
    }
    return out;
  }
}

module.exports = async (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  const origin = req.headers.origin;
  if (ORIGINS.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, x-soma-key");
    res.setHeader("Access-Control-Max-Age", "600");
  }
  res.setHeader("Vary", "Origin");
  if (req.method === "OPTIONS") return res.status(204).end();
  let body = req.body || {};
  if (typeof body === "string") { try { body = JSON.parse(body); } catch { body = {}; } }
  if (!body || typeof body !== "object") body = {};
  // ---------- paul: the list ----------
  if (req.headers["x-soma-key"] !== undefined) {
    const ip = ipOf(req);
    if (limited("admin", ip, 5, 15 * 60 * 1000)) return res.status(429).json({ error: "locked" });
    if (!isAdmin(req)) { note("admin", ip, 15 * 60 * 1000); return res.status(401).json({ error: "key" }); }
    clear("admin", ip);
    try {
      if (req.method === "GET") {
        const list = (await subscribers()).sort((a, b) => b.created - a.created).map((c) => ({
          id: c.id, email: c.email || "", lang: c.metadata.lang || "", from: c.metadata.from || "home", at: new Date(c.created * 1000).toISOString() }));
        return res.status(200).json({ subscribers: list });
      }
      const id = String(body.remove || "");
      if (!/^cus_[A-Za-z0-9]+$/.test(id)) return res.status(400).json({ error: "invalid" });
      const c = await stripe("GET", "customers/" + id).catch(() => null);
      if (!c || c.deleted || !c.metadata || c.metadata.foyo_news !== "1") return res.status(404).json({ error: "gone" });
      await stripe("DELETE", "customers/" + id);
      return res.status(200).json({ ok: true });
    } catch (err) {
      console.error("news admin", err.status, err.message);
      return res.status(502).json({ error: "unavailable" });
    }
  }
  if (req.method !== "POST") { res.setHeader("Allow", "POST"); return res.status(405).json({ error: "Method not allowed" }); }
  if (body.company) return res.status(200).json({ ok: true }); // the field people never see: bots fill it in
  const email = String(body.email || "").replace(/\s+/g, "").toLowerCase().slice(0, 254);
  if (!/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]{2,}$/.test(email)) return res.status(400).json({ error: "email" });
  const lang = LANGS.includes(body.lang) ? body.lang : "en";
  const ip = ipOf(req);
  if (limited("news", ip, 6, HOUR) || limited("news-all", "all", 300, HOUR)) return res.status(429).json({ error: "busy" });
  note("news", ip, HOUR); note("news-all", "all", HOUR);
  try {
    const found = await stripe("GET", "customers", { email, limit: 100 });
    // the same answer whether the address is new or already there
    if (!(found.data || []).some((c) => c.metadata && c.metadata.foyo_news === "1")) {
      await stripe("POST", "customers", {
        email,
        description: "foyo club · newsletter",
        metadata: { foyo_news: "1", lang, from: FROM.includes(body.from) ? body.from : "home", confirmed: "no", asked: new Date().toISOString(), source: "myfoyo.com" },
      });
    }
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("news", err.status, err.message);
    return res.status(502).json({ error: "unavailable" });
  }
};
