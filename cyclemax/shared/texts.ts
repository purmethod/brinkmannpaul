import type { Phase, PhasePushKey } from "./types";

export const APP_NAME = "Cyclemax";
export const CLAIM = "Be the Cycleman.";
export const CORE_SENTENCE = "Wenn sie lauter wird, wirst du leiser. Leiser heißt nicht kleiner.";
export const PURE_URL = "https://purmethod.com";

export const PHASE_COLORS: Record<Phase, string> = {
  yellow: "#F2B705",
  pink: "#E83E8C",
  green: "#2E9E4F",
  red: "#C8102E",
};

export const PHASES: Record<Phase, { word: string; color: string; attitude: string }> = {
  yellow: {
    word: "Kümmern",
    color: PHASE_COLORS.yellow,
    attitude: "Wärme geben, Last abnehmen – und dein Training durchziehen.",
  },
  pink: {
    word: "Spielen",
    color: PHASE_COLORS.pink,
    attitude: "Führ, plan, übernimm die Initiative.",
  },
  green: {
    word: "Nähe",
    color: PHASE_COLORS.green,
    attitude: "Sei präsent, nicht bedürftig – jetzt ist Zeit für Gespräche.",
  },
  red: {
    word: "Leiser",
    color: PHASE_COLORS.red,
    attitude: "Wenn sie lauter wird, wirst du leiser – leiser heißt nicht kleiner.",
  },
};

/** Bro tone, short. Max one notification per day. */
export const PHASE_PUSH_TEXT: Record<PhasePushKey, string> = {
  red7: "Bro, Sturm zieht auf. Wenn sie lauter wird, wirst du leiser.",
  red2: "Halt die Linie. Du bist der Fels.",
  pink: "Rückenwind, Bro. Plan was mit ihr.",
  green: "Gute Woche für Nähe – und für Gespräche, die anstehen.",
};

/** Shown in the app right after "Blutung hat begonnen" (yellow). */
export const AFTER_ENTRY_TEXT = "Sturm vorbei. Jetzt kümmern: Wärme, Ruhe.";

/** Lock screen text when "neutrale Benachrichtigungen" is on. */
export const NEUTRAL_TITLE = APP_NAME;
export const NEUTRAL_BODY = "";

export function isPhasePushKey(key: string): key is PhasePushKey {
  return key === "red7" || key === "red2" || key === "pink" || key === "green";
}
