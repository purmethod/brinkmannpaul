// /api/sfc · soma flow club sign-ups (somaflowclub.com), free, max 15 places per session.
// its own list, apart from foyo club (/api/soma): every sign-up here carries metadata.sfc, never metadata.soma,
// so foyo's places, prices and admin never see these people and the other way round.
// GET                          → { sessions: [{ id, when, place, map, left }], places }   (no group link: that is for signed-up people only)
// POST { session, name }        → { ok, id, session, when, place, map, group }   reserves one place
// POST { cancel: id }           → { ok }                                    frees it again
// admin (header x-soma-key = SOMA_ADMIN_KEY, set in vercel, never in the repo):
// GET ?admin=1                  → { sessions: [{ id, when, place, people: [{ id, name, joined }] }] }
// POST { remove: id }            → { ok }                                    takes someone off the list
// Each sign-up is a customer in Paul's Stripe account (metadata.sfc = session id), so no database is
// needed and the list is in the dashboard (Customers, filter by metadata sfc). The customer id is the cancel key.
const crypto = require("crypto");
const { stripe } = require("./_stripe");
const { SESSIONS, PLACES, GROUP } = require("./_sfc");
const { limited, note, clear, ipOf } = require("./_limit");

// somaflowclub.com calls this api directly; the limits see each visitor's own address
const ORIGINS = ["https://somaflowclub.com", "https://www.somaflowclub.com"];
const MIN = 60 * 1000;
const LOCK = 15 * MIN; // after 5 wrong admin passwords, that address is locked for 15 minutes
const HOUR = 60 * MIN;

const now = () => new Date().toISOString().slice(0, 16);
// a date without a time stays open through that day
const ends = (s) => (s.when.length === 10 ? s.when + "T23:59" : s.when);
// a session without a date stays open until it is taken out of _soma.js
const open = (s, test) => (test || !s.test) && (!s.when || ends(s) > now());
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
    for (const c of list.data || []) if (c.metadata && c.metadata.sfc) n[c.metadata.sfc] = (n[c.metadata.sfc] || 0) + 1;
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

// every sign-up of the last 180 days, grouped by session
async function people() {
  const since = Math.floor(Date.now() / 1000) - 180 * 86400;
  const by = {};
  let after;
  for (let page = 0; page < 20; page++) {
    const list = await stripe("GET", "customers", { limit: 100, starting_after: after, created: { gte: since } });
    for (const c of list.data || []) {
      const m = c.metadata || {};
      if (!m.sfc) continue;
      (by[m.sfc] = by[m.sfc] || []).push({ id: c.id, name: c.name || "", joined: new Date(c.created * 1000).toISOString() });
    }
    if (!list.has_more || !list.data.length) break;
    after = list.data[list.data.length - 1].id;
  }
  return by;
}
function admin(req) {
  const key = process.env.SOMA_ADMIN_KEY || "";
  const given = String(req.headers["x-soma-key"] || "");
  if (!key || !given) return false;
  const a = crypto.createHash("sha256").update(key).digest();
  const b = crypto.createHash("sha256").update(given).digest();
  return crypto.timingSafeEqual(a, b);
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
  const ip = ipOf(req);
  if (req.headers["x-soma-key"] !== undefined) {
    if (limited("sfc-admin", ip, 5, LOCK)) return res.status(429).json({ error: "locked" });
    if (!admin(req)) {
      note("sfc-admin", ip, LOCK);
      return res.status(401).json({ error: "key" });
    }
    clear("sfc-admin", ip);
    try {
      if (req.method === "GET") {
        const by = await people();
        const known = SESSIONS.map((s) => s.id);
        const ids = [...SESSIONS.map((s) => s.id), "next", ...Object.keys(by).filter((id) => !known.includes(id) && id !== "next")];
        const sessions = ids
          .map((id) => { const s = SESSIONS.find((x) => x.id === id) || { id, when: "", place: "" }; return { id, when: s.when, place: s.place, test: Boolean(s.test), people: (by[id] || []).sort((x, y) => x.joined.localeCompare(y.joined)) }; })
          .filter((s) => s.people.length || (!s.test && s.id !== "next" && SESSIONS.includes(SESSIONS.find((x) => x.id === s.id)) && (!s.when || ends(s) > now())));
        return res.status(200).json({ sessions, places: PLACES });
      }
      let body = req.body || {};
      if (typeof body === "string") { try { body = JSON.parse(body); } catch { body = {}; } }
      const id = String(body.remove || "");
      if (!/^cus_[A-Za-z0-9]+$/.test(id)) return res.status(400).json({ error: "invalid" });
      const c = await stripe("GET", `customers/${id}`).catch(() => null);
      if (c && !c.deleted && c.metadata && c.metadata.sfc) await stripe("DELETE", `customers/${id}`);
      return res.status(200).json({ ok: true });
    } catch (err) {
      console.error("sfc admin", err.status, err.message);
      return res.status(502).json({ error: "unavailable" });
    }
  }
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
      if (limited("sfc-cancel", ip, 20, HOUR)) return res.status(429).json({ error: "busy" });
      note("sfc-cancel", ip, HOUR);
      const id = String(body.cancel);
      if (!/^cus_[A-Za-z0-9]+$/.test(id)) return res.status(400).json({ error: "invalid" });
      const c = await stripe("GET", `customers/${id}`).catch(() => null);
      if (c && !c.deleted && c.metadata && c.metadata.sfc) await stripe("DELETE", `customers/${id}`);
      return res.status(200).json({ ok: true });
    }

    const name = String(body.name || "").replace(/\s+/g, " ").trim().slice(0, 60);
    if (name.length < 2 || /https?:|www\.|[<>]/i.test(name)) return res.status(400).json({ error: "name" });
    if (limited("sfc-join", ip, 5, HOUR) || limited("sfc-join-all", "all", 30, 10 * MIN)) return res.status(429).json({ error: "busy" });
    const s = listed(true).find((x) => x.id === body.session);
    if (!s) return res.status(400).json({ error: "session" });
    if (((await counts())[s.id] || 0) >= PLACES) return res.status(409).json({ error: "full" });
    note("sfc-join", ip, HOUR); note("sfc-join-all", "all", 10 * MIN);
    const c = await stripe("POST", "customers", {
      name,
      description: `soma flow club · ${s.when || "next session"}${s.place ? " · " + s.place : ""}`,
      metadata: { sfc: s.id, when: s.when, joined: new Date().toISOString().slice(0, 10), source: "somaflowclub.com" },
    });
    return res.status(200).json({ ok: true, id: c.id, session: s.id, when: s.when, place: s.place, map: s.map || "", group: GROUP });
  } catch (err) {
    console.error("sfc", err.status, err.message);
    return res.status(502).json({ error: "unavailable" });
  }
};
