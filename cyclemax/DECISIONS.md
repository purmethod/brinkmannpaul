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
