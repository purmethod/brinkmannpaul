"use client";

import { useState } from "react";

const SAY = /Sag:\s*[„"»]([^“"«]+)[“"«]/;

/** Mentor answer. A ready sentence ("Sag: „…“") becomes a block he can copy with one tap. */
export function AnswerText({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const m = SAY.exec(text);
  if (!m) return <p className="text-[17px] leading-relaxed whitespace-pre-wrap">{text}</p>;
  const before = text.slice(0, m.index).trim();
  const after = text.slice(m.index + m[0].length).trim();
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(m[1]);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard not available – the sentence is still visible
    }
  };
  return (
    <div className="flex flex-col gap-3">
      {before && <p className="text-[17px] leading-relaxed whitespace-pre-wrap">{before}</p>}
      <div className="flex items-start justify-between gap-3 rounded-2xl border border-ink px-4 py-3" data-testid="say">
        <p className="text-[17px] leading-snug font-medium">„{m[1]}“</p>
        <button type="button" onClick={copy} className="shrink-0 pt-0.5 text-[13px] text-muted underline-offset-4 hover:underline">
          {copied ? "Kopiert" : "Kopieren"}
        </button>
      </div>
      {after && <p className="text-[17px] leading-relaxed whitespace-pre-wrap">{after}</p>}
    </div>
  );
}
