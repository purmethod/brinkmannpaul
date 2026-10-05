# Kenza und Pablo in Paulistan — Kritzel-Testclip

Remotion + TypeScript + roughjs. 10-Sekunden-Test für Figuren und Look (1080x1080, 30 fps).

```bash
npm install
npx remotion still src/index.ts TestFiguren out/still-90.png --frame=90
npx remotion render src/index.ts TestFiguren out/test-figuren.mp4
```

- `src/lib/sketch.tsx` — rough.js-Wrapper: Boiling Lines (Seed alle 4 Frames), Draw-on per stroke-dashoffset
- `src/components/` — Kenza, Pablo (Props: pose, expression, blink, look, walkCycle, turn), Rose/Ranke,
  roter Faden, Schmetterling, Kritzel-Effekte, Kraftpapier
- `src/TestFiguren.tsx` — Ablauf des Testclips
