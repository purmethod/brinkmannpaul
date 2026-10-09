// App state: lives only on the device (StorageAdapter). Nothing here is sent anywhere by itself.
import type { Line, Mode, ProfileAnalysis } from "@shared/types";
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

/** "Erzähl mir von ihr / von dir" – stays on the device. */
export interface Profile {
  /** Everything he told, newest last (kept to re-analyse later). */
  text: string;
  analysis: ProfileAnalysis | null;
  source: "claude" | "fallback" | null;
  updatedAt: number;
  /** Steps of the current analysis he ticked off. */
  done?: string[];
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
  profile: Profile;
  /** Device ids whose server-side deletion still has to be confirmed (offline at delete time). */
  pendingDeletes: string[];
  /** He closed the "notifications are off" hint on the home screen. */
  notifHintDismissed?: boolean;
  /** Write time (ms) – the newer of IndexedDB and the sync journal wins on load. */
  savedAt?: number;
}

export const STATE_KEY = "state";
export const MAX_CHAT = 200;
export const MAX_PROFILE_TEXT = 12000;

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
    profile: { text: "", analysis: null, source: null, updatedAt: 0 },
    pendingDeletes: [],
  };
}

export const JOURNAL_KEY = "cyclemax-journal";

/**
 * Web: IndexedDB writes are async and get aborted when the page unloads right after a tap.
 * A synchronous localStorage journal of the latest state survives an immediate reload.
 */
export function writeJournal(state: AppState): void {
  try {
    globalThis.localStorage?.setItem(JOURNAL_KEY, JSON.stringify(state));
  } catch {
    // quota or private mode – IndexedDB still has the state
  }
}

export function readJournal(): Partial<AppState> | undefined {
  try {
    const raw = globalThis.localStorage?.getItem(JOURNAL_KEY);
    return raw ? (JSON.parse(raw) as Partial<AppState>) : undefined;
  } catch {
    return undefined;
  }
}

export function clearJournal(): void {
  try {
    globalThis.localStorage?.removeItem(JOURNAL_KEY);
  } catch {
    // ignore
  }
}

/** Picks the newer of two stored copies. */
export function newest(a: Partial<AppState> | undefined, b: Partial<AppState> | undefined): Partial<AppState> | undefined {
  if (!a) return b;
  if (!b) return a;
  return (b.savedAt ?? 0) > (a.savedAt ?? 0) ? b : a;
}

/** Tolerant load: unknown/missing fields get defaults. */
export function hydrate(raw: Partial<AppState> | undefined): AppState {
  const base = initialState(raw?.deviceId);
  if (!raw || typeof raw !== "object") return base;
  return { ...base, ...raw, version: 1 };
}
