# Cyclemax

**Be the Cycleman.** Eine Männer-App: Er fragt sie nach ihrem Zyklus, trägt ihn ein und weiß jederzeit, in welcher
Phase sie ist – und erinnert sich im richtigen Moment daran, der Fels in der Brandung zu sein.
Fundament ist die [PUR Method](https://purmethod.com): Cyclemax ist das Werkzeug, PUR die Haltung.

- Expo SDK 57 · React Native · TypeScript · Expo Router
- Alle Daten bleiben auf dem Gerät (AsyncStorage). Kein Login, kein Konto, kein Tracking.
- Lokale Pushes (genau 4 pro Zyklus + max. 1 Gesten-Erinnerung pro 30 Tage)
- KI-Coach über einen kleinen Proxy (`server/`, Vercel) – der API-Key liegt nie in der App
- Deutsch (Standard) + Englisch

Stand und offene Punkte: [PROGRESS.md](./PROGRESS.md) · Entscheidungen: [DECISIONS.md](./DECISIONS.md) ·
Store-Texte: [store/metadata.md](./store/metadata.md)

## Starten

Voraussetzung: Node 22+.

```bash
cd cyclemax
npm install
npx expo start          # QR-Code mit Expo Go (iOS/Android) scannen, oder i / a für Simulator/Emulator
```

Alle verwendeten Module sind in Expo Go enthalten (lokale Notifications funktionieren dort; nur Remote-Push nicht,
die Cyclemax nicht nutzt). Splash-Screen und App-Icon sieht man erst in einem echten Build.

Ohne Coach-Proxy beantwortet „Wie reagiere ich?" offline mit einem Impuls der aktuellen Phase. Mit Proxy:

```bash
cp .env.example .env    # dann EXPO_PUBLIC_COACH_URL=https://<dein-projekt>.vercel.app eintragen
npx expo start --clear
```

## Prüfen

```bash
npm test                # Jest: Engine, Pushes, Gesten, Coach, State, kompletter App-Durchlauf
npm run typecheck       # tsc --noEmit
npm run lint            # expo lint (ESLint)
npm run doctor          # expo-doctor
npm run export          # Bundles für iOS, Android, Web
npm run verify          # typecheck + lint + test in einem
(cd server && npm install && npm test && npm run typecheck)   # Coach-Proxy
```

## Struktur

```
src/app/            Screens (Expo Router): onboarding/ (3 Schritte), (tabs)/ Heute · Gesten · Einstellungen
src/engine/         Reine Funktionen: Datum, 4 Phasen, Verspätung, Lernen, Push-Planung, Gesten-Logik
src/content/        Phasen-Inhalte (Haltung, Aktionen, Marc-Aurel-Zitate, 8 Impulse/Phase), Push- und Gesten-Texte
src/i18n/           UI-Texte DE/EN, Spracherkennung, Datumsformat
src/state/          AppState-Schema (robust gegen kaputte Daten), Aktionen, Store, AsyncStorage
src/notifications/  Text-Aufbau, serialisierter Scheduler, expo-notifications-Adapter (+ Web-Stub)
src/coach/          Coach-Client mit Timeout und Offline-Fallback
src/components/     Phasenring, Drehräder, Bottom-Sheet, Logo, UI-Bausteine
server/             Vercel Function POST /api/coach (Claude-Proxy, speichert nichts)
assets/logo.svg     Das Wappen – Quelle für alle Icons (npm run assets)
store/              App-Store-/Play-Texte, Datenschutz-Entwurf
```

## Icons & Splash neu erzeugen

`assets/logo.svg` ist das feste Markenzeichen. Nach einer Änderung (nur mit Freigabe):

```bash
npm run assets          # sharp → icon.png 1024, Android adaptive + monochrome, Splash, Favicon, Notification-Icon
```

## KI-Coach-Proxy auf Vercel

Der Proxy liegt in `server/` und hat eigene Abhängigkeiten (`@anthropic-ai/sdk`).

1. Auf [vercel.com](https://vercel.com) → **Add New… → Project** → dieses GitHub-Repo importieren.
2. **Root Directory:** `cyclemax/server` · Framework Preset: **Other** · Build-/Output-Einstellungen leer lassen.
3. **Settings → Environment Variables** (für *Production*, optional auch *Preview*):
   - `ANTHROPIC_API_KEY` = dein Key aus der [Claude Console](https://platform.claude.com/settings/keys)
     → **hier und nur hier** wird der Key eingetragen, nie in der App oder im Repo.
   - `CLAUDE_MODEL` (optional) = `claude-sonnet-5-5` (Standard)
4. **Deploy.** Danach testen:

   ```bash
   curl -X POST https://<dein-projekt>.vercel.app/api/coach \
     -H 'Content-Type: application/json' \
     -d '{"phase":"brandung","cycleDay":25,"daysSinceLastGesture":12,"situation":"Sie ist gereizt wegen der Arbeit","lang":"de"}'
   # → {"text":"…"}   (503 {"error":"not_configured"} = Key fehlt)
   ```

   Alternativ per CLI: `cd cyclemax/server && npx vercel@latest --prod` und den Key mit
   `npx vercel@latest env add ANTHROPIC_API_KEY production` setzen.
5. Die URL in die App bringen: lokal über `.env` (siehe oben), für Store-Builds als EAS-Umgebungsvariable:

   ```bash
   npx eas-cli@latest env:create --name EXPO_PUBLIC_COACH_URL --value https://<dein-projekt>.vercel.app \
     --environment production --visibility plaintext
   ```

   (Für interne Test-Builds dasselbe mit `--environment preview`.)

Gesendet werden ausschließlich Phase, Zyklustag, Tage seit der letzten Geste, der optionale Situationstext und die
App-Sprache. Der Proxy speichert nichts und loggt nur Fehlerklassen. Bei einer Ablehnung durch die
Sicherheits-Klassifikatoren springt serverseitig das empfohlene Fallback-Modell ein (`fallbacks: "default"`).

## iOS- und Android-Builds mit EAS

Einmalig:

```bash
npx eas-cli@latest login
npx eas-cli@latest init          # legt das EAS-Projekt an und schreibt die projectId in app.json
```

Builds (laufen in der Expo-Cloud, kein Mac/Xcode nötig):

```bash
npx eas-cli@latest build --platform ios --profile preview        # interne Test-Builds (Ad-hoc / APK)
npx eas-cli@latest build --platform android --profile preview
npx eas-cli@latest build --platform all --profile production     # Store-Builds (Build-Nummer zählt automatisch hoch)
npx eas-cli@latest submit --platform ios --latest                # → App Store Connect / TestFlight
npx eas-cli@latest submit --platform android --latest            # → Google Play (Service-Account-JSON nötig)
```

Bundle-ID / Package: `com.purmethod.cyclemax` (in `app.json`, vor dem ersten Upload final festlegen).
