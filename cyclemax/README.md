# Cyclemax

App für Männer: **Sei der Fels in der Brandung.** Wenn sie lauter wird, wirst du ruhiger. Ruhiger heißt nicht kleiner.
Fundament: PURE Method von Paul Brinkmann. Claim: *Be the Cycleman.*

Ein Code für Web (PWA) und später iOS/Android (Capacitor): Next.js 16 (statischer Export) + Tailwind 4,
Backend als Vercel Function in `/server`, Neon Postgres (Fallback SQLite), Web Push (VAPID), Claude nur serverseitig.

## So fühlt sich die App an

Der Mann steht im Vordergrund. Er führt – durch Vorleben, Ruhe und Klarheit. Er kümmert sich nicht um ihre Periode und bekommt
keine neue Aufgabe: Er fragt sie (oder sie sagt es ihm), tippt einmal, Cyclemax übernimmt im Hintergrund, schaut voraus und
erinnert ihn rechtzeitig daran, der Fels in der Brandung zu sein.

1. **Start:** nur der Ring und CYCLEMAX. Der Ring trägt die Farbe der aktuellen Phase. Ein Tipp öffnet die App.
2. **Heute:** sein Wort für die Phase (Wärme · Führen · Nähe · Standfest), ein Satz Haltung, „Was kommen kann“ (ihre Seite,
   evidenzbasiert, „kann“ statt „wird“), Vorwarnung 1–2 Tage vor jedem Wechsel, sein Schritt aus dem Profil, die Zeile des Tages.
   Darunter: „Cyclemax fragen“ (Text oder Sprache), „Erzähl mir von euch“, „Ihre Tage haben heute begonnen“ (groß, wenn fällig).
3. **Verstehen** (Tipp auf Ring oder Vorschau): Sie tickt in rund 28 Tagen, er in 24 Stunden. Die nächsten Phasen mit Datum,
   je Phase Hormone, was kommen kann, wie er führt. Marc Aurel 4,49, Quellen.
4. **Erzähl mir von euch / von dir:** frei sprechen → Claude macht daraus sein Profil (Fokus, Nähe ↔ Abstand, 3 Schritte).
5. **Chat:** Ein-Tap-Fragen, Spracheingabe, fertige Sätze zum Kopieren.
6. **Benachrichtigungen:** max. eine pro Tag – die Zeile oder ein Phasen-Hinweis. Nie eine Aufforderung an ihn.

## Struktur

```
src/app/          Screens: / (Start: Ring), /heute, /verstehen, /onboarding, /profil, /chat, /settings, /admin, /datenschutz, /impressum
src/engine/       Zyklus-Engine + Benachrichtigungs-Planung (reine Funktionen, Vitest)
src/adapters/     StorageAdapter, NotificationAdapter, PlatformAdapter, SpeechAdapter (Web + Native)
src/lib/          App-State, Sync, API-Client
server/           Backend: Router, DB (Drizzle), Chat, Push, Wissens-Job, Admin
api/index.js      Vercel-Function-Einstieg (lädt das beim Build gebündelte Backend .data/api.cjs)
shared/           Typen, Texte, Wissensbasis (generiert) – von Client und Server genutzt
knowledge/        Wissensbasis als Markdown (Quelle für shared/knowledge.generated.ts)
store/            Store-Texte, Datenschutz-Labels, Review-Notes, Screenshots
resources/        iOS-/Android-Icons und Splash (aus assets/logo.svg)
```

## Setup

```bash
cd cyclemax
npm ci
cp .env.example .env.local        # Werte eintragen (siehe unten)
npx web-push generate-vapid-keys  # → VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY
npm run dev:server                # Backend  http://localhost:8787
npm run dev                       # Frontend http://localhost:3000
```

Ohne `DATABASE_URL` nutzt das Backend `.data/cyclemax.db` (SQLite). Ohne `ANTHROPIC_API_KEY` antwortet der
Mentor mit Zeilen aus der Wissensbasis. Ohne VAPID-Keys erzeugt der Dev-Server temporäre Keys.

## Environment-Variablen

| Variable | Wo | Zweck |
|---|---|---|
| `NEXT_PUBLIC_API_BASE` | Build (öffentlich) | Absolute Backend-URL: `https://cyclemax.app`. Auch für die nativen Apps. |
| `ANTHROPIC_API_KEY` | Server, geheim | Claude für Chat und Wissens-Job. Nie im Client. |
| `CLAUDE_MODEL` | Server | Default `claude-sonnet-5-5` |
| `DATABASE_URL` | Server, geheim | Neon Postgres (`postgres://…`). Leer = SQLite (auf Vercel nur `/tmp`, **nicht dauerhaft**). |
| `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` | Server | Web Push. `VAPID_SUBJECT` optional (Default `mailto:orders@brinkmannpaul.com`). |
| `ADMIN_PASSWORD` | Server, geheim | Passwort für `/admin`. Leer = Admin gesperrt. |
| `CRON_SECRET` | Server, geheim | Vercel Cron schickt `Authorization: Bearer $CRON_SECRET`. In Production Pflicht. |
| optional | | `CLAUDE_EFFORT` (low), `CLAUDE_JSON_EFFORT` (medium), `CLAUDE_DAILY_LIMIT` (3000), `CLAUDE_FALLBACKS` (`off`), `PUSH_LEAD_MINUTES` (30), `PUSH_STALE_MINUTES` (180) |

## Prüfen

```bash
npm run check                                           # tsc, eslint, vitest, statischer Export, Backend-Bundle
NEXT_PUBLIC_API_BASE=http://localhost:8787 npm run build && npm run test:e2e   # Playwright (iPhone-Viewport)
npm run screenshots                                     # Store-Screenshots 6,7" + 5,5" nach store/screenshots
```

## Deploy (Vercel) → https://cyclemax.app

Die Domain **cyclemax.app** liegt im Vercel-Team `pur1` (DNS bei Vercel). Ein Vercel-Projekt `cyclemax` liefert die PWA (`out/`)
und das Backend (`api/index.js` → beim Build gebündeltes `server/node.ts`) aus. Konfiguration: `vercel.json` (Rewrites, Header, Crons), hochgeladen wird nur, was der
Build braucht (`.vercelignore`).

### Automatisch per GitHub Actions (empfohlen)

Workflow `.github/workflows/cyclemax-web.yml`: legt beim ersten Lauf das Projekt an, baut, deployt auf Produktion, verbindet
`cyclemax.app` und `www.cyclemax.app` und prüft `/api/health`. Danach deployt jeder Push nach `cyclemax/**` automatisch.

1. vercel.com → Account Settings → **Tokens** → Create Token, Scope: Team **pur1**.
2. GitHub → `purmethod/brinkmannpaul` → Settings → Secrets and variables → Actions → Secret **`VERCEL_TOKEN`**.
3. Actions → **cyclemax-web** → Run workflow. Nach 2–4 Minuten läuft https://cyclemax.app.

Danach in Vercel → cyclemax → Settings → Environment Variables (Production) ergänzen und einmal neu deployen:
`ANTHROPIC_API_KEY` (echter Mentor), `DATABASE_URL` (Neon, sonst ist nichts dauerhaft), `VAPID_PUBLIC_KEY`/`VAPID_PRIVATE_KEY`
(Web Push), `ADMIN_PASSWORD`, `CRON_SECRET`. `https://cyclemax.app/api/health` zeigt, was noch fehlt.

### Von Hand

Vercel → *Add New Project* → GitHub `purmethod/brinkmannpaul` → **Root Directory `cyclemax`**, Framework Preset **Other**
→ Environment-Variablen aus der Tabelle (`NEXT_PUBLIC_API_BASE=https://cyclemax.app`) → Deploy → Settings → Domains →
`cyclemax.app`. Achtung: Die Git-Verknüpfung baut jeden Branch von `brinkmannpaul`; Branches ohne `cyclemax/` scheitern.

**Hinweis Vercel-Plan:** `vercel.json` ist auf **Hobby** eingestellt: Push-Cron täglich 06:00 UTC (08:00 Sommerzeit /
07:00 Winterzeit) – dazu `PUSH_LEAD_MINUTES=60` setzen, damit die 07:30-Nachricht in beiden Zeiten mitgeht. Mit **Pro**
den Push-Cron auf `"0 * * * *"` (stündlich, `PUSH_LEAD_MINUTES=30`) oder `"*/15 * * * *"` (`PUSH_LEAD_MINUTES=8`) stellen.
Alternative ohne Pro: externer Cron (z. B. cron-job.org) ruft stündlich `GET /api/cron/push` mit Header
`Authorization: Bearer $CRON_SECRET` auf.

Per CLI: `cd cyclemax && npx vercel link && npx vercel env add … && npx vercel --prod`.

## Vom Web in den App Store

Der statische Export `out/` ist die App, `ios/` das fertige Xcode-Projekt (iPhone, Hochformat, Deutsch, Bundle ID
`com.purmethod.cyclemax`, Version 1.0.0). Spracheingabe läuft über ein eigenes Swift-Plugin (`ios/App/App/SpeechRecognitionPlugin.swift`),
das Privacy Manifest liegt in `ios/App/App/PrivacyInfo.xcprivacy`.

### iOS ohne Mac: GitHub Actions → TestFlight

Workflow `.github/workflows/cyclemax-ios.yml` (Runner `macos-26`, Xcode 26 – seit 28.04.2026 Pflicht für Uploads).
Jeder Push kompiliert die App unsigniert. Der Upload läuft per Knopfdruck:

1. **Apple Developer Program** (99 €/Jahr) für dich bzw. deine Firma. Team ID: developer.apple.com → Membership.
2. **Bundle ID registrieren:** developer.apple.com → Certificates, IDs & Profiles → Identifiers → „+“ → App IDs → App →
   Bundle ID `com.purmethod.cyclemax` (explicit), keine Capabilities nötig.
3. **App anlegen:** App Store Connect → Apps → „+“ → Neue App → iOS, Name „Cyclemax – Sei der Fels“, Sprache Deutsch,
   Bundle ID wie oben, SKU `cyclemax`.
4. **API-Schlüssel:** App Store Connect → Benutzer und Zugriff → Integrationen → App Store Connect API → Schlüssel erzeugen,
   Rolle **Admin** (nötig, damit die Cloud-Signierung Zertifikat und Profil anlegen darf). `.p8` herunterladen (geht nur einmal).
5. **GitHub → Settings → Secrets and variables → Actions:** Secrets `APPLE_TEAM_ID`, `ASC_KEY_ID`, `ASC_ISSUER_ID`,
   `ASC_KEY_P8` (kompletter Inhalt der .p8-Datei); Variable `CYCLEMAX_API_BASE` = Backend-Domain (siehe Deploy).
6. **Actions → cyclemax-ios → Run workflow** (Branch wählen, „upload“ an). Nach 10–30 Minuten Verarbeitung steht der Build in
   App Store Connect → TestFlight. Die Build-Nummer ist die Laufnummer des Workflows.
7. In App Store Connect: Texte aus `store/metadata.md`, App-Datenschutz aus `store/privacy-labels.md`, Review-Notes aus
   `store/review-notes.md`, Screenshots aus `store/screenshots/6.7`, Altersfreigabe-Fragebogen (16+ empfohlen),
   Datenschutz-URL `https://cyclemax.app/datenschutz/` → Build auswählen → **Zur Prüfung einreichen**.

### iOS mit Mac (Xcode 26)

```bash
cd cyclemax
NEXT_PUBLIC_API_BASE=https://cyclemax.app npm run ios   # build + cap sync ios
npm run ios:open                                   # öffnet Xcode
```

Xcode: Target *App* → Signing & Capabilities → Team wählen → Product → Archive → Distribute App → App Store Connect.
Push-Notifications-Capability ist nicht nötig (lokale Benachrichtigungen).

### Android → Play Console (Android Studio + SDK)

```bash
cd cyclemax
NEXT_PUBLIC_API_BASE=https://cyclemax.app npm run build
npm i -D @capacitor/android && npx cap add android
npx @capacitor/assets generate --android    # oder resources/android/* nach android/app/src/main/res kopieren
npx cap sync android
npx cap open android
```

Android Studio: Build → Generate Signed App Bundle (.aab, neuen Upload-Key anlegen und sicher aufbewahren) →
Play Console: App erstellen → Interner Test → `.aab` hochladen → Store-Eintrag (`store/metadata.md`),
Data Safety (`store/privacy-labels.md`), Inhaltseinstufung, Zielgruppe (18+ empfohlen) → Produktion.
`android/app/src/main/AndroidManifest.xml`: `<uses-permission android:name="android.permission.RECORD_AUDIO" />`
für die Spracheingabe (auf Android nutzt die App `@capacitor-community/speech-recognition`).

Bei jedem Web-Update: `npm run ios` (bzw. `npm run cap:sync`) → neuer Build.

## Datenschutz in Kürze

Kein Konto. Zyklusdaten, Profil („Erzähl mir von euch“) und Chat bleiben auf dem Gerät. Web: Server bekommt nur Push-Subscription und
Zeitpunkt/Typ der nächsten Pushes. Native: Benachrichtigungen komplett lokal. Chat und Profil-Auswertung werden nur weitergeleitet,
gespeichert wird höchstens ein anonymes Themen-Stichwort. Details: `/datenschutz` und `DECISIONS.md`.
