// Local server that behaves like Vercel for this project: clean URLs, 404 page, /api functions.
// Run: node scripts/build.mjs && node scripts/dev.mjs   (PORT=3000 by default)
// Optional .env.local in the project root: STRIPE_SECRET_KEY=sk_test_… STRIPE_PUBLISHABLE_KEY=pk_test_…
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

const root = path.resolve(import.meta.dirname, "..");
const pub = path.join(root, "public");
const require = createRequire(import.meta.url);

const envFile = path.join(root, ".env.local");
if (fs.existsSync(envFile)) {
  for (const line of fs.readFileSync(envFile, "utf8").split("\n")) {
    const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/.exec(line);
    if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}

const TYPES = {
  ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".js": "text/javascript; charset=utf-8",
  ".json": "application/json", ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg",
  ".webp": "image/webp", ".woff2": "font/woff2", ".xml": "application/xml", ".txt": "text/plain; charset=utf-8", ".ico": "image/x-icon",
};

function resolveFile(urlPath) {
  const clean = path.normalize(decodeURIComponent(urlPath)).replace(/^(\.\.[/\\])+/, "");
  const base = path.join(pub, clean);
  if (!base.startsWith(pub)) return null;
  for (const f of [base, base + ".html", path.join(base, "index.html")]) {
    if (fs.existsSync(f) && fs.statSync(f).isFile()) return f;
  }
  return null;
}

async function api(name, req, res, url) {
  const file = path.join(root, "api", `${name}.js`);
  if (!/^[a-z-]+$/.test(name) || !fs.existsSync(file)) {
    res.writeHead(404, { "Content-Type": "application/json" });
    return res.end(JSON.stringify({ error: "Not found" }));
  }
  let raw = "";
  for await (const chunk of req) raw += chunk;
  req.query = Object.fromEntries(url.searchParams);
  req.body = raw;
  if ((req.headers["content-type"] || "").includes("application/json")) {
    try { req.body = JSON.parse(raw); } catch { req.body = raw; }
  }
  res.status = (code) => { res.statusCode = code; return res; };
  res.json = (obj) => { res.setHeader("Content-Type", "application/json"); res.end(JSON.stringify(obj)); return res; };
  delete require.cache[require.resolve(file)];
  try {
    await require(file)(req, res);
  } catch (err) {
    console.error(err);
    if (!res.headersSent) res.status(500).json({ error: "Internal error" });
  }
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, "http://localhost");
  if (url.pathname.startsWith("/api/")) return api(url.pathname.slice(5), req, res, url);
  // Vercel trailingSlash:false — /de/ → /de
  if (url.pathname.length > 1 && url.pathname.endsWith("/")) {
    res.writeHead(308, { Location: url.pathname.slice(0, -1) + url.search });
    return res.end();
  }
  // Vercel cleanUrls — /order.html → /order
  if (url.pathname.endsWith(".html")) {
    const target = url.pathname.replace(/(\/index)?\.html$/, "") || "/";
    res.writeHead(308, { Location: target + url.search });
    return res.end();
  }
  const file = resolveFile(url.pathname);
  if (!file) {
    res.writeHead(404, { "Content-Type": TYPES[".html"] });
    return res.end(fs.readFileSync(path.join(pub, "404.html")));
  }
  res.writeHead(200, { "Content-Type": TYPES[path.extname(file)] || "application/octet-stream" });
  res.end(req.method === "HEAD" ? undefined : fs.readFileSync(file));
});

const port = Number(process.env.PORT || 3000);
server.listen(port, () => console.log(`qefyr → http://localhost:${port}`));
