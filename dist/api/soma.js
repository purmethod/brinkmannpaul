// /api/soma · soma flow club sign-ups, free, max 15 places per session.
// GET                          → { sessions: [{ id, when, place, left }], group }
// POST { session, name }        → { ok, id, session, when, place, group }   reserves one place
// POST { cancel: id }           → { ok }                                    frees it again
// Each sign-up is a customer in Paul's Stripe account (metadata.soma = session id), so no database is
// needed and the list is in the dashboard (Customers → search metadata). The customer id is the cancel key.
const { stripe } = require("./_stripe");
const { SESSIONS, PLACES, GROUP } = require("./_soma");

const now = () => new Date().toISOString().slice(0, 16);
const open = (s, test) => (test || !s.test) && s.when > now();

async function taken(id) {
  const found = await stripe("GET", "customers/search", { query: `metadata['soma']:'${id}'`, limit: 100 });
  return (found.data || []).length;
}
async function withPlaces(test) {
  const list = SESSIONS.filter((s) => open(s, test));
  const counts = await Promise.all(list.map((s) => taken(s.id)));
  return list.map((s, i) => ({ id: s.id, when: s.when, place: s.place, left: Math.max(0, PLACES - counts[i]) }));
}

module.exports = async (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  const test = req.query && req.query.test === "1";
  try {
    if (req.method === "GET") return res.status(200).json({ sessions: await withPlaces(test), group: GROUP, places: PLACES });
    if (req.method !== "POST") {
      res.setHeader("Allow", "GET, POST");
      return res.status(405).json({ error: "Method not allowed" });
    }
    let body = req.body || {};
    if (typeof body === "string") {
      try { body = JSON.parse(body); } catch { body = {}; }
    }
    if (body.company) return res.status(200).json({ ok: true }); // a field people never see: bots fill it in

    if (body.cancel) {
      const id = String(body.cancel);
      if (!/^cus_[A-Za-z0-9]+$/.test(id)) return res.status(400).json({ error: "invalid" });
      const c = await stripe("GET", `customers/${id}`).catch(() => null);
      if (c && !c.deleted && c.metadata && c.metadata.soma) await stripe("DELETE", `customers/${id}`);
      return res.status(200).json({ ok: true });
    }

    const name = String(body.name || "").replace(/\s+/g, " ").trim().slice(0, 60);
    if (name.length < 2) return res.status(400).json({ error: "name" });
    const s = SESSIONS.find((x) => x.id === body.session && open(x, true));
    if (!s) return res.status(400).json({ error: "session" });
    if ((await taken(s.id)) >= PLACES) return res.status(409).json({ error: "full" });
    const c = await stripe("POST", "customers", {
      name,
      description: `soma flow club · ${s.when} · ${s.place}`,
      metadata: { soma: s.id, when: s.when, joined: new Date().toISOString().slice(0, 10), source: "brinkmannpaul.com/soma" },
    });
    return res.status(200).json({ ok: true, id: c.id, session: s.id, when: s.when, place: s.place, group: GROUP });
  } catch (err) {
    console.error("soma", err.status, err.message);
    return res.status(502).json({ error: "unavailable" });
  }
};
