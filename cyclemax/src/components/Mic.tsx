"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { SpeechAdapter } from "@/adapters/speech";

/**
 * Dictation into a text value. `base` is the text before listening started; the live transcript
 * is appended to it, so he can talk, pause, talk again.
 */
export function useDictation(speech: SpeechAdapter, value: string, setValue: (v: string) => void) {
  const [listening, setListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const base = useRef("");
  const valueRef = useRef(value);
  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  const start = useCallback(async () => {
    setError(null);
    base.current = valueRef.current.trim();
    setListening(true);
    await speech.start(
      (text) => setValue([base.current, text].filter(Boolean).join(base.current ? " " : "")),
      (err) => {
        setListening(false);
        if (err) setError(err);
      },
    );
  }, [speech, setValue]);

  const stop = useCallback(async () => {
    await speech.stop();
    setListening(false);
  }, [speech]);

  useEffect(() => () => void speech.stop(), [speech]);

  return { listening, error, start, stop, toggle: () => (listening ? stop() : start()) };
}

export function IconMic(p: { width?: number; height?: number }) {
  return (
    <svg width={p.width ?? 22} height={p.height ?? 22} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" aria-hidden="true">
      <rect x="9" y="3" width="6" height="11" rx="3" />
      <path d="M5 11a7 7 0 0014 0M12 18v3" />
    </svg>
  );
}

/** Round mic button. While listening it becomes the pulsing Cyclemax ring. */
export function MicButton({ listening, onClick, size = 48, label = "Sprechen" }: { listening: boolean; onClick: () => void; size?: number; label?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={listening ? "Aufnahme beenden" : label}
      aria-pressed={listening}
      data-testid="mic"
      className={`relative flex shrink-0 items-center justify-center rounded-full transition-colors ${listening ? "bg-ink text-white" : "bg-surface text-ink"}`}
      style={{ width: size, height: size }}
    >
      {listening && <span className="mic-pulse absolute inset-0 rounded-full border-2 border-ink" aria-hidden="true" />}
      {listening ? <span className="h-3.5 w-3.5 rounded-[3px] bg-white" /> : <IconMic width={size * 0.46} height={size * 0.46} />}
    </button>
  );
}
