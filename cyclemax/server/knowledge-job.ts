// Self-extending knowledge base (Vercel Cron, daily 03:00):
//   1. Generator: 7 new daily lines + 2 chat principles (knowledge, best rated lines, top topics)
//   2. Critic: second Claude call checks every candidate against the rules – failed = discarded
//   3. Duplicate check against everything that exists (text similarity)
//   4. Attitude without factual claim → live; factual claim → "review" for /admin
import * as z from "zod/v4";
import { KNOWLEDGE_DOCS } from "../shared/knowledge.generated";
import { isDuplicate } from "../shared/similarity";
import type { LineCategory } from "../shared/types";
import type { Llm } from "./llm";
import type { Store } from "./store";

const CATEGORIES = ["any", "yellow", "pink", "green", "red", "single"] as const;

export const GeneratorSchema = z.object({
  lines: z.array(z.object({ text: z.string(), category: z.enum(CATEGORIES) })),
  principles: z.array(z.string()),
});

export const CriticSchema = z.object({
  verdicts: z.array(
    z.object({
      index: z.number().int(),
      pass: z.boolean(),
      factual: z.boolean(),
      reason: z.string(),
    }),
  ),
});

export const RULES = `Regeln für jede Zeile:
1. PURE-Stimme von Paul Brinkmann: direkt, nicht akademisch, persönlich, männlich, ruhig. Deutsch, du-Form.
2. Fels-Haltung: Er bleibt bei sich, wird ruhiger statt lauter, hält Druck, statt ihn abzuladen. Die Frau ist wertvoll.
3. Maximal 2 kurze Sätze, höchstens 140 Zeichen. Keine Emojis, keine Hashtags.
4. Keine sexuellen Inhalte, keine Sex-Taktiken.
5. Keine Manipulation, keine Spielchen, keine Abwertung von Frauen oder Männern.
6. Keine Aussagen über ihre Denkfähigkeit oder Rationalität; ihre Gefühle nie mit Hormonen erklären.
7. Keine medizinischen Aussagen, nichts über Fruchtbarkeit oder Verhütung.
8. Mindset statt Gefälligkeit: Die Zeile stärkt SEINE Haltung und seinen Standard (lebt, als würde er allein leben; pflegt
   seine Hülle; Ordnung als eigener Standard; führt durch Vorleben). Nie Dienste, um ihr zu gefallen („Mach ihr einen Tee“).`;

const CATEGORY_HELP = `Kategorien: any (allgemein), yellow (Wärme: Wärme, Entlastung, eigenes Training), pink (Führen: Führen, Date, Kompliment, Initiative), green (Nähe: Präsenz, Gespräche, Aufmerksamkeit), red (Standfest: nicht argumentieren, nichts persönlich nehmen, Routinen), single (Dating: Charakter statt Optik, ehrliche Absichten, gelebte Grenzen).`;

/** Mechanical pre-check, independent of the critic. */
export function passesFormat(text: string): boolean {
  const t = text.trim();
  if (!t || t.length > 160) return false;
  if (/\p{Extended_Pictographic}|#/u.test(t)) return false;
  const sentences = t.split(/(?<=[.!?…])\s+/).filter((s) => s.trim().length > 0);
  return sentences.length <= 2;
}

export interface JobSummary {
  status: "ok" | "skipped" | "error";
  reason?: string;
  generated: number;
  rejectedFormat: number;
  rejectedByCritic: number;
  duplicates: number;
  live: number;
  review: number;
  topics: string[];
}

export async function runKnowledgeJob(store: Store, llm: Llm | null, now = Date.now()): Promise<JobSummary> {
  const summary: JobSummary = {
    status: "ok",
    generated: 0,
    rejectedFormat: 0,
    rejectedByCritic: 0,
    duplicates: 0,
    live: 0,
    review: 0,
    topics: [],
  };
  if (!llm) {
    summary.status = "skipped";
    summary.reason = "ANTHROPIC_API_KEY fehlt";
    await store.addJobRun(summary, now);
    return summary;
  }
  try {
    const [allLines, allPrinciples, topLines, topics] = await Promise.all([
      store.allLines(),
      store.allPrinciples(),
      store.topLines(15),
      store.topTopics(7, now),
    ]);
    summary.topics = topics.map((t) => t.topic);
    const knowledge = KNOWLEDGE_DOCS.map((d) => d.body).join("\n\n");
    const examples = (topLines.length ? topLines : allLines.filter((l) => l.source === "seed").slice(0, 15))
      .map((l) => `- [${l.category}] ${l.text}`)
      .join("\n");

    const gen = await llm.json(
      GeneratorSchema,
      `Du schreibst Inhalte für Cyclemax, eine App für Männer (Fundament: PURE Method von Paul Brinkmann, Stoa). Kernthema: Sei der Fels in der Brandung. Wenn sie lauter wird, wirst du ruhiger. Ruhiger heißt nicht kleiner.\n\n${RULES}\n\n${CATEGORY_HELP}\n\nWissensbasis:\n${knowledge}`,
      `Schreibe genau 7 neue tägliche 1–2-Zeiler über wahre Männlichkeit (verteilt über die Kategorien, mindestens eine single) und genau 2 neue Leitsätze für den Chat-Mentor (je ein Satz, Handlungsregel für ihn).\n\nBestbewertete Zeilen als Vorbild (nicht kopieren):\n${examples}\n\nHäufigste anonyme Chat-Themen der letzten 7 Tage: ${summary.topics.join(", ") || "keine"}.\nGreife diese Themen auf. Wiederhole keine bestehende Zeile.`,
    );
    if (!gen) throw new Error("Generator lieferte kein Ergebnis");

    type Candidate = { kind: "line" | "principle"; text: string; category: LineCategory };
    const candidates: Candidate[] = [
      ...gen.lines.slice(0, 7).map((l) => ({ kind: "line" as const, text: l.text.trim(), category: l.category })),
      ...gen.principles.slice(0, 2).map((p) => ({ kind: "principle" as const, text: p.trim(), category: "any" as const })),
    ];
    summary.generated = candidates.length;

    const formatted = candidates.filter((c) => passesFormat(c.text));
    summary.rejectedFormat = candidates.length - formatted.length;
    if (!formatted.length) {
      await store.addJobRun(summary, now);
      return summary;
    }

    const critic = await llm.json(
      CriticSchema,
      `Du bist ein strenger Kritiker für Cyclemax-Inhalte. Prüfe jede Zeile gegen die Regeln. Im Zweifel: pass=false.\n\n${RULES}\n\nfactual=true, wenn die Zeile eine Faktenbehauptung enthält (Hormone, Biologie, Studien, Zahlen, Prozentangaben, Zeitangaben als Tatsache). Reine Haltung = factual=false.`,
      `Bewerte jede Zeile. Antworte mit einem Urteil pro index.\n\n${formatted.map((c, i) => `${i}: ${c.text}`).join("\n")}`,
      2000,
    );
    if (!critic) throw new Error("Kritiker lieferte kein Ergebnis");
    const verdicts = new Map(critic.verdicts.map((v) => [v.index, v]));

    const existing = [...(await store.allTexts()), ...allLines.map((l) => l.text), ...allPrinciples.map((p) => p.text)];
    for (const [i, c] of formatted.entries()) {
      const v = verdicts.get(i);
      if (!v || !v.pass) {
        summary.rejectedByCritic++;
        continue;
      }
      if (isDuplicate(c.text, existing)) {
        summary.duplicates++;
        continue;
      }
      existing.push(c.text);
      const status = v.factual ? "review" : "live";
      if (c.kind === "line") {
        await store.insertLine({ text: c.text, category: c.category, status, source: "generated", factual: v.factual ? 1 : 0 }, now);
      } else {
        await store.insertPrinciple({ text: c.text, status, source: "generated", factual: v.factual ? 1 : 0 }, now);
      }
      if (status === "live") summary.live++;
      else summary.review++;
    }
  } catch (e) {
    summary.status = "error";
    summary.reason = e instanceof Error ? e.message : String(e);
  }
  await store.addJobRun(summary, now);
  return summary;
}
