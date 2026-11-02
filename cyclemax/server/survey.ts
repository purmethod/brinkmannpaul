// Survey cyclemax.app/questions: anonymous answers (no device id, no IP), aggregates and a Claude summary for /admin.
import * as z from "zod/v4";
import { AGE_GROUPS, ANNOYANCES, CURRENT_APPS, PRICES, QUESTION_IDS, QUESTIONS, SCALE, WISH_MAX } from "../shared/survey";
import { csvRow } from "./csv";
import type { Llm } from "./llm";

export const SURVEYS_PER_DAY_PER_SENDER = 3;
export const SURVEYS_PER_DAY_DEFAULT = 3000;

export const SurveyBody = z
  .object({
    consent: z.literal(true, { message: "Bitte bestätige, dass wir deine Antworten anonym speichern dürfen." }),
    version: z.string().max(20),
    // partial: every question may be skipped
    ratings: z.partialRecord(z.enum(QUESTION_IDS as [string, ...string[]]), z.number().int().min(1).max(SCALE.length)),
    annoyances: z.array(z.enum(ANNOYANCES)).max(ANNOYANCES.length).default([]),
    currentApp: z.enum(CURRENT_APPS).nullable().default(null),
    ageGroup: z.enum(AGE_GROUPS).nullable().default(null),
    price: z.enum(PRICES).nullable().default(null),
    wish: z.string().max(WISH_MAX).default(""),
    voice: z.boolean().default(false),
  })
  .refine((b) => Object.keys(b.ratings).length > 0 || b.wish.trim().length > 0, "Bitte beantworte mindestens eine Frage.");
export type SurveyBody = z.infer<typeof SurveyBody>;

export interface SurveyResponse {
  createdMonth: string;
  version: string;
  ratings: Record<string, number>;
  annoyances: string[];
  currentApp: string | null;
  ageGroup: string | null;
  price: string | null;
  wish: string;
  voice: boolean;
}

/** Free text stays anonymous: mail addresses, links and phone numbers are removed before storing. */
export function cleanWish(text: string): string {
  return text
    .replace(/[^\s@]+@[^\s@]+\.[^\s@]+/g, "[entfernt]")
    .replace(/\b(?:https?:\/\/|www\.)\S+/gi, "[entfernt]")
    .replace(/\+?\d[\d\s/().-]{7,}\d/g, "[entfernt]")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, WISH_MAX);
}

export function toResponse(b: SurveyBody, now = Date.now()): SurveyResponse {
  return {
    createdMonth: new Date(now).toISOString().slice(0, 7),
    version: b.version,
    ratings: Object.fromEntries(Object.entries(b.ratings).filter((e): e is [string, number] => typeof e[1] === "number")),
    annoyances: [...new Set(b.annoyances)],
    currentApp: b.currentApp,
    ageGroup: b.ageGroup,
    price: b.price,
    wish: cleanWish(b.wish),
    voice: b.voice,
  };
}

const round2 = (n: number) => Math.round(n * 100) / 100;

/** Admin: ranking of all wishes by average importance (1–4), plus counts for every choice question. */
export function summarizeSurvey(rows: SurveyResponse[]) {
  const count = (keys: (string | null)[], all: readonly string[]) => {
    const n: Record<string, number> = Object.fromEntries(all.map((k) => [k, 0]));
    let none = 0;
    for (const k of keys) {
      if (k === null) none++;
      else n[k] = (n[k] ?? 0) + 1;
    }
    return [...Object.entries(n).map(([key, v]) => ({ key, n: v })).sort((a, b) => b.n - a.n), ...(none ? [{ key: "keine Angabe", n: none }] : [])];
  };
  const ranking = QUESTIONS.map((q) => {
    const values = rows.map((r) => r.ratings[q.id]).filter((v): v is number => typeof v === "number");
    const dist = SCALE.map((_, i) => values.filter((v) => v === i + 1).length);
    return {
      id: q.id,
      text: q.text,
      n: values.length,
      mean: values.length ? round2(values.reduce((a, b) => a + b, 0) / values.length) : null,
      /** share of "sehr wichtig" + "ultra wichtig" */
      top: values.length ? round2((dist[2] + dist[3]) / values.length) : null,
      dist,
    };
  }).sort((a, b) => (b.mean ?? 0) - (a.mean ?? 0));
  return {
    responses: rows.length,
    withWish: rows.filter((r) => r.wish).length,
    viaVoice: rows.filter((r) => r.voice).length,
    scale: SCALE,
    ranking,
    annoyances: count(rows.flatMap((r) => r.annoyances), ANNOYANCES),
    currentApps: count(rows.map((r) => r.currentApp), CURRENT_APPS),
    ageGroups: count(rows.map((r) => r.ageGroup), AGE_GROUPS),
    prices: count(rows.map((r) => r.price), PRICES),
  };
}

export function surveyCsv(rows: (SurveyResponse & { id: string })[]): string {
  const head = ["id", "month", "version", ...QUESTION_IDS, "annoyances", "current_app", "age_group", "price", "voice", "wish"];
  const lines = rows.map((r) =>
    csvRow([
      r.id.slice(0, 8),
      r.createdMonth,
      r.version,
      ...QUESTION_IDS.map((id) => r.ratings[id] ?? ""),
      r.annoyances.join(" | "),
      r.currentApp,
      r.ageGroup,
      r.price,
      r.voice ? 1 : 0,
      r.wish,
    ]),
  );
  return [head.join(","), ...lines].join("\n") + "\n";
}

export const WishSummary = z.object({
  themes: z.array(z.object({ title: z.string(), mentions: z.number(), quote: z.string() })),
  features: z.array(z.string()),
  frustrations: z.array(z.string()),
  surprises: z.array(z.string()),
});
export type WishSummary = z.infer<typeof WishSummary>;

const SUMMARY_SYSTEM = `Du wertest Freitext-Antworten einer Umfrage unter Frauen aus: Was wünschen sie sich von einer Zyklus-App,
die wie eine Wettervorhersage jeden Tag wissenschaftlich fundierte Tipps gibt (Ernährung, Training, Schlaf, Sauna, Kälte)?
Fasse ehrlich und konkret zusammen, auf Deutsch:
- themes: die häufigsten Themen, absteigend nach Anzahl Nennungen (geschätzt), je mit einem kurzen wörtlichen Zitat (ohne persönliche Details).
- features: konkrete Funktionen, die gewünscht werden.
- frustrations: was an heutigen Zyklus-Apps stört.
- surprises: Unerwartetes, das für die Produktentwicklung wichtig ist.
Erfinde nichts, was nicht in den Antworten steht.`;

/** Admin button: themes across the latest free-text wishes. */
export async function summarizeWishes(llm: Llm, wishes: string[]): Promise<WishSummary | null> {
  const list = wishes
    .filter(Boolean)
    .slice(0, 500)
    .map((w, i) => `${i + 1}. ${w.slice(0, 600)}`)
    .join("\n");
  if (!list) return { themes: [], features: [], frustrations: [], surprises: [] };
  return llm.json(WishSummary, SUMMARY_SYSTEM, `Antworten (${wishes.length}):\n${list}`, 3000, { timeoutMs: 50_000, maxRetries: 0 });
}
