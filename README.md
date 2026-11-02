# brinkmann paul — Website

One-Pager von Paul Brinkmann: **brinkmannpaul.com** — Projekte & Produkte aus Architektur & Art, Health und Mind.
Live über **Vercel** (Projekt `brinkmannpaul`, Root Directory `dist/`). Jeder Push auf `main` geht automatisch live.

## So arbeiten Claude und ChatGPT zusammen

Ein Repo, ein Hosting, eine Wissensbasis. Beide Agenten arbeiten an genau derselben Sache:

1. **Code und Texte der Website:** dieses Repo, Ordner `dist/`. Beide pushen hierher.
2. **Live:** Vercel deployt automatisch aus `main`. Kein Agent deployt woanders hin.
3. **Wissen:** `knowledge/`. Beide lesen von dort und sortieren neue Erkenntnisse dort ein.
4. **Regeln:** [AGENTS.md](./AGENTS.md) gilt für beide. Claude Code liest sie über `CLAUDE.md`, ChatGPT über `AGENTS.md`.

`/pure` und `/pact` liegen auf purmethod.com und werden über Rewrites in `dist/vercel.json` unter brinkmannpaul.com angezeigt.

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
dist/vercel.json            → Vercel-Konfiguration (Rewrites für /pure und /pact auf purmethod.com)
.openai/hosting.json        → veraltet: frühere ChatGPT-Hosting-Konfiguration, wird nicht mehr genutzt
knowledge/                  → Pauls Wissensbasis für alle Agenten (PURE), Einstieg knowledge/README.md
```

## Stand

- [x] Live-Code komplett extrahiert; `dist/` per Diff als byte-identisch verifiziert (2026-09-22)
- [x] Analyse + Inhaltsinventar + Optimierungs-Backlog erstellt
- [x] Multi-Agent-Regeln (AGENTS.md) + Issue-Vorlage eingerichtet
- [ ] P0-Optimierungen umgesetzt (Backlog, erste Issues angelegt)
- [ ] Mobile-Verifikation auf echtem Gerät (Backlog P1)