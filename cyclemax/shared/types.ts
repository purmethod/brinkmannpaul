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
export type PhasePushKey = "red7" | "red2" | "pink" | "green";

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
  messages: ChatMessage[];
}

export interface ChatResponse {
  id: string;
  text: string;
  source: "claude" | "fallback";
  topic: string;
}
