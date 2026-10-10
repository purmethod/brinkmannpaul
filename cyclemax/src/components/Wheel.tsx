"use client";

import { useEffect, useId, useRef, type KeyboardEvent } from "react";

export interface WheelItem<T> {
  value: T;
  label: string;
}

const ITEM = 44;
const VISIBLE = 5;

/** Drehrad: scroll-snap wheel picker (touch, mouse wheel, tap, arrow keys). */
export function Wheel<T extends string | number>({
  items,
  value,
  onChange,
  label,
  testId,
}: {
  items: WheelItem<T>[];
  value: T;
  onChange: (v: T) => void;
  label: string;
  testId?: string;
}) {
  const ref = useRef<HTMLUListElement>(null);
  const frame = useRef<number | null>(null);
  /** Index a programmatic (tap/keyboard) scroll is heading to – scroll events on the way there are ignored. */
  const target = useRef<number | null>(null);
  const id = useId();
  const index = Math.max(
    0,
    items.findIndex((i) => i.value === value),
  );

  // Keep the scroll position in sync with the value (initial render and external changes).
  useEffect(() => {
    const el = ref.current;
    if (el && Math.round(el.scrollTop / ITEM) !== index) el.scrollTop = index * ITEM;
  }, [index]);

  // The value always follows the centered item, frame by frame – so "Eintragen" right after a flick
  // (iOS momentum scrolling) saves exactly the date the user sees, never a stale one.
  const onScroll = () => {
    if (frame.current !== null) return;
    frame.current = requestAnimationFrame(() => {
      frame.current = null;
      const el = ref.current;
      if (!el) return;
      const i = Math.min(items.length - 1, Math.max(0, Math.round(el.scrollTop / ITEM)));
      if (target.current !== null) {
        if (i === target.current) target.current = null;
        return;
      }
      if (items[i] && items[i].value !== value) onChange(items[i].value);
    });
  };
  useEffect(() => () => void (frame.current !== null && cancelAnimationFrame(frame.current)), []);

  const select = (i: number) => {
    const clamped = Math.min(items.length - 1, Math.max(0, i));
    const el = ref.current;
    if (el && Math.round(el.scrollTop / ITEM) !== clamped) target.current = clamped;
    el?.scrollTo({ top: clamped * ITEM, behavior: "smooth" });
    onChange(items[clamped].value);
  };

  const onKey = (e: KeyboardEvent) => {
    if (e.key === "ArrowDown") select(index + 1);
    else if (e.key === "ArrowUp") select(index - 1);
    else return;
    e.preventDefault();
  };

  return (
    <div className="relative mx-auto w-full max-w-xs" style={{ height: ITEM * VISIBLE }}>
      <div
        className="pointer-events-none absolute inset-x-0 rounded-xl bg-surface"
        style={{ top: ITEM * Math.floor(VISIBLE / 2), height: ITEM }}
        aria-hidden="true"
      />
      <ul
        ref={ref}
        role="listbox"
        aria-label={label}
        aria-activedescendant={`${id}-${index}`}
        tabIndex={0}
        onScroll={onScroll}
        onPointerDown={() => (target.current = null)}
        onWheel={() => (target.current = null)}
        onKeyDown={onKey}
        data-testid={testId}
        className="wheel relative h-full overflow-y-scroll outline-none"
        style={{ paddingBlock: ITEM * Math.floor(VISIBLE / 2) }}
      >
        {items.map((item, i) => (
          <li
            key={String(item.value)}
            id={`${id}-${i}`}
            role="option"
            aria-selected={i === index}
            onClick={() => select(i)}
            className={`flex cursor-pointer select-none items-center justify-center text-[20px] transition-colors ${
              i === index ? "font-semibold text-ink" : "text-muted"
            }`}
            style={{ height: ITEM }}
          >
            {item.label}
          </li>
        ))}
      </ul>
    </div>
  );
}
