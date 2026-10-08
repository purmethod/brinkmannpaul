import type { Phase } from "@shared/types";
import { PHASES } from "@shared/texts";

/** Big ring in the colour of the current phase with the phase word. */
export function Ring({ phase }: { phase: Phase }) {
  const { color, word } = PHASES[phase];
  return (
    <div className="relative mx-auto aspect-square w-[min(72vw,300px)]" data-phase={phase}>
      <svg viewBox="0 0 200 200" className="absolute inset-0 h-full w-full" aria-hidden="true">
        <circle cx="100" cy="100" r="88" fill="none" stroke={color} strokeWidth="14" style={{ transition: "stroke 600ms ease" }} />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <h1 className="text-[clamp(34px,10vw,44px)] font-semibold tracking-tight" data-testid="phase-word">
          {word}
        </h1>
      </div>
    </div>
  );
}
