// rate limits per visitor: counts attempts per key in a time window.
// kept in the memory of the running instance; vercel reuses warm instances, so this slows bots and
// password guessing down hard. it is not a global counter across every instance.
const buckets = new Map();
const recent = (name, key, ms) => {
  const k = name + "|" + key;
  const now = Date.now();
  const list = (buckets.get(k) || []).filter((t) => now - t < ms);
  buckets.set(k, list);
  return list;
};
// true when the key already used up its tries in this window
const limited = (name, key, max, ms) => recent(name, key, ms).length >= max;
function note(name, key, ms) {
  recent(name, key, ms).push(Date.now());
  if (buckets.size > 5000) for (const [k, v] of buckets) if (!v.length) buckets.delete(k);
}
const clear = (name, key) => buckets.delete(name + "|" + key);
// the visitor's own address, as vercel sees it (it overwrites what a client sends)
const ipOf = (req) => String(req.headers["x-vercel-forwarded-for"] || req.headers["x-forwarded-for"] || req.headers["x-real-ip"] || "").split(",")[0].trim() || "unknown";
module.exports = { limited, note, clear, ipOf };
