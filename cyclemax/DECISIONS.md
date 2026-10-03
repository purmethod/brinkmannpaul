# Cyclemax — DECISIONS

Kurzprotokoll aller Entscheidungen, die ohne Rückfrage getroffen wurden.

1. **Ort im Repo:** Die App lebt isoliert in `cyclemax/` (eigene `package.json`). Die Website (`dist/`) und ihr
   Vanilla-Stack bleiben unberührt; die „keine Abhängigkeiten"-Regel aus `AGENTS.md` gilt für die Website,
   der Stack der App ist durch den Auftrag vorgegeben.
2. **Expo SDK 57** (aktuell `latest`, RN 0.86, React 19.2, TypeScript 6). Routen liegen nach SDK-Konvention in `src/app/`,
   Alias `@/*` → `src/*`. `noUncheckedIndexedAccess` an, damit die Engine keine stillen `undefined` hat.
3. **Netzwerk-Policy der Build-Umgebung** blockiert `api.expo.dev` und `docs.expo.dev`: Pakete wurden mit
   `EXPO_OFFLINE=1 npx expo install` installiert (Versionen aus `expo/bundledNativeModules.json` = SDK-kompatibel),
   Doku aus dem `expo/expo`-GitHub-Repo (`docs/pages/versions/v57.0.0`) gelesen.
4. **Web nur als Vorschau/Smoke-Test** (`react-native-web`, `web.output: single`). Ziel-Plattformen sind iOS + Android.
5. **iPhone only** (`supportsTablet: false`): spart iPad-Screenshots und -Layouts im Store, passt zur Ein-Hand-App.
6. **Bundle-ID** `com.purmethod.cyclemax` (iOS + Android). Bei Bedarf vor dem ersten Store-Upload ändern.
7. **Logo = eine Quelle:** `assets/logo.svg` ist exakt das vorgegebene SVG. `npm run assets` (sharp) erzeugt daraus
   Icon (1024, weiß, opak), Android-Adaptive-Foreground (im 66/108-Safe-Zone-Kreis), Monochrome (Android 13 Themed Icons),
   Splash-Mark, Favicon und das weiße 96-px-Notification-Icon. `src/brand/logo.ts` spiegelt die Pfade für die
   In-App-Komponente; ein Test bricht, wenn beide auseinanderlaufen.
8. **Datumsmodell:** Alle Daten sind Kalendertage `YYYY-MM-DD`, gerechnet über UTC-Tagnummern → Sommerzeit und
   Zeitzonen können keinen Tag verschieben. Alle Tests laufen in `Europe/Berlin` (echte DST-Zone).
9. **Phasengrenzen:** Ruhe = Tag 1…P · Aufwind = P+1…O−3 · Hochphase = O−2…L−5 · Brandung = L−4…L (O = L−14).
   Kollidiert bei kurzen Zyklen mit langer Periode das Eisprungfenster mit der Periode (z. B. 21/8), gewinnt die
   Periode und Aufwind behält mindestens 1 Tag → jede Phase existiert in jedem Zyklus (Voraussetzung für 4 Pushes).
10. **Verspätung:** Ab dem erwarteten Periodenstart bleibt die Phase Brandung („Tag 31 von 28"), bis eine neue Periode
    eingetragen wird. Tage vor der letzten eingetragenen Periode werden rückwärts projiziert.
11. **Lernen:** Mittelwert der letzten ≤ 6 Abstände zwischen eingetragenen Periodenstarts, gerundet, auf 21–40 begrenzt.
    Abstände < 18 oder > 45 Tage gelten als vergessener Eintrag und zählen nicht. Der gelernte Wert wird bei jedem
    Eintrag in die Zykluslänge übernommen; manuell in Settings überschreibbar bis zum nächsten Eintrag.
12. **Korrektur statt Mini-Zyklus:** Ein neuer Periodenstart innerhalb ±14 Tagen eines vorhandenen ersetzt diesen.
    Gespeichert werden die letzten 13 Starts.
13. **Englische Phasennamen:** Rest · Rise · Peak · Breakers (Brandung = Breakers; Claim EN „Be the rock in the surf.").
14. **Zitate EN** sind freie Übertragungen der vorgegebenen deutschen Fassungen (gekennzeichnet „loosely after Marcus
    Aurelius, Meditations"), Stellenangaben im EN-Format `4.49`.
15. **Impulse:** Home zeigt täglich einen Impuls zusätzlich zum festen Phasenzitat. Die Rotation läuft über Zyklen
    weiter (`cycleIndex × Phasenlänge + Tag`), damit ein Monat nicht wie der letzte beginnt. Brandung wechselt die
    beiden Zitate täglich (4,49 / 11,18). Impulse dienen auch als Offline-Fallback des Coaches.
16. **Gesten-Standardintervalle:** Blumen 8, Date 3 (laut Auftrag), Brief/Nachricht 4, Überraschung 6, Zeit nur für sie 2
    Wochen; jeweils 1–16 Wochen in Settings.
17. **Sprache:** Deutsch ist Standard. Englisch nur, wenn das Gerät Englisch bevorzugt; in Settings umschaltbar.
    Ein Test verbietet Emojis sowie Fruchtbarkeits-, Sex- und Rationalitäts-Begriffe in allen Inhalten.
18. **Speicher:** AsyncStorage, ein versioniertes JSON-Dokument. `sanitizeState` repariert jedes Feld einzeln →
    korrupte oder ältere Daten können die App nicht crashen. Kein Login, kein Backend.
19. **Push-Horizont:** Geplant werden die 4 Phasenstarts des eingetragenen Zyklus plus der erwartete nächste
    Periodenstart (Ruhe-Push = Erinnerung, die Periode einzutragen). Danach nichts mehr, bis eine Periode eingetragen
    wird – konsistent zur Regel „verspätet = Brandung bleibt". Ergebnis bei regelmäßigem Eintrag: exakt 4 Pushes pro
    Zyklus (Simulationstest über 6 Zyklen, Eintrag vor und nach der Push-Uhrzeit). Kommt die Periode früher als
    erwartet, entfällt der Brandung-Push dieses Zyklus (er läge nach dem echten Start).
20. **Keine Duplikate:** Jede Notification hat eine deterministische ID (`phase:<datum>:<phase>`); jede Neuberechnung
    löscht alle geplanten und plant die komplette Liste neu, serialisiert über eine Promise-Queue.
21. **Gesten-Extra-Push:** frühestens am Fälligkeitstag, verschoben auf den nächsten Aufwind-/Hochphase-Tag innerhalb
    von 14 Tagen, nie am Tag eines Phasen-Pushes, mindestens 30 Tage nach dem letzten Extra-Push („max. 1 pro Monat"
    als gleitendes Fenster, damit nicht 31.1. + 1.2. möglich ist). Nie eingetragene Gesten zählen ab Einrichtung.
    Push-Text: Gestenname + „Nicht weil der Kalender es sagt. Weil du ein Mann bist, der Acht gibt."
22. **Neutral-Modus:** Titel „Cyclemax", kein Body. **Verhütungs-Modus:** nur Periodenstart-Pushes.
