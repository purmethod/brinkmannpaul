"use client";

import { useCallback, useEffect, useState } from "react";
import { Capacitor } from "@capacitor/core";
import { Button, Screen, TopBar } from "@/components/ui";
import { adminApi } from "@/lib/api";

interface Row {
  id: string;
  text: string;
  status: string;
  source: string;
  category?: string;
  factual?: number;
  up?: number;
  down?: number;
}
interface Report {
  id: string;
  answerId: string;
  text: string;
  topic: string | null;
  status: string;
  createdAt: number;
}
interface Overview {
  docs: { slug: string; title: string; body: string }[];
  lines: Row[];
  principles: Row[];
  reports: Report[];
  topics: { topic: string; count: number }[];
  answers: { up: number; down: number };
  jobs: { id: string; startedAt: number; summary: Record<string, unknown> }[];
  claude: boolean;
}

const TABS = ["Freigabe", "Zeilen", "Leitsätze", "Meldungen", "Wissen", "System"] as const;
const KEY = "cyclemax-admin";

export default function AdminPage() {
  const [password, setPassword] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [data, setData] = useState<Overview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<(typeof TABS)[number]>("Freigabe");
  const [msg, setMsg] = useState<string | null>(null);
  const native = typeof window !== "undefined" && Capacitor.isNativePlatform();

  const load = useCallback(async (pw: string) => {
    try {
      setData((await adminApi(pw).overview()) as Overview);
      setPassword(pw);
      sessionStorage.setItem(KEY, pw);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Fehler");
      setPassword(null);
      sessionStorage.removeItem(KEY);
    }
  }, []);

  useEffect(() => {
    const pw = sessionStorage.getItem(KEY);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (pw) void load(pw);
  }, [load]);

  if (native) {
    return (
      <Screen>
        <TopBar title="Admin" />
        <p className="mt-10 text-center text-muted">Nur im Web.</p>
      </Screen>
    );
  }

  if (!password || !data) {
    return (
      <Screen>
        <TopBar title="Admin" />
        <form
          className="mt-16 flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            void load(input);
          }}
        >
          <label htmlFor="pw" className="text-[17px] font-medium">
            Passwort
          </label>
          <input id="pw" type="password" autoComplete="current-password" value={input} onChange={(e) => setInput(e.target.value)} className="h-12 rounded-xl bg-surface px-4" />
          {error && <p className="text-[14px] text-accent">{error}</p>}
          <Button type="submit">Anmelden</Button>
        </form>
      </Screen>
    );
  }

  const api = adminApi(password);
  const act = async (fn: () => Promise<unknown>, done?: string) => {
    try {
      const r = await fn();
      if (done) setMsg(`${done} ${r && typeof r === "object" ? JSON.stringify(r) : ""}`);
      await load(password);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Fehler");
    }
  };

  const review = [...data.lines.filter((l) => l.status === "review"), ...data.principles.filter((p) => p.status === "review")];

  return (
    <main className="mx-auto w-full max-w-3xl px-6 pt-safe pb-safe">
      <TopBar title="Admin" right={<button className="text-[14px] text-muted" onClick={() => (sessionStorage.removeItem(KEY), setPassword(null))}>Abmelden</button>} />
      <nav className="mt-4 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`h-9 rounded-full px-4 text-[14px] ${tab === t ? "bg-ink text-white" : "bg-surface"}`}>
            {t}
            {t === "Freigabe" && review.length ? ` (${review.length})` : ""}
            {t === "Meldungen" && data.reports.filter((r) => r.status === "open").length ? ` (${data.reports.filter((r) => r.status === "open").length})` : ""}
          </button>
        ))}
      </nav>
      {msg && <p className="mt-4 rounded-xl bg-surface p-3 text-[13px] break-all">{msg}</p>}

      <section className="mt-6 flex flex-col gap-3">
        {tab === "Freigabe" && (review.length === 0 ? <p className="text-muted">Nichts zu prüfen.</p> : review.map((r) => <Editable key={r.id} row={r} kind={r.category ? "line" : "principle"} api={api} act={act} />))}
        {tab === "Zeilen" && (
          <>
            <AddLine onAdd={(text, cat) => act(() => api.addLine(text, cat), "Hinzugefügt")} />
            {data.lines.map((r) => (
              <Editable key={r.id} row={r} kind="line" api={api} act={act} />
            ))}
          </>
        )}
        {tab === "Leitsätze" && data.principles.map((r) => <Editable key={r.id} row={r} kind="principle" api={api} act={act} />)}
        {tab === "Meldungen" &&
          (data.reports.length === 0 ? (
            <p className="text-muted">Keine Meldungen.</p>
          ) : (
            data.reports.map((r) => (
              <div key={r.id} className={`rounded-2xl border border-line p-4 ${r.status !== "open" ? "opacity-50" : ""}`}>
                <p className="text-[13px] text-muted">
                  {new Date(r.createdAt).toLocaleString("de-DE")} · {r.topic} · {r.status} · Antwort {r.answerId.slice(0, 8)}
                </p>
                <p className="mt-2 whitespace-pre-wrap">{r.text}</p>
                <div className="mt-3 flex gap-2">
                  <Small onClick={() => act(() => api.setReport(r.id, "ok"))}>In Ordnung</Small>
                  <Small onClick={() => act(() => api.setReport(r.id, "removed"))}>Problem bestätigt</Small>
                  <Small onClick={() => act(() => api.setReport(r.id, "open"))}>Offen</Small>
                </div>
              </div>
            ))
          ))}
        {tab === "Wissen" &&
          data.docs.map((d) => (
            <details key={d.slug} className="rounded-2xl bg-surface p-4">
              <summary className="cursor-pointer font-medium">{d.title}</summary>
              <pre className="mt-3 text-[13px] whitespace-pre-wrap">{d.body}</pre>
            </details>
          ))}
        {tab === "System" && (
          <div className="flex flex-col gap-4">
            <p>Claude: {data.claude ? "aktiv" : "kein ANTHROPIC_API_KEY – Antworten aus der Wissensbasis"}</p>
            <p>
              Chat-Bewertungen: {data.answers.up} hoch / {data.answers.down} runter
            </p>
            <div>
              <p className="font-medium">Themen (7 Tage)</p>
              <p className="text-muted">{data.topics.map((t) => `${t.topic} (${t.count})`).join(", ") || "–"}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Small onClick={() => act(() => api.runJob(), "Wissens-Job:")}>Wissens-Job jetzt starten</Small>
              <Small onClick={() => act(() => api.testPush(), "Test-Push:")}>Test-Push an alle</Small>
            </div>
            <div>
              <p className="font-medium">Letzte Jobs</p>
              {data.jobs.map((j) => (
                <p key={j.id} className="text-[13px] text-muted">
                  {new Date(j.startedAt).toLocaleString("de-DE")} – {JSON.stringify(j.summary)}
                </p>
              ))}
            </div>
          </div>
        )}
      </section>
    </main>
  );
}

function Small({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="h-9 rounded-full bg-surface px-4 text-[13px] active:bg-line">
      {children}
    </button>
  );
}

function Editable({
  row,
  kind,
  api,
  act,
}: {
  row: Row;
  kind: "line" | "principle";
  api: ReturnType<typeof adminApi>;
  act: (fn: () => Promise<unknown>, done?: string) => Promise<void>;
}) {
  const [text, setText] = useState(row.text);
  const patch = (p: { text?: string; status?: string }) => (kind === "line" ? api.patchLine(row.id, p) : api.patchPrinciple(row.id, p));
  return (
    <div className={`rounded-2xl border border-line p-4 ${row.status === "disabled" ? "opacity-50" : ""}`}>
      <p className="text-[12px] text-muted">
        {kind === "line" ? `${row.category} · ` : "Leitsatz · "}
        {row.status} · {row.source}
        {row.factual ? " · Faktenbehauptung" : ""}
        {kind === "line" ? ` · ▲${row.up} ▼${row.down}` : ""}
      </p>
      <textarea value={text} onChange={(e) => setText(e.target.value)} rows={2} className="mt-2 w-full resize-y rounded-lg bg-surface p-2 text-[15px]" />
      <div className="mt-2 flex flex-wrap gap-2">
        {text !== row.text && <Small onClick={() => act(() => patch({ text }), "Gespeichert")}>Speichern</Small>}
        {row.status !== "live" && <Small onClick={() => act(() => patch({ status: "live" }), "Freigegeben")}>Freigeben</Small>}
        {row.status !== "disabled" && <Small onClick={() => act(() => patch({ status: "disabled" }), "Deaktiviert")}>Deaktivieren</Small>}
        <Small onClick={() => confirm("Löschen?") && act(() => (kind === "line" ? api.deleteLine(row.id) : api.deletePrinciple(row.id)), "Gelöscht")}>Löschen</Small>
      </div>
    </div>
  );
}

function AddLine({ onAdd }: { onAdd: (text: string, category: string) => void }) {
  const [text, setText] = useState("");
  const [cat, setCat] = useState("any");
  return (
    <form
      className="flex flex-col gap-2 rounded-2xl bg-surface p-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (text.trim()) onAdd(text.trim(), cat);
        setText("");
      }}
    >
      <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Neue Zeile" className="h-11 rounded-lg bg-white px-3" />
      <div className="flex gap-2">
        <select value={cat} onChange={(e) => setCat(e.target.value)} className="h-11 rounded-lg bg-white px-3">
          {["any", "yellow", "pink", "green", "red", "single"].map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
        <button type="submit" className="h-11 rounded-lg bg-ink px-4 text-white">
          Hinzufügen
        </button>
      </div>
    </form>
  );
}
