"use client";

import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { IconBack } from "./icons";

type Variant = "primary" | "secondary" | "ghost" | "danger";

const VARIANTS: Record<Variant, string> = {
  primary: "bg-ink text-white active:bg-black/80",
  secondary: "bg-surface text-ink active:bg-[#ebebe9]",
  ghost: "bg-transparent text-ink underline-offset-4 hover:underline",
  danger: "bg-accent text-white active:bg-[#6d0202]",
};

export function Button({
  variant = "primary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      type="button"
      {...props}
      className={`flex min-h-14 w-full items-center justify-center rounded-2xl px-6 text-[17px] font-medium transition-colors disabled:opacity-40 ${VARIANTS[variant]} ${className}`}
    />
  );
}

export function Toggle({ checked, onChange, label, id }: { checked: boolean; onChange: (v: boolean) => void; label: string; id: string }) {
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative h-8 w-[52px] shrink-0 rounded-full transition-colors ${checked ? "bg-ink" : "bg-[#d9d9d6]"}`}
    >
      <span
        className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow-sm transition-transform ${checked ? "translate-x-[24px]" : "translate-x-1"}`}
      />
    </button>
  );
}

export function Screen({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <main className={`mx-auto flex min-h-[100dvh] w-full max-w-md flex-col px-6 pt-safe pb-safe ${className}`}>{children}</main>;
}

export function TopBar({ title, back = "/", right }: { title?: string; back?: string | null; right?: ReactNode }) {
  return (
    <header className="flex h-12 items-center justify-between">
      {back ? (
        <Link href={back} aria-label="Zurück" className="-ml-2 flex h-11 w-11 items-center justify-center rounded-full active:bg-surface">
          <IconBack />
        </Link>
      ) : (
        <span className="w-11" />
      )}
      {title ? <h1 className="text-[17px] font-semibold">{title}</h1> : <span />}
      <div className="flex w-11 justify-end">{right}</div>
    </header>
  );
}

/** Bottom sheet dialog. */
export function Sheet({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/30" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="fade-up w-full max-w-md rounded-t-3xl bg-bg px-6 pt-6 pb-safe"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-4 text-center text-[17px] font-semibold">{title}</h2>
        {children}
      </div>
    </div>
  );
}
