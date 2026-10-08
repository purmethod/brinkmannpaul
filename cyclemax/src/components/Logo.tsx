// The Cyclemax mark: one black ring. Same as app icon and splash.
export function Logo({ size = 96, color = "#0B0B0C", title = "Cyclemax" }: { size?: number; color?: string; title?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 140 140" role="img" aria-label={title}>
      <circle cx="70" cy="70" r="40" fill="none" stroke={color} strokeWidth="9" />
    </svg>
  );
}

export function Wordmark({ className = "" }: { className?: string }) {
  return <span className={`text-[13px] font-medium tracking-[0.42em] uppercase ${className}`}>Cyclemax</span>;
}
