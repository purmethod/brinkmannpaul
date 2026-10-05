// After `next build`: writes out/sw.js with a precache list of the exported app shell.
import { createHash } from "node:crypto";
import { readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { join, relative, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(root, "out");
const SKIP = [/^splash\//, /^store\//, /\.txt$/, /^sw\.js$/, /^admin\//, /^__next\./, /\.map$/];

function walk(dir) {
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
}

const hash = createHash("sha256");
const urls = new Set();
for (const file of walk(outDir).sort()) {
  const rel = relative(outDir, file).split("\\").join("/");
  if (SKIP.some((re) => re.test(rel))) continue;
  hash.update(rel).update(readFileSync(file));
  if (rel === "index.html") urls.add("/");
  else if (rel.endsWith("/index.html")) urls.add("/" + rel.slice(0, -"index.html".length));
  else if (rel.endsWith(".html")) continue;
  else urls.add("/" + rel);
}

const version = hash.digest("hex").slice(0, 12);
const template = readFileSync(join(root, "sw/sw.template.js"), "utf8");
const precache = JSON.stringify([...urls].sort(), null, 0);
writeFileSync(join(outDir, "sw.js"), template.replace("__VERSION__", version).replace("__PRECACHE__", precache));
console.log(`sw.js: ${urls.size} files precached, version ${version}`);
