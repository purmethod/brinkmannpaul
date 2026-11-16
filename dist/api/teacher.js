// /api/teacher · foyo club: a teacher's own account and profile.
// anyone                 GET                                   → { teachers: [profile] }   the profiles paul has confirmed
//                        POST { register: { name, email, password } }  → { token, me }     a new account, waiting for paul
//                        POST { login: { email, password } }            → { token, me }
// a teacher (header x-foyo-token):
//                        GET                                   → { me }
//                        POST { save: { role, about, ig, wa, priceClass, priceRetreat, city, country, retreat, pay } } → { me }
//                        POST { locate: { lat, lon } }         → { me }   the place as town and country; the point itself is not kept
//                        POST { photo: { slot, data } }        → { me }   one jpeg, base64, into slot 1 to 3 (1 is the circle)
//                        POST { photo: { slot, remove: true } } → { me }
//                        POST { password: { old, next } }      → { token, me }
// paul (header x-soma-key = SOMA_ADMIN_KEY):
//                        GET                                   → { accounts: [profile + email, status, joined] }
//                        POST { approve: id, slug }            → { ok }   the profile goes live at myfoyo.com/<slug>
//                        POST { block: id }                    → { ok }   off the site again, the account stays
//                        POST { reset: id }                    → { ok, password }   a new password to pass on
//                        POST { remove: id }                   → { ok }
// Each account is a customer in Paul's Stripe account (metadata.foyo_account = "1"), like the sign-ups:
// no database. The password is kept as a salted scrypt hash, the photos in the blob store foyo-teachers.
const crypto = require("crypto");
const { promisify } = require("util");
const { stripe } = require("./_stripe");
const { limited, note, clear, ipOf } = require("./_limit");

const scrypt = promisify(crypto.scrypt);
const ORIGINS = ["https://myfoyo.com", "https://www.myfoyo.com"];
const MIN = 60 * 1000;
const HOUR = 60 * MIN;
const LOCK = 15 * MIN;
const DAYS = 30; // a login holds for 30 days on that device
// paths of the site itself, and the pages built by hand (only paul can hand one of those to an account)
const RESERVED = ["admin", "login", "apply", "club", "soon", "photos", "brand", "api", "t", "preview", "index", "foyo", "teacher", "teachers", "join", "www", "app"];
const STATIC = ["paul", "nafisa", "yury", "judit"];
const PAY = ["cash", "card"];

// ---------- small tools ----------
// cut by whole characters, so an emoji is never split in two
const cut = (s, n) => Array.from(s).slice(0, n).join("").trim();
const line = (v, n) => cut(String(v == null ? "" : v).replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim(), n);
const text = (v, n) => cut(String(v == null ? "" : v).replace(/\r\n?/g, "\n").replace(/[\u0000-\u0009\u000b-\u001f\u007f]/g, " ").replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim(), n);
const bad = (v) => /[<>]|https?:|www\./i.test(v);
const day = (v) => (/^\d{4}-\d{2}-\d{2}$/.test(String(v || "")) && !isNaN(Date.parse(v)) ? String(v) : "");
const slugOf = (v) => String(v || "").toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 30);
const okSlug = (s) => /^[a-z0-9](?:[a-z0-9-]{0,28}[a-z0-9])$/.test(s) && !RESERVED.includes(s);
const okMail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
const fail = (code, status = 400) => Object.assign(new Error(code), { code, status });

async function hash(password, salt = crypto.randomBytes(16).toString("hex")) {
  const key = await scrypt(String(password), salt, 32);
  return "s1$" + salt + "$" + key.toString("hex");
}
async function matches(password, stored) {
  const p = String(stored || "").split("$");
  if (p.length !== 3 || p[0] !== "s1") return false;
  const again = await hash(password, p[1]);
  return crypto.timingSafeEqual(Buffer.from(again), Buffer.from(stored));
}
// the login token: account, end, signature. the key comes from the stripe key, so nothing new has to be set
// in vercel; the end of the password hash is signed too, so a new password ends every older login.
function sign(id, exp, pw) {
  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) throw fail("unavailable", 503);
  const key = crypto.createHmac("sha256", secret).update("foyo teacher logins v1").digest();
  return crypto.createHmac("sha256", key).update(id + "." + exp + "." + String(pw).slice(-24)).digest("hex");
}
const tokenFor = (c) => { const exp = Math.floor(Date.now() / 1000) + DAYS * 86400; return c.id + "." + exp + "." + sign(c.id, exp, c.metadata.pw); };
async function fromToken(given) {
  const m = /^(cus_[A-Za-z0-9]+)\.(\d{9,11})\.([a-f0-9]{64})$/.exec(String(given || ""));
  if (!m || Number(m[2]) < Date.now() / 1000) return null;
  const c = await stripe("GET", "customers/" + m[1]).catch(() => null);
  if (!c || c.deleted || !c.metadata || c.metadata.foyo_account !== "1") return null;
  const want = sign(c.id, m[2], c.metadata.pw);
  return crypto.timingSafeEqual(Buffer.from(want), Buffer.from(m[3])) ? c : null;
}
function isAdmin(req) {
  const key = process.env.SOMA_ADMIN_KEY || "";
  const given = String(req.headers["x-soma-key"] || "");
  if (!key || !given) return false;
  return crypto.timingSafeEqual(crypto.createHash("sha256").update(key).digest(), crypto.createHash("sha256").update(given).digest());
}

// ---------- the accounts in stripe ----------
async function byEmail(email) {
  const list = await stripe("GET", "customers", { email, limit: 100 });
  return (list.data || []).find((c) => c.metadata && c.metadata.foyo_account === "1") || null;
}
// every account: through stripe's search (it sees a change after up to a minute); where search is not
// there, through the plain customer list
async function accounts() {
  const out = [];
  try {
    let page;
    for (let i = 0; i < 10; i++) {
      const r = await stripe("GET", "customers/search", { query: "metadata['foyo_account']:'1'", limit: 100, page });
      out.push(...(r.data || []));
      if (!r.has_more || !r.next_page) break;
      page = r.next_page;
    }
    return out;
  } catch (err) {
    console.error("teacher search", err.status, err.message);
    out.length = 0;
    let after;
    for (let i = 0; i < 30; i++) {
      const list = await stripe("GET", "customers", { limit: 100, starting_after: after });
      for (const c of list.data || []) if (c.metadata && c.metadata.foyo_account === "1") out.push(c);
      if (!list.has_more || !list.data.length) break;
      after = list.data[list.data.length - 1].id;
    }
    return out;
  }
}
const blobUrl = (u) => (/^https:\/\/[a-z0-9-]+\.public\.blob\.vercel-storage\.com\/[^\s"'<>]+$/i.test(String(u || "")) ? String(u) : "");
// what everyone may see of a profile
function profile(c) {
  const m = c.metadata || {};
  return {
    slug: m.slug || "", name: c.name || "", role: m.role || "",
    about: [m.about1, m.about2, m.about3, m.about4].filter(Boolean).join(""),
    photos: [1, 2, 3].map((i) => blobUrl(m["photo" + i])),
    ig: m.ig || "", wa: m.wa || "", priceClass: m.price_class || "", priceRetreat: m.price_retreat || "",
    city: m.city || "", country: m.country || "", located: m.loc_at || "",
    retreat: { title: m.r_title || "", from: m.r_from || "", to: m.r_to || "", place: m.r_place || "", price: m.r_price || "" },
    pay: String(m.pay || "").split(",").filter((p) => PAY.includes(p)),
  };
}
const mine = (c) => ({ ...profile(c), email: c.email || "", status: c.metadata.status === "active" ? "active" : "pending" });

let cache = null; // the public list, kept for half a minute in this instance
async function publicList() {
  if (cache && Date.now() - cache.at < 30000) return cache.list;
  const seen = new Set();
  const list = (await accounts())
    .filter((c) => c.metadata.status === "active" && okSlug(c.metadata.slug || ""))
    .sort((a, b) => a.created - b.created)
    .filter((c) => !seen.has(c.metadata.slug) && seen.add(c.metadata.slug))
    .map(profile);
  cache = { at: Date.now(), list };
  return list;
}

// ---------- a photo into the blob store, over its plain http api (as in teach.js) ----------
async function putBlob(pathname, bytes, type) {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) throw fail("unavailable", 503);
  const res = await fetch("https://vercel.com/api/blob/?pathname=" + encodeURIComponent(pathname), {
    method: "PUT",
    headers: { authorization: "Bearer " + token, "x-api-version": "11", "x-content-type": type, "x-add-random-suffix": "1", "x-vercel-blob-access": "public", "content-type": type },
    body: bytes,
  });
  const body = await res.text();
  if (!res.ok) throw Object.assign(new Error("blob " + res.status + " " + body.slice(0, 200)), { status: 502 });
  return JSON.parse(body).url;
}

// ---------- where a point lies: town and country, from openstreetmap. the point is rounded to about a
// kilometre before it leaves here, and it is neither kept nor logged ----------
async function placeOf(lat, lon) {
  const u = "https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom=12&addressdetails=1&accept-language=en&lat=" + lat.toFixed(2) + "&lon=" + lon.toFixed(2);
  const r = await fetch(u, { headers: { "User-Agent": "foyo club (https://myfoyo.com)", Accept: "application/json" } });
  if (!r.ok) throw fail("place", 502);
  const a = ((await r.json().catch(() => ({}))) || {}).address || {};
  const city = line(a.city || a.town || a.village || a.municipality || a.suburb || a.county || a.state || "", 60);
  const country = line(a.country || "", 60);
  if (!city && !country) throw fail("place", 422);
  return { city, country };
}

// ---------- what a teacher writes, checked field by field ----------
function cleaned(s) {
  const out = {};
  const put = (key, value, code) => { if (bad(value)) throw fail(code); out[key] = value; };
  if (s.role !== undefined) put("role", line(s.role, 80), "role");
  if (s.about !== undefined) {
    const about = text(s.about, 1600);
    if (/[<>]/.test(about)) throw fail("about");
    // stripe keeps 500 characters per value: the text in up to four parts, no character split between two
    const parts = ["", "", "", ""];
    let i = 0;
    for (const ch of about) { if (parts[i].length + ch.length > 480) i++; if (i > 3) break; parts[i] += ch; }
    parts.forEach((p, k) => { out["about" + (k + 1)] = p; });
  }
  if (s.ig !== undefined) {
    const ig = line(s.ig, 80).replace(/^https?:\/\/(www\.)?instagram\.com\//i, "").replace(/^@/, "").replace(/[/?].*$/, "");
    if (ig && !/^[A-Za-z0-9._]{1,30}$/.test(ig)) throw fail("ig");
    out.ig = ig;
  }
  if (s.wa !== undefined) {
    const wa = line(s.wa, 120).replace(/[?#].*$/, "");
    if (wa && !/^https:\/\/chat\.whatsapp\.com\/[A-Za-z0-9]{8,40}$/.test(wa) && !/^https:\/\/wa\.me\/\d{6,16}$/.test(wa)) throw fail("wa");
    out.wa = wa;
  }
  if (s.priceClass !== undefined) put("price_class", line(s.priceClass, 40), "price");
  if (s.priceRetreat !== undefined) put("price_retreat", line(s.priceRetreat, 40), "price");
  if (s.city !== undefined || s.country !== undefined) {
    put("city", line(s.city, 60), "place");
    put("country", line(s.country, 60), "place");
    out.loc_at = out.city || out.country ? new Date().toISOString().slice(0, 10) : "";
  }
  if (s.retreat !== undefined) {
    const r = s.retreat || {};
    put("r_title", line(r.title, 80), "retreat");
    put("r_place", line(r.place, 80), "retreat");
    put("r_price", line(r.price, 40), "retreat");
    out.r_from = day(r.from);
    out.r_to = day(r.to);
    if (out.r_from && out.r_to && out.r_to < out.r_from) throw fail("retreat");
  }
  if (s.pay !== undefined) out.pay = PAY.filter((p) => Array.isArray(s.pay) && s.pay.includes(p)).join(",");
  return out;
}

module.exports = async (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  const origin = req.headers.origin;
  if (ORIGINS.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, x-foyo-token, x-soma-key");
    res.setHeader("Access-Control-Max-Age", "600");
  }
  res.setHeader("Vary", "Origin");
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "GET" && req.method !== "POST") { res.setHeader("Allow", "GET, POST"); return res.status(405).json({ error: "Method not allowed" }); }
  const ip = ipOf(req);
  let body = req.body || {};
  if (typeof body === "string") { try { body = JSON.parse(body); } catch { body = {}; } }
  if (!body || typeof body !== "object") body = {};
  try {
    // ---------- paul ----------
    if (req.headers["x-soma-key"] !== undefined) {
      if (limited("admin", ip, 5, LOCK)) return res.status(429).json({ error: "locked" });
      if (!isAdmin(req)) { note("admin", ip, LOCK); return res.status(401).json({ error: "key" }); }
      clear("admin", ip);
      if (req.method === "GET") {
        const list = (await accounts()).sort((a, b) => b.created - a.created)
          .map((c) => ({ id: c.id, ...mine(c), joined: new Date(c.created * 1000).toISOString() }));
        return res.status(200).json({ accounts: list, pages: STATIC });
      }
      const id = String(body.approve || body.block || body.reset || body.remove || "");
      if (!/^cus_[A-Za-z0-9]+$/.test(id)) return res.status(400).json({ error: "invalid" });
      const c = await stripe("GET", "customers/" + id).catch(() => null);
      if (!c || c.deleted || !c.metadata || c.metadata.foyo_account !== "1") return res.status(404).json({ error: "gone" });
      cache = null;
      if (body.approve) {
        const slug = slugOf(body.slug || c.metadata.slug || c.name);
        if (!okSlug(slug)) return res.status(400).json({ error: "slug" });
        const other = (await accounts()).find((x) => x.id !== c.id && x.metadata.status === "active" && x.metadata.slug === slug);
        if (other) return res.status(409).json({ error: "taken" });
        await stripe("POST", "customers/" + id, { metadata: { status: "active", slug } });
        return res.status(200).json({ ok: true, slug });
      }
      if (body.block) { await stripe("POST", "customers/" + id, { metadata: { status: "pending" } }); return res.status(200).json({ ok: true }); }
      if (body.reset) {
        const password = crypto.randomBytes(9).toString("base64").replace(/[^A-Za-z0-9]/g, "").slice(0, 10).padEnd(10, "7");
        await stripe("POST", "customers/" + id, { metadata: { pw: await hash(password) } });
        return res.status(200).json({ ok: true, password });
      }
      await stripe("DELETE", "customers/" + id);
      return res.status(200).json({ ok: true });
    }

    // ---------- a teacher who is logged in ----------
    if (req.headers["x-foyo-token"] !== undefined) {
      if (limited("token", ip, 30, LOCK)) return res.status(429).json({ error: "locked" });
      let c = await fromToken(req.headers["x-foyo-token"]);
      if (!c) { note("token", ip, LOCK); return res.status(401).json({ error: "login" }); }
      if (req.method === "GET") return res.status(200).json({ me: mine(c) });
      if (limited("edit", c.id, 120, HOUR)) return res.status(429).json({ error: "busy" });
      note("edit", c.id, HOUR);
      let meta = null;
      let token;
      if (body.save) meta = cleaned(body.save);
      else if (body.locate) {
        const lat = Number(body.locate.lat), lon = Number(body.locate.lon);
        if (!isFinite(lat) || !isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) throw fail("place");
        if (limited("locate", c.id, 20, HOUR)) return res.status(429).json({ error: "busy" });
        note("locate", c.id, HOUR);
        const p = await placeOf(lat, lon);
        meta = { city: p.city, country: p.country, loc_at: new Date().toISOString().slice(0, 10) };
      } else if (body.photo) {
        const slot = Number(body.photo.slot);
        if (![1, 2, 3].includes(slot)) throw fail("photo");
        if (body.photo.remove) meta = { ["photo" + slot]: "" };
        else {
          if (limited("photo", c.id, 30, HOUR)) return res.status(429).json({ error: "busy" });
          note("photo", c.id, HOUR);
          const bytes = Buffer.from(String(body.photo.data || ""), "base64");
          // a jpeg, made small in the teacher's browser before it is sent
          if (bytes.length < 500 || bytes.length > 900 * 1024 || bytes[0] !== 0xff || bytes[1] !== 0xd8 || bytes[2] !== 0xff) throw fail("photo");
          meta = { ["photo" + slot]: await putBlob("profiles/" + c.id.slice(4, 14).toLowerCase() + "-" + slot + ".jpg", bytes, "image/jpeg") };
        }
      } else if (body.password) {
        const next = String(body.password.next || "");
        if (next.length < 8 || next.length > 100) throw fail("password");
        if (!(await matches(String(body.password.old || ""), c.metadata.pw))) throw fail("old", 403);
        meta = { pw: await hash(next) };
      } else throw fail("invalid");
      c = await stripe("POST", "customers/" + c.id, { metadata: meta });
      cache = null;
      if (body.password) token = tokenFor(c);
      return res.status(200).json({ me: mine(c), token });
    }

    // ---------- anyone ----------
    if (req.method === "GET") return res.status(200).json({ teachers: await publicList() });
    if (body.company) return res.status(200).json({ ok: true }); // the field people never see: bots fill it in

    if (body.login) {
      const email = line(body.login.email, 120).toLowerCase();
      const password = String(body.login.password || "");
      if (limited("login", ip, 8, LOCK) || limited("login-mail", email, 6, LOCK)) return res.status(429).json({ error: "locked" });
      const c = okMail(email) && password ? await byEmail(email) : null;
      // the same answer for an unknown address and a wrong password
      if (!c || !(await matches(password, c.metadata.pw))) { note("login", ip, LOCK); note("login-mail", email, LOCK); return res.status(401).json({ error: "login" }); }
      clear("login", ip); clear("login-mail", email);
      return res.status(200).json({ token: tokenFor(c), me: mine(c) });
    }

    if (body.register) {
      const name = line(body.register.name, 40);
      const email = line(body.register.email, 120).toLowerCase();
      const password = String(body.register.password || "");
      if (name.length < 2 || bad(name)) throw fail("name");
      if (!okMail(email)) throw fail("email");
      if (password.length < 8 || password.length > 100) throw fail("password");
      if (limited("register", ip, 3, HOUR) || limited("register-all", "all", 30, HOUR)) return res.status(429).json({ error: "busy" });
      if (await byEmail(email)) return res.status(409).json({ error: "exists" });
      note("register", ip, HOUR); note("register-all", "all", HOUR);
      // the address of the page: the name, with a number when that one is taken
      const taken = new Set([...STATIC, ...(await accounts()).map((x) => x.metadata.slug)]);
      const base = okSlug(slugOf(name)) ? slugOf(name) : "teacher";
      let slug = base;
      for (let n = 2; taken.has(slug) || !okSlug(slug); n++) slug = base.slice(0, 26) + "-" + n;
      const c = await stripe("POST", "customers", {
        name, email,
        description: "foyo club · teacher account",
        metadata: { foyo_account: "1", status: "pending", slug, pw: await hash(password), joined: new Date().toISOString().slice(0, 10), source: "myfoyo.com" },
      });
      return res.status(200).json({ token: tokenFor(c), me: mine(c) });
    }
    return res.status(400).json({ error: "invalid" });
  } catch (err) {
    if (err.code) return res.status(err.status || 400).json({ error: err.code });
    console.error("teacher", err.status, err.message);
    return res.status(502).json({ error: "unavailable" });
  }
};
