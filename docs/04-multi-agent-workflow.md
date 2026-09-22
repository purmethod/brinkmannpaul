# 04 — Multi-Agent-Workflow (Higgsfield · Claude · ChatGPT)

So arbeiten drei KI-Agenten KI + ein Mensch (Paul) gleichzeitig an *einem* GitHub-Repo, ohne sich zu überfahren.

## Grundprinzip

**Ein Repo, ein Stand der Wahrheit; Änderungen laufen immer über Issues → Branches → PRs.**
Kein Agent schreibt direkt auf `main`. Der Mensch merged (oder gibt Freigabe), Konflikte entscheidet Paul.

## Rollen (Default-Zuordnung — jeder kann alles, aber das ist die Weichenstellung)

| Agent | Heimatsystem | Standard-Jobs |
|---|---|---|
| **Higgsfield** | diese Umgebung (Higgsfield) | Design-Review, Bild/Motion-Generierung (z. B. neue OG-Images, Intro-Varianten), Web-Engineering, Deployment |
| **Claude** | Claude Code (oder ChatGPT-Projekt mit Repo-Anbindung) | Implementierung, Refactoring, Testing, Code-Review |
| **ChatGPT** | ChatGPT (Projekte/Code interpreter, Repo-Zugriff) | Konzept, Copy, SEO-Metadaten, Datenschutz-Recherche, Backlog-Pflege |
| **Paul** | — | Prioritäten, inhaltliche Entscheidungen, finale Freigabe, Tests auf echten Geräten |

## Ablauf einer Aufgabe (Standard)

1. **Issue anlegen** (Vorlage: `.github/ISSUE_TEMPLATE.md`) mit: Ziel, Warum, Akzeptanzkriterien, Label (`p0–p2`, `design`/`code`/`copy`/`seo`/`bug`/`test`).
2. **Agent übernimmt** (Issue-Kommentar „übernehme") und legt Branch an: `<agent>/<issue-nr>-<slug>`.
3. **Umsetzung** auf dem Branch; Verifikation laut AGENTS.md §7 (node --check, Smoke-Test Desktop+Mobile).
4. **PR öffnen** → Issue verlinken → **mindestens ein anderer Agent reviewt** (Kommentar im PR).
   Review-Fokus: Design-Regeln (AGENTS.md §4), keine erfundenen Inhalte (§6), DoD (§7).
5. **Paul** gibt grün → Merge auf `main` → (falls Deployment gewünscht) Hosting aktualisieren.
6. **Backlog-Datei** (docs/03) im selben PR aktualisieren (Status ⏳→✅).

## Kommunikationsregeln

- **Alles dokumentiert, nichts per Chat-Vereinbarung:** Entscheidungen, die im Chat fallen, landen als
  kurzer Eintrag im jeweiligen Issue oder in diesem Dokument.
- **Ein Agent = eine Baustelle:** gleichzeitige PRs dürfen keine gleichen Dateien anfassen; wer eine Datei
  in Arbeit hat, markiert das im Issue („hält styles.css").
- **Höflichkeit & Klarheit:** Antworten kurz, auf Deutsch, Referenzen auf Datei+Zeile.

## Einrichtung für die beteiligten KI-Systeme

- **Claude Code:** Repo klonen, `AGENTS.md` wird automatisch gelesen. `claude` als Agent-Name verwenden.
- **ChatGPT:** Projekt mit dem GitHub-Repo verknüpfen (oder Code-Interpreter mit Klon); AGENTS.md als Projekt-Kontext.
- **Higgsfield:** dieses Repo als Arbeitskopie; siehe README.
- Für alle gilt: **vor dem ersten Commit** die AGENTS.md einmal komplett lesen.

## Regeln für Paul (Checks vor Freigabe)

- PR-Diff ansehen, Screenshots/Verifikationsangabe im PR prüfen (Agenten fügen bei Design-Änderungen einen Screenshot bei).
- Bei mobile/visual-Änderungen: kurz auf dem echten Handy testen.
- Nur Dinge freigeben, die den Markenkern (Signatur-Intro, ruhiger Minimalismus, lowercase) nicht brechen.

## Ausblick

- Optional später: CI-Workflow (GitHub Actions) mit `node --check` + Link-Check bei jedem PR — als eigener
  Issue-Vorschlag P2, vorher kein Merge-Gate, das Agenten ausbremst.