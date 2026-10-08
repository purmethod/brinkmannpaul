"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { fallbackAnswer } from "@shared/fallback";
import { HELP_TEXT, needsHelp } from "@shared/safety";
import { topicOf } from "@shared/topics";
import type { ChatMessage } from "@shared/types";
import { Gate } from "@/components/Gate";
import { IconSend } from "@/components/icons";
import { Thumbs } from "@/components/Thumbs";
import { TopBar } from "@/components/ui";
import { api } from "@/lib/api";
import { useApp } from "@/lib/app-context";
import { useCycle, useToday } from "@/lib/hooks";
import { MAX_CHAT, type AppState, type ChatEntry } from "@/lib/state";
import { effectiveCatalog } from "@/lib/sync";
import type { Adapters } from "@/adapters";

export default function ChatPage() {
  return <Gate>{(state, adapters) => <Chat state={state} adapters={adapters} />}</Gate>;
}

const CONTEXT_MESSAGES = 12;

function Chat({ state, adapters }: { state: AppState; adapters: Adapters }) {
  const { update } = useApp();
  const today = useToday();
  const cycle = useCycle(state, today);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const end = useRef<HTMLDivElement>(null);

  useEffect(() => end.current?.scrollIntoView({ block: "end" }), [state.chat.length, busy]);

  const send = async (e?: FormEvent) => {
    e?.preventDefault();
    const content = text.trim();
    if (!content || busy) return;
    const userEntry: ChatEntry = { id: crypto.randomUUID(), role: "user", content, at: Date.now() };
    const history = [...state.chat, userEntry];
    update({ chat: history.slice(-MAX_CHAT) });
    setText("");
    setBusy(true);

    const window = history.slice(-CONTEXT_MESSAGES);
    // Messages must start with the user.
    while (window.length && window[0].role !== "user") window.shift();
    const messages: ChatMessage[] = window.map(({ role, content }) => ({ role, content }));
    const notes = history
      .slice(0, -CONTEXT_MESSAGES)
      .filter((m) => m.role === "user")
      .slice(-5)
      .map((m) => m.content.slice(0, 300));
    const req = {
      deviceId: state.deviceId,
      mode: state.mode,
      phase: cycle?.phase ?? null,
      cycleDay: cycle?.cycleDay ?? null,
      notes,
      messages,
    };

    let answer: ChatEntry;
    try {
      const res = await api.chat(req);
      answer = { id: res.id, role: "assistant", content: res.text, at: Date.now(), source: res.source, topic: res.topic };
    } catch {
      // Offline: answer from the knowledge base on the device.
      let t = fallbackAnswer(req, effectiveCatalog(state));
      if (needsHelp(content)) t = `${HELP_TEXT}\n\n${t}`;
      answer = { id: `offline-${crypto.randomUUID()}`, role: "assistant", content: t, at: Date.now(), source: "offline", topic: topicOf(content) };
    }
    update((s) => ({ chat: [...s.chat, answer].slice(-MAX_CHAT) }));
    setBusy(false);
  };

  const patchEntry = (id: string, patch: Partial<ChatEntry>) =>
    update((s) => ({ chat: s.chat.map((m) => (m.id === id ? { ...m, ...patch } : m)) }));

  const vote = (m: ChatEntry, v: 1 | -1) => {
    void adapters.platform.haptic("impact");
    patchEntry(m.id, { vote: v });
    if (!m.id.startsWith("offline-")) api.feedback(state.deviceId, "answer", m.id, v, m.topic).catch(() => undefined);
  };

  const report = async (m: ChatEntry) => {
    if (!window.confirm("Diese Antwort anonym melden?")) return;
    try {
      await api.report(state.deviceId, m.id, m.content, m.topic ?? "Sonstiges");
      patchEntry(m.id, { reported: true });
    } catch {
      window.alert("Gerade keine Verbindung. Versuch es später noch mal.");
    }
  };

  return (
    <main className="mx-auto flex h-[100dvh] w-full max-w-md flex-col">
      <div className="px-6 pt-safe">
        <TopBar title="Chat" />
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-4" aria-live="polite">
        {state.chat.length === 0 && (
          <p className="mt-[25vh] text-center text-[19px] leading-snug text-muted">Was ist los? Schreib es kurz.</p>
        )}
        <ul className="flex flex-col gap-5">
          {state.chat.map((m) =>
            m.role === "user" ? (
              <li key={m.id} className="ml-10 self-end rounded-2xl rounded-br-md bg-surface px-4 py-3 text-[16px] leading-snug whitespace-pre-wrap">
                {m.content}
              </li>
            ) : (
              <li key={m.id} className="mr-6 flex flex-col gap-1" data-testid="answer">
                <p className="text-[17px] leading-relaxed whitespace-pre-wrap">{m.content}</p>
                <div className="-ml-3 flex items-center gap-2">
                  <Thumbs value={m.vote} onVote={(v) => vote(m, v)} label="Antwort bewerten" />
                  {!m.id.startsWith("offline-") &&
                    (m.reported ? (
                      <span className="text-[13px] text-muted">Gemeldet. Danke.</span>
                    ) : (
                      <button type="button" onClick={() => report(m)} className="h-11 px-2 text-[13px] text-muted underline-offset-4 hover:underline">
                        Antwort melden
                      </button>
                    ))}
                </div>
              </li>
            ),
          )}
          {busy && (
            <li className="flex gap-1 py-2" aria-label="Mentor schreibt">
              {[0, 1, 2].map((i) => (
                <span key={i} className="dot h-2 w-2 rounded-full bg-ink" style={{ animationDelay: `${i * 0.16}s` }} />
              ))}
            </li>
          )}
        </ul>
        <div ref={end} />
      </div>

      <form onSubmit={send} className="flex items-end gap-2 border-t border-line px-4 pt-3 pb-safe">
        <label htmlFor="chat-input" className="sr-only">
          Nachricht
        </label>
        <textarea
          id="chat-input"
          rows={1}
          value={text}
          maxLength={2000}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void send();
            }
          }}
          placeholder="Schreib dem Mentor"
          className="max-h-40 min-h-12 flex-1 resize-none rounded-2xl bg-surface px-4 py-3 text-[16px] outline-none placeholder:text-muted"
        />
        <button
          type="submit"
          aria-label="Senden"
          disabled={!text.trim() || busy}
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-ink text-white disabled:opacity-30"
        >
          <IconSend />
        </button>
      </form>
    </main>
  );
}
