# Cyclemax – DECISIONS

Kurzprotokoll aller Entscheidungen, die ohne Rückfrage getroffen wurden.

## Ort & Repo
- Cyclemax lebt im Unterordner `cyclemax/` von `purmethod/brinkmannpaul` (zugewiesener Branch
  `claude/focused-mendel-udfpde`). Die Website `dist/` wird nicht angefasst. Die AGENTS.md-Regeln der
  Website (Vanilla-Stack, Issue-Pflicht) gelten für `dist/`; Cyclemax ist ein eigenständiges Projekt mit
  ausdrücklich vorgegebenem Stack, deshalb keine Issues/kein Agenten-Review vorab – Paul reviewt den PR.
- PURE-Quellen: `purmethod/pur` (öffentlich, `knowledge/*.txt`) und die freigegebenen PURE-Kapitel auf
  brinkmannpaul.com (`dist/index.html`). Übernommen wurde nur, was zu den Cyclemax-Regeln passt
  (siehe `knowledge/README.md`). Bewusst NICHT übernommen: P0 Sexual Control und sexuelle Passagen
  (Regel: keine sexuellen Inhalte), pauschale Aussagen über Frauen aus R2/R3 („Red Flags in Women“,
  „Women do not want to lead“) – Regel: keine Abwertung, keine Aussagen über ihre Denkfähigkeit.

## Engine
- Zykluslänge nur 21–45 Tage (Eingabe und gelernter Wert werden geklemmt). Bei 21 Tagen ist Pink leer
  (Gelb 7 + Grün 7 + Rot 7 = 21); es gibt dann keinen Pink-Push. Spielraum entsteht ausschließlich in Pink.
- Lernen: Mittelwert der letzten bis zu 6 *Intervalle* zwischen Einträgen. Intervalle < 18 oder > 50 Tage
  gelten als vergessener/falscher Eintrag und zählen nicht. Ohne Intervall gilt die übliche Länge (Default 28).
- Ein Eintrag < 14 Tage neben einem bestehenden korrigiert diesen (Doppeltipp, Datum ändern) statt einen
  neuen Zyklus zu starten. Gespeichert werden die letzten 13 Einträge.
- Phasen-Pushes: red7 = erster Rot-Tag (7 Tage vor erwarteter Blutung), red2 = 2 Tage vorher, pink = Tag 8,
  green = erster Grün-Tag. Während Verspätung (Rot bleibt) keine weiteren Phasen-Pushes.
- Tageszeilen werden pro Tag deterministisch (Geräte-ID + Datum) gewählt und in einer lokalen Historie
  gespeichert – Home und Benachrichtigung zeigen dieselbe Zeile. 60-Tage-Sperre in beide Richtungen,
  weil Zukunftstage schon geplant sind. Phasen-Zeilen werden an passenden Tagen 1,5× bevorzugt,
  gut bewertete Zeilen über `weight` (vom Server) öfter gewählt, `weight 0` = deaktiviert.
- Die Planung (`src/engine/notifications.ts`) ist EIN Codepfad für Web und Native: Web schickt die
  Termine an den Server, Native plant sie lokal.
