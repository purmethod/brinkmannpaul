// Anonymous screenshot upload (cyclemax.app/upload): women share screenshots of their cycle app.
// Pipeline: the images arrive once, Claude reads ONLY cycle data out of them, the server turns that into an
// anonymous dataset (no dates, no names, no device id, no IP) and the images are dropped – they are never stored.
import * as z from "zod/v4";
import type { Llm } from "./llm";

export const MAX_IMAGES = 6;
/** Per decoded image; the client shrinks screenshots to ~1600 px JPEG first (Vercel body limit 4.5 MB). */
export const MAX_IMAGE_BYTES = 1_500_000;
export const UPLOADS_PER_DAY_PER_SENDER = 5;

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
export const Extraction = z.object({
  relevant: z.boolean(),
  sourceApp: z.enum(SOURCE_APPS),
  periodStarts: z.array(z.string()),
  periodLengths: z.array(z.number()),
  cycleLengths: z.array(z.number()),
  averageCycleLength: z.number().nullable(),
  averagePeriodLength: z.number().nullable(),
  symptoms: z.array(z.object({ name: z.enum(SYMPTOMS), cycleDay: z.number().nullable() })),
  quality: z.enum(["klar", "teilweise", "unlesbar"]),
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
  quality: Extraction["quality"];
  images: number;
}

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
        .filter((s) => /^\d{4}-\d{2}-\d{2}$/.test(s))
        .map((s) => Date.parse(`${s}T00:00:00Z`))
        .filter((t) => Number.isFinite(t) && t <= now + DAY && t >= now - 10 * 365 * DAY),
    ),
  ].sort((a, b) => a - b);
  const fromStarts: number[] = [];
  for (let i = 1; i < starts.length; i++) {
    const d = Math.round((starts[i] - starts[i - 1]) / DAY);
    // > 90 days between two entries is a gap in the logging, not one cycle
    if (d >= 10 && d <= 90) fromStarts.push(d);
  }
  const cycleLengths = fromStarts.length ? fromStarts : ints(x.cycleLengths, 10, 90);
  const periodLengths = ints(x.periodLengths, 1, 15);
  const seen = new Set<string>();
  const symptoms = x.symptoms
    .map((s) => ({ name: s.name, cycleDay: s.cycleDay !== null && Number.isFinite(s.cycleDay) && s.cycleDay >= 1 && s.cycleDay <= 90 ? Math.round(s.cycleDay) : null }))
    .filter((s) => (seen.has(`${s.name}|${s.cycleDay}`) ? false : (seen.add(`${s.name}|${s.cycleDay}`), true)))
    .slice(0, 60);
  const avgCycle = inRange(x.averageCycleLength, 10, 90) ?? mean(cycleLengths);
  const avgPeriod = inRange(x.averagePeriodLength, 1, 15) ?? mean(periodLengths);
  if (!cycleLengths.length && !periodLengths.length && avgCycle === null && avgPeriod === null && !symptoms.length) return null;
  return {
    createdMonth: new Date(now).toISOString().slice(0, 7),
    sourceApp: x.sourceApp,
    ageGroup: meta.ageGroup,
    contraception: meta.contraception,
    cycleLengths: cycleLengths.slice(-24),
    periodLengths: periodLengths.slice(-24),
    avgCycle,
    avgPeriod,
    symptoms,
    quality: x.quality,
    images: meta.images,
  };
}

export const EXTRACT_SYSTEM = `Du liest Screenshots aus Zyklus- und Perioden-Apps (z. B. Apple Health, Flo, Clue, Natural Cycles) und extrahierst ausschließlich Zyklusdaten.
Regeln:
- Übernimm NIEMALS Namen, E-Mail-Adressen, Telefonnummern, Geburtstage, Orte, Kontonamen, Freitext-Notizen oder Benachrichtigungen. Ignoriere alles außer Zyklusdaten.
- periodStarts: Starttage der Periode, die eindeutig sichtbar sind, als YYYY-MM-DD. Fehlt das Jahr, nimm das jüngste zurückliegende passende Jahr relativ zu heute.
- periodLengths: sichtbare Periodendauern in Tagen. cycleLengths: ausdrücklich angezeigte Zykluslängen in Tagen. averageCycleLength / averagePeriodLength: nur wenn die App einen Durchschnitt anzeigt, sonst null.
- symptoms: erfasste Symptome, auf die vorgegebene Liste abgebildet, mit Zyklustag falls ablesbar (Tag 1 = erster Tag der Periode), sonst null.
- Keine Schätzungen oder Erfindungen: was nicht sicher ablesbar ist, bleibt leer.
- relevant = false, wenn die Bilder keine Zyklusdaten zeigen (z. B. andere Inhalte, Personen, Dokumente).`;

/** One Claude call for all images of an upload. Throws when Claude is not reachable. */
export async function extract(llm: Llm, images: UploadImage[], now = Date.now()): Promise<Extraction | null> {
  const today = new Date(now).toISOString().slice(0, 10);
  return llm.json(Extraction, EXTRACT_SYSTEM, `Heute ist ${today}. Lies die ${images.length} Screenshot(s) aus und gib nur die Zyklusdaten zurück.`, 3000, images);
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
  };
}

const csvCell = (v: unknown) => {
  const s = v === null || v === undefined ? "" : Array.isArray(v) ? v.join(" ") : String(v);
  return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

/** One row per dataset; lists are space separated, symptoms as name@cycleDay. */
export function toCsv(rows: (Dataset & { id: string })[]): string {
  const head = ["id", "month", "source_app", "age_group", "contraception", "cycle_lengths", "period_lengths", "avg_cycle", "avg_period", "symptoms", "quality", "images"];
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
      r.quality,
      r.images,
    ]
      .map(csvCell)
      .join(","),
  );
  return [head.join(","), ...lines].join("\n") + "\n";
}
