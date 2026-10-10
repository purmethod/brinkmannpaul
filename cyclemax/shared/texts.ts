import type { Phase, PhasePushKey } from "./types";

export const APP_NAME = "Cyclemax";
export const CLAIM = "Be the Cycleman.";
export const CORE_SENTENCE = "Wenn sie lauter wird, wirst du ruhiger. Ruhiger heißt nicht kleiner.";
export const PURE_URL = "https://purmethod.com";

export const PHASE_COLORS: Record<Phase, string> = {
  yellow: "#F2B705",
  pink: "#E83E8C",
  green: "#2E9E4F",
  red: "#C8102E",
};

export interface PhaseText {
  /** His mode for these days – the word in the ring. */
  word: string;
  color: string;
  /** One sentence of attitude on the home screen. */
  attitude: string;
  /** What is going on in her body, one line (Verstehen). */
  hormones: string;
  /** What can come – her side, hedged. Shown on the home screen. */
  forecast: string;
  /** How he leads in these days (Verstehen). */
  lead: string;
}

export const PHASES: Record<Phase, PhaseText> = {
  yellow: {
    word: "Wärme",
    color: PHASE_COLORS.yellow,
    attitude: "Bleib warm und klar – und zieh dein eigenes Programm durch.",
    hormones: "Östrogen und Progesteron sind unten. Ihr Körper arbeitet.",
    forecast: "Krämpfe, Kopfweh, wenig Energie – vor allem an den ersten Tagen. Die Spannung der Vorwoche löst sich meist.",
    lead: "Du führst mit Wärme: ruhig da sein, nichts kommentieren, dein Standard läuft weiter.",
  },
  pink: {
    word: "Führen",
    color: PHASE_COLORS.pink,
    attitude: "Plan was mit ihr – du gibst den Takt vor.",
    hormones: "Östrogen steigt bis zur Mitte des Zyklus.",
    forecast: "Mehr Energie, bessere Laune, offen für Neues. Gute Tage für Pläne und Unternehmungen.",
    lead: "Du führst mit Initiative: entscheiden, planen, einladen.",
  },
  green: {
    word: "Nähe",
    color: PHASE_COLORS.green,
    attitude: "Sei präsent, nicht bedürftig – jetzt ist Zeit für Gespräche.",
    hormones: "In der zweiten Zyklushälfte steigt Progesteron.",
    forecast: "Ruhiger, häuslicher, öfter müde. Die stabilsten Tage für Gespräche, die anstehen.",
    lead: "Du führst mit Präsenz: zuhören, Zeit zu zweit, wichtige Themen jetzt ansprechen.",
  },
  red: {
    word: "Standfest",
    color: PHASE_COLORS.red,
    attitude: "Wenn sie lauter wird, wirst du ruhiger – ruhiger heißt nicht kleiner.",
    hormones: "Östrogen und Progesteron fallen ab.",
    forecast: "Dünnhäutiger, schneller gereizt, Kleinigkeiten wiegen schwer. Schlaf oft schlechter. Das gilt nicht dir.",
    lead: "Du führst mit Ruhe: nichts persönlich nehmen, nicht argumentieren, deine Routinen halten.",
  },
};

/** Order of the phases within one cycle. */
export const PHASE_ORDER: Phase[] = ["yellow", "pink", "green", "red"];

/** "Hey Man" tone, short. Max one notification per day. Cyclemax never asks him for anything. */
export const PHASE_PUSH_TEXT: Record<PhasePushKey, string> = {
  red7: "Hey Man, Standfest beginnt. Sie kann dünnhäutiger werden – du wirst ruhiger.",
  red2: "Ihre Tage stehen kurz bevor. Halt die Linie: Wenn sie lauter wird, wirst du ruhiger.",
  pink: "Hey Man, Rückenwind. Ihre Energie steigt – plan was, du gibst den Takt vor.",
  green: "Nähe beginnt. Ruhigere Tage – gut für Gespräche, die anstehen.",
};

/** Where every notification leads when tapped. */
export const PUSH_URL = "/heute/";

/** Shown in the app right after "Ihre Tage haben begonnen" (yellow). */
export const AFTER_ENTRY_TEXT = "Eingetragen. Sturm vorbei – den Rest übernimmt Cyclemax.";

/** After an entry with another date: which day was saved and what that means today. `day` e.g. "Gestern", "Mi, 8. Okt.". */
export function afterEntryText(day: string, phaseWord: string): string {
  const d = day === "Heute" || day === "Gestern" ? day.toLowerCase() : day;
  return `Eingetragen: ${d}. Jetzt ${phaseWord} – den Rest übernimmt Cyclemax.`;
}

/** Lock screen text when "neutrale Benachrichtigungen" is on. */
export const NEUTRAL_TITLE = APP_NAME;
export const NEUTRAL_BODY = "";

export function isPhasePushKey(key: string): key is PhasePushKey {
  return Object.hasOwn(PHASE_PUSH_TEXT, key);
}

/** Heads-up on the home screen, 1–2 days before a phase starts. `{when}` = "Morgen" / "Übermorgen". */
export const HEADS_UP: Record<Phase, string> = {
  red: "Hey Man, {when} beginnt Standfest. Sie kann dünnhäutiger werden – du bleibst ruhig.",
  green: "{when} beginnt Nähe. Ruhigere Tage, gut für Gespräche, die anstehen.",
  pink: "{when} beginnt Führen. Ihre Energie steigt – plan schon mal was.",
  yellow: "Ihre Tage stehen bevor. Bleib warm, bleib bei dir – dein Programm läuft weiter.",
};

export function headsUp(phase: Phase, inDays: number): string {
  const t = HEADS_UP[phase];
  const when = inDays === 1 ? "morgen" : "übermorgen";
  // capitalised only at the start of the sentence
  return t.startsWith("{when}") ? t.replace("{when}", when[0].toUpperCase() + when.slice(1)) : t.replace("{when}", when);
}

/** "Verstehen": why she ticks differently – his 24 hours against her ~28 days. */
export const UNDERSTAND = {
  title: "Sie tickt anders.",
  intro: [
    "Dein Hormonspiegel läuft im 24-Stunden-Takt: Testosteron ist morgens am höchsten und fällt bis zum Abend deutlich ab.",
    "Ihrer läuft in rund 28 Tagen – vier Phasen, jede mit eigenem Wetter. Du musst es nicht ändern. Du musst es kennen.",
  ],
  individual: "Jede Frau ist anders. Cyclemax lernt ihren Rhythmus mit jedem Eintrag – „kann“ heißt kann, nicht muss.",
  rules: [
    "Das Wissen ist für dich, nicht gegen sie. Sag nie: „Hast du deine Tage?“",
    "Nicht alles ist Zyklus. Hat sie ein echtes Anliegen, nimm es ernst.",
    "Du musst nichts tun, außer einmal zu tippen, wenn ihre Tage beginnen. Den Rest übernimmt Cyclemax.",
  ],
  quote: "„Sei wie der Fels, an dem sich unaufhörlich die Wellen brechen. Er steht fest, und um ihn herum kommt das Wasser zur Ruhe.“",
  quoteSource: "Marc Aurel, Selbstbetrachtungen 4,49",
  disclaimer: "Cyclemax ist keine Verhütungs- oder Gesundheits-App und stellt keine Diagnosen.",
  sources: [
    "ACOG Clinical Practice Guideline No. 7: Management of Premenstrual Disorders (2023)",
    "Armour et al.: The Prevalence and Academic Impact of Dysmenorrhea in 21,573 Young Women, J Womens Health (2019)",
    "A Mid-Cycle Rise in Positive and Drop in Negative Moods among Healthy Young Women: A Pilot Study, Brain Sciences (2023)",
    "Baker & Driver: Circadian rhythms, sleep, and the menstrual cycle, Sleep Medicine (2007)",
    "Diver et al.: Diurnal rhythms of serum total, free and bioavailable testosterone, Clinical Endocrinology (2003)",
  ],
};
