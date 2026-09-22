# 03 — Optimierungs-Backlog

Priorisiert P0 → P2. Jede Aufgabe wird als GitHub Issue angelegt (Vorlage in `.github/ISSUE_TEMPLATE.md`),
auf einem eigenen Branch umgesetzt und per PR mit Review durch einen anderen Agenten gemerged.

Legende Status: `⏳ offen` · `🚧 in Arbeit` · `✅ fertig`

---

## P0 — Sofort-Gewinne (hoher Wert, geringes Risiko)

### P0-01 Social-/SEO-Meta ergänzen (OG + Twitter + Canonical + JSON-LD)
- **Warum:** Beim Teilen (Instagram, WhatsApp, LinkedIn) rendert die Seite aktuell nur eine nackte URL.
- **Was:** `og:title`, `og:description`, `og:image` (bestehendes Intro-Endbild oder neues 1200×630), `og:url`,
  `twitter:card`, `canonical`, optional `Person`-JSON-LD.
- **Akzeptanz:** Teilen-Test zeigt Titel, Beschreibung, Bild.
- **Owner:** `chatgpt` (Texte) + `higgsfield` (Bild) + `claude` (Umsetzung). Status: ⏳

### P0-02 Heading-Semantik (h1/h2) ohne Sicht-Änderung
- **Warum:** Kein einziges `h1`/`h2` vorhanden → SEO & Screenreader strukturlos.
- **Was:** Header-Wortmarke als `h1` (visuell identisch), Kategorien als `h2`; CSS/Typo unverändert.
- **Akzeptanz:** Lighthouse/HTML-Validator meldet Heading-Struktur; Screenshot pixelgleich.
- **Owner:** `claude`. Status: ⏳

### P0-03 Kontrast `--muted` erhöhen (AA)
- **Warum:** `#7b7b75` ≈ 4,2:1 auf Weiß — unter AA (4,5:1) für Fließtext.
- **Was:** muted dunkler justieren (z. B. `#5f5f58`, mit allen drei Agenten auf Optik geprüft — der Grauton ist Teil des Looks).
- **Akzeptanz:** Kontrast-Rechner ≥ 4,5:1; Design-Look bleibt ruhig.
- **Owner:** `claude` (+ `higgsfield` Review). Status: ⏳

### P0-04 Intro-Gate: Skip + Besucher-Speicher
- **Warum:** 9,6 s Blockade bei jedem Besuch = Absprungrisiko, v. a. Mobile.
- **Was:** (a) dezenter „skip"-Hinweis (Klick ins Leere funktioniert bereits — sichtbar machen), (b) nach einmaligem
  Eintritt in `sessionStorage` merken → gleiche Session/Rückkehr überspringt das Video (Endbild kurz zeigen oder direkt Inhalt).
- **Nicht:** Gate komplett entfernen — die Signatur ist das Markenzeichen (Freigabe von Paul nötig).
- **Akzeptanz:** Zweiter Besuch in Session zeigt Inhalt ohne Wartezeit; einmal Klick läuft wie bisher.
- **Owner:** `claude` + `higgsfield` (Motion-Feeling). Status: ⏳

### P0-05 Ritual-Plant-Link auf echte Shop-Seite
- **Warum:** ritualplantseeds.higgsfield.app ist live; mailto ist der schwächste Weg zum Verkauf.
- **Was:** „discover ↗" → shop-Link; Text unverändert. (Bestehende Brand-Identität beachten.)
- **Akzeptanz:** Klick öffnet Shop in neuem Tab; Rest unverändert.
- **Owner:** `claude` + Freigabe `paul`. Status: ⏳

---

## P1 — Struktur & Qualität

### P1-01 Mobile-Verifikation auf echten Geräten
- **Warum:** Headless-Mobile-Screenshot lieferte **weiße Fläche** — vermutlich blockiertes Video-Autoplay im
  Intro-Gate, kein belegter Bug. Muss auf iPhone + Android verifiziert werden.
- **Was:** Test in Safari/Chrome Mobile; bei Bestätigung: Gate-Größe/Entry-Verhalten mobil überarbeiten
  (evtl. Video erst nach Klick starten).
- **Owner:** `paul` (Test auf Gerät) mit `claude` (Fix). Status: ⏳

### P1-02 Hover-/Fokus-Zustände auf Zeilen
- **Warum:** 9 von 10 Besuchern erkennen Klickbarkeit nicht sofort; aktuell nur Unterstrich im Header.
- **Was:** dezente Zeilen-Hover (z. B. muted-Farbwechsel + Plus-Drehung), `cursor: pointer` (fehlt bei summary teils), Touch-tauglich.
- **Akzeptanz:** Hover auf Kategorie- und Projektzeilen fühlt sich „teuer" an, bleibt ruhig.
- **Owner:** `higgsfield` (Look) + `claude` (Code). Status: ⏳

### P1-03 Footer bereinigen
- **Warum:** `paul brink` wirkt abgeschnitten und bricht die Fluchtlinie.
- **Was:** entweder `paul brinkmann` oder sinnvoller Inhalt (Impressum-Link, Jahr, E-Mail-Direktlink „orders@…").
  Europarechtlich (Dienstleistungen, Coaching) ist ein Impressums-Zugang ohnehin empfehlenswert → Entscheidung Paul.
- **Owner:** `chatgpt` (Vorschläge) + `paul`. Status: ⏳

### P1-04 404-Seite im selben Design
- **Was:** statische `404.html` im Look der Seite („nothing here. one purpose: build." o. ä. — Textvorschlag `chatgpt`).
- **Akzeptanz:** Direktaufruf einer Fantasie-URL zeigt die Seite.
- **Owner:** `claude`. Status: ⏳

### P1-05 Analytics-Option entscheiden
- **Warum:** Ohne Daten keine fundierte Optimierung (z. B. Intro-Abbruchrate).
- **Was:** datensparsame Variante vorschlagen (keine Cookie-Banner-Pflicht bei cookieless Setup möglich nach EU-Lage — prüfen!),
  Entscheidung durch Paul.
- **Owner:** `chatgpt` (Datenschutz-Recherche) + `paul`. Status: ⏳

---

## P2 — Wachstum (nur wenn Paul beauftragt)

### P2-01 Eigene Unterseiten statt „alles im Akkordeon"
- Projekte wie «real estate», «blueprints» oder «health system» bekommen eigene Detailseiten (gleiche Design-Sprache).
- Voraussetzung: Inhalte von Paul (Fotos, Referenzen, Preise).

### P2-02 Hosting-Umzug evaluieren
- ChatGPT-Hosting ist funktional; ein eigener Standort (z. B. Cloudflare Pages / GitHub Pages / Higgsfield-Builder)
  bringt Analytics, Redirect-Kontrolle und einfachere CI. `.openai/hosting.json` dann dort spiegeln.
- DNS/Domain-Entscheidung liegt bei Paul.

### P2-03 Mehrsprachigkeit (en/de)
- Content aktuell englisch, Zielgruppe teils DACH. Sprach-Toggle als eigener Issue-Komplex.

### P2-04 Newsletter-/Kontaktformular
- Ersatz für reine mailto-CTAs. Voraussetzung: Backend-Vertrag (Form-Service, DSGVO).

### P2-05 Intro-Pipeline aufräumen & dokumentieren
- **Warum:** `dist/assets/` hält 15 nicht referenzierte Intro-Varianten (~1,7 MB); die drei Render-Skripte sind
  unkommentiert im Team-Kontext.
- **Was:** referenzierte Assets bestimmen, Legacy auslagern (z. B. `artefacts/` oder Repo-History), Skript-Ablauf
  (Foto → Trace → Pen-Reveal → MP4) als Kurzanleitung dokumentieren. Nur mit Freigabe Paul (Dateien sind verlustfrei
  remixbar — erst Versionssicherung).
- **Owner:** `claude`. Status: ⏳

## Audit-Stand 2026-09-22 — lokal vorbereitet, noch nicht veröffentlicht

- #1 / P0-01: Canonical, OG-/Twitter-Textmetadaten und Person-JSON-LD ergänzt. Social-Bild und echter Sharing-Test bleiben offen.
- #2 / P0-02: Eine h1 und drei h2 mit unveränderten Schriftmaßen ergänzt. Visueller Vergleich noch offen.
- #3 / P0-03: Sekundärfarbe #6a6a63, berechneter Kontrast 5,45:1 auf Weiß. Visueller Vergleich noch offen.
- #4 / P0-04: Sichtbares „enter →“, Session-Merker, Reduced-Motion, Hintergrund-inert, Fokusübergabe und robuste Fallbacks implementiert. Ohne JS bzw. bei ausgefallenem app.js bleiben Inhalte standardmäßig zugänglich. Video-Datei unverändert.
- Unabhängiger Agenten-Code-Review: Übergangsregression gefunden und korrigiert; statische Nachprüfung ohne weitere Befunde.
- Syntaxprüfung und acht isolierte JavaScript-Verhaltensszenarien bestanden; Metadaten/Links/Assets strukturell geprüft.
- Desktop-/Mobile-Browsertests ausstehend: Browser-Prozesse starten in dieser Host-Umgebung nicht (SIGABRT / Browser-Kernel-Abbruch). Keine visuellen Tests als bestanden markieren.
- GitHub-Schreibzugriff für Issues und Branches wird mit HTTP 403 abgewiesen. Kein PR und kein Push erfolgt; kein Review-Kommentar auf GitHub möglich.
- Paul bestätigt GitHub → Vercel als aktuellen Veröffentlichungsweg. Alte Sites-Konfiguration erhalten, dort nichts veröffentlicht.


## Nutzerkorrektur — einfache Projektliste

Auf ausdrücklichen Wunsch von Paul: Kategorien architecture & art / health / mind entfernt, alle neun Projekte in gleicher Reihenfolge als direkt sichtbare, einzeln aufklappbare Liste. Kopftext: „one person. different fields.“ in einer Zeile, darunter „one purpose: build“ ohne Schlusspunkt. Projektüberschriften nun h2. Inhalte, Links und Intro unverändert. Lokal umgesetzt; GitHub-Schreibzugriff und visuelle Browserprüfung weiterhin offen. Diese Anweisung ersetzt die bisherige Drei-Kategorien-Vorgabe.


## Veröffentlichung — Issue #6

GitHub-Anmeldung wiederhergestellt. Paul hat die Veröffentlichung der aktuellen flachen Projektliste ausdrücklich beauftragt. Implementierung und unabhängiges statisches Review abgeschlossen; JavaScript-Syntaxprüfung und isolierte Verhaltensprüfungen erneut bestanden. Visuelle Desktop-/Mobile-Prüfung bleibt wegen des Browser-Absturzes offen. Produktionsstatus wird im verknüpften Pull Request und in Vercel dokumentiert. Refs #1 (Textmetadaten, Bild offen), #2 (durch flache Liste angepasst), #3, #4.


## Korrektur Handschrift — Issue #8

Paul meldet, dass die Handschrift nach der Veröffentlichung nicht mehr sichtbar ist. Ursache: Session-Merker übersprang das Intro bei Rückkehr. Merker entfernt; Handschrift bei jedem Aufruf. Bei reduzierter Bewegung wird das bestehende Endbild statt des Videos gezeigt. Original-Video, Projektliste und expliziter Einstieg bleiben unverändert. Diese Nutzerkorrektur ersetzt den Besucher-Speicher aus P0-04.

## Kaufprozess — Issue #11, Entwurf

Paul priorisiert PDF-Guides, Kefirpilze, Sauerteigstarter und Bücher gleichwertig. Diese Angebote sind im Entwurf direkt sichtbar; übrige Projekte folgen als flache Liste. Hero und Signatur bleiben erhalten. Shopify-Anbindung vorgeschlagen, aber noch nicht bestätigt; Produktnamen/Preise/Versandangaben stehen aus. Keine produktive Veröffentlichung des unvollständigen Kaufprozesses. Details: `docs/05-kaufprozess.md`.

### Update Issue #11 — eigener Shop statt Shopify

Paul wählt ausdrücklich eine eigene Umsetzung. Warenkorb, serverseitig validierter Stripe-Checkout und geprüfte Zahlungsstatus-Abfrage sind als deaktivierter Entwurf implementiert. Preise, konkrete Artikel, Stripe-Konto, Versand und Auslieferungsprozess fehlen weiterhin. Shopify wird nicht angebunden. Kein produktiver Verkauf freigeschaltet; Details und Aktivierungsbedingungen in `docs/05-kaufprozess.md`.
