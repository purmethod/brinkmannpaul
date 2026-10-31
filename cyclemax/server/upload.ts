// Anonymous screenshot upload (cyclemax.app/upload): women share screenshots of their cycle app.
// Pipeline: the images arrive once, Claude reads cycle data plus everything else the app shows that helps build
// Cyclemax (mood, energy, sleep, desire, temperature, the app's own statistics …), the server turns that into an
// anonymous dataset (no dates, no names, no notes, no device id, no IP) – the images are never stored.
import * as z from "zod/v4";
import type { Llm } from "./llm";

export const MAX_IMAGES = 6;
/** Per decoded image; the client shrinks screenshots to ~1600 px JPEG first (Vercel body limit 4.5 MB). */
export const MAX_IMAGE_BYTES = 1_500_000;
export const UPLOADS_PER_DAY_PER_SENDER = 5;
/** All uploads together per day – own budget, so uploads can never use up the chat's Claude budget. */
export const UPLOADS_PER_DAY_DEFAULT = 200;

export const SOURCE_APPS = ["Apple Health", "Flo", "Clue", "Natural Cycles", "Stardust", "Ovy", "Kalender", "andere", "unbekannt"] as const;
export const SYMPTOMS = [
  "Krämpfe",
  "Kopfschmerzen",
  "Migräne",
  "Brustspannen",
  "Stimmungsschwankungen",
  "Reizbarkeit",
  "Traurigkeit",
  "Angst",
  "Müdigkeit",
  "viel Energie",
  "Schlafprobleme",
  "Heißhunger",
  "Blähungen",
  "Verdauung",
  "Übelkeit",
  "Akne",
  "Rückenschmerzen",
  "Lust hoch",
  "Lust niedrig",
  "Schmierblutung",
  "Ausfluss",
  "Hitzewallungen",
  "Sonstiges",
] as const;
/** Everything else a cycle app logs per day besides the fixed symptoms – each with a short value. */
export const OBSERVATIONS = [
  "Stimmung",
  "Gefühl",
  "Energie",
  "Schlaf",
  "Lust",
  "Sex",
  "Schmerz",
  "Blutung",
  "Verdauung",
  "Haut",
  "Ausfluss",
  "Temperatur",
  "Gewicht",
  "Bewegung",
  "Stress",
  "Appetit",
  "Konzentration",
  "Sozial",
  "Medikament",
  "Test",
  "Sonstiges",
] as const;
export const AGE_GROUPS = ["unter 20", "20-29", "30-39", "40-49", "50+"] as const;
export const CONTRACEPTION = ["hormonell", "nicht hormonell", "keine"] as const;

const MediaType = z.enum(["image/jpeg", "image/png", "image/webp"]);
export const UploadBody = z.object({
  consent: z.literal(true, { message: "Bitte bestätige die Einwilligung." }),
  ageGroup: z.enum(AGE_GROUPS).nullable().default(null),
  contraception: z.enum(CONTRACEPTION).nullable().default(null),
  images: z
    .array(z.object({ mediaType: MediaType, data: z.string().min(100).max(Math.ceil((MAX_IMAGE_BYTES * 4) / 3) + 4) }))
    .min(1)
    .max(MAX_IMAGES),
});
export type UploadBody = z.infer<typeof UploadBody>;
export type UploadImage = UploadBody["images"][number];

/** What Claude reads from the screenshots. Absolute dates exist only here, in memory. */
// Free strings on purpose: structured outputs only describe enums, so an app or symptom off the list would make
// the whole parse fail. anonymize() maps everything onto the fixed lists instead.
export const Extraction = z.object({
  relevant: z.boolean(),
  sourceApp: z.string(),
  periodStarts: z.array(z.string()),
  periodLengths: z.array(z.number()),
  cycleLengths: z.array(z.number()),
  averageCycleLength: z.number().nullable(),
  averagePeriodLength: z.number().nullable(),
  symptoms: z.array(z.object({ name: z.string(), cycleDay: z.number().nullable() })),
  observations: z.array(z.object({ category: z.string(), value: z.string(), cycleDay: z.number().nullable() })),
  metrics: z.array(z.object({ name: z.string(), value: z.number(), unit: z.string() })),
  quality: z.string(),
});
export type Extraction = z.infer<typeof Extraction>;

/** What is stored. Nothing in here points to a person or a calendar date. */
export interface Dataset {
  createdMonth: string;
  sourceApp: (typeof SOURCE_APPS)[number];
  ageGroup: (typeof AGE_GROUPS)[number] | null;
  contraception: (typeof CONTRACEPTION)[number] | null;
  cycleLengths: number[];
  periodLengths: number[];
  avgCycle: number | null;
  avgPeriod: number | null;
  symptoms: { name: (typeof SYMPTOMS)[number]; cycleDay: number | null }[];
  /** Mood, energy, sleep … as short labels per cycle day. */
  observations: { category: (typeof OBSERVATIONS)[number]; value: string; cycleDay: number | null }[];
  /** Statistics the app shows itself (e.g. luteal phase 13 days, variation 3 days, ovulation day 15). */
  metrics: { name: string; value: number; unit: string }[];
  quality: (typeof QUALITY)[number];
  images: number;
}

export const QUALITY = ["klar", "teilweise", "unlesbar"] as const;

const norm = (s: string) => s.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]/g, "");
/** English (and a few other) labels apps use, mapped onto the German list. */
const SYMPTOM_ALIASES: Record<string, (typeof SYMPTOMS)[number]> = {
  cramps: "Krämpfe", krampfe: "Krämpfe", headache: "Kopfschmerzen", migraine: "Migräne", tenderbreasts: "Brustspannen", breasttenderness: "Brustspannen",
  moodswings: "Stimmungsschwankungen", irritability: "Reizbarkeit", irritable: "Reizbarkeit", sad: "Traurigkeit", sadness: "Traurigkeit", anxiety: "Angst", anxious: "Angst",
  fatigue: "Müdigkeit", tired: "Müdigkeit", energetic: "viel Energie", insomnia: "Schlafprobleme", sleepproblems: "Schlafprobleme", cravings: "Heißhunger",
  bloating: "Blähungen", constipation: "Verdauung", diarrhea: "Verdauung", nausea: "Übelkeit", acne: "Akne", backache: "Rückenschmerzen", lowerbackpain: "Rückenschmerzen",
  highsexdrive: "Lust hoch", lowsexdrive: "Lust niedrig", spotting: "Schmierblutung", discharge: "Ausfluss", hotflashes: "Hitzewallungen",
};
const OBSERVATION_ALIASES: Record<string, (typeof OBSERVATIONS)[number]> = {
  mood: "Stimmung", moods: "Stimmung", laune: "Stimmung", feeling: "Gefühl", feelings: "Gefühl", emotion: "Gefühl", emotions: "Gefühl", gefuhle: "Gefühl",
  energy: "Energie", sleep: "Schlaf", libido: "Lust", sexdrive: "Lust", desire: "Lust", sexualactivity: "Sex", intimacy: "Sex",
  pain: "Schmerz", flow: "Blutung", bleeding: "Blutung", digestion: "Verdauung", stool: "Verdauung", skin: "Haut", discharge: "Ausfluss", cervicalmucus: "Ausfluss",
  temperature: "Temperatur", bbt: "Temperatur", basaltemperatur: "Temperatur", basalbodytemperature: "Temperatur", weight: "Gewicht",
  exercise: "Bewegung", activity: "Bewegung", sport: "Bewegung", workout: "Bewegung", stress: "Stress", appetite: "Appetit", cravings: "Appetit",
  focus: "Konzentration", concentration: "Konzentration", mental: "Konzentration", social: "Sozial", medication: "Medikament", medikamente: "Medikament",
  pills: "Medikament", test: "Test", tests: "Test", ovulationtest: "Test", pregnancytest: "Test",
};
/** Short labels only: anything that looks like a contact, link or long number is not a cycle observation. */
const cleanValue = (v: string) => {
  const s = v.replace(/\s+/g, " ").trim().slice(0, 40);
  // no contacts, links, long numbers or calendar dates (12.10. / 2026-10-12)
  return !s || /@|https?:|www\.|\d{5,}|\+\d{2}|\d{1,2}[./]\d{1,2}[./]|\d{4}-\d{2}-\d{2}/i.test(s) ? null : s.toLowerCase();
};
const cleanName = (v: string) => {
  const s = v.replace(/\s+/g, " ").trim().slice(0, 40);
  return !s || /@|https?:|www\.|\d{5,}/i.test(s) ? null : s;
};
const cycleDayOf = (d: number | null) => (d !== null && Number.isFinite(d) && d >= 1 && d <= 90 ? Math.round(d) : null);
const unique = <T>(xs: T[], key: (x: T) => string) => {
  const seen = new Set<string>();
  return xs.filter((x) => (seen.has(key(x)) ? false : (seen.add(key(x)), true)));
};

const pick = <T extends string>(list: readonly T[], value: string, fallback: T, aliases: Record<string, T> = {}): T =>
  list.find((x) => norm(x) === norm(value)) ?? aliases[norm(value)] ?? fallback;

const MAGIC: Record<UploadImage["mediaType"], (b: Buffer) => boolean> = {
  "image/jpeg": (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  "image/png": (b) => b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
  "image/webp": (b) => b.subarray(0, 4).toString("latin1") === "RIFF" && b.subarray(8, 12).toString("latin1") === "WEBP",
};

/** The bytes really are an image of the declared type and small enough. Returns an error text or null. */
export function checkImage(img: UploadImage): string | null {
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(img.data)) return "Bild ist beschädigt.";
  const bytes = Buffer.from(img.data, "base64");
  if (bytes.length > MAX_IMAGE_BYTES) return "Ein Bild ist zu groß.";
  if (!MAGIC[img.mediaType](bytes)) return "Nur Screenshots als JPEG, PNG oder WebP.";
  return null;
}

const DAY = 86_400_000;
/** "2026-02-30" must not silently become 2 March. */
const validDay = (s: string) => /^\d{4}-\d{2}-\d{2}$/.test(s) && new Date(`${s}T00:00:00Z`).toISOString().slice(0, 10) === s;
const round1 = (n: number) => Math.round(n * 10) / 10;
const mean = (xs: number[]) => (xs.length ? round1(xs.reduce((a, b) => a + b, 0) / xs.length) : null);
const ints = (xs: number[], min: number, max: number) => xs.filter((n) => Number.isFinite(n)).map(Math.round).filter((n) => n >= min && n <= max);
const inRange = (n: number | null, min: number, max: number) => (n !== null && Number.isFinite(n) && n >= min && n <= max ? round1(n) : null);

/**
 * Extraction → anonymous dataset. Absolute dates are turned into cycle lengths and then dropped;
 * implausible values are removed. Returns null when there is nothing about the cycle in it.
 */
export function anonymize(x: Extraction, meta: Pick<Dataset, "ageGroup" | "contraception" | "images">, now = Date.now()): Dataset | null {
  if (!x.relevant) return null;
  const starts = [
    ...new Set(
      x.periodStarts
        .filter(validDay)
        .map((s) => Date.parse(`${s}T00:00:00Z`))
        .filter((t) => Number.isFinite(t) && t <= now + DAY && t >= now - 10 * 365 * DAY),
    ),
  ].sort((a, b) => a - b);
  const diffs: number[] = [];
  for (let i = 1; i < starts.length; i++) diffs.push(Math.round((starts[i] - starts[i - 1]) / DAY));
  const fromStarts = withoutGaps(diffs.filter((d) => d >= 10));
  const shown = ints(x.cycleLengths, 10, 90);
  // what the app lists itself wins when it shows more cycles than the visible start dates give
  const cycleLengths = shown.length > fromStarts.length ? shown : fromStarts;
  const periodLengths = ints(x.periodLengths, 1, 15);
  const symptoms = unique(
    x.symptoms.map((s) => ({ name: pick(SYMPTOMS, s.name, "Sonstiges", SYMPTOM_ALIASES), cycleDay: cycleDayOf(s.cycleDay) })),
    (s) => `${s.name}|${s.cycleDay}`,
  ).slice(0, 60);
  const observations = unique(
    x.observations.flatMap((o) => {
      const value = cleanValue(o.value);
      return value ? [{ category: pick(OBSERVATIONS, o.category, "Sonstiges", OBSERVATION_ALIASES), value, cycleDay: cycleDayOf(o.cycleDay) }] : [];
    }),
    (o) => `${o.category}|${o.value}|${o.cycleDay}`,
  ).slice(0, 120);
  const metrics = unique(
    x.metrics.flatMap((m) => {
      const name = cleanName(m.name);
      return name && Number.isFinite(m.value) && Math.abs(m.value) < 1e6 ? [{ name, value: round1(m.value), unit: (cleanName(m.unit) ?? "").slice(0, 12) }] : [];
    }),
    (m) => m.name.toLowerCase(),
  ).slice(0, 30);
  const avgCycle = inRange(x.averageCycleLength, 10, 90) ?? mean(cycleLengths);
  const avgPeriod = inRange(x.averagePeriodLength, 1, 15) ?? mean(periodLengths);
  if (!cycleLengths.length && !periodLengths.length && avgCycle === null && avgPeriod === null && !symptoms.length && !observations.length && !metrics.length)
    return null;
  return {
    createdMonth: new Date(now).toISOString().slice(0, 7),
    sourceApp: pick(SOURCE_APPS, x.sourceApp, "andere"),
    ageGroup: meta.ageGroup,
    contraception: meta.contraception,
    cycleLengths: cycleLengths.slice(-24),
    periodLengths: periodLengths.slice(-24),
    avgCycle,
    avgPeriod,
    symptoms,
    observations,
    metrics,
    quality: pick(QUALITY, x.quality, "teilweise"),
    images: meta.images,
  };
}

/**
 * Differences between consecutive start dates. A missing start in between (or a screenshot of July and September
 * only) looks like one long cycle: with enough data, drop what is far above the typical length; with little data,
 * anything above 60 days.
 */
export function withoutGaps(diffs: number[]): number[] {
  const plausible = diffs.filter((d) => d >= 10 && d <= 90);
  if (plausible.length < 3) return plausible.filter((d) => d <= 60);
  const sorted = [...plausible].sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length / 2)];
  return plausible.filter((d) => d <= Math.max(45, median * 1.6));
}

export const EXTRACT_SYSTEM = `Du liest Screenshots aus Zyklus- und Perioden-Apps (z. B. Apple Health, Flo, Clue, Natural Cycles) für die Entwicklung einer Zyklus-App.
Lies alles aus, was über den Zyklus und das Befinden erfasst ist – aber nichts, was eine Person erkennbar macht.
Regeln:
- Übernimm NIEMALS Namen, E-Mail-Adressen, Telefonnummern, Geburtstage, Orte, Kontonamen, Fotos von Personen, Freitext-Notizen, Chat- oder Benachrichtigungstexte.
- periodStarts: Starttage der Periode, die eindeutig sichtbar sind, als YYYY-MM-DD. Fehlt das Jahr, nimm das jüngste zurückliegende passende Jahr relativ zu heute.
- periodLengths: sichtbare Periodendauern in Tagen. cycleLengths: ausdrücklich angezeigte Zykluslängen in Tagen. averageCycleLength / averagePeriodLength: nur wenn die App einen Durchschnitt anzeigt, sonst null.
- sourceApp: eine aus ${SOURCE_APPS.join(", ")}.
- symptoms: erfasste Symptome, abgebildet auf genau einen dieser Namen: ${SYMPTOMS.join(", ")}; mit Zyklustag falls ablesbar (Tag 1 = erster Tag der Periode), sonst null.
- observations: alle weiteren erfassten Einträge zu Befinden und Körper, je Eintrag eine Kategorie aus ${OBSERVATIONS.join(", ")}
  und ein kurzer Wert in wenigen Wörtern, wie die App ihn zeigt (z. B. Stimmung "gereizt", Gefühl "verliebt", Energie "niedrig", Schlaf "7 Stunden",
  Lust "hoch", Sex "geschützt", Blutung "stark", Ausfluss "cremig", Temperatur "36,7 °C", Bewegung "Yoga", Test "Eisprungtest positiv").
  Mit Zyklustag (Tag 1 = erster Tag der Periode; rechne vom letzten sichtbaren Periodenstart davor), sonst null. Niemals Datumsangaben in den Wert schreiben.
- metrics: Kennzahlen, die die App selbst anzeigt, mit Name, Zahl und Einheit (z. B. "Lutealphase" 13 "Tage", "Zyklusschwankung" 3 "Tage", "Eisprung" 15 "Zyklustag", "Schritte im Schnitt" 8000 "").
- quality: klar, teilweise oder unlesbar.
- Keine Schätzungen oder Erfindungen: was nicht sicher ablesbar ist, bleibt leer.
- relevant = false, wenn die Bilder keine Zyklusdaten zeigen (z. B. andere Inhalte, Personen, Dokumente).`;

/** One Claude call for all images of an upload. Throws when Claude is not reachable. */
export async function extract(llm: Llm, images: UploadImage[], now = Date.now()): Promise<Extraction | null> {
  const today = new Date(now).toISOString().slice(0, 10);
  // no retries and a timeout below the function limit: the images go to the API once
  return llm.json(Extraction, EXTRACT_SYSTEM, `Heute ist ${today}. Lies die ${images.length} Screenshot(s) aus: Zyklusdaten, Symptome, alle weiteren Einträge zum Befinden und die Kennzahlen der App.`, 3000, {
    images,
    maxRetries: 0,
    timeoutMs: 50_000,
  });
}

export type PhaseName = "yellow" | "pink" | "green" | "red";

/**
 * Cyclemax's own phase model for a cycle day: yellow days 1-7, red the 7 days before the next period,
 * green the 7 days before red, pink in between. Cycle length clamped like the app (21-45).
 */
export function phaseOfDay(cycleDay: number, cycleLength: number | null): PhaseName {
  const len = Math.min(45, Math.max(21, Math.round(cycleLength ?? 28)));
  if (cycleDay <= 7) return "yellow";
  if (cycleDay > len - 7) return "red";
  if (cycleDay > len - 14) return "green";
  return "pink";
}

/** Admin view: plain aggregates over all datasets. */
export function summarize(rows: Dataset[]) {
  const all = rows.flatMap((r) => r.cycleLengths);
  const sorted = [...all].sort((a, b) => a - b);
  const median = sorted.length ? (sorted.length % 2 ? sorted[(sorted.length - 1) / 2] : (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2) : null;
  const count = <K extends string>(keys: (K | null)[]) =>
    Object.entries(keys.reduce<Record<string, number>>((acc, k) => ((acc[k ?? "keine Angabe"] = (acc[k ?? "keine Angabe"] ?? 0) + 1), acc), {}))
      .map(([key, n]) => ({ key, n }))
      .sort((a, b) => b.n - a.n);
  const buckets = ["<21", "21-25", "26-30", "31-35", "36-45", ">45"];
  const bucketOf = (d: number) => (d < 21 ? 0 : d <= 25 ? 1 : d <= 30 ? 2 : d <= 35 ? 3 : d <= 45 ? 4 : 5);
  const hist = buckets.map((key) => ({ key, n: 0 }));
  for (const d of all) hist[bucketOf(d)].n++;
  return {
    datasets: rows.length,
    cycles: all.length,
    cycleLength: { mean: mean(all), median, min: sorted[0] ?? null, max: sorted.at(-1) ?? null, histogram: hist },
    periodLength: { mean: mean(rows.flatMap((r) => r.periodLengths)) },
    symptoms: count(rows.flatMap((r) => r.symptoms.map((s) => s.name))),
    sourceApps: count(rows.map((r) => r.sourceApp)),
    ageGroups: count(rows.map((r) => r.ageGroup)),
    contraception: count(rows.map((r) => r.contraception)),
    observations: OBSERVATIONS.map((category) => {
      const values = rows.flatMap((r) => r.observations.filter((o) => o.category === category).map((o) => o.value));
      return { category, n: values.length, top: count(values).slice(0, 6) };
    })
      .filter((o) => o.n > 0)
      .sort((a, b) => b.n - a.n),
    // what shows up in which Cyclemax phase – the core question for the app's texts
    byPhase: (["yellow", "pink", "green", "red"] as const).map((phase) => ({
      phase,
      top: count(
        rows.flatMap((r) => [
          ...r.symptoms.filter((s) => s.cycleDay !== null && phaseOfDay(s.cycleDay, r.avgCycle) === phase).map((s) => s.name),
          ...r.observations.filter((o) => o.cycleDay !== null && phaseOfDay(o.cycleDay, r.avgCycle) === phase).map((o) => `${o.category}: ${o.value}`),
        ]),
      ).slice(0, 10),
    })),
    metrics: Object.values(
      rows
        .flatMap((r) => r.metrics)
        .reduce<Record<string, { name: string; unit: string; values: number[] }>>((acc, m) => {
          const k = `${m.name.toLowerCase()}|${m.unit}`;
          (acc[k] ??= { name: m.name, unit: m.unit, values: [] }).values.push(m.value);
          return acc;
        }, {}),
    )
      .map((m) => ({ name: m.name, unit: m.unit, n: m.values.length, mean: mean(m.values) }))
      .sort((a, b) => b.n - a.n)
      .slice(0, 20),
  };
}

const csvCell = (v: unknown) => {
  let s = v === null || v === undefined ? "" : Array.isArray(v) ? v.join(" ") : String(v);
  // text read from screenshots must never run as a formula in Excel/Numbers
  if (typeof v !== "number" && /^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

/** One row per dataset; number lists space separated, symptoms as name@cycleDay, observations category:value@cycleDay. */
export function toCsv(rows: (Dataset & { id: string })[]): string {
  const head = ["id", "month", "source_app", "age_group", "contraception", "cycle_lengths", "period_lengths", "avg_cycle", "avg_period", "symptoms", "observations", "metrics", "quality", "images"];
  const lines = rows.map((r) =>
    [
      r.id.slice(0, 8),
      r.createdMonth,
      r.sourceApp,
      r.ageGroup,
      r.contraception,
      r.cycleLengths,
      r.periodLengths,
      r.avgCycle,
      r.avgPeriod,
      r.symptoms.map((s) => (s.cycleDay ? `${s.name}@${s.cycleDay}` : s.name)),
      r.observations.map((o) => `${o.category}:${o.value}${o.cycleDay ? `@${o.cycleDay}` : ""}`).join(" | "),
      r.metrics.map((m) => `${m.name}=${m.value}${m.unit ? ` ${m.unit}` : ""}`).join(" | "),
      r.quality,
      r.images,
    ]
      .map(csvCell)
      .join(","),
  );
  return [head.join(","), ...lines].join("\n") + "\n";
}
