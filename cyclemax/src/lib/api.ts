// Backend client. Always absolute via NEXT_PUBLIC_API_BASE – the same build runs inside
// Capacitor (capacitor://localhost), where relative URLs would hit the device.
import type { ChatRequest, ChatResponse, Line, ProfileRequest, ProfileResponse, ScheduledItem } from "@shared/types";

export const API_BASE = (process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8787").replace(/\/+$/, "");

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

async function call<T>(path: string, init: RequestInit = {}, timeoutMs = 20_000): Promise<T> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      ...init,
      signal: ctrl.signal,
      headers: { "content-type": "application/json", ...(init.headers ?? {}) },
    });
    const text = await res.text();
    const data = text ? JSON.parse(text) : {};
    if (!res.ok) throw new ApiError(res.status, data?.error ?? res.statusText);
    return data as T;
  } finally {
    clearTimeout(timer);
  }
}

const json = (body: unknown) => JSON.stringify(body);

export interface PushSchedulePayload {
  deviceId: string;
  subscription: PushSubscriptionJSON;
  neutral: boolean;
  items: ScheduledItem[];
}

export const api = {
  lines: () => call<{ lines: Line[] }>("/api/lines"),
  chat: (req: ChatRequest) => call<ChatResponse>("/api/chat", { method: "POST", body: json(req) }, 45_000),
  profile: (req: ProfileRequest) => call<ProfileResponse>("/api/profile", { method: "POST", body: json(req) }, 60_000),
  feedback: (deviceId: string, kind: "line" | "answer", id: string, vote: 1 | -1, topic?: string) =>
    call<{ ok: true }>("/api/feedback", { method: "POST", body: json({ deviceId, kind, id, vote, topic }) }),
  report: (deviceId: string, answerId: string, text: string, topic: string) =>
    call<{ ok: true }>("/api/report", { method: "POST", body: json({ deviceId, answerId, text, topic }) }),
  pushKey: () => call<{ publicKey: string }>("/api/push/key"),
  pushSchedule: (payload: PushSchedulePayload) =>
    call<{ ok: true; scheduled: number }>("/api/push/schedule", { method: "POST", body: json(payload) }),
  pushUnschedule: (deviceId: string) =>
    call<{ ok: true }>("/api/push/schedule", { method: "DELETE", body: json({ deviceId }) }),
  deleteDevice: (deviceId: string) => call<{ ok: true }>("/api/device", { method: "DELETE", body: json({ deviceId }) }),
};

export type Api = typeof api;

/** /admin (web only). The password is sent as Bearer token and kept in sessionStorage. */
export function adminApi(password: string) {
  const auth = { authorization: `Bearer ${password}` };
  const req = <T>(method: string, path: string, body?: unknown) =>
    call<T>(path, { method, headers: auth, body: body === undefined ? undefined : json(body) }, 90_000);
  return {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    overview: () => req<any>("GET", "/api/admin/overview"),
    patchLine: (id: string, patch: { text?: string; status?: string; category?: string }) => req("PATCH", `/api/admin/lines/${id}`, patch),
    deleteLine: (id: string) => req("DELETE", `/api/admin/lines/${id}`),
    addLine: (text: string, category: string) => req("POST", "/api/admin/lines", { text, category }),
    patchPrinciple: (id: string, patch: { text?: string; status?: string }) => req("PATCH", `/api/admin/principles/${id}`, patch),
    deletePrinciple: (id: string) => req("DELETE", `/api/admin/principles/${id}`),
    setReport: (id: string, status: "open" | "ok" | "removed") => req("PATCH", `/api/admin/reports/${id}`, { status }),
    runJob: () => req<Record<string, unknown>>("POST", "/api/admin/job"),
    testPush: () => req<{ subscriptions: number; delivered: number; errors: string[] }>("POST", "/api/admin/test-push"),
  };
}
