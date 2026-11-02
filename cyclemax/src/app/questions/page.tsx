"use client";

import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { AGE_GROUPS, ANNOYANCES, CURRENT_APPS, PRICES, QUESTIONS, SECTIONS, SURVEY_VERSION, WISH_MAX } from "@shared/survey";
import { fill, LANGS, pickLang, SURVEY_STRINGS, type Lang } from "@shared/survey-i18n";
import { createWebSpeech } from "@/adapters/speech";
import { Wordmark } from "@/components/Logo";
import { MicButton, useDictation } from "@/components/Mic";
import { Button, Screen } from "@/components/ui";
import { ApiError, surveyApi } from "@/lib/api";

/** Language boxes at the top – every woman sees her language at once. */
function LanguagePicker({ lang, onChange, label }: { lang: Lang; onChange: (l: Lang) => void; label: string }) {
  return (
    <div role="radiogroup" aria-label={label} className="grid grid-cols-3 gap-2" data-testid="languages">
      {LANGS.map((l) => (
        <button
          key={l.code}
          type="button"
          role="radio"
          aria-checked={lang === l.code}
          lang={l.code}
          dir={l.dir}
          onClick={() => onChange(l.code)}
          className={`min-h-11 rounded-xl px-2 text-[15px] transition-colors ${lang === l.code ? "bg-ink text-white" : "bg-surface active:bg-line"}`}
        >
          {l.label}
        </button>
      ))}
    </div>
  );
}

function Scale({ id, value, onChange, labels, rtl }: { id: string; value: number | undefined; onChange: (v: number) => void; labels: readonly string[]; rtl: boolean }) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  // radio group: one tab stop per question, arrow keys move the choice (mirrored right-to-left)
  const onKey = (e: KeyboardEvent) => {
    const forward = rtl ? "ArrowLeft" : "ArrowRight";
    const backward = rtl ? "ArrowRight" : "ArrowLeft";
    const step = e.key === forward || e.key === "ArrowDown" ? 1 : e.key === backward || e.key === "ArrowUp" ? -1 : 0;
    if (!step) return;
    e.preventDefault();
    const next = Math.min(labels.length, Math.max(1, (value ?? 0) + step));
    onChange(next);
    refs.current[next - 1]?.focus();
  };
  return (
    <div role="radiogroup" aria-labelledby={`${id}-label`} className="grid grid-cols-4 gap-1.5" onKeyDown={onKey}>
      {labels.map((label, i) => {
        const v = i + 1;
        const on = value === v;
        return (
          <button
            key={v}
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

/** Choice chips: `value` is the stored (language independent) key, `labels` the translation. */
function Chips<K extends string>({
  options,
  labels,
  selected,
  onToggle,
  label,
}: {
  options: readonly K[];
  labels: Record<K, string>;
  selected: string[];
  onToggle: (v: K) => void;
  label: string;
}) {
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
            {labels[o]}
          </button>
        );
      })}
    </div>
  );
}

const one = (set: (v: string | null) => void, current: string | null) => (v: string) => set(current === v ? null : v);

export default function QuestionsPage() {
  const [lang, setLang] = useState<Lang>("de");
  const t = SURVEY_STRINGS[lang];
  const meta = LANGS.find((l) => l.code === lang)!;
  const rtl = meta.dir === "rtl";

  // ?lang=… or the browser language; the choice goes into the address (shareable link), nothing is stored
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLang(pickLang(new URLSearchParams(window.location.search).get("lang"), navigator.languages ?? [navigator.language]));
  }, []);
  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = meta.dir;
    return () => {
      document.documentElement.lang = "de";
      document.documentElement.dir = "ltr";
    };
  }, [lang, meta.dir]);
  const chooseLang = (l: Lang) => {
    setLang(l);
    const url = new URL(window.location.href);
    url.searchParams.set("lang", l);
    window.history.replaceState(null, "", url);
  };

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

  // speech recognition in her language
  const speech = useMemo(() => createWebSpeech(typeof window === "undefined" ? {} : window, meta.speech), [meta.speech]);
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
      await surveyApi.send({ consent: true, version: SURVEY_VERSION, lang, ratings, annoyances, currentApp, ageGroup, price, wish: wishRef.current.trim(), voice: usedVoice });
      setDone(true);
      window.scrollTo({ top: 0 });
    } catch (e) {
      const status = e instanceof ApiError ? e.status : 0;
      setError(status === 429 ? t.errors.limit : status === 503 ? t.errors.busy : status === 400 ? t.errors.invalid : t.errors.generic);
    } finally {
      setBusy(false);
    }
  };

  if (done) {
    return (
      <div dir={meta.dir} lang={lang}>
        <Screen className="gap-6 py-10">
          <Wordmark />
          <h1 ref={doneRef} tabIndex={-1} className="text-[30px] leading-tight font-semibold tracking-tight outline-none">
            {t.thanksTitle}
          </h1>
          <p className="text-[17px] leading-relaxed">{t.thanksText}</p>
          {/* the screenshot upload exists in German only so far */}
          {lang === "de" && (
            <div className="flex flex-col gap-3 rounded-2xl bg-surface p-4">
              <p className="text-[15px] leading-relaxed">
                Magst du noch mehr beitragen? Teile Screenshots deiner Zyklus-App – anonym, gespeichert werden nur Zahlen und Einträge, keine Bilder.
              </p>
              <a href="/upload/" className="flex min-h-12 items-center justify-center rounded-2xl bg-ink px-6 text-[16px] font-medium text-white">
                Screenshots anonym teilen
              </a>
            </div>
          )}
        </Screen>
      </div>
    );
  }

  return (
    <div dir={meta.dir} lang={lang}>
      <Screen className="gap-8 py-10">
        <Wordmark />
        <LanguagePicker lang={lang} onChange={chooseLang} label={t.language} />
        <section className="flex flex-col gap-3">
          <h1 className="text-[30px] leading-tight font-semibold tracking-tight">{t.title}</h1>
          <p className="text-[17px] leading-relaxed">{t.intro}</p>
          <p className="text-[15px] text-muted">{fill(t.meta, { n: total })}</p>
        </section>

        {SECTIONS.map((section, i) => (
          <section key={section.title} className="flex flex-col gap-5">
            <div>
              <h2 className="text-[21px] font-semibold tracking-tight">{t.sections[i].title}</h2>
              <p className="text-[15px] text-muted">{t.sections[i].intro}</p>
            </div>
            {section.questions.map((q) => (
              <div key={q.id} className="flex flex-col gap-2.5">
                <p id={`${q.id}-label`} className="text-[16px] leading-snug">
                  {t.questions[q.id]}
                </p>
                <Scale id={q.id} labels={t.scale} rtl={rtl} value={ratings[q.id]} onChange={(v) => setRatings((r) => ({ ...r, [q.id]: v }))} />
              </div>
            ))}
          </section>
        ))}

        <section className="flex flex-col gap-5">
          <h2 className="text-[21px] font-semibold tracking-tight">{t.todayTitle}</h2>
          <div className="flex flex-col gap-2.5">
            <p className="text-[16px]">{t.annoyQ}</p>
            <Chips
              label={t.todayTitle}
              options={ANNOYANCES}
              labels={t.annoyances}
              selected={annoyances}
              onToggle={(v) => setAnnoyances((a) => (a.includes(v) ? a.filter((x) => x !== v) : [...a, v]))}
            />
          </div>
          <div className="flex flex-col gap-2.5">
            <p className="text-[16px]">{t.appQ}</p>
            <Chips label={t.appQ} options={CURRENT_APPS} labels={t.apps} selected={currentApp ? [currentApp] : []} onToggle={one(setCurrentApp, currentApp)} />
          </div>
          <div className="flex flex-col gap-2.5">
            <p className="text-[16px]">{t.priceQ}</p>
            <Chips label={t.priceQ} options={PRICES} labels={t.prices} selected={price ? [price] : []} onToggle={one(setPrice, price)} />
          </div>
          <div className="flex flex-col gap-2.5">
            <p className="text-[16px]">
              {t.ageQ} <span className="text-muted">{t.optional}</span>
            </p>
            <Chips label={t.ageQ} options={AGE_GROUPS} labels={t.ages} selected={ageGroup ? [ageGroup] : []} onToggle={one(setAgeGroup, ageGroup)} />
          </div>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-[21px] font-semibold tracking-tight">{t.dreamTitle}</h2>
          <p id="wish-label" className="text-[16px] leading-snug">
            {t.dreamQ}
          </p>
          <div className="flex items-start gap-3">
            <textarea
              value={wish}
              aria-labelledby="wish-label"
              dir="auto"
              // typing while the microphone runs would be overwritten by the next transcript
              onFocus={() => dictation.listening && void dictation.stop()}
              onChange={(e) => setWish(e.target.value.slice(0, WISH_MAX))}
              rows={5}
              placeholder={canSpeak ? t.placeholderSpeak : t.placeholderType}
              className="min-h-32 flex-1 resize-y rounded-2xl bg-surface p-4 text-[16px] leading-relaxed"
              data-testid="wish"
            />
            {canSpeak && <MicButton listening={dictation.listening} onClick={() => void dictation.toggle()} size={52} label={t.mic} stopLabel={t.micStop} />}
          </div>
          {dictation.error && (
            <p className="text-[14px] text-accent" role="alert">
              {t.errors.mic}
            </p>
          )}
          <p className="text-[13px] text-muted">{t.textHint}</p>
        </section>

        <label className="flex items-start gap-3 text-[14px] leading-relaxed">
          <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-1 h-5 w-5 shrink-0 accent-[#111]" data-testid="survey-consent" />
          <span>
            {t.consent}{" "}
            <a href="/datenschutz/#umfrage" target="_blank" rel="noopener" className="underline underline-offset-2">
              {t.privacy}
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
            {busy ? t.sending : t.send}
          </Button>
          <p className="text-center text-[13px] text-muted">
            {fill(t.progress, { a: answered, n: total })}
            {answered < total ? t.skip : ""}
          </p>
        </div>
      </Screen>
    </div>
  );
}
