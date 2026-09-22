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