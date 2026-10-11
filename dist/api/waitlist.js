// POST /api/waitlist { email, lang, list } → keeps the address on a waitlist.
// The list lives in Stripe as customers tagged metadata.waitlist (one place Paul
// already owns; Customers → filter by metadata exports it). An address that is
// already there is not added twice. Without the Stripe key it answers 503 and
// the page falls back to an e-mail to Paul, so no sign-up is lost.
const { stripe } = require("./_stripe");

const LISTS = ["cyclemax"];
const LANGS = ["en", "de", "fr", "es", "ar", "ru"];
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

module.exports = async (req, res) => {
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
    const found = await stripe("GET", "customers", { email, limit: 10 });
    if ((found.data || []).some((c) => c.metadata && c.metadata.waitlist === list)) {
      return res.status(200).json({ ok: true });
    }
    await stripe("POST", "customers", {
      email,
      metadata: { waitlist: list, lang, source: "brinkmannpaul.com", joined: new Date().toISOString().slice(0, 10) },
    });
    res.status(200).json({ ok: true });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
};
