// Generates every icon and splash image from assets/logo.svg (exact brand SVG) with sharp.
// Run: npm run icons
import sharp from "sharp";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const logo = readFileSync(join(root, "assets/logo.svg"), "utf8");
// Same artwork without the white square: used where the logo is placed on a larger canvas.
const mark = logo.replace(/<rect[^>]*\/>\n?/, "");
const WHITE = { r: 255, g: 255, b: 255, alpha: 1 };

const out = (p) => {
  const f = join(root, p);
  mkdirSync(dirname(f), { recursive: true });
  return f;
};

const render = (svg, size) => sharp(Buffer.from(svg), { density: Math.ceil((72 * size) / 140) + 1 }).resize(size, size);

/** Logo scaled to `scale` of a square canvas. */
async function padded(size, scale, { transparent = false } = {}) {
  const inner = Math.round(size * scale);
  const art = await render(mark, inner).png().toBuffer();
  return sharp({ create: { width: size, height: size, channels: 4, background: transparent ? { r: 0, g: 0, b: 0, alpha: 0 } : WHITE } })
    .composite([{ input: art, gravity: "center" }])
    .png();
}

async function canvas(width, height, logoSize) {
  const art = await render(mark, logoSize).png().toBuffer();
  return sharp({ create: { width, height, channels: 3, background: WHITE } })
    .composite([{ input: art, gravity: "center" }])
    .png({ compressionLevel: 9, palette: true });
}

// ---- web / PWA
await render(logo, 192).png().toFile(out("public/icons/icon-192.png"));
await render(logo, 512).png().toFile(out("public/icons/icon-512.png"));
// maskable: keep the artwork inside the 80 % safe circle
await (await padded(512, 0.72)).flatten({ background: WHITE }).toFile(out("public/icons/maskable-512.png"));
await (await padded(192, 0.72)).flatten({ background: WHITE }).toFile(out("public/icons/maskable-192.png"));
await (await padded(180, 0.86)).flatten({ background: WHITE }).toFile(out("public/apple-touch-icon.png"));
writeFileSync(out("public/icon.svg"), logo);

// favicon.ico (PNG-compressed ICO with 16/32/48)
const sizes = [16, 32, 48];
const pngs = await Promise.all(sizes.map((s) => render(logo, s).png().toBuffer()));
const header = Buffer.alloc(6 + 16 * sizes.length);
header.writeUInt16LE(0, 0);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(sizes.length, 4);
let offset = header.length;
sizes.forEach((s, i) => {
  const e = 6 + i * 16;
  header.writeUInt8(s, e);
  header.writeUInt8(s, e + 1);
  header.writeUInt8(0, e + 2);
  header.writeUInt8(0, e + 3);
  header.writeUInt16LE(1, e + 4);
  header.writeUInt16LE(32, e + 6);
  header.writeUInt32LE(pngs[i].length, e + 8);
  header.writeUInt32LE(offset, e + 12);
  offset += pngs[i].length;
});
writeFileSync(out("public/favicon.ico"), Buffer.concat([header, ...pngs]));

// ---- iOS PWA splash screens (logo centred on white), portrait
export const APPLE_SPLASH = [
  [1320, 2868, 3], [1206, 2622, 3], [1290, 2796, 3], [1179, 2556, 3], [1284, 2778, 3],
  [1170, 2532, 3], [1125, 2436, 3], [1242, 2688, 3], [828, 1792, 2], [1242, 2208, 3], [750, 1334, 2],
];
for (const [w, h] of APPLE_SPLASH) {
  await (await canvas(w, h, Math.round(w * 0.42))).toFile(out(`public/splash/apple-splash-${w}x${h}.png`));
}

// ---- native (Capacitor) – used later by `npx @capacitor/assets generate` or copied by hand
// iOS App Store icon: 1024, no alpha channel allowed
await render(logo, 1024).flatten({ background: WHITE }).removeAlpha().png().toFile(out("resources/icon-only.png"));
await render(logo, 1024).flatten({ background: WHITE }).removeAlpha().png().toFile(out("resources/ios/AppIcon-1024.png"));
// Android adaptive: 108dp canvas, artwork in the inner 66dp safe zone
await (await padded(1024, 0.6, { transparent: true })).toFile(out("resources/icon-foreground.png"));
await sharp({ create: { width: 1024, height: 1024, channels: 3, background: WHITE } }).png().toFile(out("resources/icon-background.png"));
const densities = { mdpi: 1, hdpi: 1.5, xhdpi: 2, xxhdpi: 3, xxxhdpi: 4 };
for (const [name, f] of Object.entries(densities)) {
  await (await padded(Math.round(108 * f), 0.6, { transparent: true })).toFile(out(`resources/android/mipmap-${name}/ic_launcher_foreground.png`));
  await render(logo, Math.round(48 * f)).png().toFile(out(`resources/android/mipmap-${name}/ic_launcher.png`));
  const r = Math.round(48 * f);
  const circle = Buffer.from(`<svg width="${r}" height="${r}"><circle cx="${r / 2}" cy="${r / 2}" r="${r / 2}" fill="#fff"/></svg>`);
  await sharp(await (await padded(r, 0.8)).toBuffer()).composite([{ input: circle, blend: "dest-in" }]).toFile(out(`resources/android/mipmap-${name}/ic_launcher_round.png`));
}
writeFileSync(
  out("resources/android/mipmap-anydpi-v26/ic_launcher.xml"),
  `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@color/ic_launcher_background"/>
    <foreground android:drawable="@mipmap/ic_launcher_foreground"/>
</adaptive-icon>
`,
);
writeFileSync(
  out("resources/android/values/ic_launcher_background.xml"),
  `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="ic_launcher_background">#FFFFFF</color>
</resources>
`,
);
// Native splash (Capacitor SplashScreen): 2732² with the logo centred on white
await (await canvas(2732, 2732, 820)).toFile(out("resources/splash.png"));

console.log("icons + splash generated");
