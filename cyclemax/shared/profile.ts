// Profile helpers shared by device and server: offline/no-key fallback and the compact chat context.
import type { Mode, ProfileAnalysis } from "./types";

const THEMES: { label: string; re: RegExp; relationship: string; single: string }[] = [
  { label: "Streit", re: /streit|schrei|laut|vorw[üu]rf|eskal|zoff/i, relationship: "Konflikte eskalieren. Du wirst ruhiger, nicht lauter.", single: "Konflikte früh ruhig ansprechen." },
  { label: "Haushalt", re: /haushalt|putzen|aufr[äa]um|w[äa]sche|k[üu]che|einkauf|m[üu]ll/i, relationship: "Alltag ist Reibung. Übernimm etwas, ohne darüber zu reden.", single: "" },
  { label: "Nähe & Intimität", re: /bett|sex|intim|n[äa]he|z[äa]rtlich|ber[üu]hr|kuscheln|lust/i, relationship: "Nähe entsteht durch Präsenz und Vertrauen, nicht durch Druck.", single: "Nähe entsteht durch Vertrauen. Kein Druck." },
  { label: "Kinderwunsch", re: /kind|kinder|schwanger|familie gr[üu]nd|baby/i, relationship: "Kinderwunsch braucht ein ruhiges Grundsatzgespräch – in einer guten Woche.", single: "Sag früh, ob du Familie willst." },
  { label: "Vertrauen", re: /vertrau|eifers|l[üu]g|betrog|fremd/i, relationship: "Vertrauen wächst durch gehaltene kleine Versprechen.", single: "Ehrlich von Anfang an." },
  { label: "Stress & Arbeit", re: /stress|arbeit|job|m[üu]de|ersch[öo]pft|projekt/i, relationship: "Dein Kopf ist voll. Trotzdem: zehn Minuten volle Präsenz am Tag.", single: "Volle Woche? Ein gutes Date schlägt fünf halbe." },
  { label: "Kommunikation", re: /reden|zuh[öo]r|gespr[äa]ch|versteh|schweig/i, relationship: "Zuhören, bis sie fertig ist. Dann erst du.", single: "Neugierig fragen, ehrlich antworten." },
  { label: "Dating", re: /date|tinder|hinge|bumble|kennenlern|ansprechen|single/i, relationship: "", single: "Charakter statt Optik. Ehrliche Absicht." },
];

/** Keyword-based profile when Claude is not reachable. */
export function fallbackProfile(mode: Mode, text: string, previous: ProfileAnalysis | null): ProfileAnalysis {
  const found = THEMES.filter((t) => t.re.test(text) && (mode === "single" ? t.single : t.relationship));
  const topics = found.slice(0, 6).map((t) => ({ label: t.label, note: mode === "single" ? t.single : t.relationship }));
  const merged = previous ? [...previous.topics.filter((p) => !topics.some((t) => t.label === p.label)), ...topics].slice(0, 6) : topics;
  return {
    summary:
      previous?.summary ??
      (mode === "single"
        ? "Gespeichert. Sobald der Mentor erreichbar ist, wird daraus dein Profil."
        : "Gespeichert. Sobald der Mentor erreichbar ist, wird daraus ihr Profil."),
    traits: previous?.traits ?? [],
    topics: merged,
    balance: previous?.balance ?? 50,
    balanceNote: previous?.balanceNote ?? "Nähe und Abstand – beides braucht es. Finde die Balance.",
    focus: previous?.focus ?? (mode === "single" ? "Klar sein, was du suchst – und ehrlich sagen." : "Ruhig bleiben, zuhören, präsent sein."),
    steps: previous?.steps ?? (merged.length ? merged.slice(0, 3).map((t) => t.note) : ["Erzähl mehr – je mehr ich weiß, desto genauer wird es."]),
  };
}

/** Compact text the chat sends as context (max ~1500 chars). */
export function profileContext(p: ProfileAnalysis | null | undefined): string | undefined {
  if (!p) return undefined;
  const parts = [
    p.summary,
    p.traits.length ? `Merkmale: ${p.traits.join("; ")}.` : "",
    p.topics.length ? `Themen: ${p.topics.map((t) => `${t.label} (${t.note})`).join("; ")}.` : "",
    `Nähe/Abstand: ${p.balance}/100 – ${p.balanceNote}`,
    `Fokus: ${p.focus}`,
  ];
  return parts.filter(Boolean).join(" ").slice(0, 1500);
}
