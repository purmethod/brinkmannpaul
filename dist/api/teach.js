// /api/teach · foyo club: teachers apply to join the team.
// POST { name, email, about, audio?, type? } → { ok }
//   audio: the voice note, base64, at most ~3 MB (about two minutes); it goes to Vercel Blob (store
//   foyo-teachers, BLOB_READ_WRITE_TOKEN set by vercel), the application itself to Paul's Stripe account
//   as a customer (metadata.foyo_teacher = "1", the voice link in metadata.voice), the same way the
//   session sign-ups are kept: no database. Stripe dashboard → Customers → filter metadata foyo_teacher.
const { stripe } = require("./_stripe");
const { limited, note, ipOf } = require("./_limit");

const ORIGINS = ["https://myfoyo.com", "https://www.myfoyo.com"];
const HOUR = 60 * 60 * 1000;
const TYPES = { "audio/webm": "webm", "audio/mp4": "m4a", "audio/aac": "aac", "audio/mpeg": "mp3", "audio/ogg": "ogg", "audio/x-m4a": "m4a" };

// one file into the blob store, over its plain http api (no sdk, no dependencies)
async function putBlob(pathname, bytes, type) {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) throw Object.assign(new Error("BLOB_READ_WRITE_TOKEN is not set"), { status: 503 });
  const res = await fetch("https://vercel.com/api/blob/?pathname=" + encodeURIComponent(pathname), {
    method: "PUT",
    headers: {
      authorization: "Bearer " + token,
      "x-api-version": "11",
      "x-content-type": type,
      "x-add-random-suffix": "1",
      "x-vercel-blob-access": "public",
      "content-type": type,
    },
    body: bytes,
  });
  const text = await res.text();
  if (!res.ok) throw Object.assign(new Error("blob " + res.status + " " + text.slice(0, 300)), { status: res.status });
  return JSON.parse(text).url;
}

const clean = (v, n) => String(v || "").replace(/\s+/g, " ").trim().slice(0, n);

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
  if (body.company) return res.status(200).json({ ok: true }); // the field people never see: bots fill it in
  const name = clean(body.name, 60);
  const email = clean(body.email, 120).toLowerCase();
  const about = String(body.about || "").trim().slice(0, 1500);
  if (name.length < 2 || /https?:|[<>]/i.test(name)) return res.status(400).json({ error: "name" });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return res.status(400).json({ error: "email" });
  if (about.length < 10 && !body.audio) return res.status(400).json({ error: "about" });
  const ip = ipOf(req);
  if (limited("teach", ip, 4, HOUR) || limited("teach-all", "all", 40, HOUR)) return res.status(429).json({ error: "busy" });
  note("teach", ip, HOUR); note("teach-all", "all", HOUR);
  try {
    let voice = "";
    if (body.audio) {
      const type = String(body.type || "audio/webm").split(";")[0].trim();
      const ext = TYPES[type] || "webm";
      const bytes = Buffer.from(String(body.audio), "base64");
      if (bytes.length > 3.2 * 1024 * 1024) return res.status(413).json({ error: "long" });
      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "teacher";
      try { voice = await putBlob("teachers/" + new Date().toISOString().slice(0, 10) + "-" + slug + "." + ext, bytes, TYPES[type] ? type : "audio/webm"); }
      catch (err) { console.error("teach voice", err.message); voice = "upload failed"; }
    }
    // stripe keeps 500 characters per metadata value: the text in three parts
    const parts = {};
    for (let i = 0; i < 3; i++) if (about.slice(i * 500, (i + 1) * 500)) parts["about" + (i + 1)] = about.slice(i * 500, (i + 1) * 500);
    await stripe("POST", "customers", {
      name,
      email,
      description: "foyo club · teacher application",
      metadata: { foyo_teacher: "1", voice, ...parts, applied: new Date().toISOString().slice(0, 10), source: "myfoyo.com" },
    });
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("teach", err.status, err.message);
    return res.status(502).json({ error: "unavailable" });
  }
};
