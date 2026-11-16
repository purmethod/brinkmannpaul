// /api/news · foyo club: sign-ups for the newsletter (one short mail on sundays, and a note before the
// next session or retreat). POST { email, lang } → { ok }
// Each address is a customer in Paul's Stripe account (metadata.foyo_news = "1"), like the sign-ups to the
// sessions: no database, never twice. Nothing is sent from here yet: "confirmed" stays "no" until the person
// has confirmed the address by mail (double opt-in), which the sending will do before its first letter.
const { stripe } = require("./_stripe");
const { limited, note, ipOf } = require("./_limit");

const ORIGINS = ["https://myfoyo.com", "https://www.myfoyo.com"];
const LANGS = ["en", "de", "fr", "es", "ar", "ru"];
const HOUR = 60 * 60 * 1000;

module.exports = async (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  const origin = req.headers.origin;
  if (ORIGINS.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    res.setHeader("Access-Control-Max-Age", "600");
  }
  res.setHeader("Vary", "Origin");
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") { res.setHeader("Allow", "POST"); return res.status(405).json({ error: "Method not allowed" }); }
  let body = req.body || {};
  if (typeof body === "string") { try { body = JSON.parse(body); } catch { body = {}; } }
  if (!body || typeof body !== "object") body = {};
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
        metadata: { foyo_news: "1", lang, confirmed: "no", asked: new Date().toISOString(), source: "myfoyo.com" },
      });
    }
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("news", err.status, err.message);
    return res.status(502).json({ error: "unavailable" });
  }
};
