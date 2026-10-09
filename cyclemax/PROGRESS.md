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

## Phase 2 – Pauls Feedback (09.10., autonom bis 12:30 Berlin)

- [x] P1 Logo neu: ein schwarzer Kreis (Ring) = App-Icon = Logo, Wortmarke CYCLEMAX, Luxus-Anmutung; alle Icons/Splash neu
- [x] P2 Sprache: „Leiser“ → „Ruhiger“/„Standfest“ überall (Phasenwörter, Kernsatz, Pushes, Zeilen, Prompts, Store)
- [x] P3 Zykluslänge-Drehrad raus (Onboarding + Settings); Länge lernt automatisch
- [x] P4 Home: „Blutung hat heute begonnen“ als Haupt-Aktion, prominent wenn fällig; Vorschau/Warnung „Hey Man …“
- [x] P5 Spracheingabe überall (SpeechAdapter: Web Speech API / Capacitor-Plugin) – Chat + Profil
- [x] P6 Profil: „Erzähl mir von ihr“ (frei sprechen) → Claude analysiert → Profil auf dem Gerät → Coaching nutzt es
       (Beziehung: Emotionen, Reaktionen, Haushalt, Nähe/Intimität, Kinderwunsch; Single: wer er ist, was er sucht)
- [x] P7 Mentor: Balance Nähe ↔ Abstand, Ziel liebevolle Beziehung, „Hey Man“-Ton; Profil im Kontext
- [x] P8 Usability-Pass aus Sicht eines Mannes mit vollem Kopf: null Mehraufwand, ein Tap, nur Nutzen
- [x] P9 Tests (Unit + E2E) angepasst/erweitert, Screenshots, Datenschutz/Store/README aktualisiert
- [x] P10 Selbst-Review, finaler Check, Push; Vercel erneut versuchen

## Phase 3 – Der Mann führt (09.10. vormittags)

- [x] Q1 Review gegen Pauls Vision: Mann im Vordergrund, führt, keine Zusatzaufgabe, App sieht voraus
- [x] Q2 „Was kommen kann“ je Phase (evidenzbasiert, mit Quellen) auf Heute; Pushes und Vorwarnungen mit Prognose
- [x] Q3 Neuer Screen „Verstehen“: 24 Stunden vs. 28 Tage, nächste Phasen mit Datum, „Du führst“, Marc Aurel 4,49, Quellen
- [x] Q4 Keine Aufgaben: Verspätungs- und Check-in-Push raus; „Ihre Tage“ statt „Blutung“; Profil gehört ihm
- [x] Q5 Mentor/Wissensbasis: Führung durch Vorleben, Zyklus = Wissensvorsprung, nie Pflege-Aufgabe; 14 neue Zeilen
- [x] Q6 iOS-Projekt eingecheckt (SPM, iPhone, Deutsch, Privacy Manifest, eigenes Sprach-Plugin in Swift)
- [x] Q7 GitHub Actions `cyclemax-ios`: Compile bei jedem Push, Upload zu TestFlight per Knopfdruck (ohne Mac)
- [x] Q8 Store-Texte neu (Mann im Vordergrund), Review-Notes, Screenshots + Marketing-Frames `store/screenshots/framed`

## Stand (Verifikation, 09.10. vormittags)

- `npm run check`: tsc, ESLint, 108 Vitest-Tests, statischer Export (11 Routen), Backend-Bundle – grün.
- Playwright (iPhone 14 Pro): 15/15 grün inkl. neuem Test „Verstehen“ und axe-Audit (WCAG AA) aller Screens inkl. /verstehen.
- iOS: siehe Workflow `cyclemax-ios` (macos-26, Xcode 26) auf dem Branch.

## Stand (Verifikation, 09.10. früh)

- `npm run check`: tsc, ESLint, 103 Vitest-Tests, statischer Export (10 Routen), Backend-Bundle – grün.
- Playwright (iPhone 14 Pro, Chromium 141 lokal + Chrome 153 in CI): 14/14 grün – inkl. axe-Barrierefreiheit (WCAG AA) aller Screens – Start (nur Ring), Onboarding Beziehung + Single, Blutung
  eintragen (+ Rückgängig, Drehrad), Vorschau „Hey Man, morgen beginnt Standfest“, Profil per Sprache → Profil →
  Tages-Schritt → Chat per Sprache, Chat mit Mock-Claude + kopierbarer Satz + Bewerten + Melden, Schnellfragen,
  Settings, Alle Daten löschen (lokal + Server), Offline-Start + Offline-Chat, PWA installierbar, Push → Service Worker.
- Web Push lokal nachgewiesen: `server/webpush.test.ts` (echtes VAPID + aes128gcm, entschlüsselt wie ein Browser).
- Code-Review (medium) über die ganze App: 10 Funde, alle behoben und mit Tests abgesichert (siehe DECISIONS).
- GitHub Actions `.github/workflows/cyclemax.yml`: check + E2E bei jedem Push nach `cyclemax/**` – grün.
- CI fand zwei echte Bugs, beide behoben: Chat-Absturz in Chrome 153 (Effekt gab `scrollIntoView()`-Promise zurück) und
  Datenverlust bei sofortigem Neuladen nach einem Tap (IndexedDB-Schreibvorgang abgebrochen → synchrones Journal).

## Blocker / Fallbacks

- Vercel: Die Vercel-Verbindung dieser Session bekommt im Team `pur1` 403 („re-authenticate to this scope“) –
  kein Projekt anlegen, keine Env-Variablen lesen. Damit auch kein Zugriff auf den ANTHROPIC_API_KEY im Projekt `pur`.
- Kein VERCEL_TOKEN / ANTHROPIC_API_KEY als Umgebungsvariable. Kein Xcode in der Cloud-Umgebung → das iOS-Projekt wird
  hier erzeugt und auf GitHub Actions (`macos-26`, Xcode 26) kompiliert. Kein Android SDK (Befehle im README).

## Offene Punkte für Paul

**Weg in den App Store (in dieser Reihenfolge, Details README › „iOS ohne Mac“):**

1. Apple Developer Program (99 €/Jahr) – als Person oder Firma. Ohne geht nichts.
2. Bundle ID `com.purmethod.cyclemax` registrieren und App in App Store Connect anlegen (Name „Cyclemax – Sei der Fels“).
3. App Store Connect API-Key (Rolle Admin) → GitHub Secrets `APPLE_TEAM_ID`, `ASC_KEY_ID`, `ASC_ISSUER_ID`, `ASC_KEY_P8`.
4. Backend deployen (README › Deploy, Root Directory `cyclemax`): Neon `DATABASE_URL`, `ANTHROPIC_API_KEY`, VAPID-Keys,
   `ADMIN_PASSWORD`, `CRON_SECRET`, `NEXT_PUBLIC_API_BASE`. Dann GitHub-Variable `CYCLEMAX_API_BASE` = diese Domain.
   Die Vercel-Verbindung dieser Session sieht kein Team (Liste leer) – Deploy also durch dich oder nach Neu-Autorisierung.
   Ohne Backend läuft die App trotzdem (Mentor antwortet aus der Wissensbasis), aber die Datenschutz-URL braucht eine Domain.
5. Impressum: Anschrift in `src/app/impressum/page.tsx` eintragen (Pflicht in DE).
6. Actions → cyclemax-ios → Run workflow → Build in TestFlight auf deinem iPhone testen.
7. App Store Connect: Texte `store/metadata.md`, Datenschutz `store/privacy-labels.md`, Review-Notes `store/review-notes.md`,
   Screenshots `store/screenshots/framed` (6,9"), Altersfreigabe 16+, Datenschutz-URL → Zur Prüfung einreichen.

**Inhalt:**

8. Gegenlesen: „Was kommen kann“ und „Du führst“ (`shared/texts.ts`), neue Zeilen in `knowledge/daily-lines.md`
   (Abschnitt „Führen & Verstehen“), Datenschutztext (rechtlich prüfen lassen).
9. Markenprüfung „Cyclemax“ / „Be the Cycleman“ (DPMA/EUIPO) vor dem Launch.
10. App-Oberfläche nur Deutsch; englischer Store-Eintrag erst nach Übersetzung.
11. Android/Play Store: README › Android (Android Studio nötig).
12. Zwei ältere Cyclemax-Stände liegen auf `claude/focused-mendel-udfpde` und `claude/laughing-rubin-gh83dv`. Maßgeblich ist
    dieser Branch (`claude/cool-turing-huj1fh`, auf aktuellem main).
