"use client";

import { useState } from "react";
import { fallbackProfile } from "@shared/profile";
import type { ProfileAnalysis } from "@shared/types";
import { Gate } from "@/components/Gate";
import { MicButton, useDictation } from "@/components/Mic";
import { Button, Screen, TopBar } from "@/components/ui";
import { api } from "@/lib/api";
import { useApp } from "@/lib/app-context";
import { MAX_PROFILE_TEXT, type AppState } from "@/lib/state";
import type { Adapters } from "@/adapters";

export default function ProfilePage() {
  return <Gate>{(state, adapters) => <Profile state={state} adapters={adapters} />}</Gate>;
}

const COPY = {
  relationship: {
    title: "Erzähl mir von euch.",
    intro: "Sprich einfach frei – über dich, über sie, über euch. Je mehr ich weiß, desto genauer coache ich dich. Alles bleibt auf deinem Gerät.",
    prompts: [
      "Du zuerst: Wie lebst du gerade? Training, Ordnung, eigene Projekte?",
      "Wo führst du – und wo lässt du dich treiben?",
      "Wie ist sie – und was liebst du an ihr?",
      "Wie reagiert sie, wenn sie gestresst ist oder es knallt?",
      "Was hakt? Zeit, Nähe, Bett, Kinderwunsch, Zukunft?",
    ],
    heading: "Dein Profil",
  },
  single: {
    title: "Erzähl mir von dir.",
    intro: "Sprich einfach frei. Je mehr ich weiß, desto genauer helfe ich dir. Alles bleibt auf deinem Gerät.",
    prompts: [
      "Wer bist du, was macht dein Leben aus?",
      "Was suchst du – etwas Lockeres oder die Eine?",
      "Wie läuft Dating gerade? Was klappt, was nicht?",
      "Was für eine Frau passt zu dir – vom Charakter her?",
    ],
    heading: "Dein Profil",
  },
};

function Balance({ value, note }: { value: number; note: string }) {
  return (
    <div className="flex flex-col gap-2" data-testid="balance">
      <div className="flex justify-between text-[12px] tracking-wide text-muted uppercase">
        <span>Abstand</span>
        <span>Balance</span>
        <span>Nähe</span>
      </div>
      <div className="relative h-1.5 rounded-full bg-line" role="img" aria-label={`Nähe und Abstand: ${value} von 100`}>
        <span className="absolute top-1/2 left-1/2 h-3 w-px -translate-y-1/2 bg-muted" />
        <span className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-ink bg-white" style={{ left: `${value}%` }} />
      </div>
      <p className="text-[15px] leading-snug">{note}</p>
    </div>
  );
}

function Profile({ state, adapters }: { state: AppState; adapters: Adapters }) {
  const { update } = useApp();
  const copy = COPY[state.mode];
  const analysis = state.profile.analysis;
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const dictation = useDictation(adapters.speech, text, setText);

  const submit = async () => {
    const t = text.trim();
    if (!t || busy) return;
    if (dictation.listening) await dictation.stop();
    setBusy(true);
    setNote(null);
    let result: { profile: ProfileAnalysis; source: "claude" | "fallback" };
    try {
      result = await api.profile({ deviceId: state.deviceId, mode: state.mode, text: t, previous: analysis });
    } catch {
      result = { profile: fallbackProfile(state.mode, t, analysis), source: "fallback" };
      setNote("Offline gespeichert. Ich werte es aus, sobald du wieder online bist und mehr erzählst.");
    }
    update({
      profile: {
        text: [state.profile.text, t].filter(Boolean).join("\n\n").slice(-MAX_PROFILE_TEXT),
        analysis: result.profile,
        source: result.source,
        updatedAt: Date.now(),
        done: [],
      },
    });
    void adapters.platform.haptic("success");
    setText("");
    setBusy(false);
  };

  const input = (
    <div className="flex flex-col gap-4">
      <div className="flex items-start gap-3">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={analysis ? 3 : 6}
          maxLength={6000}
          placeholder={dictation.listening ? "Ich höre zu …" : "Sprechen oder schreiben"}
          aria-label="Erzählung"
          data-testid="profile-input"
          className="min-h-24 flex-1 resize-none rounded-2xl bg-surface px-4 py-3 text-[16px] leading-relaxed outline-none placeholder:text-muted"
        />
        <MicButton listening={dictation.listening} onClick={dictation.toggle} size={56} label="Frei sprechen" />
      </div>
      {dictation.error && <p className="text-[14px] text-accent">{dictation.error}</p>}
      <Button onClick={submit} disabled={!text.trim() || busy} data-testid="profile-submit">
        {busy ? "Ich höre genau hin …" : analysis ? "Profil aktualisieren" : "Fertig – Profil erstellen"}
      </Button>
    </div>
  );

  if (!analysis) {
    return (
      <Screen>
        <TopBar />
        <section className="fade-up mt-6 flex flex-1 flex-col gap-6">
          <h1 className="text-[32px] leading-tight font-semibold tracking-tight">{copy.title}</h1>
          <p className="text-[17px] leading-relaxed text-muted">{copy.intro}</p>
          <ul className="flex flex-col gap-2 text-[15px] leading-snug">
            {copy.prompts.map((p) => (
              <li key={p} className="border-l-2 border-line pl-3">
                {p}
              </li>
            ))}
          </ul>
          <div className="mt-auto">{input}</div>
          {note && <p className="text-[14px] text-muted">{note}</p>}
        </section>
      </Screen>
    );
  }

  return (
    <Screen>
      <TopBar title={copy.heading} />
      <article className="fade-up mt-6 flex flex-col gap-8" data-testid="profile">
        <section className="flex flex-col gap-3">
          <p className="text-[19px] leading-snug font-medium">{analysis.focus}</p>
          <p className="text-[16px] leading-relaxed text-muted">{analysis.summary}</p>
        </section>

        <Balance value={analysis.balance} note={analysis.balanceNote} />

        {analysis.steps.length > 0 && (
          <section className="flex flex-col gap-3">
            <h2 className="text-[13px] tracking-[0.2em] text-muted uppercase">Deine Woche</h2>
            <ol className="flex flex-col gap-3">
              {analysis.steps.map((s, i) => {
                const done = (state.profile.done ?? []).includes(s);
                return (
                  <li key={s} className={`flex gap-3 text-[16px] leading-snug ${done ? "text-muted line-through" : ""}`}>
                    <span className="text-muted">{done ? "✓" : i + 1}</span>
                    {s}
                  </li>
                );
              })}
            </ol>
          </section>
        )}

        {analysis.traits.length > 0 && (
          <section className="flex flex-col gap-3">
            <h2 className="text-[13px] tracking-[0.2em] text-muted uppercase">{state.mode === "single" ? "Du" : "Sie"}</h2>
            <ul className="flex flex-wrap gap-2">
              {analysis.traits.map((t) => (
                <li key={t} className="rounded-full bg-surface px-3 py-1.5 text-[14px]">
                  {t}
                </li>
              ))}
            </ul>
          </section>
        )}

        {analysis.topics.length > 0 && (
          <section className="flex flex-col gap-1">
            <h2 className="mb-2 text-[13px] tracking-[0.2em] text-muted uppercase">Themen</h2>
            {analysis.topics.map((t) => (
              <div key={t.label} className="border-b border-line py-3">
                <p className="text-[16px] font-medium">{t.label}</p>
                <p className="text-[15px] leading-snug text-muted">{t.note}</p>
              </div>
            ))}
          </section>
        )}

        <section className="flex flex-col gap-3 pb-4">
          <h2 className="text-[13px] tracking-[0.2em] text-muted uppercase">Mehr erzählen</h2>
          {input}
          {note && <p className="text-[14px] text-muted">{note}</p>}
          <button
            type="button"
            className="mt-2 h-11 self-start text-[14px] text-muted underline-offset-4 hover:underline"
            onClick={() => window.confirm("Profil löschen?") && update({ profile: { text: "", analysis: null, source: null, updatedAt: 0 } })}
          >
            Profil löschen
          </button>
        </section>
      </article>
    </Screen>
  );
}
