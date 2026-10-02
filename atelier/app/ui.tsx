'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';

/* ---------- icons: thin, quiet, no emoji ---------- */

const paths: Record<string, React.ReactNode> = {
  camera: (
    <>
      <path d="M4 8.5h3.2l1.6-2.5h6.4l1.6 2.5H20v10H4z" />
      <circle cx="12" cy="13.2" r="3.4" />
    </>
  ),
  library: (
    <>
      <rect x="4" y="5" width="16" height="14" />
      <path d="M4 15.5l4.5-4.5 4 4 2.5-2.5 5 5" />
      <circle cx="15.5" cy="9" r="1.3" />
    </>
  ),
  mic: (
    <>
      <rect x="9.3" y="3.5" width="5.4" height="10.5" rx="2.7" />
      <path d="M6 11.5a6 6 0 0 0 12 0M12 17.5v3" />
    </>
  ),
  close: <path d="M6 6l12 12M18 6L6 18" />,
  back: <path d="M14.5 5.5L8 12l6.5 6.5" />,
  plus: <path d="M12 5v14M5 12h14" />,
  share: (
    <>
      <path d="M12 3.5v11M7.5 8L12 3.5 16.5 8" />
      <path d="M5.5 12.5v7h13v-7" />
    </>
  ),
  download: (
    <>
      <path d="M12 4v11M7.5 10.5L12 15l4.5-4.5" />
      <path d="M5 19.5h14" />
    </>
  ),
  check: <path d="M5 12.5l4.5 4.5L19 7.5" />,
  create: (
    <>
      <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
      <path d="M12 8.5v7M8.5 12h7" />
    </>
  ),
  channels: (
    <>
      <rect x="3.5" y="3.5" width="7" height="7" rx="2.2" />
      <rect x="13.5" y="3.5" width="7" height="7" rx="2.2" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="2.2" />
      <rect x="13.5" y="13.5" width="7" height="7" rx="2.2" />
    </>
  ),
  settings: (
    <>
      <path d="M4 7h10M18 7h2M4 17h2M10 17h10" />
      <circle cx="16" cy="7" r="2.2" />
      <circle cx="8" cy="17" r="2.2" />
    </>
  ),
  bolt: <path d="M13 3.5L5.5 13.5H12l-1 7 7.5-10H12z" />,
};

export function Icon({ name, size = 24, stroke = 1.4 }: { name: keyof typeof paths | string; size?: number; stroke?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {paths[name]}
    </svg>
  );
}

/* ---------- scroll wheel (iOS-style picker) ---------- */

export interface WheelItem {
  value: string;
  label: string;
}

const ROW = 46;

/** One column of a snap-scrolling wheel. Calls onChange when it settles. */
export function Wheel({ items, value, onChange, width }: { items: WheelItem[]; value: string; onChange: (v: string) => void; width?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const settle = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [active, setActive] = useState(value);

  useLayoutEffect(() => {
    const i = Math.max(0, items.findIndex((it) => it.value === value));
    if (ref.current && Math.round(ref.current.scrollTop / ROW) !== i) ref.current.scrollTop = i * ROW;
    setActive(value);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, items.length]);

  function onScroll() {
    const el = ref.current;
    if (!el) return;
    const i = Math.min(items.length - 1, Math.max(0, Math.round(el.scrollTop / ROW)));
    setActive(items[i]?.value);
    if (settle.current) clearTimeout(settle.current);
    settle.current = setTimeout(() => items[i] && items[i].value !== value && onChange(items[i].value), 120);
  }

  return (
    <div className="wheel" ref={ref} onScroll={onScroll} style={{ width }} role="listbox">
      <div style={{ height: ROW * 2 }} />
      {items.map((it, i) => (
        <div
          key={it.value}
          className={`wheel-row ${it.value === active ? 'on' : ''}`}
          role="option"
          aria-selected={it.value === active}
          onClick={() => ref.current?.scrollTo({ top: i * ROW, behavior: 'smooth' })}
        >
          {it.label}
        </div>
      ))}
      <div style={{ height: ROW * 2 }} />
    </div>
  );
}

/* ---------- bottom sheet ---------- */

export function Sheet({ open, onClose, children }: { open: boolean; onClose: () => void; children: React.ReactNode }) {
  useEffect(() => {
    if (!open) return;
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', esc);
    return () => window.removeEventListener('keydown', esc);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="sheet-wrap" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        {children}
      </div>
    </div>
  );
}

/* ---------- template previews (pure css, uses the user's own photo) ---------- */

export function TemplatePreview({ layout, photo, line }: { layout: string; photo?: string | null; line?: string }) {
  const text = line || 'less, but better.';
  const bg = photo ? { backgroundImage: `url(${photo})` } : {};
  if (layout === 'editorial') {
    return (
      <div className="tp tp-editorial" style={bg}>
        <div className="tp-shade" />
        <span className="tp-rule" />
        <span className="tp-ed-text">{text}</span>
      </div>
    );
  }
  if (layout === 'foyo') {
    return (
      <div className="tp tp-foyo" style={photo ? { backgroundImage: `linear-gradient(to top, rgba(10,7,6,.75), rgba(10,7,6,0) 60%), url(${photo})` } : {}}>
        <span className="tp-fy-logo">
          fo
          <br />
          yo
        </span>
        <span className="tp-fy-text">{text}</span>
      </div>
    );
  }
  if (layout === 'bauhaus') {
    return (
      <div className="tp tp-bauhaus">
        <span className="tp-bh-bar" />
        <div className="tp-bh-photo" style={bg} />
        <span className="tp-bh-dot" />
        <span className="tp-bh-text">{text}</span>
      </div>
    );
  }
  return (
    <div className="tp tp-polaroid">
      <div className="tp-card">
        <div className="tp-photo" style={bg} />
        <span className="tp-pol-text">{text}</span>
      </div>
    </div>
  );
}

/* ---------- channel wordmark ---------- */

export function Mark({ name, logo }: { name: string; logo: string[] | null }) {
  const lines = logo?.length ? logo : name === 'foyo' ? ['fo', 'yo'] : [name.slice(0, 5)];
  return (
    <span className="mark" aria-hidden="true">
      {lines.slice(0, 3).map((l) => (
        <span key={l} style={{ fontSize: lines.length > 2 ? 17 : Math.max(14, 30 - l.length * 2.6) }}>
          {l}
        </span>
      ))}
    </span>
  );
}

/* ---------- cutcake logo: dome over three layers — the gaps are the cuts ---------- */

export function Logo({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="192 192 640 640" fill="var(--logo)" aria-hidden="true" className="logo">
      <path d="M243 462a269 230 0 0 1 538 0z" />
      <rect x="213" y="509" width="598" height="68" rx="9" />
      <rect x="259" y="616" width="506" height="69" rx="9" />
      <rect x="313" y="724" width="399" height="68" rx="9" />
    </svg>
  );
}
