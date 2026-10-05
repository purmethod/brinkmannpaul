// Backend client. Always absolute via NEXT_PUBLIC_API_BASE – the same build runs inside
// Capacitor (capacitor://localhost), where relative URLs would hit the device.
import type { ChatRequest, ChatResponse, Line, ScheduledItem } from "@shared/types";

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
