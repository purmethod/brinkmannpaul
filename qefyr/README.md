# qefyr.com

Lebender Kefir mit echten Kefirknollen in Bio-Alpenmilch aus Berchtesgaden. Trinkfertig, zuhause weiterzüchten.
Shop auf Deutsch und Englisch mit eingebettetem Stripe-Checkout, gehostet auf Vercel.

**Zum Livegang: [LAUNCH.md](./LAUNCH.md).**

## Stack

- Statisches HTML/CSS/JS, erzeugt von einem kleinen Node-Build ohne Abhängigkeiten (`scripts/build.mjs` → `public/`).
- Drei Vercel-Funktionen in `api/` (CommonJS, ohne Stripe-SDK, Stripe-API-Version fest auf `2024-06-20`).
- Eine selbst gehostete Schrift (Fraunces, OFL), keine Google-Server, keine Cookies, kein Tracking.
- Illustrationen werden im Code gezeichnet (`src/art.mjs`), keine KI-Bilder.

## Struktur

```
shop.json            Produkt, Preis, Versandzonen, Länder, Lieferzeiten: die einzige Stelle dafür
site.json            Marke, Kontakt, Pflichtangaben (Impressum). Leere Felder = Launch-Blocker
routes.json          URLs je Sprache (/order ↔ /de/bestellen …)
src/i18n/en.mjs      alle englischen Texte
src/i18n/de.mjs      alle deutschen Texte
src/legal.mjs        Impressum, Datenschutz, AGB, Widerruf (DE verbindlich, EN Übersetzung)
src/pages.mjs        Seitenaufbau
src/layout.mjs       Kopf, Menü, Footer, Meta-Tags
src/art.mjs          Glas, Kefirknollen, Bergkamm, Icons, Favicon
static/              styles.css, app.js, Schriften, Bilder (wird 1:1 nach public/ kopiert)
api/checkout.js      POST: erstellt die Stripe Checkout Session (Preise nur serverseitig aus shop.json)
api/session-status.js GET: Status für die Danke-Seite
api/health.js        GET: ist der Shop bereit? Zeigt Modus und Erreichbarkeit, nie Schlüssel
scripts/build.mjs    Build
scripts/dev.mjs      lokaler Server wie Vercel (Clean URLs, 404, /api)
scripts/check.mjs    Prüfung vor jedem Push: Syntax, Links, Größen, Textregeln, Launch-Blocker
tests/api.test.mjs   API-Tests (node:test), optional gegen stripe-mock
tools/               nur lokal: Browser-Tests (Playwright + axe), Bild-Rendering, Screenshots
docs/                Quellen, Shot-Liste
```

## Lokal

```bash
node scripts/build.mjs && node scripts/dev.mjs     # http://localhost:3000
node scripts/check.mjs                              # vor jedem Push
node --test tests/api.test.mjs                      # API-Tests
cd tools && npm ci && npm run e2e                   # Browser-Tests (alle Seiten, Checkout, Barrierefreiheit, Handys)
```

Für einen echten Testkauf lokal: `.env.local` mit `STRIPE_SECRET_KEY=sk_test_…` und `STRIPE_PUBLISHABLE_KEY=pk_test_…`
anlegen (wird nie committet), dann `node scripts/dev.mjs`.

Gegen Stripes echtes Schema testen (ohne Schlüssel): `stripe-mock` v0.187.0 (Spezifikation von 2024-06-20) starten,
dann `STRIPE_MOCK_URL=http://localhost:12111 node --test tests/api.test.mjs`.

## Häufige Änderungen

| Was | Wo |
|---|---|
| Preis | `shop.json → product.amount` (Cent) |
| Versandpreise, Länder, Lieferzeiten | `shop.json → shipping` |
| Texte | `src/i18n/en.mjs`, `src/i18n/de.mjs` |
| Impressum-Daten | `site.json → legal` |
| Bilder neu rendern (Share-Bild, Stripe-Produktbild, Icons) | `cd tools && npm run images` |

## Regeln

- Keine Gesundheitsversprechen (VO 1924/2006). `scripts/check.mjs` bricht bei „probiotisch“, „Immunsystem“ usw. ab.
- Nichts erfinden: Fakten nur von Paul oder aus [docs/sources.md](./docs/sources.md). Keine erfundenen Bewertungen.
- Die Marke schreibt sich immer `qefyr`.
- Jede Datei unter 300 KB. Keine Laufzeit-Abhängigkeiten.
- `prefers-reduced-motion`, Fallbacks ohne JavaScript und Fokus-Stile nie entfernen.
