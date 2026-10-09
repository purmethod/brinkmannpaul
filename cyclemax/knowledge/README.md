# Cyclemax – Wissensbasis

Diese Markdown-Dateien sind die **Startinhalte**. `npm run knowledge` kompiliert sie nach
`shared/knowledge.generated.ts`; der Server seedet daraus die Datenbank, der Client nutzt sie
als Offline-Fallback. Neue Inhalte entstehen danach täglich über den Wissens-Job und landen in der DB
(Status `live` oder `review` → `/admin`).

## Dateien

| Datei | Inhalt | Verwendung |
|---|---|---|
| `pure-method.md` | PURE Method (Paul Brinkmann): Säulen, Kernsätze | System-Prompt des Mentors, Generator |
| `pure-modules.md` | Kuratierte Auszüge aus `purmethod/pur/knowledge` (R1–R5, U0–U5, P4) | System-Prompt, Generator |
| `pure-chapters.md` | Freigegebene PURE-Kapitel von brinkmannpaul.com (Ego, Responsibility …) | System-Prompt, Generator |
| `stoic-quotes.md` | Stoische Zitate frei nach Marc Aurel | System-Prompt, Generator, Zeilen |
| `phases.md` | Hintergrund der 4 Phasen (nicht als App-Text) | System-Prompt |
| `chat-principles.md` | Leitsätze des Mentors | System-Prompt |
| `daily-lines.md` | Tägliche 1–2-Zeiler mit Kategorie | Tägliche Nachricht, Offline-Chat |

## Format `daily-lines.md`

`- [kategorie] Text` – Kategorien: `any`, `yellow`, `pink`, `green`, `red`, `single`.
Maximal zwei Sätze, keine Faktenbehauptungen, keine Emojis.

## Quellen & Auswahl

- PURE-Inhalte: Prompt von Paul (Cyclemax-Auftrag), `github.com/purmethod/pur` (`knowledge/*.txt`),
  freigegebene Kapiteltexte auf brinkmannpaul.com.
- Nicht übernommen: P0 Sexual Control und sexuelle Passagen aus U1/U3 (Cyclemax: keine sexuellen
  Inhalte); pauschale Aussagen über Frauen aus R2/R3 (Cyclemax: keine Abwertung, keine Aussagen über
  ihre Denkfähigkeit); Ernährungs-/Kälte-/Atemprotokolle mit Zahlen (keine medizinischen Aussagen).
