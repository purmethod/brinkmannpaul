// qefyr illustrations, drawn in code: a glass of kefir, kefir grains, an alpine ridge and line icons.
// No photos are faked here: when Paul's real photographs exist, they replace the glass (see README).
import { rng, r1 } from "./util.mjs";

let uid = 0;
const id = (p) => `${p}${++uid}`;

// One kefir grain: an irregular, cauliflower-like mound of lobules, lit as one creamy mass,
// with fine edges between the lobules.
export function grain(cx, cy, size, seed) {
  const rand = rng(seed);
  const gid = id("gr");
  const lobes = [];
  const n = 18 + Math.floor(rand() * 8);
  const stretch = 0.85 + rand() * 0.45;
  for (let i = 0; i < n; i++) {
    const a = rand() * Math.PI * 2;
    const d = Math.pow(rand(), 0.8) * size * 0.62;
    const x = cx + Math.cos(a) * d * stretch;
    const y = cy + Math.sin(a) * d * 0.5 - (1 - d / (size * 0.62)) * size * 0.3;
    const r = size * (0.15 + rand() * 0.15);
    lobes.push({ x, y, rx: r * (0.9 + rand() * 0.3), ry: r * (0.78 + rand() * 0.25), rot: Math.round(rand() * 180) });
  }
  lobes.sort((p, q) => p.y + p.ry - (q.y + q.ry));
  const lx = r1(cx - size * 0.35), ly = r1(cy - size * 0.55), lr = r1(size * 1.35);
  let mass = "";
  for (const l of lobes) {
    mass += `<ellipse cx="${r1(l.x)}" cy="${r1(l.y)}" rx="${r1(l.rx)}" ry="${r1(l.ry)}" transform="rotate(${l.rot} ${r1(l.x)} ${r1(l.y)})"/>`;
  }
  return `<g>
    <radialGradient id="${gid}" gradientUnits="userSpaceOnUse" cx="${lx}" cy="${ly}" r="${lr}">
      <stop offset="0" stop-color="#fffcf3"/><stop offset="0.5" stop-color="#f1e8d4"/><stop offset="1" stop-color="#cdbd99"/>
    </radialGradient>
    <ellipse cx="${r1(cx)}" cy="${r1(cy + size * 0.36)}" rx="${r1(size * 0.78 * stretch)}" ry="${r1(size * 0.14)}" fill="#4a3a1f" opacity="0.18"/>
    <g fill="url(#${gid})" stroke="rgba(112,90,52,0.34)" stroke-width="${r1(Math.max(0.5, size * 0.012))}">${mass}</g>
  </g>`;
}

// A few grains on their own, e.g. for the story section.
export function grainCluster({ w = 320, h = 220, seed = 7, count = 3, label = "" } = {}) {
  const rand = rng(seed);
  let g = "";
  const spots = [
    [0.36, 0.5, 0.2],
    [0.66, 0.6, 0.15],
    [0.52, 0.28, 0.11],
    [0.18, 0.72, 0.09],
    [0.84, 0.32, 0.08],
  ].slice(0, count);
  for (const [x, y, s] of spots) g += grain(x * w, y * h, s * w * (0.9 + rand() * 0.2), Math.floor(rand() * 1e6));
  const a11y = label ? `role="img" aria-label="${label}"` : `aria-hidden="true"`;
  return `<svg class="art-grains" viewBox="0 0 ${w} ${h}" ${a11y} focusable="false">${g}</svg>`;
}

// The hero glass: a tumbler of creamy kefir with grains beside it.
export function glass({ label = "", grains = true, shadow = true } = {}) {
  const K = { kef: id("kef"), shade: id("sh"), top: id("top"), wall: id("wall"), hl: id("hl"), blur: id("bl"), soft: id("sf") };
  // Glass: rim at y=60 (x 70–330), foot at y=540 (x 96–304). Kefir surface at y=150.
  const slope = 26 / 480;
  const xl = (y) => 70 + (y - 60) * slope;
  const xr = (y) => 330 - (y - 60) * slope;
  const level = 150;
  const inset = 8;
  const bottom = 508;
  const kef = `M${r1(xl(level) + inset)},${level} L${r1(xl(bottom - 12) + inset)},${bottom - 12} Q${r1(xl(bottom) + inset + 2)},${bottom} ${r1(xl(bottom) + inset + 16)},${bottom} L${r1(xr(bottom) - inset - 16)},${bottom} Q${r1(xr(bottom) - inset - 2)},${bottom} ${r1(xr(bottom - 12) - inset)},${bottom - 12} L${r1(xr(level) - inset)},${level} Z`;
  const outer = `M70,60 L${r1(xl(518))},518 Q${r1(xl(540))},540 ${r1(xl(540) + 22)},540 L${r1(xr(540) - 22)},540 Q${r1(xr(540))},540 ${r1(xr(518))},518 L330,60`;
  const surfRx = r1((xr(level) - xl(level)) / 2 - inset);
  const rand = rng(31);
  let foam = "";
  for (let i = 0; i < 26; i++) {
    const side = i % 2 ? 1 : -1;
    const t = 0.72 + rand() * 0.26;
    const x = 200 + side * surfRx * t;
    const y = level + (rand() - 0.5) * 9;
    foam += `<circle cx="${r1(x)}" cy="${r1(y)}" r="${r1(0.9 + rand() * 2.4)}" fill="#fffef9" stroke="rgba(150,128,90,0.35)" stroke-width="0.5"/>`;
  }
  let lonely = "";
  for (let i = 0; i < 9; i++) {
    const x = 200 + (rand() - 0.5) * surfRx * 1.3;
    const y = level + (rand() - 0.5) * 12;
    lonely += `<circle class="pop" style="--d:${r1(rand() * 6)}s" cx="${r1(x)}" cy="${r1(y)}" r="${r1(0.8 + rand() * 1.4)}" fill="none" stroke="rgba(150,128,90,0.45)" stroke-width="0.6"/>`;
  }
  const grainsSvg = grains
    ? grain(392, 546, 36, 11) + grain(452, 560, 24, 23) + grain(58, 564, 20, 5)
    : "";
  const a11y = label ? `role="img" aria-label="${label}"` : `aria-hidden="true"`;
  return `<svg class="art-glass" viewBox="0 0 500 600" ${a11y} focusable="false">
  <defs>
    <linearGradient id="${K.kef}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#fffdf8"/><stop offset="0.5" stop-color="#f6efe1"/><stop offset="1" stop-color="#e6dbc5"/>
    </linearGradient>
    <linearGradient id="${K.shade}" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#7a6644" stop-opacity="0.34"/><stop offset="0.16" stop-color="#7a6644" stop-opacity="0.07"/>
      <stop offset="0.42" stop-color="#ffffff" stop-opacity="0.18"/><stop offset="0.62" stop-color="#ffffff" stop-opacity="0"/>
      <stop offset="0.86" stop-color="#7a6644" stop-opacity="0.1"/><stop offset="1" stop-color="#7a6644" stop-opacity="0.38"/>
    </linearGradient>
    <radialGradient id="${K.top}" cx="0.42" cy="0.4" r="0.7">
      <stop offset="0" stop-color="#ffffff"/><stop offset="0.7" stop-color="#faf5ea"/><stop offset="1" stop-color="#e9dfcb"/>
    </radialGradient>
    <linearGradient id="${K.wall}" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#ffffff" stop-opacity="0.16"/><stop offset="0.1" stop-color="#ffffff" stop-opacity="0.04"/>
      <stop offset="0.9" stop-color="#ffffff" stop-opacity="0.03"/><stop offset="1" stop-color="#ffffff" stop-opacity="0.14"/>
    </linearGradient>
    <linearGradient id="${K.hl}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#ffffff" stop-opacity="0"/><stop offset="0.2" stop-color="#ffffff" stop-opacity="0.75"/>
      <stop offset="0.8" stop-color="#ffffff" stop-opacity="0.5"/><stop offset="1" stop-color="#ffffff" stop-opacity="0"/>
    </linearGradient>
    <filter id="${K.blur}" x="-20%" y="-200%" width="140%" height="500%"><feGaussianBlur stdDeviation="9"/></filter>
    <filter id="${K.soft}" x="-50%" y="-10%" width="200%" height="120%"><feGaussianBlur stdDeviation="1.6"/></filter>
  </defs>
  ${shadow ? `<ellipse cx="200" cy="548" rx="150" ry="13" fill="#000" opacity="0.38" filter="url(#${K.blur})"/>` : ""}
  <path d="${outer}" fill="url(#${K.wall})"/>
  <path d="${kef}" fill="url(#${K.kef})"/>
  <path d="${kef}" fill="url(#${K.shade})"/>
  <ellipse cx="200" cy="${level}" rx="${surfRx}" ry="15" fill="url(#${K.top})" stroke="rgba(150,128,90,0.28)" stroke-width="0.8"/>
  ${foam}${lonely}
  <path d="M${r1(xl(bottom) + 6)},${bottom + 2} L${r1(xr(bottom) - 6)},${bottom + 2} L${r1(xr(536) - 18)},536 L${r1(xl(536) + 18)},536 Z" fill="#ffffff" opacity="0.08"/>
  <path d="${outer}" fill="none" stroke="#ffffff" stroke-opacity="0.6" stroke-width="1.6" stroke-linejoin="round"/>
  <ellipse cx="200" cy="60" rx="130" ry="13" fill="#ffffff" fill-opacity="0.05" stroke="#ffffff" stroke-opacity="0.75" stroke-width="1.6"/>
  <path d="M92,92 L98,92 L${r1(xl(470) + 14)},470 L${r1(xl(470) + 9)},470 Z" fill="url(#${K.hl})" filter="url(#${K.soft})"/>
  <path d="M112,96 L${r1(xl(300) + 40)},300" stroke="#ffffff" stroke-opacity="0.35" stroke-width="1" fill="none"/>
  <path d="M312,100 L${r1(xr(460) - 9)},460" stroke="#ffffff" stroke-opacity="0.45" stroke-width="1.2" fill="none" filter="url(#${K.soft})"/>
  ${grainsSvg}
</svg>`;
}

// An alpine ridge line, loosely after the Berchtesgaden skyline. Decorative.
export function ridge({ cls = "art-ridge", fill = false } = {}) {
  const pts = [
    [0, 112], [60, 104], [120, 92], [170, 70], [205, 58], [232, 46], [252, 54], [276, 62], [300, 78], [330, 88],
    [356, 80], [374, 72], [392, 82], [410, 76], [428, 66], [446, 80], [470, 84], [500, 70], [530, 56], [560, 44],
    [590, 36], [618, 40], [646, 30], [680, 24], [712, 18], [738, 26], [762, 32], [790, 28], [818, 22], [846, 26],
    [872, 40], [900, 58], [930, 74], [966, 86], [1010, 96], [1060, 100], [1120, 106], [1200, 108],
  ];
  const d = "M" + pts.map((p) => p.join(",")).join(" L");
  return fill
    ? `<svg class="${cls}" viewBox="0 0 1200 120" preserveAspectRatio="none" aria-hidden="true" focusable="false"><path d="${d} L1200,120 L0,120 Z"/></svg>`
    : `<svg class="${cls}" viewBox="0 0 1200 120" preserveAspectRatio="none" aria-hidden="true" focusable="false"><path d="${d}" fill="none" vector-effect="non-scaling-stroke"/></svg>`;
}

// Line icons, 32×32, drawn with currentColor.
const ICONS = {
  glass: `<path d="M9 5h14l-1.6 22H10.6z"/><path d="M9.8 11h12.4"/><path d="M12 16h3"/>`,
  milk: `<path d="M12 3h8v3l3 4v19H9V10l3-4z"/><path d="M9 14h14"/><path d="M12 6h8"/>`,
  loop: `<path d="M25 12a10 10 0 0 0-17.5-3"/><path d="M7 4v5h5"/><path d="M7 20a10 10 0 0 0 17.5 3"/><path d="M25 28v-5h-5"/>`,
  time: `<circle cx="16" cy="16" r="11"/><path d="M16 9v7l5 3"/>`,
  warmth: `<path d="M14 5a2 2 0 0 1 4 0v13a5 5 0 1 1-4 0z"/><path d="M16 12v9"/>`,
  culture: `<circle cx="12" cy="18" r="5"/><circle cx="20.5" cy="15" r="4"/><circle cx="16" cy="9.5" r="3.5"/><circle cx="21" cy="23" r="2.5"/>`,
  mountain: `<path d="M3 26l8-12 4 5 5-9 9 16z"/><path d="M18 13.5l2-3.5 2 3.6"/>`,
  truck: `<path d="M3 9h15v13H3z"/><path d="M18 13h6l4 5v4h-10"/><circle cx="9" cy="24" r="2.5"/><circle cx="23" cy="24" r="2.5"/>`,
  lock: `<rect x="7" y="14" width="18" height="13" rx="2"/><path d="M11 14v-4a5 5 0 0 1 10 0v4"/>`,
  flag: `<path d="M7 28V5"/><path d="M7 6h16l-3 5 3 5H7"/>`,
  arrow: `<path d="M6 16h20"/><path d="M19 9l7 7-7 7"/>`,
  plus: `<path d="M16 7v18M7 16h18"/>`,
  minus: `<path d="M7 16h18"/>`,
  mail: `<rect x="4" y="7" width="24" height="18" rx="2"/><path d="M5 9l11 8 11-8"/>`,
  insta: `<rect x="5" y="5" width="22" height="22" rx="6"/><circle cx="16" cy="16" r="5"/><circle cx="22.3" cy="9.7" r="1.2" fill="currentColor" stroke="none"/>`,
  menu: `<path d="M5 11h22M5 21h22"/>`,
  close: `<path d="M8 8l16 16M24 8L8 24"/>`,
};

export const icon = (name, cls = "icon") =>
  `<svg class="${cls}" viewBox="0 0 32 32" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">${ICONS[name]}</svg>`;

// Favicon: a cream "q" on pine.
export const favicon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="#1c2a21"/><circle cx="29" cy="28" r="12.5" fill="none" stroke="#f4eee1" stroke-width="5"/><path d="M41.5 18v34" stroke="#f4eee1" stroke-width="5" stroke-linecap="round"/><path d="M36 52h11" stroke="#b08d57" stroke-width="3.5" stroke-linecap="round"/></svg>`;
