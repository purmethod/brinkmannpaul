"use client";

import { useEffect, useState } from "react";
import { LANGS, pickLang, SURVEY_STRINGS, type Lang } from "@shared/survey-i18n";
import { Wordmark } from "@/components/Logo";
import { Splash } from "@/components/Splash";
import { useApp } from "@/lib/app-context";

/** Coming soon: the mark, and one way in – the survey, so everyone can help build the app. */
export default function StartPage() {
  const { state } = useApp();
  const [lang, setLang] = useState<Lang>("de");
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLang(pickLang(null, navigator.languages ?? [navigator.language]));
  }, []);
  if (!state) return <Splash />;
  const t = SURVEY_STRINGS[lang];
  const dir = LANGS.find((l) => l.code === lang)!.dir;
  // letter-spacing tears Arabic script apart: the spaced look only for Latin and Cyrillic
  const spaced = dir !== "rtl";
  return (
    <main className="flex min-h-[100dvh] flex-col items-center justify-center gap-16 bg-bg px-6">
      <div className="ring-in relative flex flex-col items-center gap-5 rounded-3xl p-6" data-testid="start-ring">
        <div className="coming-soon-ring" aria-hidden="true" />
        <Wordmark />
        <p className="absolute inset-x-0 top-full text-center text-xs tracking-[0.2em] text-muted">coming soon</p>
      </div>
      <div className="flex w-full max-w-xs flex-col items-center gap-4 text-center" dir={dir} lang={lang} data-testid="start-invite">
        {/* same type as "coming soon" */}
        <p className={`text-xs leading-relaxed text-muted ${spaced ? "tracking-[0.2em] lowercase" : ""}`}>{t.inviteTitle}</p>
        <a
          href={`/questions/?lang=${lang}`}
          // button lettering like the CYCLEMAX wordmark; the extra left padding balances the trailing letter-spacing
          className={`flex min-h-12 w-full items-center justify-center rounded-2xl bg-ink px-6 text-[13px] font-medium text-white active:bg-black/80 ${spaced ? "pl-[calc(1.5rem+0.42em)] tracking-[0.42em] uppercase" : ""}`}
        >
          {t.inviteButton}
        </a>
      </div>
    </main>
  );
}
