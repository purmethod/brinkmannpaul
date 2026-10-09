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
  ruhiger. Ruhiger heißt nicht kleiner.“ Phasenwörter: Gelb „Wärme“, Pink „Führen“, Grün „Nähe“, Rot „Standfest“.
- Neue Screens erlaubt (Profil). Intimität ist als Beziehungsthema im Profil/Coaching erlaubt (Paul: „ob im Bett
  Probleme sind“) – sachlich, ohne explizite Inhalte, ohne Sex-Taktiken, ohne Tracking.
- Ziel jeder Beratung: eine Beziehung, in der gegenseitige Liebe ist. Single-Modus begleitet auch lockeres Dating
  respektvoll, richtet aber auf dieses Ziel aus. Kernkompetenz Paul: Balance aus Nähe und Abstand.
- Startseite = nur der Ring + CYCLEMAX (Paul). Tipp → Menü `/heute/` (bzw. Onboarding). Für eingerichtete Nutzer im
  Beziehungsmodus trägt der Ring die Farbe der aktuellen Phase – Information ohne ein Wort; sonst schwarz.
- Null Mehraufwand: Zykluslänge wird nicht abgefragt (lernt sich). Blutungs-Eintrag ist ein Tap; groß nur, wenn fällig
  (Rot/unbekannt), sonst eine schlanke Zeile. Vergessen? 3 und 10 Tage nach dem erwarteten Tag ein sanfter Hinweis
  (App + 1 Push), sonst bleibt Rot.
- Vorschau 1–2 Tage vor jedem Phasenwechsel auf dem Heute-Screen („Hey Man, morgen beginnt Standfest …“).
- Profil wird zu EINEM Schritt pro Tag auf dem Heute-Screen (abhakbar). Alle zwei Wochen sonntags ersetzt ein
  Check-in-Push („Wie läuft's mit ihr? Erzähl's mir in einer Minute.“) die Tageszeile → führt ins Profil.
- Chat: Ein-Tap-Fragen für den leeren Chat; „Sag: …“-Sätze als kopierbarer Block (direkt in WhatsApp).
- Spracheingabe: Web Speech API (Chrome/Safari) bzw. `@capacitor-community/speech-recognition`; ohne Unterstützung
  Hinweis auf das Diktier-Mikrofon der Tastatur. Es wird kein Audio gespeichert oder gesendet.

## Härtung nach Code-Review (09.10.)
- Löschen im Admin = Tombstone (`status: deleted`), damit Seed-Inhalte nicht beim nächsten Kaltstart zurückkommen und
  der Wissens-Job gelöschte Texte nicht neu erzeugt.
- Bewertungen sind anonym und damit fälschbar: max. 5 automatische Deaktivierungen pro Tag (Rest bleibt live, /admin entscheidet).
- Kostenschutz: atomarer Tageszähler pro Gerät (40) + globales Tageslimit für Claude-Aufrufe (`CLAUDE_DAILY_LIMIT`, 3000).
- Production ohne VAPID-Keys: kein Fallback auf Zufallsschlüssel (würde pro Serverless-Instanz anders sein) → 503 +
  Warnung in `/api/health`. Ebenso Warnungen für fehlende DATABASE_URL, Claude-Key, Admin-Passwort, Cron-Secret.
- Push-Cron: pro Gerät nur die neueste fällige Nachricht; bei vorübergehendem Fehler bleibt alles für den nächsten Lauf.

## Mindset statt Gefälligkeit (Paul, 09.10. morgens)
- Cyclemax zeigt dem Mann nicht, was er tun soll, um ihr zu gefallen („Übernimm den Abwasch“ ist falsch – es liegt nie
  am Abwasch, es liegt an der Einstellung). Cyclemax verändert sein Mindset: Er lebt, als würde er allein leben – im
  positiven Sinn. Eigener Standard, Hülle pflegen, Sauberkeit/Ordnung für sich, führen durch Vorleben, Exempel sein.
- Umgesetzt in: Wissensbasis (`pure-method.md`, `chat-principles.md`, `phases.md`), Mentor-Prompt (MISSION + Stilregel),
  Profil-Prompt (Fokus/Schritte betreffen IHN), Wissens-Job-Regel 8 (Kritiker verwirft Gefälligkeits-Zeilen),
  Haltungssatz Gelb, Text nach dem Eintrag, Tageszeilen (Dienst-Zeilen ersetzt, 6 neue Mindset-Zeilen), Offline-Profil,
  Profil-Fragen („Und du: Wie lebst du gerade?“), Chat-Schnellfrage, Store-Beschreibung.

## Phase 3 – Der Mann führt, keine Aufgabe (Paul, 09.10. vormittags)
- Pauls Auftrag: Die App stellt den Mann in den Vordergrund. Männer führen, sind der Kopf der Beziehung. Er kümmert sich nicht
  zusätzlich um ihre Periode und bekommt keine neue Aufgabe. Er versteht, dass sie hormonell anders gebaut ist; er fragt sie
  (oder sie sagt es ihm), die App übernimmt im Hintergrund, sieht voraus, was kommen kann, und erinnert ihn, der Fels zu sein.
- Umsetzung „führen“: als Führung durch Vorleben, Richtung, Ruhe, Entscheidungen – nie Kontrolle, Druck oder Abwertung.
  Pauls Formulierung „ein anderes Tier“ steht bewusst nicht in der App: App Store Richtlinie 1.1.1 (abwertende Inhalte
  über Gruppen) wäre ein Ablehnungsgrund. In der App heißt es: „Sie tickt anders.“ / „hormonell anders gebaut“.
- „Was kommen kann“ ist jetzt sichtbar (früher: Phasenwissen nur als Hintergrund). Evidenzbasiert und vorsichtig formuliert
  („kann“, „oft“, „viele“): ACOG CPG 7 (2023, bis 90 % mind. ein prämenstruelles Symptom, 20–30 % PMS), Armour 2019
  (Dysmenorrhö ~71 %), Brain Sciences 2023 (Stimmungshoch zur Zyklusmitte), Baker & Driver 2007 (Schlaf in der späten
  Lutealphase), Diver 2003 (Testosteron-Tagesrhythmus beim Mann). Keine Aussagen zu Eisprung als Zeitfenster,
  Fruchtbarkeit, Verhütung. Quellen stehen auf „Verstehen“ und in `knowledge/phases.md`.
- Neuer Screen `/verstehen` statt mehr Text auf Heute: Heute zeigt eine Zeile Prognose, Tipp darauf (oder auf den Ring) öffnet
  Verstehen mit den nächsten Phasen-Terminen (`phaseOutlook`). Heute bleibt ohne Datum.
- Keine Aufforderungen mehr: Nachfrage-Push bei Verspätung (+3/+10 Tage) und Check-in-Push alle zwei Wochen entfernt.
  Es bleiben die vier Phasen-Pushes und die Tageszeile. Der stille Hinweis auf Heute bei Verspätung bleibt.
- Sprache: „Ihre Tage“ statt „Blutung“ (so reden Männer, so redet Paul). Profil heißt „Dein Profil“, Einstieg „Erzähl mir von
  euch“, seine Fragen zuerst.

## iOS / App Store (09.10.)
- `ios/` wird jetzt eingecheckt (vorher ignoriert): reproduzierbarer Build ohne lokales `cap add`, Cloud-Build möglich.
- Bundle ID `com.purmethod.cyclemax` statt `com.cyclemax.app`: Reverse-DNS auf eine Domain, die Paul gehört; noch nichts
  registriert, also kein Wechselaufwand.
- Nur iPhone, nur Hochformat, nur Light Mode, Deutsch: weniger Screenshot-Pflichten (kein iPad), passt zum Design.
- `@capacitor-community/speech-recognition` hat kein Swift Package → unter SPM nicht eingebunden. Lösung: eigenes Swift-Plugin
  mit gleichem jsName und gleichen Events (`SpeechRecognitionPlugin.swift`, registriert in `MainViewController`), keine
  Änderung am JS. Android nutzt weiter das Community-Plugin.
- Cloud-Signierung per App Store Connect API-Key (Rolle Admin) auf `macos-26` (Xcode 26, Pflicht seit 28.04.2026).
  Build-Nummer = Workflow-Laufnummer. Jeder Push kompiliert unsigniert – Swift-Fehler fallen vor dem Upload auf.
- Store-Auftritt auf den Mann ausgerichtet: „Cyclemax – Sei der Fels“ / „Für Männer, die führen“ statt „Ihr Zyklus /
  Versteh deine Partnerin“. Altersfreigabe 16+ empfohlen (Intimitätsthemen, KI-Chat), Kategorie nur Lifestyle.
- Impressum: Name und E-Mail eingetragen (Paul Brinkmann, orders@brinkmannpaul.com – beides öffentlich auf brinkmannpaul.com);
  die Anschrift bleibt Platzhalter (nichts erfinden).

## Vercel Hobby (09.10.)
- Pauls Vercel-Konto ist Hobby → Crons nur täglich, sonst bricht das Deployment ab. `vercel.json`: Push-Cron `0 6 * * *`
  (UTC) mit `PUSH_LEAD_MINUTES=60`, Wissens-Job `0 3 * * *`. Für mehrere Pushes am Tag: Pro (stündlich) oder externer Cron.
- Test-Deployment als eigenes Vercel-Projekt `cyclemax` (Root Directory `cyclemax`), ohne Git-Verknüpfung: sonst würde
  jeder Push auf irgendeinen Branch von `brinkmannpaul` einen Cyclemax-Build mit rotem Check auslösen (Branches ohne Ordner).
