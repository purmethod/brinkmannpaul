# AGENTS.md — Projektvertrag für alle KI-Agenten

> Lese diese Datei **vollständig**, bevor du irgendetwas im Repo änderst.
> Gilt für jeden Agenten: Higgsfield, Claude (Code), ChatGPT (Codex) — und für menschliche Mitarbeit.

## 1. Projekt in einem Satz

brinkmannpaul.com ist der minimalistische One-Pager eines Architekten/Künstlers — eine
handgeschriebene Signatur-Intro („TRUST IS MY CURRENCY") und drei Akkordeon-Kategorien
(architecture & art, health, mind) mit neun Projekten/Produkten, alle CTAs als `mailto:` an
orders@brinkmannpaul.com.

## 2. So arbeitet das Team

1. **Jede Änderung startet mit einem GitHub Issue** (Backlog-Vorlage). Kein Issue → kein Branch → kein Code.
2. Branch pro Issue: `<agent>/<issue-nr>-<slug>` (z. B. `claude/42-fix-contrast`).
3. Pull Request mit Verweis auf das Issue; **mindestens ein anderer Agent reviewed** (Kommentar im PR).
   Der Mensch entscheidet bei Konflikten zwischen Agenten.
4. Labels: `p0`, `p1`, `p2`, `copy`, `design`, `code`, `seo`, `bug`, `test`, `blocked`.
5. Stand immer im Backlog ([docs/03-optimierungs-backlog.md](./docs/03-optimierungs-backlog.md)) spiegeln.

## 3. Repo-Layout

- `dist/` — der produktive, **deployed Code** (index.html, styles.css, app.js, assets/). Wird laut
  `.openai/hosting.json` statisch ausgeliefert — dieser Stand entspricht 1:1 dem Live-System. Hier wird gearbeitet.
- `scripts/` — Python-Tooling, das Pauls **echte Handschrift-Fotos** in die Intro-Videos rendert
  (Trace + Pen-Reveal, siehe Skript-Header). Nur für Intro-Änderungen relevant.
- `docs/` — Analyse, Inventar, Backlog, Workflow. Änderungen an Inhalten dokumentieren.
- `.openai/hosting.json` — Deployment-Konfiguration des ChatGPT-Hostings. **Nicht löschen.**

## 4. Brand & Design-System (nicht verhandelbar)

- **Tonalität:** konsequent kleingeschrieben (lowercase), englische Kurztexte, ruhig, hochwertig, „weniger ist mehr".
- **Farben:** `--ink: #101010`, `--muted: #7b7b75`, `--soft-line: #cfcfca`, `--paper: #ffffff`.
- **Typografie:** System-Stack (Arial/Helvetica) — keine Webfonts ohne ausdrücklichen Issue-Entscheid.
- **Layout-Gesetze:** horizontale Ink-Linien als Trenner, viel Weißraum, `clamp()`-Fluid-Typo,
  Header mit 2px oberer Linie, alles im Raster rechtsbündig ausgerichtet.
- **Signatur-Intro:** die Handschrift-Animation (`asset/intro-handwriting-split.mp4`) ist das Markenzeichen.
  Sie kürzen/ändern nur mit ausdrücklicher Freigabe von Paul.

## 5. Code-Regeln

- **Keine neuen Abhängigkeiten / Frameworks** ohne Issue-Entscheid. Der Vanilla-Stack ist ein Feature.
- **Verifikation vor jedem Push:** `node --check app.js` + Smoke-Test im Browser (mind. Desktop + Mobile-Breite).
  Das Repo muss **frei von Plattform-Workspace-Abhängigkeiten** sein — überall lauffähig.
- Keine Secrets, keine Zugangsdaten im Repo.
- Assets klein halten (< 300 KB pro Datei ist die Daumenregel); Video-Codecs wie bisher (h264).
- `prefers-reduced-motion` und die `noscript`-Fallbacks **nie entfernen**.
- Intro-Verhalten (Gate → Reveal auf Klick/Scroll/Taste, komplette Fallbacks) nicht brechen — nur verbessern.
- **Intro-Videos entstehen aus Pauls Handschrift-Fotos** über `scripts/` (Trace → Pen-Reveal → MP4). Eine Intro-Änderung
  heißt: Skript anpassen, rendern, Ergebnis nach `dist/assets/` legen — niemals ein Video „freihändig" erzeugen.
- Barrierefreiheit: Kontraste mind. AA, fokussierbare Elemente mit sichtbarem Focus, korrekte Semantik (`h1`/`h2`, `aria`).

## 6. Content-Regeln

- **Nichts erfinden.** Projekte, Status, Zahlen und Links nur aus [docs/02-inhalts-inventar.md](./docs/02-inhalts-inventar.md)
  oder aus Aussagen von Paul übernehmen.
- Neue Produkte/Projekte erst als Issue-Konzept, dann Text, dann Code.
- CTA-Schema ist `mailto:orders@brinkmannpaul.com?subject=...` — neue Ziele (z. B. eigene Produktseiten) nur mit Freigabe.

## 7. Definition of Done

- [ ] Issue verlinkt, Branch-Konvention eingehalten
- [ ] `node --check app.js` grün, Smoke-Test ok (Desktop + Mobile)
- [ ] Design-Regeln aus §4 eingehalten, kein Abhängigkeits-Zuwachs
- [ ] Ein anderer Agent hat reviewt, Mensch informiert
- [ ] Backlog-Datei aktualisiert (Status)

## 8. Commit-Konventionen

- Conventional Commits: `feat:` `fix:` `docs:` `style:` `perf:` `refactor:` — kurz und präzise.
- Ein Commit = eine logische Änderung. Keine Chat-Protokolle in Commit-Messages.