// Shared, dependency-free types used by client (src/) and backend (server/).

export type Phase = "yellow" | "pink" | "green" | "red";
export type Mode = "relationship" | "single";
export type LineCategory = Phase | "single" | "any";

export interface Line {
  id: string;
  text: string;
  category: LineCategory;
  /** Selection weight from ratings (1 = neutral). Sent by the server catalog. */
  weight?: number;
}

export interface KnowledgeDoc {
  slug: string;
  title: string;
  body: string;
}

/** Phase pushes in relationship mode. */
export type PhasePushKey = "red7" | "red2" | "pink" | "green" | "late" | "checkin" | "checkin_single";

/** One planned notification. `key` is a PhasePushKey (kind "phase") or a line id (kind "daily"). */
export interface ScheduledItem {
  /** Absolute instant, ISO 8601 (UTC). */
  at: string;
  kind: "phase" | "daily";
  key: string;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ChatRequest {
  deviceId: string;
  mode: Mode;
  phase: Phase | null;
  cycleDay: number | null;
  notes: string[];
  /** Compact profile from the device ("Erzähl mir von ihr"), optional. */
  profile?: string;
  messages: ChatMessage[];
}

export interface ChatResponse {
  id: string;
  text: string;
  source: "claude" | "fallback";
  topic: string;
}

/** Result of "Erzähl mir von ihr / von dir" – lives only on the device. */
export interface ProfileAnalysis {
  /** 2–3 sentences. */
  summary: string;
  /** How she ticks (relationship) / who he is (single). Max 5. */
  traits: string[];
  /** Themes with a short note, e.g. Haushalt, Nähe & Intimität, Kinderwunsch. Max 6. */
  topics: { label: string; note: string }[];
  /** 0 = zu viel Abstand, 50 = Balance, 100 = zu viel Nähe/Klammern. */
  balance: number;
  balanceNote: string;
  /** One sentence: what matters most right now. */
  focus: string;
  /** Three concrete next actions. */
  steps: string[];
}

export interface ProfileRequest {
  deviceId: string;
  mode: Mode;
  text: string;
  previous: ProfileAnalysis | null;
}

export interface ProfileResponse {
  profile: ProfileAnalysis;
  source: "claude" | "fallback";
}
