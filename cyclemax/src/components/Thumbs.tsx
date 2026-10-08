"use client";

import { IconThumb } from "./icons";

/** Daumen hoch/runter – anonymous feedback. */
export function Thumbs({ value, onVote, label }: { value?: 1 | -1; onVote: (v: 1 | -1) => void; label: string }) {
  return (
    <div className="flex items-center gap-1 text-muted" role="group" aria-label={label}>
      <button
        type="button"
        aria-label="Daumen hoch"
        aria-pressed={value === 1}
        onClick={() => onVote(1)}
        className={`flex h-11 w-11 items-center justify-center rounded-full active:bg-surface ${value === 1 ? "text-ink" : ""}`}
      >
        <IconThumb filled={value === 1} width={20} height={20} />
      </button>
      <button
        type="button"
        aria-label="Daumen runter"
        aria-pressed={value === -1}
        onClick={() => onVote(-1)}
        className={`flex h-11 w-11 items-center justify-center rounded-full active:bg-surface ${value === -1 ? "text-ink" : ""}`}
      >
        <IconThumb down filled={value === -1} width={20} height={20} />
      </button>
    </div>
  );
}
