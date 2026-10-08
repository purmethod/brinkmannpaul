// Knowledge-base answer when Claude is unavailable (no key, refusal, offline on the device).
import type { ChatRequest, Line } from "./types";

export function fallbackAnswer(req: Pick<ChatRequest, "mode" | "phase" | "messages">, lines: Line[]): string {
  const category = req.mode === "single" ? "single" : req.phase;
  const pool = lines.filter((l) => (l.weight ?? 1) > 0 && (l.category === category || l.category === "any"));
  const last = req.messages.filter((m) => m.role === "user").at(-1)?.content ?? "";
  let h = 0;
  for (const ch of last) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return pool.length ? pool[h % pool.length].text : "Es ist nichts Großes passiert. Atme. Weiter.";
}
