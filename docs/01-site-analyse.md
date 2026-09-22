# 01 — Site-Analyse brinkmannpaul.com

Stand: 2026-09-22 · Extrahiert von Higgsfield durch direkten Seitenabruf (HTML, CSS, JS, Assets) + Browser-Inspektion + Screenshots.

## 1. Was ist die Seite?

Ein einziger One-Pager (keine Unterseiten, keine Navigation) mit **Intro-Gate** und **drei Akkordeon-Kategorien**:

- **Hero:** `one person. / different fields. / one purpose: build.`
- **architecture & art** → neuroarchitecture (phd research), mysidibou (unesco project), real estate agency (worldwide · $10m+)
- **health** → pure method (health system), kefir (living culture), sourdough (living culture), ritual plant (seed editions), wim hof instructor (1:1 coaching worldwide)
- **mind** → blueprints (digital guides)
- **Footer:** `paul brink`

Zweck: persönliche Visitenkarte + Vertriebs-Sammelpunkt; alle Bestell-/Anfrage-Canäle laufen über `mailto:orders@brinkmannpaul.com` mit vorbefülltem Betreff.

## 2. Technik (vollständig dekonstruiert)

Quelle: `dist/` des GitHub-Repos purmethod/brinkmannpaul (per Live-Abgleich am 2026-09-22 verifiziert:
index.html, styles.css, app.js **byte-identisch** mit brinkmannpaul.com; genutztes Intro-Asset ebenfalls identisch).

| Datei | Größe | Inhalt |
|---|---|---|
| `index.html` | 9.1 KB | komplette Seite, semantisches HTML, `<details>`-Akkordeons, Inline-SVG-Favicon, `noscript`-Fallback |
| `styles.css` | 7.4 KB | Design-System, Fluid-Typo (`clamp()`), Mobile-Breakpoint 680px, `prefers-reduced-motion` |
| `app.js` | 3.0 KB | Intro-Gate-Logik + Akkordeon-„nur eins offen"-Logik + IntersectionObserver |
| `assets/intro-handwriting-split.mp4` | 139 KB | 9,62 s, 900×1100 (9:11), h264, **60 fps** — Handschrift-Reveal |
| `assets/intro-handwriting-split-complete.png` | 83 KB | 900×1100, finaler Frame der Signatur (Fallback/Endbild) |

**Stack:** statisch, null Abhängigkeiten, kein Build. Hosting: ChatGPT-Hosting (OpenAI), konfiguriert via
`.openai/hosting.json` im Repo (static directory: `dist`).

**Intro-Produktionskette:** `dist/assets/intro-handwriting-split.mp4` wird NICHT generiert, sondern aus Pauls
echter Handschrift gerendert — `scripts/render_handwriting_photo.py` (SVG-Trace der Tinten-Fotos),
`scripts/render_split_handwriting.py` (Signatur + „TRUST IS MY CURRENCY" als Pen-Reveal),
`scripts/render_handwriting_video.py` (finales Safari-sicheres MP4). `dist/assets/` enthält 15 historische
Intro-Varianten (approved/lettered/optimized/final-photo/v3/v4/smooth/pen.svg), von denen aktuell nur
`intro-handwriting-split.mp4` + `-complete.png` referenziert werden (Legacy, gesamt ~1,7 MB).

## 3. Wie die Seite funktioniert (Verhalten)

1. **Intro-Gate:** `<body class="intro-locked">` sperrt Scrollen; auf weißer Vollfläche läuft die 9,6-Sekunden-Handschrift-Animation (kursiver „Paul"-Signatur-Lockup + „TRUST IS MY CURRENCY").
2. **Reveal-Fallbacks (4fach abgesichert):** Video-`ended` → Endbild; Video-`error` → Endbild; `loadedmetadata` → Timer = Dauer + 350 ms; Safety-Timer 11 s; `play()`-Reject → Endbild.
3. **Enter:** Klick aufs Gate, Scrollen (wheel), Touch-Bewegung oder Tastatur (↓/Enter/Leertaste/Escape) öffnet die Seite (Overlay blendet über 520 ms aus, Seite fade/translate rein).
4. **Akkordeon:** native `<details>/<summary>`; JS (`toggle`-Events) schließt beim Öffnen alle anderen Kategorien bzw. Projektzeilen derselben Kategorie („nur eine offen").
5. **Scroll-Entrance:** `IntersectionObserver` blendet den Index-Content beim Sichtbarwerden ein.
6. **Responsive:** Media Query ≤ 680 px: Projektzeilen werden zweizeilig, CTAs/Status rutschen unter den Text, Intro-Stage skaliert auf `min(96vw, 74svh)`.

## 4. Design-System (extrahiert)

- **Farben:** Ink `#101010` · Muted `#7b7b75` · Soft-Line `#cfcfca` · Paper `#ffffff`
- **Typo:** System-Stack `Arial, Helvetica, sans-serif`; Intro/Headline eng geschnitten (`letter-spacing: -0.055em`), alles lowercase, Status/Type-Labels 0,75 rem mit `letter-spacing 0.08em`
- **Layout:** obere 2px-Ink-Linie im Header, 1px-Ink-Linien als Kategorie-Trenner, weichere Linien für Projektebene, 1,5rem-Plus-Symbole (CSS-gezeichnet), Raster-Spalten `1fr 9rem 1.5rem` (Name / Typ / Plus)
- **Motion:** Open-Item 220–260 ms Fade+Slide, Gate-Fade 520 ms `cubic-bezier(0.22,1,0.36,1)`, reduziert via `prefers-reduced-motion`

## 5. Stärken

- Extrem leicht (gesamte Seite ~240 KB), keine Ladezeit durch Bibliotheken
- Starkes, einprägsames Branding (Signatur-Intro + „trust is my currency"), perfekt zum Persönlichkeits-Lockup
- Solide Barrierefreiheit-Grundlagen: `aria-labels`, `focus-visible`, Keyboard-Reveal, `noscript`-Fallback, reduced-motion
- Native `<details>` = funktioniert sogar ohne JS (bis auf „nur eins offen")

## 6. Schwächen & Risiken (Details im Backlog: docs/03)

1. **Keine Social/SEO-Meta:** kein Open Graph, kein Twitter Card, kein Canonical, kein JSON-LD → Teilen auf Instagram/Facebook/WhatsApp rendert nur nackte URL-Karte. (Screenshot-Vorschau = leer)
2. **Keine Heading-Semantik:** kein einziges `h1`/`h2` — Suchmaschinen und Screenreader verlieren die Struktur.
3. **Intro-Gate als Absprungrisiko:** 9,6 s Blockade vor dem Inhalt; kein sichtbarer Skip; auf jedem Besuch erneut. Headless-Mobile-Render lieferte eine komplett weiße Fläche → auf echten Geräten verifizieren.
4. **Kontrast `--muted #7b7b75`:** auf Weiß ca. 4,2:1 — knapp unter AA für Fließtext (4,5:1).
5. **Footer `paul brink`** wirkt abgeschnitten (Marke heißt „brinkmann paul"); bricht zudem die vertikale Fluchtlinie des Inhalts.
6. **Interaktions-Lead fehlt:** keine Hover-Zustände auf Zeilen, Plus-Icons konnotieren „weitere Ebene", obwohl die Projektebene bereits maximal aufklappt.
7. **Veralteter CTA-Kanal:** „ritual plant" existiert inzwischen als eigene Website (ritualplantseeds.higgsfield.app), verlinkt aber weiter nur `mailto`. Gleiches gilt für andere Produkte, die eigene Seiten bekommen könnten.
8. **Keine Analytics** (bewusst datensparsam — optionaler Wunsch von Paul nötig), kein 404, keine Favicon-Varianten (apple-touch).

## 7. Verifikations-Ergebnisse

- Browser-Interaktion (Enter, Akkordeon öffnen/schließen, „nur eins offen") auf Desktop: **funktioniert**.
- `node --check app.js`: sauber (keine Syntaxfehler).
- Intro-Video: h264 900×1100 60 fps 9,617 s — finaler Frame entspricht exakt dem `complete.png` (Signatur + „TRUST IS MY CURRENCY", schwarze Tinte auf Weiß).