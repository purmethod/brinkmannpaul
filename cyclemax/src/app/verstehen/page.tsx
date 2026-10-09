"use client";

import { PHASE_ORDER, PHASES, PURE_URL, UNDERSTAND } from "@shared/texts";
import type { Phase } from "@shared/types";
import { Gate } from "@/components/Gate";
import { Screen, TopBar } from "@/components/ui";
import { phaseOutlook } from "@/engine/cycle";
import { rangeLabel } from "@/lib/format";
import { useCycle, useToday } from "@/lib/hooks";
import type { AppState } from "@/lib/state";

export default function UnderstandPage() {
  return <Gate>{(state) => <Understand state={state} />}</Gate>;
}

function Dot({ phase }: { phase: Phase }) {
  return <span aria-hidden="true" className="mt-[7px] h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: PHASES[phase].color }} />;
}

function Understand({ state }: { state: AppState }) {
  const today = useToday();
  const cycle = useCycle(state, today);
  const outlook = cycle ? phaseOutlook(cycle) : [];

  return (
    <Screen>
      <TopBar title="Verstehen" />

      <article className="mt-6 flex flex-col gap-10 pb-6">
        <section className="flex flex-col gap-4">
          <h2 className="text-[30px] leading-tight font-semibold tracking-tight">{UNDERSTAND.title}</h2>
          {UNDERSTAND.intro.map((p) => (
            <p key={p} className="text-[17px] leading-relaxed">
              {p}
            </p>
          ))}
        </section>

        {outlook.length > 0 && (
          <section aria-labelledby="outlook" className="flex flex-col gap-1" data-testid="outlook">
            <h3 id="outlook" className="mb-2 text-[12px] tracking-[0.2em] text-muted uppercase">
              Was kommt
            </h3>
            {outlook.map((s, i) => (
              <a key={`${s.phase}-${s.start}`} href={`#${s.phase}`} className="flex items-start gap-3 border-b border-line py-3 last:border-b-0">
                <Dot phase={s.phase} />
                <span className="flex flex-1 items-baseline justify-between gap-3">
                  <span className="text-[17px] font-medium">{PHASES[s.phase].word}</span>
                  <span className="text-right text-[14px] text-muted">{i > 0 ? rangeLabel(s.start, s.end) : cycle?.late ? "jetzt" : `jetzt · bis ${rangeLabel(s.end, s.end)}`}</span>
                </span>
              </a>
            ))}
            {cycle?.late && (
              <p className="pt-2 text-[14px] leading-snug text-muted">Ihre Tage sind überfällig. Sobald sie beginnen: ein Tap auf Heute – dann rechnet Cyclemax weiter.</p>
            )}
          </section>
        )}

        <section className="flex flex-col gap-8">
          {PHASE_ORDER.map((phase) => {
            const t = PHASES[phase];
            const now = cycle?.phase === phase;
            return (
              <div key={phase} id={phase} className="flex scroll-mt-6 flex-col gap-2" data-testid={`phase-${phase}`}>
                <h3 className="flex items-center gap-3 text-[22px] font-semibold tracking-tight">
                  <span aria-hidden="true" className="h-3 w-3 rounded-full" style={{ background: t.color }} />
                  {t.word}
                  {now && <span className="rounded-full bg-ink px-2.5 py-0.5 text-[12px] font-medium tracking-wide text-white">jetzt</span>}
                </h3>
                <p className="text-[14px] text-muted">{t.hormones}</p>
                <p className="text-[16px] leading-relaxed">
                  <span className="font-medium">Was kommen kann: </span>
                  {t.forecast}
                </p>
                <p className="text-[16px] leading-relaxed">
                  <span className="font-medium">Du führst: </span>
                  {t.lead.replace(/^Du führst mit /, "mit ")}
                </p>
              </div>
            );
          })}
          <p className="text-[14px] leading-relaxed text-muted">{UNDERSTAND.individual}</p>
        </section>

        <section className="flex flex-col gap-3 border-t border-line pt-8">
          {UNDERSTAND.rules.map((r) => (
            <p key={r} className="text-[16px] leading-relaxed">
              {r}
            </p>
          ))}
        </section>

        <figure className="flex flex-col gap-2 border-t border-line pt-8">
          <blockquote className="text-[20px] leading-snug font-medium">{UNDERSTAND.quote}</blockquote>
          <figcaption className="text-[14px] text-muted">{UNDERSTAND.quoteSource}</figcaption>
        </figure>

        <footer className="flex flex-col gap-3 border-t border-line pt-6 text-[13px] leading-relaxed text-muted">
          <p>
            Fundament:{" "}
            <a href={PURE_URL} target="_blank" rel="noreferrer" className="underline underline-offset-2">
              PURE Method
            </a>{" "}
            von Paul Brinkmann und die Stoa. {UNDERSTAND.disclaimer}
          </p>
          <details>
            <summary className="cursor-pointer py-1 text-ink">Quellen</summary>
            <ul className="mt-2 flex flex-col gap-1.5">
              {UNDERSTAND.sources.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          </details>
        </footer>
      </article>
    </Screen>
  );
}
