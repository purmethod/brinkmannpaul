// KI-Mentor. The server forwards to Claude and stores no content – only an anonymous topic keyword.
import { KNOWLEDGE_DOCS } from "../shared/knowledge.generated";
import { HELP_TEXT, needsHelp } from "../shared/safety";
import { PHASES } from "../shared/texts";
import { topicOf } from "../shared/topics";
import type { ChatRequest, ChatResponse, Line } from "../shared/types";
import type { Llm } from "./llm";

export const BASE_PROMPT = `Du bist der Cyclemax-Mentor, ein ruhiger, klarer Begleiter für Männer. Grundlage ist die PURE Method von Paul Brinkmann und stoische Haltung (Marc Aurel). Sei der Fels in der Brandung. Wenn sie lauter wird, wird er leiser – leiser heißt nicht kleiner. Er bleibt bei sich. Ziel ist eine langfristige Beziehung und Familie; die Frau ist wertvoll. Ihre Grenzen werden respektiert; seine Grenzen formuliert er ruhig mit Ich-Botschaften, Grundsatzgespräche in Grün, in Rot nur wenn akut und dann kurz. Im Dating-Modus: Wahl nach Charakter statt Optik, ehrliche Absichten, gelebte statt angekündigte Grenzen. Nicht alles ist Zyklus: Hat sie ein echtes Anliegen, nimm es ernst. Erkläre ihre Gefühle nie mit Hormonen, und er sagt nie 'Hast du deine Tage?'. Keine Manipulation, keine Sex-Taktiken, keine Abwertung von Frauen, keine Aussagen über ihre Denkfähigkeit. Bei Gewalt, Drohungen oder Hinweisen auf Selbstgefährdung: klar sagen, dass das professionelle Hilfe braucht, und auf Hilfsangebote verweisen.`;

export const STYLE_RULES = `So antwortest du:
- Deutsch, du-Form, kurz: höchstens 80 Wörter. Kein Markdown, keine Listen, keine Emojis.
- Kurz, direkt, männlich. Kein Therapeuten-Ton, keine Floskeln wie „Ich verstehe, dass …“.
- Erst ein Satz Einordnung, dann eine konkrete Handlung.
- Fragt er „Wie soll ich antworten?“ oder Ähnliches: gib einen fertigen Satz vor, beginnend mit „Sag: “.
- Ist er wütend: zuerst ihn beruhigen (atmen, Pause, kurz rausgehen), dann die Lösung.
- Keine Aussagen über Fruchtbarkeit, Verhütung oder Medizin. Keine sexuellen Inhalte.
- Nenne Phase oder Zyklustag nie als Begründung ihr gegenüber. Der Zyklus ist nur dein Hintergrundwissen.
- Bei Gewalt, Drohungen oder Selbstgefährdung: Notruf 112, TelefonSeelsorge 0800 111 0 111, Hilfetelefon Gewalt an Männern 0800 123 99 00, Hilfetelefon Gewalt gegen Frauen 116 016.`;

/** Stable system prompt (cached): base + rules + knowledge + live principles. */
export function buildSystemPrompt(principles: string[]): string {
  const knowledge = KNOWLEDGE_DOCS.filter((d) => d.slug !== "chat-principles")
    .map((d) => d.body)
    .join("\n\n");
  return [
    BASE_PROMPT,
    STYLE_RULES,
    `Leitsätze:\n${principles.map((p) => `- ${p}`).join("\n")}`,
    `Wissensbasis (Hintergrund, nicht zitieren, nicht ausbreiten):\n\n${knowledge}`,
  ].join("\n\n");
}

export function buildContext(req: Pick<ChatRequest, "mode" | "phase" | "cycleDay" | "notes">): string {
  const parts = [
    `Kontext (vom Gerät, nicht gespeichert): Modus ${req.mode === "single" ? "Single/Dating" : "Beziehung"}.`,
  ];
  if (req.mode === "relationship" && req.phase) {
    parts.push(`Aktuelle Phase: ${PHASES[req.phase].word} (${req.phase}). Zyklustag ${req.cycleDay ?? "unbekannt"}.`);
  }
  if (req.notes.length) parts.push(`Seine letzten Notizen: ${req.notes.map((n) => `„${n}“`).join(" ")}`);
  return parts.join(" ");
}

/** Offline/no-key answer: a fitting line from the knowledge base. */
export function fallbackAnswer(req: ChatRequest, lines: Line[]): string {
  const category = req.mode === "single" ? "single" : req.phase;
  const pool = lines.filter((l) => l.category === category || l.category === "any");
  const last = req.messages.filter((m) => m.role === "user").at(-1)?.content ?? "";
  let h = 0;
  for (const ch of last) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return pool.length ? pool[h % pool.length].text : "Es ist nichts Großes passiert. Atme. Weiter.";
}

export async function answerChat(
  req: ChatRequest,
  deps: { llm: Llm | null; lines: Line[]; principles: string[] },
): Promise<ChatResponse> {
  const lastUser = req.messages.filter((m) => m.role === "user").at(-1)?.content ?? "";
  const topic = topicOf(lastUser);
  const crisis = needsHelp(lastUser);
  const id = crypto.randomUUID();

  let text = "";
  let source: ChatResponse["source"] = "fallback";
  if (deps.llm) {
    try {
      const res = await deps.llm.chat({
        system: buildSystemPrompt(deps.principles),
        context: buildContext(req),
        messages: req.messages,
      });
      if (!res.refused && res.text) {
        text = res.text;
        source = "claude";
      }
    } catch (e) {
      console.error("chat: claude failed, using fallback", e instanceof Error ? e.message : e);
    }
  }
  if (!text) text = fallbackAnswer(req, deps.lines);
  // Safety net: help resources are always attached, independent of the model.
  if (crisis && !text.includes("0800 111 0 111")) text = `${HELP_TEXT}\n\n${text}`;
  return { id, text, source, topic };
}
