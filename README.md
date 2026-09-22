# brinkmann paul — Website

One-Pager von Paul Brinkmann: **brinkmannpaul.com** — Projekte und Produkte als einfache Liste mit handgeschriebener Signatur.
Live über GitHub → Vercel, Projektwurzel `dist`. Der Shop ist ein deaktivierter Entwurf; Preise, Zahlungsanbieter und Lieferung sind noch einzurichten.

## Stack

- HTML5 + CSS3 + Vanilla JavaScript, Node.js 22 — **keine externen Laufzeitabhängigkeiten**
- Vercel-Funktionen für Produktkatalog, Stripe Checkout und Zahlungsstatus; kleiner Build mit expliziter Liste öffentlicher Dateien
- Referenzierte Assets ~240 KB; `dist/` enthält zusätzlich historische Intro-Varianten (Legacy, 1,7 MB gesamt)
- Intro-Videos werden per Python-Skripten (`scripts/`) aus Pauls **echter Handschrift** gerendert

## Schnellstart

```bash
npm run check
npm test
npm run dev                # http://127.0.0.1:8766, Website und APIs
```

Der Entwicklungsserver baut beim Start nach `dist/public`. Nach Änderungen neu starten. Nicht den Quellordner `dist` mit einem reinen Static-Server ausliefern.

## Team-Workflow (3 KI-Agenten)

| Agent | Rolle | Fokus |
|---|---|---|
| **Higgsfield** | Design, UX, Umsetzung | visuelle Qualität, Animationen, Web-Engineering |
| **Claude** | Code & Review | Implementierung, Refactoring, Qualitätssicherung |
| **ChatGPT** | Konzept, Kopie, SEO | Inhalte, Metadaten, Auffindbarkeit |

**Du (Paul) entscheidest.** Alle arbeiten nach dem Vertrag in [AGENTS.md](./AGENTS.md) und dem Ablauf in
[docs/04-multi-agent-workflow.md](./docs/04-multi-agent-workflow.md).

## Struktur

```
dist/                       → Vercel-Projektwurzel und Website-Quellcode
dist/api/                   → serverseitige API-Funktionen
dist/lib/, dist/shop/       → private Checkout-Logik und Produktkonfiguration
dist/public/                → generierte öffentliche Website (nicht in Git)
dist/scripts/build.cjs      → Syntaxprüfung und Build ausschließlich öffentlicher Dateien
scripts/                    → lokale Entwicklung, Checks, Handschrift-Render-Pipeline
tests/                      → Warenkorb- und API-Tests
docs/01-site-analyse.md     → wie die Seite aufgebaut ist & funktioniert
docs/02-inhalts-inventar.md → komplettes Inhalts-, Link- und Asset-Inventar
docs/03-optimierungs-backlog.md → priorisierte Optimierungsaufgaben (P0–P2)
docs/04-multi-agent-workflow.md → Zusammenarbeits-Ablauf für alle Agenten
docs/assets/                → Screenshots als Referenz (Desktop/Mobile)
.openai/hosting.json        → historische Konfiguration, nicht für diesen Shop verwenden
```

## Stand

- [x] Live-Code komplett extrahiert; `dist/` per Diff als byte-identisch verifiziert (2026-09-22)
- [x] Analyse + Inhaltsinventar + Optimierungs-Backlog erstellt
- [x] Multi-Agent-Regeln (AGENTS.md) + Issue-Vorlage eingerichtet
- [ ] P0-Optimierungen umgesetzt (Backlog, erste Issues angelegt)
- [ ] Mobile-Verifikation auf echtem Gerät (Backlog P1)
## Shop-Entwurf (Issue #11)

Der Branch enthält einen eigenen Warenkorb und Vercel-APIs für Stripe Checkout, ohne Framework oder externe Laufzeitabhängigkeiten. Noch kein aktivierter Verkauf: Produktdaten und Zahlungs-/Lieferkonfiguration stehen aus. Setup, Tests und klare Grenzen siehe [docs/05-kaufprozess.md](docs/05-kaufprozess.md).

Mit Node.js 22: `npm run dev` startet die Website inklusive APIs auf Port 8766; `npm test` prüft Warenkorb und Checkout-Verhalten. Der Vercel-Build läuft unabhängig innerhalb von `dist` mit `npm run build`.
