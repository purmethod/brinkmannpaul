# Eigener Shop — Issue #11

Paul hat einen eigenen Shop ohne Shopify gewählt. Vier gleichwertige Angebote: PDF-Guides, Kefirpilze, Sauerteigstarter und eigene Bücher. Website und APIs laufen bei GitHub → Vercel; Stripe übernimmt ausschließlich den gehosteten Zahlungsabschluss.

## Implementierter Entwurf

- Vier sichtbare Produktzeilen, bestehende Signatur, unveränderter Zweizeiler und weitere Projekte.
- Warenkorb mit Mengen, Zwischensumme, optionaler lokaler Speicherung und Tastaturdialog.
- `GET /api/catalog` liefert freigegebene öffentliche Produktdaten; ungeklärte Angebote behalten ihre Anfrage-Links.
- `POST /api/checkout` akzeptiert nur IDs/Mengen und einen Wiederholungsschlüssel. Preis, Währung, Menge und Versand werden serverseitig bestimmt und gegen Stripe geprüft.
- `GET /api/order` prüft die Zahlung bei Stripe. Die Bestätigungsseite wertet keinen frei manipulierbaren „success“-Parameter als Zahlung aus und gibt keine Kundendaten aus.
- Keine Kartendaten oder geheimen Stripe-Schlüssel im Browser.
- Kein neues Framework und keine Laufzeitabhängigkeiten.

## Was der Entwurf noch nicht leistet

Kein Zahlungsanbieter ist angemeldet, kein Produkt hat bestätigte Preise oder Artikelvarianten, keine reale Zahlung wurde getestet. Keine automatische PDF-Auslieferung, keine Versandetiketten, kein Lager-/Bestandsabgleich, keine eigene Bestelldatenbank. Deshalb bleiben Verkäufe standardmäßig deaktiviert.

Für einen ersten kleinen Verkaufsstart kann Paul bestätigte Bestellungen manuell im Stripe-Dashboard bearbeiten und Waren beziehungsweise Dateien persönlich ausliefern. Diese Arbeitsweise und konkrete Lieferzeiten müssen vor Aktivierung bestätigt sein. Die Seite verspricht keinen Sofortdownload oder bereits erfolgten Versand. Automatische Lieferung benötigt signierte Webhooks, dauerhaft gespeicherte Erfüllungszustände und sichere Datei-/E-Mail-Zustellung; die Zahlungsbestätigungsseite ersetzt das nicht.

## Fehlende Produktdaten

| Angebot | Bekannt | Noch erforderlich |
|---|---|---|
| PDF-Guides | digitale Guides | konkrete Titel, Preis/Währung, Beschreibung je Datei, Dateien |
| Kefirpilze | lebende Kultur plus Anleitung | Portionsgröße, Preis/Währung, verfügbare Menge, Versandländer/-kosten/-dauer |
| Sauerteigstarter | aktive Kultur plus Fütterungs-/Erstbrotanleitung | Portionsgröße, Preis/Währung, verfügbare Menge, Versandländer/-kosten/-dauer |
| Bücher | Pauls eigene Bücher | Titel, Print oder digital, Beschreibung, Preis/Währung, Cover, Bestand oder Dateien |

## Einrichtung

1. Stripe-Konto von Paul aktivieren und zuerst Testmodus nutzen. Geheime Schlüssel ausschließlich als Vercel-Umgebungsvariablen bzw. lokal in ignorierter `.env.local` in der Repository-Wurzel speichern; niemals im Chat, in Git oder in der öffentlichen Ausgabe.
2. Konkrete Stripe-Produkte/Einmalpreise anlegen. `dist/shop/products.json` mit bestätigten Daten befüllen. Beträge sind ganzzahlige Minor Units, z. B. Cent bei EUR. Unterstützt: EUR, USD, GBP, CHF. Alle Artikel sind jetzt `active: false` und `confirmed: false`; Bücher haben noch kein bestätigtes Format.
3. Artikel einzeln aktivieren. `maxQuantity` begrenzt nur die Menge pro Bestellung; es ist kein Lagerbestand. Bestand und tatsächliche Lieferfähigkeit vor der Freigabe sicherstellen.
4. Umgebungsvariablen nach `.env.example` setzen. `SITE_URL` ist die echte erlaubte Origin. Für Preview-Tests eine separate Testkonfiguration mit deren Origin verwenden, keine Live-Schlüssel.
5. Physische Waren brauchen bestätigte `SHIPPING_ALLOWED_COUNTRIES` und passende `STRIPE_SHIPPING_RATE_IDS`; Versand wird bei Stripe geprüft.
6. Preis-/Steuerbehandlung, Verkäuferdaten, Kontakt, Liefer-/Rückgabeinformationen und erforderliche Rechtstexte mit echten Angaben fertigstellen. `SHOP_POLICIES_READY=true` ist nur die Bestätigung dieser Vorbereitung, kein automatischer Rechtscheck.
7. Manuelle oder automatische Erfüllung festlegen und betriebsbereit machen. `SHOP_FULFILLMENT_READY=true` bestätigt dies, implementiert aber keinen Versand und keine Downloads.
8. Erst nach diesen Voraussetzungen und den Tests `SHOP_ENABLED=true` setzen. Ohne alle Freigaben gibt der Checkout einen Nicht-verfügbar-Status zurück.

## Hosting

Die bestehende Vercel-Projektwurzel bleibt `dist`. Dort liegen ein eigenständiges `package.json`, `vercel.json` und die Funktionen unter `api/`. Der Build (`npm run build` innerhalb von `dist`) prüft JavaScript-Syntax und kopiert nur die ausdrücklich freigegebenen Website-Dateien und zwei referenzierte Intro-Assets nach `dist/public`. Vercel veröffentlicht ausschließlich diese statische Ausgabe und die API-Funktionen. `lib/`, `shop/`, Build-Konfiguration und Umgebungsdateien sind keine öffentlichen Dateien. Der Build benötigt keine Dateien außerhalb von `dist`.

Die vollständige Testsuite läuft aus der Repository-Wurzel vor dem Push; sie ist nicht Teil der Vercel-Projektwurzel. Die alte `.openai/hosting.json` bleibt als historischer Stand erhalten und darf für diesen Shop nicht verwendet werden, da sie den gesamten Quellordner `dist` statisch veröffentlichen würde.

## Lokale Entwicklung

Node.js 22 verwenden. Keine Pakete erforderlich.

```sh
npm run check
npm test
npm run dev
# Optional mit echten Test-Umgebungswerten:
node --env-file=.env.local scripts/dev-server.cjs
```

Vorschau standardmäßig auf `http://127.0.0.1:8766`. Der Entwicklungsserver baut vor dem Start und liefert ausschließlich `dist/public` sowie die drei API-Routen aus. Nach Änderungen neu starten. Keinen einfachen Static-Server auf `dist` verwenden: Er würde Serverquellcode veröffentlichen und unterstützt die APIs nicht. Für lokale Stripe-Testläufe zusätzlich `NODE_ENV=development`, `SITE_URL=http://127.0.0.1:8766` und ausschließlich einen Stripe-Testschlüssel verwenden.

## Vor echtem Verkauf prüfen

- Desktop/Mobile, Tastatur, Intro und Produktlinks tatsächlich im Browser prüfen.
- Preisänderung, ungültigen Warenkorb, API-Ausfall und abgebrochenen Checkout prüfen.
- Stripe-Testzahlung durchführen; offene/fehlgeschlagene Zahlungen dürfen keine Bestätigung oder Lieferung auslösen.
- Bestellinformationen im Dashboard prüfen, tatsächliche manuelle oder automatische Auslieferung testen.
- Live-Konfiguration erst nach bestätigter Produkt-/Versand-/Preis-/Steuerbehandlung aktivieren.

Offizielle Quellen:
- https://docs.stripe.com/checkout/fulfillment?payment-ui=stripe-hosted
- https://docs.stripe.com/payments/checkout/custom-success-page?payment-ui=stripe-hosted
- https://vercel.com/docs/functions/runtimes/node-js

## Verifikation dieses Entwurfs

68 automatisierte Tests bestanden (Warenkorb und API mit simulierten Stripe-Antworten), JavaScript-Syntaxprüfung bestanden. Lokaler HTTP-Test bestätigt den öffentlichen Entwurfskatalog und den gesperrten Checkout (503) ohne Zugangsdaten. Kein echter Stripe-Testkauf und keine visuelle Browserabnahme erfolgt.
