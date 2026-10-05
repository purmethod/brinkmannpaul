import {C} from '../lib/sketch';

/** Kraftpapier: flache Grundfarbe ... */
export const PaperBase: React.FC<{w: number; h: number}> = ({w, h}) => <rect width={w} height={h} fill={C.paper} />;

/** ... und die gesamte Textur als Multiply-Overlay über allem, damit Flächen in Papierfarbe unsichtbar bleiben. */
export const PaperGrain: React.FC<{w: number; h: number}> = ({w, h}) => (
  <g style={{mixBlendMode: 'multiply'}} pointerEvents="none">
    <defs>
      <filter id="kraft-mottle" x="0" y="0" width="100%" height="100%">
        <feTurbulence type="fractalNoise" baseFrequency="0.006" numOctaves={3} seed={4} />
        <feColorMatrix type="matrix" values="0 0 0 0 0.55  0 0 0 0 0.42  0 0 0 0 0.28  0 0 0 0.9 -0.25" />
      </filter>
      <filter id="kraft-fiber" x="0" y="0" width="100%" height="100%">
        <feTurbulence type="fractalNoise" baseFrequency="0.012 0.35" numOctaves={2} seed={9} />
        <feColorMatrix type="matrix" values="0 0 0 0 0.45  0 0 0 0 0.33  0 0 0 0 0.2  0 0 0 1.1 -0.5" />
      </filter>
      <filter id="kraft-grain" x="0" y="0" width="100%" height="100%">
        <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves={2} seed={2} />
        <feColorMatrix type="matrix" values="0 0 0 0 0.35  0 0 0 0 0.26  0 0 0 0 0.16  0 0 0 1.6 -0.72" />
      </filter>
      <radialGradient id="kraft-vignette" cx="50%" cy="50%" r="72%">
        <stop offset="60%" stopColor="#fff" stopOpacity={0} />
        <stop offset="100%" stopColor="#7a5a38" stopOpacity={0.45} />
      </radialGradient>
    </defs>
    <rect width={w} height={h} filter="url(#kraft-mottle)" opacity={0.45} />
    <rect width={w} height={h} filter="url(#kraft-fiber)" opacity={0.35} />
    <rect width={w} height={h} filter="url(#kraft-grain)" opacity={0.6} />
    <rect width={w} height={h} fill="url(#kraft-vignette)" />
  </g>
);
