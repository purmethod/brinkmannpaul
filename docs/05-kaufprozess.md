# Kaufprozess — Umsetzung zu Issue #11

Paul möchte vier gleichwertige Angebote verkaufen: PDF-Guides, Kefirpilze, Sauerteigstarter und eigene Bücher. Noch kein Shop oder Zahlungsanbieter vorhanden. Die Website bleibt bei GitHub → Vercel.

## Vorbereitet

- Vier gleichwertige, direkt sichtbare Produktzeilen mit eigenen IDs: `#pdf`, `#kefir`, `#sourdough`, `#books`.
- Kopftext und Signatur aus der freigegebenen Version unverändert.
- Einstieg „explore products“ und Navigation zu Produkten / weiterer Arbeit.
- Beschreibungen aus dem Inhaltsinventar; Bücher nur als „books by paul brinkmann“, bis Titel/Inhalt bekannt sind.
- Verbleibende Projekte und Angebote weiterhin als flache Liste zugänglich.
- Kontaktlinks heißen ausdrücklich „request details“. Kein vorgetäuschter Checkout, keine erfundenen Preise oder Lieferzusagen.

## Empfohlene Anbindung

Shopify als Produkt-, Bestell- und Zahlungsverwaltung. Bestehende Website behalten und bestätigte Shopify-Produkte über Buy Buttons oder produktspezifische Checkout-Links anbinden. PDFs über die Digital-Downloads-App ausliefern. Der Connector wurde zur Einrichtung vorgeschlagen; Verbindung noch nicht bestätigt.

Offizielle Grundlagen:
- https://help.shopify.com/en/manual/online-sales-channels/buy-button
- https://help.shopify.com/en/manual/products/digital-service-product/selling-services-or-digital-products

## Benötigte Produktdaten

| Angebot | Bereits bestätigt | Noch erforderlich |
|---|---|---|
| PDF-Guides | digitale Guides; bestehende Sammelbezeichnung blueprints | konkrete Titel, Preis/Währung, Beschreibung je Datei, Download-Dateien |
| Kefirpilze | lebende Kefirkultur plus Anleitung | Portionsgröße, Preis/Währung, Bestand, Versandländer, Versandkosten/-dauer |
| Sauerteigstarter | aktive Kultur plus Fütterungs- und Erstbrotanleitung | Portionsgröße, Preis/Währung, Bestand, Versandländer, Versandkosten/-dauer |
| Bücher | Pauls eigene Bücher | Titel, Format (gedruckt/digital), Beschreibung, Preis/Währung, Cover, Druckbestand oder Dateien |

Shop-Einrichtung benötigt außerdem die echten Verkäufer-/Geschäftsangaben und vom Zahlungsanbieter verlangte Verifizierung. Diese Angaben dürfen nicht erfunden werden. Kostenpflichtigen Tarif nicht ohne konkrete Auswahl beauftragen.

## Abnahme vor dem Verkaufsstart

1. Angebote mit bestätigten Daten in Shopify anlegen, Kaufabschluss und Lieferprozess konfigurieren.
2. Preise und tatsächliche Produktdaten in die Website übernehmen. Kaufen nur bei aktivem, passendem Checkout anbieten.
3. Testmodus: Produkt → Warenkorb/Checkout → erfolgreiche/abgebrochene Zahlung prüfen. Keine echte Belastung im Test.
4. Physische Bestellungen im Shop und digitale Dateiauslieferung prüfen; keine Dateien allein durch einen frei zugänglichen Success-Link freischalten.
5. Geschäftskontakt, Liefer-/Rückgabeinformationen und für den Shop erforderliche Rechtstexte mit echten Angaben einbinden.
6. Mobile/Desktop-Browserprüfung und Veröffentlichung. Der lokale Browser war zuletzt durch einen Host-Absturz blockiert; statische Codeprüfung ersetzt keine visuelle Abnahme.

Die aktuelle Vorschau ist die Angebotsseite. Ein vollständiger, funktionierender Kauf-Funnel ist sie erst nach diesen Schritten.
