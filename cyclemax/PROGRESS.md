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
- [x] M9 Qualität: Jest grün, `tsc --noEmit`, ESLint, `expo-doctor`, `expo export`, Web-Smoke-Test mit Screenshots
- [x] M10 Doku: README (Start, EAS, Vercel), `store/metadata.md`, `eas.json`, offene Punkte für Paul

## Definition of Done

- [x] Alle Screens gebaut (Onboarding 3 Schritte, Heute, Gesten, Einstellungen), Design wie vorgegeben
- [x] Icon, Adaptive Icon, Monochrome, Splash, Favicon, Notification-Icon aus dem Wappen-SVG
- [x] Jest: 96 Tests grün (Engine, Pushes, Gesten, Coach, State, Inhalte, kompletter App-Durchlauf) + 13 Server-Tests
- [x] `npx tsc --noEmit` fehlerfrei, ESLint sauber, `npx expo export` erfolgreich (iOS, Android, Web)
- [x] `npx expo-doctor`: 19/21 grün, 2 nur wegen Netzsperre nicht ausführbar → manuell offline verifiziert (DECISIONS 33)
- [x] README: Start, EAS-Builds, Vercel-Deployment, wo `ANTHROPIC_API_KEY` eingetragen wird
- [x] `store/metadata.md` (DE + EN), Datenschutz-Entwurf, Screenshot-Entwürfe 6,9"

## Blocker (mit Fallback gelöst)

1. **Kein Xcode / kein iOS-Simulator** (Linux-Umgebung). Fallback: kompletter App-Durchlauf als Jest-Test im
   iOS-Preset (`src/__tests__/app.test.tsx`) + Web-Build mit Playwright/Chromium durchgeklickt (19 Screenshots,
   0 Konsolenfehler, Persistenz nach Reload, Verspätung, Verhütung, EN, Löschen) + iOS/Android-Hermes-Bundles exportiert.
2. **`api.expo.dev`, `docs.expo.dev`, `reactnative.directory` gesperrt.** Fallback: `EXPO_OFFLINE=1` für SDK-konforme
   Installs, Doku aus dem `expo/expo`-GitHub-Repo, Schema- und Directory-Check offline (siehe DECISIONS 3, 33).
3. **Kein `ANTHROPIC_API_KEY` in der Umgebung.** Fallback: Proxy vollständig mit gemocktem SDK getestet (Validierung,
   Prompt, Fehler-Mapping, Refusal), App fällt ohne Proxy auf Phasen-Impulse zurück. Ein Live-Call steht aus.

## Offene Punkte für Paul

1. **Coach live schalten:** `cyclemax/server` auf Vercel deployen, `ANTHROPIC_API_KEY` dort eintragen (README),
   URL als `EXPO_PUBLIC_COACH_URL` in EAS setzen, einmal per `curl` testen.
2. **Konten & IDs:** Apple Developer + Google Play Console, `npx eas-cli init` (projectId), Bundle-ID
   `com.purmethod.cyclemax` bestätigen, Copyright-Zeile prüfen.
3. **Echte Geräte testen** (iPhone + Android): Push zur eingestellten Uhrzeit, Spinner-Optik, Splash, Icon.
   Android kann Erinnerungen im Doze-Modus um einige Minuten verzögern (bewusst keine Exact-Alarm-Berechtigung).
4. **Datenschutz-URL:** `store/privacy.md` juristisch prüfen, Anschrift ergänzen, öffentlich hosten (z. B. purmethod.com).
5. **Anthropic-Datenaufbewahrung:** Für „Data Not Collected" Zero-Data-Retention mit Anthropic klären – sonst das
   Privacy-Label für den Coach anpassen (Details in `store/metadata.md`).
6. **Missbrauchsschutz Proxy:** Der Endpoint ist öffentlich. Vercel-Firewall-Rate-Limit (z. B. 20 Anfragen/Minute
   pro IP) und ein Budget-Limit in der Claude Console setzen.
7. **Store-Review-Risiko:** Die App erfasst Zyklusdaten einer anderen Person. Store-Text und Review-Notiz betonen
   „Frag sie" und lokale Speicherung; Play-Console-Gesundheits-Deklaration ausfüllen.
8. **Inhalte gegenlesen:** 32 Impulse, Aktionen, englische Übertragungen der Marc-Aurel-Zitate (`src/content/phases.ts`).
9. **Markenprüfung** „Cyclemax" / „Be the Cycleman" (DPMA/EUIPO/USPTO) vor dem Launch.
10. **Repo-Prozess:** Laut Root-`AGENTS.md` startet jede Änderung mit Issue + PR + Review. Dieser Stand liegt auf
    `claude/laughing-rubin-gh83dv` – Issue/PR anlegen, wenn du ihn in `main` haben willst.
11. **Coach-Screenshot** für den Store, sobald der Proxy echte Antworten liefert; Altersfreigabe 4+ bestätigen.
