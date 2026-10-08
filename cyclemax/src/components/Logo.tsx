// The Cyclemax mark: rock in the surf with the cycle ring (exact brand SVG).
export function Logo({ size = 96, title = "Cyclemax" }: { size?: number; title?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 140 140" role="img" aria-label={title}>
      <path d="M28 106 L36 66 L52 46 L66 34 L82 40 L96 32 L112 52 L116 78 L112 106 Z" fill="#FFFFFF" stroke="#8A0303" strokeWidth="5" strokeLinejoin="round" />
      <path d="M73 54 A18 18 0 0 1 91 72" fill="none" stroke="#C8102E" strokeWidth="6" />
      <path d="M91 72 A18 18 0 0 1 73 90" fill="none" stroke="#F2B705" strokeWidth="6" />
      <path d="M73 90 A18 18 0 0 1 55 72" fill="none" stroke="#E83E8C" strokeWidth="6" />
      <path d="M55 72 A18 18 0 0 1 73 54" fill="none" stroke="#2E9E4F" strokeWidth="6" />
      <path d="M14 120 q8 -6 16 0 t16 0 t16 0 t16 0 t16 0 t16 0 t16 0" fill="none" stroke="#8A0303" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}
