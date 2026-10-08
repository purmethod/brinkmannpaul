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
- [ ] M10 Store-Material `/store` + Screenshot-Skript
- [ ] M11 README, Selbst-Review aller Texte, Builds/Lint/Typecheck grün
- [ ] M12 Deploy (Vercel) oder exakte Dokumentation

## Blocker / Fallbacks

- Gestoppt auf Wunsch von Paul (Credits) mitten in M7. Stand: Engine, Adapter, Backend, Wissens-Job,
  Icons/SW fertig und getestet. M7 begonnen: `src/lib/{state,sync,app-context,hooks,format}.ts`,
  `src/components/{Logo,Ring,Wheel,Splash,Thumbs,ui,icons}.tsx`, `src/app/globals.css`.
  Noch offen: Seiten (Onboarding, Home, Chat, Settings, Admin, Datenschutz, Impressum), layout.tsx,
  SW-Registrierung, Capacitor-Config, Playwright, /store, README, Deploy.
- Kein VERCEL_TOKEN, kein ANTHROPIC_API_KEY, kein Xcode/Android SDK in dieser Umgebung.

## Offene Punkte für Paul

(wird am Ende vervollständigt)
