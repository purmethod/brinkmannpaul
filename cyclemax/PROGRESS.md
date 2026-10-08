# Cyclemax – PROGRESS

> Bei Neustart: diese Datei zuerst lesen und beim ersten offenen Punkt weitermachen.

## Meilensteine

- [x] M0 Projektgerüst (Next.js 16, TS, Tailwind 4, Abhängigkeiten), PROGRESS/DECISIONS
- [x] M1 Wissensbasis `/knowledge` (PURE aus `purmethod/pur` + brinkmannpaul.com, Stoiker, Zeilen) + Generator `shared/knowledge.generated.ts`
- [x] M2 Engine `src/engine` (Phasen, Lernen, Benachrichtigungs-Planung) + Vitest
- [x] M3 Adapter (Storage, Notification, Platform) Web + Native + Tests
- [x] M4 Icons, Splash, Manifest, Service Worker (offline, push)
- [x] M5 Backend `/server` (Router, DB Drizzle Neon/SQLite, Push, Chat, Feedback, Admin, Cron) + Tests
- [x] M6 Wissens-Job (Generator → Kritiker → Duplikat-Check) + Tests mit Mock-Claude
- [x] M7 Frontend-Screens: Onboarding, Home, Chat, Settings, Admin, Datenschutz, Impressum
- [x] M8 Capacitor-Konfiguration
- [x] M9 Playwright E2E (iPhone-Viewport) + Installierbarkeit + Test-Push-Nachweis
- [x] M10 Store-Material `/store` + Screenshot-Skript
- [x] M11 README, Selbst-Review aller Texte, Builds/Lint/Typecheck grün
- [~] M12 Deploy (Vercel) – exakt dokumentiert (README › Deploy), Ausführung blockiert (siehe unten)

## Stand (Verifikation)

- `npm run check`: tsc, ESLint, 81 Vitest-Tests, statischer Export (8 Routen), Backend-Bundle – grün.
- Playwright (iPhone 14 Pro, Chromium): 10/10 grün – Onboarding Beziehung + Single, Blutung eintragen
  (+ Rückgängig, Drehrad), Chat mit Mock-Claude, Bewerten, Melden, Settings, Alle Daten löschen (lokal + Server),
  Offline-Start + Offline-Chat, PWA installierbar (Chrome `getInstallabilityErrors` leer), Push → Service Worker
  zeigt Benachrichtigung.
- Web Push lokal nachgewiesen: `server/webpush.test.ts` (echtes VAPID + aes128gcm, entschlüsselt wie ein Browser).
- Lighthouse 12+ hat keine PWA-Kategorie mehr; Installierbarkeit wird stattdessen mit Chromes eigener Prüfung getestet.

## Blocker / Fallbacks

- Vercel: Die Vercel-Verbindung dieser Session bekommt im Team `pur1` 403 („re-authenticate to this scope“) –
  kein Projekt anlegen, keine Env-Variablen lesen. Damit auch kein Zugriff auf den ANTHROPIC_API_KEY im Projekt `pur`.
- Kein VERCEL_TOKEN / ANTHROPIC_API_KEY als Umgebungsvariable; kein Xcode/Android SDK (native Projekte nicht erzeugt,
  Befehle im README).

## Offene Punkte für Paul

1. Vercel freischalten: Vercel-Verbindung in claude.ai neu autorisieren (Team `pur1` mit Schreibrecht) ODER in den
   Environment-Settings dieser Cloud-Umgebung `VERCEL_TOKEN` und `ANTHROPIC_API_KEY` als Secret hinterlegen → neue Session.
   Oder selbst deployen: README › Deploy (Root Directory `cyclemax`, Preset „Other“).
2. Neon-Datenbank anlegen → `DATABASE_URL` (ohne: Daten auf Vercel nicht dauerhaft).
3. Env setzen: `ANTHROPIC_API_KEY`, VAPID-Keys (`npx web-push generate-vapid-keys`), `ADMIN_PASSWORD`, `CRON_SECRET`,
   `NEXT_PUBLIC_API_BASE`.
4. Vercel Pro für den stündlichen Push-Cron (Hobby: Crons nur täglich) – oder externer Cron (README).
5. Impressum: [NAME], [ADRESSE], [E-MAIL] in `src/app/impressum/page.tsx` eintragen.
6. Inhalte gegenlesen: `knowledge/daily-lines.md` (103 Zeilen), Haltungssätze in `shared/texts.ts`,
   Datenschutztext `src/app/datenschutz/page.tsx` (rechtlich prüfen lassen).
7. App Store / Play: Mac mit Xcode bzw. Android Studio → README › „Vom Web in den App Store“.
8. App-Oberfläche ist nur Deutsch; englischer Store-Eintrag erst nach Übersetzung.
