# serie — Kritzel-Märchenserie (Remotion + roughjs)

35 Folgen für Reels/TikTok (1080×1920, 30 fps), erzählt wie ein altes Märchen, animiert im
Stil eines Zeichentrickfilms der 1930er–50er. **Eine Datenquelle:** `src/data/episodes.ts`.

## Ablauf

```bash
cd serie && npm install
# Ton (braucht ELEVENLABS_API_KEY + Netzzugang zu api.elevenlabs.io):
node scripts/generate-audio.mjs voices --episodes 1-3   # Kandidaten-Stimmen (config/voice.json)
node scripts/generate-audio.mjs select <slug>           # Stimme freigeben -> public/voice/teil-XX.mp3
node scripts/generate-audio.mjs voices --episodes 4-11  # danach nur noch freigegebene Stimme
node scripts/generate-audio.mjs music                   # Spieluhr-Liebesthema in 4 Stimmungen + Outro-Jingle
node scripts/generate-audio.mjs sfx                     # Schallplatten-Knistern
# Bild:
npm run stills -- --only 1-3        # 2 Prüf-Standbilder je Folge -> out/stills/
npm run render:all                  # out/teil-XX.mp4 + out/thumbs/teil-XX.jpg
npm run studio                      # Vorschau
```

Optional vorhandenes Chromium: `REMOTION_BROWSER_EXECUTABLE=/pfad/zu/chrome`.

## Aufbau

- `src/data/episodes.ts` — Nr, Stimmung, Erzählung (englisch, wortgetreu gesprochen), Bild, erlaubte Schriftzüge
- `src/data/audio.json` — vom Audio-Skript geschrieben: Stimmen, Wortzeiten, Musik, Jingle, Knistern
- `src/lib/timing.ts` — Folgendauer = 0,3 s Hook + Erzählung + 0,4 s + 1,5 s Outro (mind. 8 s); `cue('wort')` liefert den Frame eines Wortes
- `src/components/` — Paper, VintageOverlay, Iris, Karima, Pablo, Dove, Lion, Butterfly, Vine/Rose, RedRibbon,
  DoodleFX (Herz, Sternchen, Fragezeichen, Gedankenblase, Vögel, Puff, Regen, Boom, Schatten-Augen),
  EpisodeBadge, Outro, Town, Book, House, Lantern, Fence/Rope, TownMap, Episode (Rahmen + Ton)
- `src/episodes/TeilXX.tsx` — eine Datei pro Folge, nutzt nur Komponenten; Registrierung in `src/episodes/index.ts`
- `src/Root.tsx` — eine Composition pro Folge, generiert aus `episodes.ts`

Musik liegt unter der Stimme bei −18 dB, Knistern läuft durchgehend leise mit.
