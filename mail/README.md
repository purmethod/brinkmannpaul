# zero — ruhige Mail, Gmail darunter, Claude räumt auf

Eine eigene Mail-App: Gmail bleibt im Hintergrund (Konto, Spam-Erkennung, Kategorien,
Suche), Claude liest jede neue Mail, hält die Inbox auf Null und schreibt Antwortentwürfe in
deiner Stimme. Morgens siehst du nur noch: **Entwurf → senden, ändern oder verwerfen.**

Issue: [purmethod/brinkmannpaul#42](https://github.com/purmethod/brinkmannpaul/issues/42). Eigenständiges Modul, berührt `dist/` (die Website) nicht.

## So läuft es

```
alle 30 min (und auf „clean now")
gmail inbox ──► gmail sagt werbung / social? ──► ja ─► zero/noise, archiviert, gelesen   (kein ki-aufruf)
            └─► du hattest das letzte wort?   ──► ja ─► zero/done, archiviert
            └─► claude liest den thread
                  reply ─► entwurf in deiner stimme, zero/ready, bleibt in der inbox
                  fyi   ─► zero/fyi, archiviert, steht im brief
                  noise ─► zero/noise, archiviert, gelesen, abmelden per klick

app: ein entwurf nach dem anderen
  send (5 s rückgängig) · edit · „claude: kürzer / förmlicher / freundlich absagen" · later · discard
```

Die Gmail-Inbox enthält danach nur noch Threads, für die ein Entwurf auf dich wartet.

## Sicherheitsregeln (fest eingebaut)

- **Nie automatisch senden.** Gesendet wird nur, wenn du in der App „send" tippst (mit 5 s Rückgängig).
- **Nie löschen.** Scope ist `gmail.modify`: archivieren, labeln, Entwürfe, senden. Alles über die
  `zero/*`-Labels in Gmail nachvollziehbar und umkehrbar. „discard" löscht nur den Entwurf, nie die Mail.
- **Fehler = Finger weg.** Wenn Claude oder Gmail bei einem Thread scheitern, bleibt er unverändert in der Inbox.
- **Prompt-Injection:** Mailinhalte gelten für Claude als Daten, nie als Anweisung. Schlimmstenfalls
  landet eine Mail falsch archiviert (Label zeigt wo) oder ein Entwurf ist schlecht, gesendet wird nichts.
- **Kein Erfinden:** fehlende Infos stehen als `[platzhalter]` im Entwurf, keine Zusagen zu Geld, Verträgen, Terminen.
- Google-Refresh-Token AES-256-GCM-verschlüsselt (`data/`, Dateirechte 600), Session-Cookie signiert,
  HttpOnly, SameSite; CSRF-Header; strikte CSP; Abmelde-Links nur an öffentliche https-Hosts.
- Nur Konten aus `ALLOWED_EMAILS` können sich anmelden (sonst würde jeder dein Claude-Budget nutzen).

## Demo (ohne Google, ohne API-Key)

```bash
cd mail
npm install
npm run demo            # http://localhost:8787 → „sign in with google" meldet dich als Demo an
```

Fiktive Inbox mit 10 Threads; ein geskriptetes „Claude" ersetzt die echte KI.

## Live einrichten (einmalig, ca. 20 Minuten)

1. **Google Cloud** → neues Projekt → *APIs & Services* → **Gmail API** aktivieren.
2. *OAuth consent screen*: Typ **External**, App-Name „zero", deine Mail als Support-Kontakt,
   Scope `.../auth/gmail.modify`. Danach **„Publish app" → In production**.
   Wichtig: Im Status *Testing* laufen Refresh-Tokens nach **7 Tagen** ab, dann müsstest du dich
   wöchentlich neu anmelden. Unverifiziert in Produktion zeigt Google beim Login einmal
   „Google hasn't verified this app" → *Advanced* → *Go to zero*. Für dich allein ist das ok
   (Limit 100 Nutzer).
3. *Credentials* → *Create OAuth client ID* → **Web application** →
   Authorized redirect URI: `https://DEINE-DOMAIN/auth/callback` (lokal: `http://localhost:8787/auth/callback`).
4. Anthropic-Konsole → API-Key.
5. `cp .env.example .env` und ausfüllen: Client-ID/Secret, `ANTHROPIC_API_KEY`, `APP_SECRET`
   (Befehl steht in der Datei), `ALLOWED_EMAILS=deine@gmail.com`, `BASE_URL`.
6. **Erst Probelauf:** `TRIAGE_DRY_RUN=1` lassen → `npm start` → anmelden → im *brief* prüfen,
   was Claude tun würde (inkl. Entwurfstexte). Oder im Terminal: `npm run triage`.
7. Passt es: `TRIAGE_DRY_RUN=0`, neu starten. Ab jetzt räumt zero alle 30 Minuten auf.
8. Große Alt-Inbox? `ARCHIVE_OLDER_THAN_DAYS=14` archiviert alles Ältere ohne KI (Label `zero/old`).
9. In *settings* deinen Namen und deine Regeln eintragen. Den Ton lernt Claude zusätzlich aus deinen
   letzten 12 gesendeten Mails (täglich aufgefrischt).

Auf dem iPhone: Seite in Safari öffnen → Teilen → *Zum Home-Bildschirm*. Dann ist zero eine App.

## Betrieb

Braucht einen dauerhaft laufenden Node-22-Prozess mit HTTPS und einem persistenten Ordner für
`data/`. Das statische Hosting der Website (`.openai/hosting.json`) kann das **nicht**. Passend:
ein kleiner Server (Hetzner/VPS mit Caddy), Fly.io, Render oder Google Cloud Run mit Volume.
`GET /healthz` für Health-Checks. Keine Datenbank nötig: Gmail ist die Quelle der Wahrheit.

## Kosten (Schätzung, nicht gemessen)

Modell standardmäßig `claude-opus-5-5` ($4 / $20 pro Mio. Tokens). Pro Thread, den Claude liest,
grob 2–4 Cent (Profil + Stilbeispiele werden gecacht). Werbung/Social kostet nichts, das filtert
Gmail vorher. 50 relevante Mails am Tag ≈ 1–2 $ am Tag. Hebel, falls nötig:
`CLAUDE_MODEL=claude-sonnet-5-5` ($2 / $10). Bei Safety-Ablehnungen leitet die API automatisch
auf ein Ersatzmodell um (`fallbacks: "default"`).

## Als Produkt für andere Nutzer

Technisch vorbereitet (`OPEN_SIGNUP=1`, ein Datensatz pro Nutzer), aber vor dem Launch Pflicht:

- **Google-Verifizierung + CASA-Security-Assessment** (jährlich, externer Prüfer), weil
  `gmail.modify` ein *restricted scope* ist. Ohne: max. 100 Nutzer, Warnseite beim Login.
- Datenschutzerklärung + AV-Verträge (DSGVO): Mailinhalte gehen zur Verarbeitung an Anthropic.
- Echte Datenbank statt JSON-Dateien, Abrechnung, Rate-Limits pro Nutzer.

## Ohne eigenen Cleaner: Claude-Code-Routine

[`routine/PROMPT.md`](./routine/PROMPT.md) ist derselbe Ablauf als geplante Claude-Code-Routine
mit Gmail-Connector (gleiche Labels). Die App zeigt deren Entwürfe genauso an.

## Dateien

| Datei | Aufgabe |
|---|---|
| `server.js` | HTTP-Server, Google-Login, JSON-API, Zeitplan |
| `lib/triage.js` | der Cleaner: entscheidet pro Thread, schreibt Entwürfe, archiviert |
| `lib/claude.js` | Claude-Aufrufe (Triage mit JSON-Schema, Umschreiben), Anthropic SDK |
| `lib/gmail.js` | Gmail-REST-Client + OAuth, Label-Vertrag `zero/*` |
| `lib/inbox.js` | App-Aktionen: Karten, speichern, senden, verwerfen, umschreiben, abmelden |
| `lib/mime.js` | Mails lesen (MIME, Zeichensätze, HTML→Text, Zitate kappen), Antworten bauen |
| `lib/store.js` | verschlüsselter Speicher pro Nutzer (Token, Einstellungen, letzter Bericht) |
| `lib/session.js` | signierte Cookies |
| `lib/demo.js` | Fake-Gmail + Fake-Claude für Demo und Tests |
| `app/` | die App (Vanilla HTML/CSS/JS, Brand-System der Website) |

## Prüfen

```bash
npm run check   # node --check auf allen Dateien
npm test        # 32 Tests: MIME, Triage, Aktionen, Server, Clients, Sessions, Verschlüsselung
PLAYWRIGHT=$(npm root -g)/playwright/index.mjs npm run smoke   # Browser: 1366 px, 390 px, 320 px
```
