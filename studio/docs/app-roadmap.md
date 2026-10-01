# Vom eigenen Tool zur App im App Store

Stand: 01.10.2026. Ziel: Creator laden Video oder Text hoch, wählen eine Vorlage, und die App schneidet,
untertitelt, schreibt die Caption und postet automatisch. @brinkbuild ist Kunde Nr. 1 und der öffentliche Beweis.

## Was schon app-fähig ist

- **Engine und Brand-Kit getrennt:** Die Engine (`lib/`, `worker/`) kennt keine Markenwerte. Ein Brand-Kit besteht aus
  `brands/<id>/` im Repo plus Overrides in der App (Redis + Blob: Signatur, Auto-Approve).
- **Mehrere Marken:** Redis-Keys sind pro Marke getrennt (`brand:<id>:…`), dazu Instagram-Token und -Konto pro Marke.
  Der Cron postet jede Marke zu ihrer eigenen Uhrzeit in ihrer eigenen Zeitzone.
- **Austauschbares Vorlagen-Schema:** `templates.json` kann 1:1 als Datenbank-Spalte (JSON) pro Kunde dienen.

## Was für die App fehlt (kritischer Pfad zuerst)

| # | Baustein | Entscheidung | Warum |
| --- | --- | --- | --- |
| 1 | **Meta App Review** | sofort starten: Business-Verifizierung + Advanced Access für `instagram_business_basic` und `instagram_business_content_publish` | Ohne Review kann die App nur auf eigene/Test-Konten posten. Dauert Wochen, deshalb der kritische Pfad. |
| 2 | **Instagram-OAuth pro Nutzer** | „Business Login for Instagram“ (Code-Flow → Long-Lived-Token → in `brand:<id>:ig:token`) | Ersetzt den eingefügten `IG_ACCESS_TOKEN`. Die Token-Logik (`lib/token.ts`) bleibt. |
| 3 | **Accounts + Datenbank** | Postgres (Neon über Vercel Marketplace): users, workspaces, brands, posts. Redis nur noch für Locks | Mandantenfähigkeit, Abrechnung, Löschung von Accounts |
| 4 | **Login** | Sign in with Apple + E-Mail-Magic-Link (Better Auth oder Clerk) | Apple verlangt Sign in with Apple, sobald andere Social-Logins angeboten werden |
| 5 | **Video-Worker** | weg von GitHub Actions, hin zu Modal (Python, ffmpeg, Whisper, Abrechnung pro Sekunde). `process_video.py` läuft fast unverändert | Die Actions-Nutzungsbedingungen verbieten projektfremde Rechenlast. Außerdem skaliert es nicht und hat keine SLA. |
| 6 | **Zeitplanung** | Upstash QStash: eine geplante Zustellung pro Post zur Wunschzeit | Exakte Uhrzeit pro Nutzer/Zeitzone statt eines festen Tages-Crons |
| 7 | **iOS-App** | Expo (React Native), spricht dieselbe API. Hintergrund-Upload, Push bei „gepostet“/„Fehler“ | Ein Codebase für iOS und Android. Eine reine Web-Hülle riskiert die Ablehnung nach Guideline 4.2. |
| 8 | **Bezahlung** | iOS: In-App-Abo über RevenueCat. Web: Stripe | Guideline 3.1.1: digitale Abos in der iOS-App laufen über IAP |
| 9 | **App-Store-Pflichten** | Account-Löschung in der App, Datenschutzerklärung, Privacy Labels, kein „Instagram“ im App-Namen | Guideline 5.1.1(v) + Markenrecht von Meta |

## Phasen

1. **Jetzt bis Woche 1:** @brinkbuild postet täglich. Meta-Business-Verifizierung und App Review beantragen,
   Apple Developer Program (99 $/Jahr) anlegen, App-Namen prüfen (Marke + App Store).
2. **Woche 2–4:** Backend mandantenfähig machen (Postgres, Login, OAuth, Brand-Kit-Editor, Modal-Worker,
   QStash). Web-Beta mit 10 Creatorn aus deinem Umfeld.
3. **Woche 4–8:** Expo-App (Upload, Vorlage, Vorschau/Freigabe, Push, Paywall), TestFlight.
4. **Danach:** App-Store-Einreichung, Android aus demselben Code.

## Positionierung

Die Technik (Auto-Cut, Untertitel, Planung) bieten CapCut, Opus Clip, Buffer und Later schon an. Der Burggraben ist
**Geschmack als Produkt**: ruhige, hochwertige Vorlagen (Bauhaus statt KI-Look), die eigene Signatur auf jedem
Post, Captions im eigenen Ton — fertig in 60 Sekunden vom Handy. Der Vertrieb läuft über @brinkbuild selbst:
jeder Post ist eine Demo der App.
