# Cyclemax — PROGRESS

> Bei Neustart: diese Datei zuerst lesen und beim ersten offenen Meilenstein weitermachen.
> Entscheidungen stehen in [DECISIONS.md](./DECISIONS.md).

## Meilensteine

- [x] M0 Setup: Expo SDK + TypeScript strict + Expo Router, ESLint, Jest im Ordner `cyclemax/`
- [x] M1 Marke: `assets/logo.svg` → Icon 1024, Adaptive Icon, Monochrome, Splash, Favicon (sharp-Skript); Logo-Komponente
- [x] M2 Engine (`src/engine`): Datums-Mathe, 4 Phasen lückenlos, Verspätung, Lern-Mittelwert, Verhütungs-Modus + Jest
- [x] M3 Inhalte + i18n: `src/content/phases.ts` (DE/EN, Haltung, 3 Aktionen, Zitate, 8 Impulse/Phase), Push- und Gesten-Texte
- [x] M4 Daten + State: AsyncStorage, versioniertes Schema, Store-Provider
- [x] M5 Pushes: reine Planung (4 pro Zyklus, keine Duplikate) + expo-notifications-Sync mit Mutex + Tests
- [x] M6 Gesten: Intervall-Logik, Extra-Push (bevorzugt Aufwind/Hochphase, max. 1 pro 30 Tage) + Tests
- [x] M7 KI-Coach: App-Client mit Timeout + Fallback, Vercel-Proxy `/server/api/coach` + Tests
- [x] M8 UI: Onboarding (3), Home (Phasenring), Gesten, Settings — Design radikal minimal, Inter
- [ ] M9 Qualität: Jest grün, `tsc --noEmit`, ESLint, `expo-doctor`, `expo export`, Web-Smoke-Test mit Screenshots
- [ ] M10 Doku: README (Start, EAS, Vercel), `store/metadata.md`, `eas.json`, offene Punkte für Paul

## Blocker

_(noch keine)_

## Offene Punkte für Paul

_(wird am Ende gefüllt)_
