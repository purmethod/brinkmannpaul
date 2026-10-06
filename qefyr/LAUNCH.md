# qefyr.com live schalten

Code, Design, Texte (DE + EN), Checkout und Tests sind fertig. Was fehlt, sind Zugänge und Angaben, die nur du hast.
Reihenfolge einhalten. Abschnitt 4 sind harte Blocker: ohne sie nicht live gehen.

## 1. Repository anlegen (2 Minuten)

Claude darf auf GitHub keine neuen Repos anlegen (die Claude-App hat dafür keine Berechtigung). Deshalb liegt der Code
vorerst im Ordner `qefyr/` auf dem Branch `claude/wonderful-gauss-7apfed` von `purmethod/brinkmannpaul`.

1. github.com/new → Owner `purmethod`, Name `qefyr`, **leer** (kein README, keine .gitignore).
2. Danach entweder Claude sagen „repo ist da“ (Claude schiebt den Code mit sauberer Historie rüber) oder selbst:

```bash
git clone https://github.com/purmethod/brinkmannpaul.git && cd brinkmannpaul
git checkout claude/wonderful-gauss-7apfed
git subtree split --prefix=qefyr -b qefyr-main
git push https://github.com/purmethod/qefyr.git qefyr-main:main
```

## 2. Vercel (5 Minuten)

1. vercel.com/new → `purmethod/qefyr` importieren. Framework „Other“, sonst nichts ändern (`vercel.json` regelt Build und Ausgabe).
2. Settings → Environment Variables (Production und Preview):
   - `STRIPE_SECRET_KEY` = `sk_live_…` (oder ein Restricted Key `rk_live_…` mit Schreibrecht auf Checkout Sessions)
   - `STRIPE_PUBLISHABLE_KEY` = `pk_live_…` (gleiches Konto, gleicher Modus)
   - optional `SITE_URL` = `https://qefyr.com`
3. Settings → Domains: `qefyr.com` und `www.qefyr.com` (www als Redirect auf qefyr.com). Die DNS-Einträge zeigen bereits auf Vercel
   (216.198.79.x). qefyr.com liefert gerade 503: die Domain hängt vermutlich an einem Vercel-Projekt ohne
   Deployment. Dort entfernen und hier hinzufügen.
4. Redeploy. Dann `https://qefyr.com/api/health` öffnen: dort muss `"ready": true` stehen.

## 3. Stripe (10 Minuten)

- **Eigenes Stripe-Konto für qefyr** (Dashboard → Konto-Menü → „Neues Konto“). Mit dem ÂLF-Konto stünde ÂLF im
  Checkout und auf dem Kontoauszug der Kunden.
- Settings → Business → Public details: Name `qefyr`, Support-E-Mail, Statement Descriptor `QEFYR`.
- Settings → Branding: Icon `static/img/icon-512.png`, Farbe `#1c2a21`, Akzent `#b08d57`.
- Settings → Payment methods: Karten, Apple Pay, Google Pay, PayPal, Klarna einschalten. Alles, was hier aktiv
  ist, erscheint automatisch im Checkout.
- Settings → Payment method domains: `qefyr.com` hinzufügen (sonst kein Apple Pay im eingebetteten Checkout).
- Settings → Customer emails: „Successful payments“ an (Zahlungsbeleg für Kunden).
  Benachrichtigung für dich: Settings → Notifications → Successful payments.
- **Erst testen:** Testschlüssel (`sk_test_…`/`pk_test_…`) in Vercel, auf qefyr.com bestellen mit Karte
  `4242 4242 4242 4242`, beliebiges Datum in der Zukunft, beliebige CVC. Danach Live-Schlüssel eintragen.

## 4. Pflichtangaben (Blocker)

`node scripts/check.mjs` listet alles, was noch fehlt. Stand jetzt:

| Was | Wo | Warum |
|---|---|---|
| Verkäufer (Name/Firma), Straße, PLZ/Ort, Telefon | `site.json → legal` | Impressum (§ 5 DDG), AGB, Datenschutz |
| USt-IdNr. **oder** `"small_business": true` (Kleinunternehmer) | `site.json → legal` | Preisangabe „inkl. MwSt.“ vs. „§ 19 UStG“ |
| Öko-Kontrollstelle `DE-ÖKO-0xx` | `site.json → legal` | „Bio“ darf nur mit Zertifizierung beworben werden (VO (EU) 2018/848) |
| Füllmenge in ml | `shop.json → product.volume_ml` | Pflicht (LMIV); der Grundpreis pro Liter erscheint dann automatisch (PAngV) |
| Fettstufe, Lagerhinweis, Nährwerte, MHD-Hinweis | an Claude schicken | Pflichtangaben im Fernabsatz (LMIV Art. 14) |

Außerhalb des Codes:

- **Bio-Zertifizierung.** Ohne Kontrollnummer muss das Wort „Bio“ raus (je eine Zeile in `src/i18n/en.mjs` und `de.mjs`).
  Sonst Abmahnung und Bußgeld.
- **Lebensmittelbetrieb registrieren** beim zuständigen Lebensmittelüberwachungsamt (Art. 6 VO (EG) 852/2004) und
  klären, ob für die Verarbeitung von Milch eine Zulassung nach VO (EG) 853/2004 nötig ist.
- **Rechtstexte prüfen lassen.** Impressum, Datenschutz, AGB und Widerruf sind sauber aufgesetzt, aber ein
  Schutzpaket (Händlerbund oder IT-Recht Kanzlei, ca. 10 bis 20 € im Monat, mit Abmahnschutz und Update-Service)
  ist billiger als eine einzige Abmahnung.

## 5. Annahmen, die du bestätigen musst

Diese Punkte stehen so auf der Seite. Ändern dauert jeweils eine Zeile.

- **Preis 29 €** (`shop.json → product.amount`): Premium-Positionierung. Zum Vergleich: ÂLF kostet 19 €.
- **Versand wie bei ÂLF:** Deutschland 6,19 €, EU 14,49 €, weltweit 27,49 €, alles DHL Paket mit Sendungsverfolgung.
  Lieferzeiten 1–3 / 2–6 / 4–14 Werktage (`shop.json → shipping`).
- **Höchstens 6 Stück pro Bestellung**, **Rabattcodes erlaubt** (für Creator-Codes; in Stripe unter Produkte → Gutscheine anlegen).
- **Lieferumfang:** lebender Kefir mit Knollen, trinkfertig, Pauls Methode, Anleitung für den Start.
- **Sendungsnummer:** Laut FAQ und Datenschutz schickst du sie selbst per E-Mail. Die Kunden-E-Mail steht in Stripe bei der Zahlung.
- **Kontakt:** `brinkmannbuild@gmail.com` (wie bei ÂLF). Besser: `hello@qefyr.com` einrichten, dann in `site.json` tauschen.
- **Anne Maria:** Auf der Gründerseite steht nur „hat qefyr zusammen mit Paul gegründet“. Foto (4:5) und zwei Sätze fehlen.
- **Die Methode** ist bewusst allgemein beschrieben (trinken → Milch dazu → wiederholen). Sobald du sie erklärst,
  baut Claude sie konkret ein.

## 6. Risiken, direkt

1. **Weltweiter Versand eines lebenden Milchprodukts mit DHL Paket International** dauert 4 bis 14 Tage, ungekühlt.
   Der Kefir fermentiert weiter, wird sauer und baut CO₂-Druck auf: Flaschen können auslaufen. Die Knollen überleben
   das, der trinkfertige Kefir nicht zuverlässig. Bis die Verpackung getestet ist: Zonen EU und Welt mit DHL Express
   oder vorerst nur DE/AT/CH (`shop.json`). Verschluss mit Druckausgleich verwenden.
2. **Einfuhrregeln für Milchprodukte.** Großbritannien verbietet seit April 2025 private Einfuhren von
   EU-Milchprodukten. Die USA verlangen für Lebensmittelsendungen von Firmen eine FDA Prior Notice. Australien und
   Neuseeland haben strenge Biosecurity-Regeln. Solche Länder aus `shop.json → world.countries` streichen oder vorher
   klären, sonst werden Pakete vernichtet und du erstattest.
3. **Verpackung:** Glas statt Kunststoff. Kefir ist sauer, und Säure erhöht die Migration aus Kunststoff
   (Mikroplastik, Weichmacher). Glas passt außerdem zur Luxus-Positionierung.
4. **Gesundheitsversprechen:** Auf der Seite steht keins, und das muss so bleiben. „Probiotisch“, „gut für den Darm“
   oder „stärkt das Immunsystem“ sind für Kefir in der EU nicht zugelassen (VO 1924/2006). Abmahnvereine suchen genau
   danach. Deshalb steht auch der Vitamin-Satz von brinkmannpaul.com (B3 +202 % usw.) bewusst nicht im Shop: Im Verkauf
   wäre das eine unzulässige nährwertbezogene Angabe. `scripts/check.mjs` schlägt Alarm, wenn so etwas reinrutscht.

## 7. Weg zu 10 Verkäufen am Tag

- **Mathematik:** 10 Bestellungen bei ca. 35 € Warenkorb sind ca. 350 € am Tag bzw. 10.500 € im Monat. Bei 2 bis 3 %
  Conversion brauchst du 350 bis 500 Besucher pro Tag. Das schafft nur Instagram/Reels plus Creator.
- **Echte Fotos und Videos sind der größte Hebel.** Du gießt qefyr ein, Knollen in der Hand, Berchtesgaden. Die
  Illustrationen sind ein hochwertiger Platzhalter, ersetzen aber keine echten Bilder. Shot-Liste: `docs/photos.md`.
- **Wiederkäufe einplanen.** Wer die Knollen hat, kauft nicht nach. Umsatz pro Kunde kommt über Geschenke
  (Mehrfachkauf ist schon angelegt: „Einen für dich, einen zum Verschenken“), Bundle mit ÂLF („lebende Küche“),
  Zubehör (Glas, Sieb), Ersatzkultur-Abo und Gutscheine.
- **Creator-Codes:** Rabattcodes sind im Checkout aktiv. Pro Creator ein Code bedeutet messbaren Umsatz pro Kanal.
- **Bewertungen:** Ab der ersten Woche echte Kundenstimmen einsammeln (nie erfinden: UWG). Mit Stimmen auf der Seite
  steigt die Conversion spürbar.
- **Messen:** In Vercel „Web Analytics“ einschalten (cookiefrei, kein Banner nötig). Dann siehst du, wo Besucher
  abspringen.
