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

## Backend
- EIN Vercel-Projekt (Root `cyclemax/`): statischer Export `out/` + Vercel Function `api/index.ts`, die nur
  `server/app.ts` re-exportiert. Backend-Code liegt in `/server`, das Frontend ruft es trotzdem immer absolut
  über `NEXT_PUBLIC_API_BASE` auf (nötig für Capacitor). Ein Projekt = eine Domain, keine CORS-Hürden im Web,
  ein Deploy. Alle `/api/*`-Pfade laufen per Rewrite in eine Function (Hobby-Limit für Functions).
- Handler im Web-Standard (`Request → Response`), lokal identisch über `server/dev.ts`.
- DB: Drizzle mit zwei spiegelgleichen Schemas (Postgres/Neon und SQLite/libsql), Tabellen werden beim
  Kaltstart idempotent angelegt (`server/db/ddl.ts`) und mit `/knowledge` geseedet – kein Migrations-Tool
  zur Laufzeit. Ohne `DATABASE_URL` lokal `.data/cyclemax.db`, auf Vercel `/tmp` (nicht persistent!).
- IDs sind UUID-Texte (keine Autoincrement-Unterschiede zwischen den Dialekten), Zeitstempel in ms.
- Meldungen („Antwort melden“) werden OHNE Geräte-ID gespeichert (anonym). Sie enthalten den Antworttext,
  damit /admin ihn prüfen kann – nur auf ausdrückliche Aktion des Nutzers. Seine eigene Frage wird nicht gesendet.
- Chat: max. 40 Anfragen/Gerät/Tag (Kostenschutz), danach Antwort aus der Wissensbasis.
  Bei Gewalt/Selbstgefährdung hängt der Server die Hilfsnummern IMMER an (unabhängig vom Modell).
- Claude: Modell per `CLAUDE_MODEL` (Default `claude-sonnet-5-5`), `effort: low` für schnelle, kurze Antworten,
  Wissensbasis als gecachter System-Prompt-Prefix. Anthropic-Server-Fallbacks bei Ablehnung sind für
  Sonnet 5.5 / Opus 5.x / Fable 5.1 aktiv (`CLAUDE_FALLBACKS=off` schaltet ab); lehnt alles ab → Wissensbasis.
- Web-Push-Cron stündlich (Vorgabe). Fällig = innerhalb ±30 min (`PUSH_LEAD_MINUTES`), d. h. 07:30 kommt um
  07:00 oder 08:00 Uhr – je nach Cron-Lauf. Mit Vercel Pro kann der Cron auf `*/15` gestellt werden (dann
  `PUSH_LEAD_MINUTES=8`). Verpasste Pushes > 3 h werden verworfen statt verspätet gesendet.
  Achtung: Vercel Hobby erlaubt Crons nur täglich → für stündliche Pushes ist Vercel Pro nötig.
- Web-Push-Nachweis lokal: `server/webpush.test.ts` sendet mit echtem VAPID + aes128gcm an einen lokalen
  HTTPS-Push-Dienst, prüft die VAPID-Signatur und entschlüsselt den Payload wie ein Browser.

## Phase 2 – Pauls Feedback (09.10.)
- Pauls neue Vorgaben überschreiben den ursprünglichen Auftrag, wo sie sich widersprechen: Fels-Logo raus,
  ein schwarzer Kreis ist App-Icon und Logo. „Leiser“ heißt jetzt „ruhiger“: „Wenn sie lauter wird, wirst du
  ruhiger. Ruhiger heißt nicht kleiner.“ Phasenwörter: Gelb „Wärme“, Pink „Initiative“, Grün „Nähe“, Rot „Standfest“.
- Neue Screens erlaubt (Profil). Intimität ist als Beziehungsthema im Profil/Coaching erlaubt (Paul: „ob im Bett
  Probleme sind“) – sachlich, ohne explizite Inhalte, ohne Sex-Taktiken, ohne Tracking.
- Ziel jeder Beratung: eine Beziehung, in der gegenseitige Liebe ist. Single-Modus begleitet auch lockeres Dating
  respektvoll, richtet aber auf dieses Ziel aus. Kernkompetenz Paul: Balance aus Nähe und Abstand.
