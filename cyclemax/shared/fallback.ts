// Knowledge-base answer when Claude is unavailable (no key, refusal, offline on the device).
import type { ChatRequest, Line, Phase } from "./types";

/** "Was soll ich sagen / antworten / schreiben?" */
const ASKS_FOR_WORDS = /\b(was|wie)\b[^.?!]*\b(sag|antwort|schreib|formulier)/i;

/** One ready sentence per situation – the chat turns "Sag: „…“" into a copy block. */
const SAY: Record<Phase | "single" | "none", string> = {
  red: "Nicht argumentieren, nicht rechtfertigen. Ruhig bleiben. Sag: „Ich bin da. Wir reden morgen in Ruhe.“",
  yellow: "Kein Kommentar zu ihren Tagen, einfach ruhig da sein. Sag: „Ich bin hier. Lass dir Zeit.“",
  pink: "Gute Tage für Initiative. Du gibst die Richtung vor. Sag: „Samstagabend gehört uns. Ich plane, du musst nur kommen.“",
  green: "Ruhige Tage, gut für Klartext ohne Druck. Sag: „Lass uns heute Abend in Ruhe reden. Mir ist das wichtig.“",
  single: "Ehrlich und klar, ohne Spiel. Sag: „Ich hatte einen schönen Abend mit dir. Ich will dich wiedersehen.“",
  none: "Erst atmen, dann antworten. Sag: „Ich höre dich. Lass mich kurz nachdenken, dann antworte ich dir.“",
};

export function fallbackAnswer(req: Pick<ChatRequest, "mode" | "phase" | "messages">, lines: Line[]): string {
  const last = req.messages.filter((m) => m.role === "user").at(-1)?.content ?? "";
  if (ASKS_FOR_WORDS.test(last)) return SAY[req.mode === "single" ? "single" : (req.phase ?? "none")];
  const category = req.mode === "single" ? "single" : req.phase;
  const pool = lines.filter((l) => (l.weight ?? 1) > 0 && (l.category === category || l.category === "any"));
  let h = 0;
  for (const ch of last) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return pool.length ? pool[h % pool.length].text : "Es ist nichts Großes passiert. Atme. Weiter.";
}
