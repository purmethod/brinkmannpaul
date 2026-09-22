# brinkmann paul — Website

One-Pager von Paul Brinkmann: **brinkmannpaul.com** — Projekte & Produkte aus Architektur & Art, Health und Mind.
Live über ChatGPT-Hosting (OpenAI, konfiguriert in `.openai/hosting.json`, static directory: `dist/`).

## Stack

- Pure HTML5 + CSS3 + Vanilla JavaScript — **null Abhängigkeiten, kein Build-System**
- Referenzierte Assets ~240 KB; `dist/` enthält zusätzlich historische Intro-Varianten (Legacy, 1,7 MB gesamt)
- Intro-Videos werden per Python-Skripten (`scripts/`) aus Pauls **echter Handschrift** gerendert

## Schnellstart

```bash
cd dist
python3 -m http.server 8000   # oder jeder andere Static-Server
# Verifikation vor jedem Push:
node --check dist/app.js
```

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
dist/                       → deployed Live-Code (index.html, styles.css, app.js, assets/)
scripts/                    → Render-Pipeline für die Handschrift-Intro-Videos (Python)
docs/01-site-analyse.md     → wie die Seite aufgebaut ist & funktioniert
docs/02-inhalts-inventar.md → komplettes Inhalts-, Link- und Asset-Inventar
docs/03-optimierungs-backlog.md → priorisierte Optimierungsaufgaben (P0–P2)
docs/04-multi-agent-workflow.md → Zusammenarbeits-Ablauf für alle Agenten
docs/assets/                → Screenshots als Referenz (Desktop/Mobile)
.openai/hosting.json        → ChatGPT-Hosting-Konfiguration (static: dist)
```

## Stand

- [x] Live-Code komplett extrahiert; `dist/` per Diff als byte-identisch verifiziert (2026-09-22)
- [x] Analyse + Inhaltsinventar + Optimierungs-Backlog erstellt
- [x] Multi-Agent-Regeln (AGENTS.md) + Issue-Vorlage eingerichtet
- [ ] P0-Optimierungen umgesetzt (Backlog, erste Issues angelegt)
- [ ] Mobile-Verifikation auf echtem Gerät (Backlog P1)
## Shop-Entwurf (Issue #11)

Der Branch enthält einen eigenen Warenkorb und Vercel-APIs für Stripe Checkout, ohne Framework oder externe Laufzeitabhängigkeiten. Noch kein aktivierter Verkauf: Produktdaten und Zahlungs-/Lieferkonfiguration stehen aus. Setup, Tests und klare Grenzen siehe [docs/05-kaufprozess.md](docs/05-kaufprozess.md).

Mit Node.js 22: `npm run dev` startet die Website inklusive APIs auf Port 8766; `npm test` prüft Warenkorb und Checkout-Verhalten. Der reine Static-Server aus dem ursprünglichen Schnellstart stellt die neuen APIs nicht bereit.
