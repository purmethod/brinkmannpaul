// App state: lives only on the device (StorageAdapter). Nothing here is sent anywhere by itself.
import type { Line, Mode } from "@shared/types";
import type { DateStr } from "@/engine/dates";
import type { LineHistory } from "@/engine/lines";
import { DEFAULT_CYCLE_LENGTH } from "@/engine/cycle";

export interface ChatEntry {
  id: string;
  role: "user" | "assistant";
  content: string;
  at: number;
  source?: "claude" | "fallback" | "offline";
  topic?: string;
  vote?: 1 | -1;
  reported?: boolean;
}

export interface AppState {
  version: 1;
  deviceId: string;
  onboarded: boolean;
  mode: Mode;
  entries: DateStr[];
  usualLength: number;
  dailyTime: string;
  notifications: boolean;
  neutral: boolean;
  lineHistory: LineHistory;
  catalog: Line[];
  catalogAt: number;
  lineVotes: Record<string, 1 | -1>;
  chat: ChatEntry[];
  /** Device ids whose server-side deletion still has to be confirmed (offline at delete time). */
  pendingDeletes: string[];
}

export const STATE_KEY = "state";
export const MAX_CHAT = 200;

export function newDeviceId(): string {
  return crypto.randomUUID();
}

export function initialState(deviceId = newDeviceId()): AppState {
  return {
    version: 1,
    deviceId,
    onboarded: false,
    mode: "relationship",
    entries: [],
    usualLength: DEFAULT_CYCLE_LENGTH,
    dailyTime: "07:30",
    notifications: false,
    neutral: false,
    lineHistory: {},
    catalog: [],
    catalogAt: 0,
    lineVotes: {},
    chat: [],
    pendingDeletes: [],
  };
}

/** Tolerant load: unknown/missing fields get defaults. */
export function hydrate(raw: Partial<AppState> | undefined): AppState {
  const base = initialState(raw?.deviceId);
  if (!raw || typeof raw !== "object") return base;
  return { ...base, ...raw, version: 1 };
}
