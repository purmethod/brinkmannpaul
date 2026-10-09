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

export const PHASES: Record<Phase, { word: string; color: string; attitude: string }> = {
  yellow: {
    word: "Wärme",
    color: PHASE_COLORS.yellow,
    attitude: "Wärme geben, Last abnehmen – und dein Training durchziehen.",
  },
  pink: {
    word: "Führen",
    color: PHASE_COLORS.pink,
    attitude: "Plan was mit ihr – du gibst den Takt vor.",
  },
  green: {
    word: "Nähe",
    color: PHASE_COLORS.green,
    attitude: "Sei präsent, nicht bedürftig – jetzt ist Zeit für Gespräche.",
  },
  red: {
    word: "Standfest",
    color: PHASE_COLORS.red,
    attitude: "Wenn sie lauter wird, wirst du ruhiger – ruhiger heißt nicht kleiner.",
  },
};

/** "Hey Man" tone, short. Max one notification per day. */
export const PHASE_PUSH_TEXT: Record<PhasePushKey, string> = {
  red7: "Hey Man, ab jetzt mehr beobachten, mehr zuhören. Ruhe trainieren.",
  red2: "Halt die Linie. Wenn sie lauter wird, wirst du ruhiger.",
  pink: "Hey Man, Rückenwind. Plan was mit ihr.",
  green: "Gute Woche für Nähe – und für Gespräche, die anstehen.",
  late: "Hey Man, hat ihre Blutung schon begonnen? Ein Tap in Cyclemax hält alles aktuell.",
  checkin: "Hey Man, wie läuft's mit ihr? Erzähl's mir in einer Minute.",
  checkin_single: "Hey Man, wie läuft's beim Dating? Erzähl's mir in einer Minute.",
};

/** Where a notification leads when tapped. */
export function pushUrl(key: string): string {
  return key === "checkin" || key === "checkin_single" ? "/profil/" : "/heute/";
}

/** Shown in the app right after "Blutung hat begonnen" (yellow). */
export const AFTER_ENTRY_TEXT = "Eingetragen. Sturm vorbei – jetzt Wärme: entlasten, da sein.";

/** Lock screen text when "neutrale Benachrichtigungen" is on. */
export const NEUTRAL_TITLE = APP_NAME;
export const NEUTRAL_BODY = "";

export function isPhasePushKey(key: string): key is PhasePushKey {
  return key in PHASE_PUSH_TEXT;
}

/** Heads-up on the home screen, 1–2 days before a phase starts. `{when}` = "Morgen" / "Übermorgen". */
export const HEADS_UP: Record<Phase, string> = {
  red: "Hey Man, {when} beginnt Standfest. Mehr beobachten, mehr zuhören, Ruhe trainieren.",
  green: "{when} beginnt Nähe. Gute Tage für Gespräche, die anstehen.",
  pink: "{when} beginnt Führen. Plan schon mal was mit ihr.",
  yellow: "Ihre Tage stehen bevor. Halt dich bereit: Wärme, Entlastung.",
};

export function headsUp(phase: Phase, inDays: number): string {
  return HEADS_UP[phase].replace("{when}", inDays === 1 ? "Morgen" : "Übermorgen");
}
