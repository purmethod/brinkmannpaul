# film — Kritzel-Märchen (Remotion + roughjs)

18-Sekunden-Testclip „Es war einmal …“ im Stil eines alten Zeichentrickfilms (1930er–50er).
Separates Teilprojekt, berührt `dist/` (Website) nicht.

## Schnellstart

```bash
cd film
npm install
cp .env.example .env            # ELEVENLABS_API_KEY eintragen
npm run audio:elevenlabs        # Stimme (2 Kandidaten, wärmere gewinnt) + Musik + Knistern
npm run stills                  # out/still-02s.png, still-09s.png, still-15s.png
npm run render                  # out/test-maerchen.mp4
npm run studio                  # interaktive Vorschau
```

Ohne API-Key: `npm run audio:placeholder` synthetisiert Spieluhr/Celesta/Streicher und
Schallplatten-Knistern lokal. Ohne Stimme läuft die Animation auf geschätzten Wortzeiten.

Optional ein vorhandenes Chromium statt Remotions Download:
`REMOTION_BROWSER_EXECUTABLE=/pfad/zu/chrome npm run render`.

## Wie das Timing funktioniert

`scripts/generate-elevenlabs.mjs` nutzt den `with-timestamps`-Endpunkt und schreibt Wortzeiten nach
`public/voice/test-erzaehlung.timing.json`. `src/narration/narration.ts` leitet daraus die Szenen-Cues ab
(„ein“ → Kenza tritt auf, „Träume“ → Sternchen, „neue“ → Stadt zeichnet sich, „Jede“ → Häuser erwachen,
„flüstern“ → Höhepunkt der Flüster-Zeichen), geklemmt aufs Storyboard-Raster. Musik wird unter der
Stimme auf −18 dB geduckt.

## Bausteine (für den ganzen Film wiederverwendbar)

| Komponente | Datei | Wichtige Props |
|---|---|---|
| `Rough` | `src/components/rough/Rough.tsx` | `shape`, `salt`, `fill` (Schraffur), `draw` (zeichnet sich selbst), `base`, `wash` — Linien „kochen“ alle 4 Frames, Seed deterministisch aus Frame + salt |
| `Kenza` | `src/components/characters/Kenza.tsx` | `pose` (stand/walk/wonder/reach), `expression` (happy/wonder/curious), `blink`, `walkCycle`, `facing`, `lookX/Y`, `headTilt`, `withSuitcase` |
| `HoseLimb` | `src/components/characters/HoseLimb.tsx` | Rubber-Hose-Arm/Bein ohne Gelenke |
| `House` | `src/components/scenery/House.tsx` | `draw`, `face` (Fenster → Augen, Tür → Mund), `lean`, `whisper`, `lookX` |
| `Lantern`, `Lane`, `Cloud`, `Vine`, `Rose`, `Leaf`, `Book`, `WoodTable` | `src/components/scenery/` | meist `draw`/`grow` 0..1 |
| `Butterfly`, `Suitcase`, `Sparkle`, `QuestionMark`, `DreamStars` | `src/components/props/` | |
| `OrnateTitle` | `src/components/text/OrnateTitle.tsx` | `lines`, `write`, `flourish` — Pinyon Script (SIL OFL), lokal in `public/fonts` |
| `VintageFilm` | `src/components/effects/VintageFilm.tsx` | `enabled`, `sepia`, `grain`, `flicker`, `scratches`, `dust`, `vignette`, `gateWeave` |
| `PaperTexture` | `src/components/effects/PaperTexture.tsx` | vergilbtes Papier |
| `IrisWipe` | `src/components/transitions/IrisWipe.tsx` | `cx`, `cy`, `radius` |
| `PageTurn` | `src/components/transitions/PageTurn.tsx` | `progress`, `from`, `to` |

Komposition `Bausteine` = Charakterblatt (Kenza in allen Posen) + Umblätter-Demo.
Vintage-Effekte im Testclip abschalten: Prop `vintage: false`.
