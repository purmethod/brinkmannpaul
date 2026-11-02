"use client";

import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { AGE_GROUPS, ANNOYANCES, CURRENT_APPS, PRICES, QUESTIONS, SCALE, SECTIONS, SURVEY_VERSION, WISH_MAX } from "@shared/survey";
import { createWebSpeech } from "@/adapters/speech";
import { Wordmark } from "@/components/Logo";
import { MicButton, useDictation } from "@/components/Mic";
import { Button, Screen } from "@/components/ui";
import { surveyApi } from "@/lib/api";

function Scale({ id, value, onChange }: { id: string; value: number | undefined; onChange: (v: number) => void }) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  // radio group: one tab stop per question, arrow keys move the choice
  const onKey = (e: KeyboardEvent) => {
    const step = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 0;
    if (!step) return;
    e.preventDefault();
    const next = Math.min(SCALE.length, Math.max(1, (value ?? 0) + step));
    onChange(next);
    refs.current[next - 1]?.focus();
  };
  return (
    <div role="radiogroup" aria-labelledby={`${id}-label`} className="grid grid-cols-4 gap-1.5" onKeyDown={onKey}>
      {SCALE.map((label, i) => {
        const v = i + 1;
        const on = value === v;
        return (
          <button
            key={label}
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="button"
            role="radio"
            aria-checked={on}
            tabIndex={on || (!value && i === 0) ? 0 : -1}
            onClick={() => onChange(v)}
            data-testid={`${id}-${v}`}
            className={`min-h-11 rounded-xl px-1 text-[12.5px] leading-tight transition-colors ${on ? "bg-ink text-white" : "bg-surface active:bg-line"}`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

function Chips({ options, selected, onToggle, label }: { options: readonly string[]; selected: string[]; onToggle: (v: string) => void; label: string }) {
  return (
    <div role="group" aria-label={label} className="flex flex-wrap gap-2">
      {options.map((o) => {
        const on = selected.includes(o);
        return (
          <button
            key={o}
            type="button"
            aria-pressed={on}
            onClick={() => onToggle(o)}
            className={`min-h-10 rounded-full px-4 text-[14px] transition-colors ${on ? "bg-ink text-white" : "bg-surface active:bg-line"}`}
          >
            {o}
          </button>
        );
      })}
    </div>
  );
}

const one = (set: (v: string | null) => void, current: string | null) => (v: string) => set(current === v ? null : v);

export default function QuestionsPage() {
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [annoyances, setAnnoyances] = useState<string[]>([]);
  const [currentApp, setCurrentApp] = useState<string | null>(null);
  const [price, setPrice] = useState<string | null>(null);
  const [ageGroup, setAgeGroup] = useState<string | null>(null);
  const [wish, setWish] = useState("");
  const wishRef = useRef("");
  useEffect(() => {
    wishRef.current = wish;
  }, [wish]);
  const doneRef = useRef<HTMLHeadingElement>(null);
  const [usedVoice, setUsedVoice] = useState(false);
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const speech = useMemo(() => createWebSpeech(typeof window === "undefined" ? {} : window), []);
  const [canSpeak, setCanSpeak] = useState(false);
  useEffect(() => {
    void speech.available().then(setCanSpeak);
  }, [speech]);
  // "spoken" only once a transcript really arrives (not on a mere tap or a denied microphone)
  const dictation = useDictation(speech, wish, (v) => {
    setUsedVoice(true);
    setWish(v.slice(0, WISH_MAX));
  });
  const anything = Object.keys(ratings).length > 0 || !!wish.trim() || annoyances.length > 0 || !!currentApp || !!price || !!ageGroup;
  useEffect(() => {
    if (done) doneRef.current?.focus();
  }, [done]);

  const answered = Object.keys(ratings).length;
  const total = QUESTIONS.length;

  const send = async () => {
    setBusy(true);
    setError(null);
    if (dictation.listening) {
      await dictation.stop();
      // the last words arrive just after stopping
      await new Promise((r) => setTimeout(r, 600));
    }
    try {
      await surveyApi.send({ consent: true, version: SURVEY_VERSION, ratings, annoyances, currentApp, ageGroup, price, wish: wishRef.current.trim(), voice: usedVoice });
      setDone(true);
      window.scrollTo({ top: 0 });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Das hat nicht geklappt. Bitte versuch es noch einmal.");
    } finally {
      setBusy(false);
    }
  };

  if (done) {
    return (
      <Screen className="gap-6 py-10">
        <Wordmark />
        <h1 ref={doneRef} tabIndex={-1} className="text-[30px] leading-tight font-semibold tracking-tight outline-none">
          Danke dir.
        </h1>
        <p className="text-[17px] leading-relaxed">
          Deine Antworten sind angekommen – anonym. Du hilfst, Cyclemax so zu bauen, wie Frauen es wirklich wollen.
        </p>
        <div className="flex flex-col gap-3 rounded-2xl bg-surface p-4">
          <p className="text-[15px] leading-relaxed">
            Magst du noch mehr beitragen? Teile Screenshots deiner Zyklus-App – anonym, gespeichert werden nur Zahlen und Einträge, keine Bilder.
          </p>
          <a href="/upload/" className="flex min-h-12 items-center justify-center rounded-2xl bg-ink px-6 text-[16px] font-medium text-white">
            Screenshots anonym teilen
          </a>
        </div>
      </Screen>
    );
  }

  return (
    <Screen className="gap-8 py-10">
      <Wordmark />
      <section className="flex flex-col gap-3">
        <h1 className="text-[30px] leading-tight font-semibold tracking-tight">Bau deine Zyklus-App mit.</h1>
        <p className="text-[17px] leading-relaxed">
          Cyclemax wird deine Wettervorhersage für den Zyklus. Jeden Morgen weißt du, was dir heute guttut: mehr Kohlenhydrate oder mehr Eiweiß,
          Training oder Ruhe, Sauna oder kalte Dusche – wissenschaftlich belegt, damit du dich viel besser fühlst.
        </p>
        <p className="text-[15px] text-muted">{total} kurze Fragen · ca. 3 Minuten · anonym</p>
      </section>

      {SECTIONS.map((section) => (
        <section key={section.title} className="flex flex-col gap-5">
          <div>
            <h2 className="text-[21px] font-semibold tracking-tight">{section.title}</h2>
            <p className="text-[15px] text-muted">{section.intro}</p>
          </div>
          {section.questions.map((q) => (
            <div key={q.id} className="flex flex-col gap-2.5">
              <p id={`${q.id}-label`} className="text-[16px] leading-snug">
                {q.text}
              </p>
              <Scale id={q.id} value={ratings[q.id]} onChange={(v) => setRatings((r) => ({ ...r, [q.id]: v }))} />
            </div>
          ))}
        </section>
      ))}

      <section className="flex flex-col gap-5">
        <h2 className="text-[21px] font-semibold tracking-tight">Was dich heute stört</h2>
        <div className="flex flex-col gap-2.5">
          <p className="text-[16px]">Was nervt dich an deiner jetzigen Zyklus-App? (mehrere möglich)</p>
          <Chips
            label="Was stört"
            options={ANNOYANCES}
            selected={annoyances}
            onToggle={(v) => setAnnoyances((a) => (a.includes(v) ? a.filter((x) => x !== v) : [...a, v]))}
          />
        </div>
        <div className="flex flex-col gap-2.5">
          <p className="text-[16px]">Womit trackst du deinen Zyklus gerade?</p>
          <Chips label="Aktuelle App" options={CURRENT_APPS} selected={currentApp ? [currentApp] : []} onToggle={one(setCurrentApp, currentApp)} />
        </div>
        <div className="flex flex-col gap-2.5">
          <p className="text-[16px]">Was wäre dir so eine App wert?</p>
          <Chips label="Preis" options={PRICES} selected={price ? [price] : []} onToggle={one(setPrice, price)} />
        </div>
        <div className="flex flex-col gap-2.5">
          <p className="text-[16px]">
            Dein Alter <span className="text-muted">(freiwillig)</span>
          </p>
          <Chips label="Alter" options={AGE_GROUPS} selected={ageGroup ? [ageGroup] : []} onToggle={one(setAgeGroup, ageGroup)} />
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-[21px] font-semibold tracking-tight">Deine Traum-App</h2>
        <p id="wish-label" className="text-[16px] leading-snug">
          Wenn du deine Zyklus-App selbst bauen würdest: Was müsste sie können? Was soll sie dir jeden Tag sagen? Was würdest du an deiner
          jetzigen ändern?
        </p>
        <div className="flex items-start gap-3">
          <textarea
            value={wish}
            aria-labelledby="wish-label"
            // typing while the microphone runs would be overwritten by the next transcript
            onFocus={() => dictation.listening && void dictation.stop()}
            onChange={(e) => setWish(e.target.value.slice(0, WISH_MAX))}
            rows={5}
            placeholder={canSpeak ? "Sprich einfach drauflos – oder tipp." : "Schreib einfach drauflos."}
            className="min-h-32 flex-1 resize-y rounded-2xl bg-surface p-4 text-[16px] leading-relaxed"
            data-testid="wish"
          />
          {canSpeak && (
            <MicButton
              listening={dictation.listening}
              onClick={() => void dictation.toggle()}
              size={52}
              label="Reinsprechen"
            />
          )}
        </div>
        {dictation.error && (
          <p className="text-[14px] text-accent" role="alert">
            {dictation.error}
          </p>
        )}
        <p className="text-[13px] text-muted">Bitte keine Namen oder Kontaktdaten. Spracheingabe läuft über die Spracherkennung deines Browsers.</p>
      </section>

      <label className="flex items-start gap-3 text-[14px] leading-relaxed">
        <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-1 h-5 w-5 shrink-0 accent-[#111]" data-testid="survey-consent" />
        <span>
          Einverstanden: Meine Antworten werden anonym gespeichert und für die Entwicklung von Cyclemax ausgewertet. Details in der{" "}
          <a href="/datenschutz/#umfrage" target="_blank" rel="noopener" className="underline underline-offset-2">
            Datenschutzerklärung
          </a>
          .
        </span>
      </label>

      {error && (
        <p className="text-[14px] text-accent" role="alert">
          {error}
        </p>
      )}
      <div className="flex flex-col gap-2">
        <Button disabled={!consent || busy || !anything} onClick={send} data-testid="survey-send">
          {busy ? "Wird gesendet …" : "Antworten senden"}
        </Button>
        <p className="text-center text-[13px] text-muted">
          {answered} von {total} beantwortet{answered < total ? " – du kannst auch Fragen auslassen" : ""}
        </p>
      </div>
    </Screen>
  );
}
