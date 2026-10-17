// POST /api/waitlist { email, lang, list } → keeps the address on a waitlist.
// The list lives in Paul's Stripe account as customers tagged metadata.waitlist
// (Customers → filter by metadata exports it), never twice. With its own Stripe
// key this project writes there itself; until then it hands the sign-up to
// souralf.com, which holds the same account's key and keeps it the same way.
const { stripe } = require("./_stripe");

const LISTS = ["cyclemax", "cutcake"];
const LANGS = ["en", "de", "fr", "es", "ar", "ru"];
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const RELAY = "https://souralf.com/api/waitlist";

module.exports = async (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }
  let body = req.body || {};
  if (typeof body === "string") {
    try { body = JSON.parse(body); } catch { body = {}; }
  }
  // A field people never see: bots fill it in, people leave it empty.
  if (body.company) return res.status(200).json({ ok: true });
  const email = String(body.email || "").trim().toLowerCase();
  if (email.length > 254 || !EMAIL.test(email)) return res.status(400).json({ error: "Invalid e-mail" });
  const list = LISTS.includes(body.list) ? body.list : LISTS[0];
  const lang = LANGS.includes(body.lang) ? body.lang : "en";

  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      const relayed = await fetch(RELAY, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, lang, list }),
      });
      const data = await relayed.json().catch(() => ({}));
      return res.status(relayed.ok ? 200 : 502).json(relayed.ok ? { ok: true } : { error: data.error || "Waitlist unavailable" });
    }
    const found = await stripe("GET", "customers", { email, limit: 10 });
    if (!(found.data || []).some((c) => c.metadata && c.metadata.waitlist === list)) {
      await stripe("POST", "customers", {
        email,
        description: `${list} waitlist`,
        metadata: { waitlist: list, lang, source: "brinkmannpaul.com", joined: new Date().toISOString().slice(0, 10) },
      });
    }
    res.status(200).json({ ok: true });
  } catch (err) {
    res.status(502).json({ error: "Waitlist unavailable" });
  }
};
