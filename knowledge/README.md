# knowledge · Wissensbasis für alle Agenten

> Hier liegt Pauls Wissen, damit Claude, Claude Code, ChatGPT, Higgsfield und jeder andere Agent darauf zugreifen kann. Dieser Ordner wird nicht auf der Website ausgeliefert (`dist/` ist das Deployment), das Repo selbst ist aber **öffentlich**.

## Prinzip: ein Fach pro Projekt

`knowledge/` ist das Regal, jedes Projekt bekommt ein eigenes Fach: `knowledge/pure/`, später z. B. `knowledge/cyclemax/` oder `knowledge/alf/`. Ein Agent liest nur das Fach des Projekts, an dem er arbeitet. Ein neues Projekt bekommt ein neues Fach mit eigener `README.md`, nichts wird in ein fremdes Fach gelegt.

## Inhalt

| Ordner | Inhalt |
|---|---|
| [pure/](pure/README.md) | PURE · system for man: Säulen, Module, Buchtexte, Belege, Produkte |
| [pure/ALL.md](pure/ALL.md) | Alles zu PURE in einer einzigen Datei, für Agenten, die nur eine URL lesen können |

## So greifst du zu

- **Claude Code:** Repo klonen, dann `knowledge/pure/README.md` lesen. `CLAUDE.md` im Repo-Root verweist hierher.
- **ChatGPT mit GitHub-Verbindung:** Repo `purmethod/brinkmannpaul` verbinden, Einstieg `knowledge/pure/README.md`.
- **Jeder Agent per URL (ohne Login):**
  - Alles in einer Datei: `https://raw.githubusercontent.com/purmethod/brinkmannpaul/main/knowledge/pure/ALL.md`
  - Einzeldatei: `https://raw.githubusercontent.com/purmethod/brinkmannpaul/main/knowledge/pure/<pfad>`
  - Übersicht im Browser: `https://github.com/purmethod/brinkmannpaul/tree/main/knowledge/pure`

## Regeln für jeden Agenten

1. **Erst lesen:** [pure/00-system/sprache-und-stil.md](pure/00-system/sprache-und-stil.md) und [pure/00-system/marke.md](pure/00-system/marke.md).
2. **Pauls Worte tragen.** Glätten ja, ersetzen nein. Nie eine ausführlichere Fassung durch eine kürzere ersetzen.
3. **Nichts erfinden.** Was in [status.md](pure/00-system/status.md) als offen steht, füllt nur Paul.
4. **Neue Erkenntnis von Paul:** in die passende Moduldatei unter „Kernaussagen (Paul)“ einsortieren, Status in `status.md` nachziehen, danach `python3 scripts/build_knowledge_bundle.py` laufen lassen, damit `ALL.md` aktuell ist.
5. **Neue Belege:** in die Moduldatei unter „Belege“ und mit voller Referenz in [09-quellen.md](pure/09-quellen.md). PubMed und klinische Journale bevorzugt, Evidenz klar von Erfahrung trennen.
6. **Öffentliches Repo:** keine Diagnosen, Laborwerte, Tagebucheinträge, Namen Dritter, Chats mit realen Personen, Zugangsdaten.
7. **Änderungen an `knowledge/`** berühren die Website nicht und dürfen direkt auf `main` (Commit-Präfix `docs(knowledge):`). Änderungen an `dist/` folgen weiter dem Ablauf in [AGENTS.md](../AGENTS.md).
