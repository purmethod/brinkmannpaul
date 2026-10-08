// "Erzähl mir von ihr / von dir": Claude turns free speech into a structured profile.
// Nothing is stored on the server – the profile lives on the device.
import * as z from "zod/v4";
import { fallbackProfile } from "../shared/profile";
import type { ProfileRequest, ProfileResponse } from "../shared/types";
import { BASE_PROMPT, MISSION } from "./chat";
import type { Llm } from "./llm";
import { KNOWLEDGE_DOCS } from "../shared/knowledge.generated";

export const ProfileSchema = z.object({
  summary: z.string(),
  traits: z.array(z.string()),
  topics: z.array(z.object({ label: z.string(), note: z.string() })),
  balance: z.number(),
  balanceNote: z.string(),
  focus: z.string(),
  steps: z.array(z.string()),
});

const RULES = `Regeln:
- Deutsch, du-Form an ihn gerichtet, kurz und klar. Keine Emojis, kein Therapeuten-Ton.
- summary: 2–3 Sätze. traits: max. 5 kurze Merkmale. topics: max. 6 Themen (label 1–3 Wörter, note ein Satz mit seiner Haltung/Handlung).
- balance: 0 = er hält zu viel Abstand, 50 = gute Balance, 100 = zu viel Nähe/Klammern/Bedürftigkeit. balanceNote: ein Satz.
- focus: ein Satz – worauf es jetzt am meisten ankommt. steps: genau 3 konkrete, kleine Handlungen für diese Woche.
- Nur was er erzählt hat. Nichts erfinden, keine Diagnosen, keine Aussagen über ihre Denkfähigkeit, ihre Gefühle nie mit Hormonen erklären.
- Intimität sachlich und respektvoll, ohne explizite Details. Keine Manipulation, keine Taktiken.
- Gibt es ein vorheriges Profil: ergänzen und aktualisieren, nicht verwerfen.
- Bei Gewalt oder Selbstgefährdung: als Thema „Hilfe holen“ mit dem Hinweis auf professionelle Hilfe aufnehmen.`;

export async function analyzeProfile(req: ProfileRequest, llm: Llm | null): Promise<ProfileResponse> {
  if (llm) {
    try {
      const who =
        req.mode === "single"
          ? "Er ist Single und erzählt von sich: wer er ist, was er sucht, wie Dating bei ihm läuft."
          : "Er ist in einer Beziehung und erzählt von seiner Partnerin und eurer Beziehung.";
      const knowledge = KNOWLEDGE_DOCS.filter((d) => ["pure-method", "phases", "pure-modules"].includes(d.slug))
        .map((d) => d.body)
        .join("\n\n");
      const res = await llm.json(
        ProfileSchema,
        `${BASE_PROMPT}\n\n${MISSION}\n\nDeine Aufgabe jetzt: Aus seiner frei gesprochenen Erzählung ein Profil erstellen, mit dem du ihn danach gezielt coachst.\n\n${RULES}\n\nWissensbasis:\n${knowledge}`,
        `${who}\n\n${req.previous ? `Bisheriges Profil (JSON):\n${JSON.stringify(req.previous)}\n\n` : ""}Seine Erzählung:\n"""${req.text}"""`,
        3000,
      );
      if (res) {
        return {
          source: "claude",
          profile: {
            summary: res.summary.trim(),
            traits: res.traits.slice(0, 5),
            topics: res.topics.slice(0, 6),
            balance: Math.max(0, Math.min(100, Math.round(res.balance))),
            balanceNote: res.balanceNote.trim(),
            focus: res.focus.trim(),
            steps: res.steps.slice(0, 3),
          },
        };
      }
    } catch (e) {
      console.error("profile: claude failed", e instanceof Error ? e.message : e);
    }
  }
  return { source: "fallback", profile: fallbackProfile(req.mode, req.text, req.previous) };
}
