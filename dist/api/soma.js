// /api/soma · soma flow club sign-ups, free, max 15 places per session.
// GET                          → { sessions: [{ id, when, place, map, left }], places }   (no group link: that is for signed-up people only)
// POST { session, name }        → { ok, id, session, when, place, map, group }   reserves one place
// POST { cancel: id }           → { ok }                                    frees it again
// Each sign-up is a customer in Paul's Stripe account (metadata.soma = session id), so no database is
// needed and the list is in the dashboard (Customers, filter by metadata soma). The customer id is the cancel key.
const { stripe } = require("./_stripe");
const { SESSIONS, PLACES, GROUP } = require("./_soma");

const now = () => new Date().toISOString().slice(0, 16);
const open = (s, test) => (test || !s.test) && s.when > now();
// with no real date yet, one place list for "the next session": date and place follow in the group
const NEXT = { id: "next", when: "", place: "" };
const listed = (test) => {
  const real = SESSIONS.filter((s) => open(s, false));
  return [...(real.length ? [] : [NEXT]), ...SESSIONS.filter((s) => s.test && open(s, test))].concat(real);
};

// counted from the customer list itself (sign-ups of the last 180 days), not from search,
// which only sees a new customer after up to a minute and could let a 16th person in
async function counts() {
  const since = Math.floor(Date.now() / 1000) - 180 * 86400;
  const n = {};
  let after;
  for (let page = 0; page < 20; page++) {
    const list = await stripe("GET", "customers", { limit: 100, starting_after: after, created: { gte: since } });
    for (const c of list.data || []) if (c.metadata && c.metadata.soma) n[c.metadata.soma] = (n[c.metadata.soma] || 0) + 1;
    if (!list.has_more || !list.data.length) break;
    after = list.data[list.data.length - 1].id;
  }
  return n;
}
async function withPlaces(test) {
  const list = listed(test);
  const n = list.length ? await counts() : {};
  return list.map((s) => ({ id: s.id, when: s.when, place: s.place, map: s.map || "", left: Math.max(0, PLACES - (n[s.id] || 0)) }));
}

module.exports = async (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  const test = req.query && req.query.test === "1";
  try {
    if (req.method === "GET") return res.status(200).json({ sessions: await withPlaces(test), places: PLACES });
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
    const s = listed(true).find((x) => x.id === body.session);
    if (!s) return res.status(400).json({ error: "session" });
    if (((await counts())[s.id] || 0) >= PLACES) return res.status(409).json({ error: "full" });
    const c = await stripe("POST", "customers", {
      name,
      description: `soma flow club · ${s.when || "next session"}${s.place ? " · " + s.place : ""}`,
      metadata: { soma: s.id, when: s.when, joined: new Date().toISOString().slice(0, 10), source: "somaflowclub.com" },
    });
    return res.status(200).json({ ok: true, id: c.id, session: s.id, when: s.when, place: s.place, map: s.map || "", group: GROUP });
  } catch (err) {
    console.error("soma", err.status, err.message);
    return res.status(502).json({ error: "unavailable" });
  }
};
