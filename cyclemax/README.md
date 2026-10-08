# Cyclemax

App für Männer: **Sei der Fels in der Brandung.** Wenn sie lauter wird, wirst du leiser. Leiser heißt nicht kleiner.
Fundament: PURE Method von Paul Brinkmann. Claim: *Be the Cycleman.*

Ein Code für Web (PWA) und später iOS/Android (Capacitor): Next.js 16 (statischer Export) + Tailwind 4,
Backend als Vercel Function in `/server`, Neon Postgres (Fallback SQLite), Web Push (VAPID), Claude nur serverseitig.

## Struktur

```
src/app/          Screens: / (Home), /onboarding, /chat, /settings, /admin, /datenschutz, /impressum
src/engine/       Zyklus-Engine + Benachrichtigungs-Planung (reine Funktionen, Vitest)
src/adapters/     StorageAdapter, NotificationAdapter, PlatformAdapter (Web + Native)
src/lib/          App-State, Sync, API-Client
server/           Backend: Router, DB (Drizzle), Chat, Push, Wissens-Job, Admin
api/index.ts      Vercel-Function-Einstieg (re-export von server/app.ts)
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
| `NEXT_PUBLIC_API_BASE` | Build (öffentlich) | Absolute Backend-URL, z. B. `https://cyclemax.vercel.app`. Auch für die nativen Apps. |
| `ANTHROPIC_API_KEY` | Server, geheim | Claude für Chat und Wissens-Job. Nie im Client. |
| `CLAUDE_MODEL` | Server | Default `claude-sonnet-5-5` |
| `DATABASE_URL` | Server, geheim | Neon Postgres (`postgres://…`). Leer = SQLite (auf Vercel nur `/tmp`, **nicht dauerhaft**). |
| `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` | Server | Web Push. `VAPID_SUBJECT` optional (Default `mailto:orders@brinkmannpaul.com`). |
| `ADMIN_PASSWORD` | Server, geheim | Passwort für `/admin`. Leer = Admin gesperrt. |
| `CRON_SECRET` | Server, geheim | Vercel Cron schickt `Authorization: Bearer $CRON_SECRET`. In Production Pflicht. |
| optional | | `CLAUDE_EFFORT` (low), `CLAUDE_FALLBACKS` (`off`), `PUSH_LEAD_MINUTES` (30), `PUSH_STALE_MINUTES` (180) |

## Prüfen

```bash
npm run check                                           # tsc, eslint, vitest, statischer Export, Backend-Bundle
NEXT_PUBLIC_API_BASE=http://localhost:8787 npm run build && npm run test:e2e   # Playwright (iPhone-Viewport)
npm run screenshots                                     # Store-Screenshots 6,7" + 5,5" nach store/screenshots
```

## Deploy (Vercel)

Ein Vercel-Projekt liefert die PWA (`out/`) und das Backend (`api/index.ts`) aus. Konfiguration: `vercel.json`
(Rewrites, Header, Cron: stündlich `/api/cron/push`, täglich 03:00 `/api/cron/knowledge`).

1. Neon-Datenbank anlegen (Vercel Marketplace → Neon oder neon.tech) → `DATABASE_URL`.
2. Vercel → *Add New Project* → GitHub `purmethod/brinkmannpaul` → **Root Directory `cyclemax`**,
   Framework Preset **Other** (Build/Output kommen aus `vercel.json`).
3. Environment-Variablen aus der Tabelle setzen. `NEXT_PUBLIC_API_BASE` = die Projekt-Domain
   (z. B. `https://cyclemax.vercel.app`).
4. Deploy. Danach `https://<domain>/api/health` → `{"ok":true,"db":"postgres","claude":true}`.
5. `/admin` mit `ADMIN_PASSWORD` öffnen → System → „Test-Push an alle“.

**Hinweis Vercel-Plan:** Auf Hobby laufen Cron-Jobs nur einmal täglich – für den stündlichen Push-Cron ist
**Pro** nötig. Alternative: externer Cron (z. B. cron-job.org) ruft stündlich
`GET /api/cron/push` mit Header `Authorization: Bearer $CRON_SECRET` auf und `vercel.json` bekommt
für Push `"0 7 * * *"`.

Per CLI: `cd cyclemax && npx vercel link && npx vercel env add … && npx vercel --prod`.

## Vom Web in den App Store

Der statische Export `out/` ist die App. Voraussetzung: `NEXT_PUBLIC_API_BASE` zeigt auf das deployte Backend.

### iOS → Xcode → TestFlight (Mac mit Xcode 16+, Apple Developer Account)

```bash
cd cyclemax
NEXT_PUBLIC_API_BASE=https://<domain> npm run build
npm i -D @capacitor/ios && npx cap add ios
npx @capacitor/assets generate --ios        # Icons/Splash aus resources/ (icon-only.png, splash.png)
npx cap sync ios
npx cap open ios
```

In Xcode: Target *App* → Signing & Capabilities → Team wählen, Bundle Identifier `com.cyclemax.app`,
Capability **Push Notifications** ist für lokale Benachrichtigungen *nicht* nötig. Version/Build setzen →
Product → Archive → Distribute App → App Store Connect → Upload. In App Store Connect: App anlegen
(Name „Cyclemax: Ihr Zyklus“, Bundle ID wie oben), Texte aus `store/metadata.md`, Datenschutz aus
`store/privacy-labels.md`, Review-Notes aus `store/review-notes.md`, Screenshots aus `store/screenshots/6.7` und
`/5.5` → Build unter **TestFlight** testen → *Zur Prüfung einreichen*.

### Android → Play Console (Android Studio + SDK)

```bash
cd cyclemax
NEXT_PUBLIC_API_BASE=https://<domain> npm run build
npm i -D @capacitor/android && npx cap add android
npx @capacitor/assets generate --android    # oder resources/android/* nach android/app/src/main/res kopieren
npx cap sync android
npx cap open android
```

Android Studio: Build → Generate Signed App Bundle (.aab, neuen Upload-Key anlegen und sicher aufbewahren) →
Play Console: App erstellen → Interner Test → `.aab` hochladen → Store-Eintrag (`store/metadata.md`),
Data Safety (`store/privacy-labels.md`), Inhaltseinstufung, Zielgruppe (18+ empfohlen) → Produktion.
Für Android 13+ fragt die App die Benachrichtigungs-Berechtigung selbst; für exakte Zeiten ggf.
`SCHEDULE_EXACT_ALARM` im Manifest ergänzen.

Bei jedem Web-Update: `npm run build && npx cap sync` → neuer Build in Xcode/Android Studio.

## Datenschutz in Kürze

Kein Konto. Zyklusdaten und Chat bleiben auf dem Gerät. Web: Server bekommt nur Push-Subscription und
Zeitpunkt/Typ der nächsten Pushes. Native: Benachrichtigungen komplett lokal. Chat wird nur weitergeleitet,
gespeichert wird höchstens ein anonymes Themen-Stichwort. Details: `/datenschutz` und `DECISIONS.md`.
