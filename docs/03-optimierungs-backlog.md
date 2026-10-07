# 03 — Optimierungs-Backlog

Priorisiert P0 → P2. Jede Aufgabe wird als GitHub Issue angelegt (Vorlage in `.github/ISSUE_TEMPLATE.md`),
auf einem eigenen Branch umgesetzt und per PR mit Review durch einen anderen Agenten gemerged.

Legende Status: `⏳ offen` · `🚧 in Arbeit` · `✅ fertig`

## Issue #43 — Neuroscience-Hintergrund und PURE (2026-10-06)

Status: umgesetzt; Veröffentlichung von Paul ausdrücklich freigegeben, unabhängiger Code-Review im zugehörigen PR.

- Freigegebener Entwurf: feine graue Gehirnkonturen und verzweigte Neuronen auf Weiß, als komprimiertes WebP (127 KB).
- Desktop mit Lesespalte links und Illustration rechts; mobile Darstellung mit Gehirn oben und ruhigen weißen Textflächen.
- PURE-Deskriptor und Kapiteltitel: physis, understanding, responsibility, ego. Einstieg in das erste Kapitel sprachlich angepasst.
- Aktuelle Projekte, Reihenfolge, Links, Originalporträt, Handschrift-Intro und JavaScript erhalten.
- Keine neuen Abhängigkeiten. Grafik dekorativ, ohne Interaktion und ohne Animation.
- Auf Pauls bestehende Credit-Saving-Anweisung keine Tests, Browserprüfungen, Screenshots oder lokalen Builds ausgeführt. Keine visuelle Prüfung der implementierten Website behauptet.
- Veröffentlichung über den bestehenden GitHub-PR/main/Vercel-Ablauf.

## Issue #38: Freigegebene PURE-Kapitel (2026-09-28)

Status: ✅ umgesetzt und geprüft; PR #39, unabhängiger Agent-Review ohne blockierende Befunde.

- Alle vier PURE-Kapitel wortgetreu durch Pauls freigegebenen englischen Entwurf ersetzt.
- 34 separate Absätze innerhalb der vorhandenen Kapitel-Akkordeons; bestehende Typografie und Abstände werden weiterverwendet.
- Durchgehend Kleinschreibung, keine Bindestriche oder Gedankenstriche in den neuen Texten.
- Inhaltsinventar aktualisiert. Keine Änderungen an anderen Projekten, CSS, JavaScript oder Assets.
- Paul hat die Veröffentlichung am 2026-09-28 ausdrücklich beauftragt. Veröffentlichung erfolgt nach Prüfung über den bestehenden GitHub/Vercel-Ablauf.
- Exakter Textvergleich (5/8/6/15 Absätze), Kleinschreibung, Prüfung auf Bindestriche/Gedankenstriche, `node --check dist/app.js` und `git diff --check` bestanden.
- Vercel-Vorschau auf Desktop (1363 × 936) und in mobilen Iframe-Viewports (390 px und 320 px) geprüft: alle vier Kapitel vollständig, kein horizontaler Überlauf, natürliche Absatzhöhen, Aufklappen funktioniert. Nur Browser-Erweiterungsfehler beobachtet; keine Website-Fehler.
- Temporäre mobile Prüfseite vor Merge entfernt. Produktionsdateien außerhalb der vier Kapitel sind byte-identisch zum Ausgangsstand.

## Issue #30 — Porträt mit Handschrift auf dem Hemd

Status: ✅ fertig; PR #31, unabhängiger Agent-Review ohne blockierende Befunde.

- Pauls Originalfoto erscheint direkt im Intro, monochrom über CSS, ohne Veränderung des Gesichts.
- Bestehende Handschrift liegt per Multiply über dem weißen Hemd; Animation und Endbild bleiben unverändert.
- Kein zusätzliches Warten: Tap-, Scroll-, Swipe- und Tastatureinstiege bleiben erhalten.
- Vercel-Browservorschau bei 1363 × 936 sowie in 390 × 844 und 320 × 568 Iframe-Viewports visuell geprüft: Gesicht und Schrift vollständig sichtbar. Klick, Scroll und Tastatur wechseln zur Projektliste.
- Syntaxprüfung und Diff-Prüfung bestanden. Temporäre QA-Seite vor Merge entfernt.
- Projektliste, Typografie, neuronaler Hintergrund und Fallbacks unverändert. Keine neuen Abhängigkeiten.

## Issue #24 — Zuverlässigkeit, Hintergrundinformationen, dezentes neuronales Netz

Status: implementiert und in Vercel-Vorschau geprüft; zur Veröffentlichung freigegeben (PR #25).

- Live-Ausgangsstand geprüft: SVG-Intro lief im Desktopbrowser, entsprach aber nicht der ursprünglichen MP4-Gestaltung (anderes Seitenverhältnis und dickere Schrift). Ein iPhone-Fehler ist in diesem Browser nicht direkt reproduzierbar.
- Statt weiterer alternativer Handschrift: originale MP4-Frames verlustfrei als einmalig abspielendes WebP exportiert (unter 300 KB); keine Video-Autoplay-Abhängigkeit, kein Playbutton.
- Ladefehler/Timeout und Reduced Motion zeigen das bestehende vollständige Endbild; Klick, Tastatur und Wischen erlauben weiterhin den sofortigen Einstieg. Tastatur-Skip-Link, stabile Fokusübergabe, Zoom-Geste nicht abfangen.
- Projektinformationen erweitert; `pure / system for man` aus Pauls letzter Inhaltskorrektur übernommen. Native Details funktionieren auch ohne JavaScript und lassen mehrere Rubriken gleichzeitig offen.
- Statisches, leichtes, hellgraues Synapsen-SVG; keine Canvas-Schleife, keine Abhängigkeiten, keine Klickblockade.
- `node --check dist/app.js`, `node scripts/test-site.mjs`, `git diff --check` bestanden. Bildfolge/Abspieldauer/Einmal-Wiedergabe mit Pillow geprüft.
- Paul hat am 2026-09-22 ausdrücklich den Ablauf „separate Vercel-Testversion, dort prüfen, danach live“ genehmigt, als Ausnahme zur lokalen Prüfung vor dem Upload.
- Vercel-Vorschau erfolgreich: Desktop (1363 px) und Mobile-Layout (390 px Frame / 375 px Inhaltsbreite) visuell geprüft; originale Handschrift vollständig sichtbar, kein Videoelement/Playbutton, Einstieg per Klick und Enter, alle sechs Rubriken geöffnet/geschlossen, kein horizontaler Überlauf auch bei geöffneten Texten. Nur Erweiterungsfehler des Testbrowsers, keine Website-Fehler beobachtet. Temporäre Testseite vor Merge entfernt.
- Unabhängiger Agentenreview ohne blockierende Codebefunde. Kein physisches iPhone/Safari verfügbar; diese Geräteprüfung wird nicht als durchgeführt behauptet.

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

## Intro-Fix + Kuration — Issue #10

**Root Cause Intro-Bug:** PR #7 hat `autoplay` vom `<video id="intro-video">` entfernt und `preload` von `auto` auf `none` gesetzt. Dadurch lehnt die Autoplay-Policy des Browsers den programmatischen `.play()`-Aufruf beim Seitenaufruf ab, der `catch`-Handler springt sofort zu `showCompleteHandwriting()` — die Handschrift-Animation wird nie sichtbar abgespielt, nur das Endbild erscheint sofort. Verifiziert per Live-Browser-Konsole (`currentTime: 0`, `paused: true`, Klasse `is-complete` bereits gesetzt). Fix: `autoplay` wiederhergestellt, `preload="auto"` wiederhergestellt (Stand vor PR #7).

**Kuration (Auftrag Paul, Sprachnachricht 2026-09-22):**
- `real estate agency`, `ritual plant`, `blueprints` entfernt.
- `pure method` → `pure code`, Typ `health system` → `life system for man`.
- `neuroarchitecture`-Beschreibung um recherchierten Hintergrund zum Feld Neuroarchitektur ergänzt (Quelle: allgemeine Fachliteratur, keine erfundenen Spezifika zu Pauls Person/Institution — siehe PR-Beschreibung für Quellen).
- `kefir`, `sourdough`, `mysidibou`, `wim hof instructor` unverändert (Paul: „kann man lassen").

Verbleibende Liste: neuroarchitecture, mysidibou, pure code, kefir, sourdough, wim hof instructor.
`docs/02-inhalts-inventar.md` synchronisiert. `node --check` in dieser Umgebung nicht möglich (kein Node installiert) — `app.js` in diesem Branch nicht verändert, nur `dist/index.html`.


## Korrektur Handschrift — Issue #8

Paul meldet, dass die Handschrift nach der Veröffentlichung nicht mehr sichtbar ist. Ursache: Session-Merker übersprang das Intro bei Rückkehr. Merker entfernt; Handschrift bei jedem Aufruf. Bei reduzierter Bewegung wird das bestehende Endbild statt des Videos gezeigt. Original-Video, Projektliste und expliziter Einstieg bleiben unverändert. Diese Nutzerkorrektur ersetzt den Besucher-Speicher aus P0-04.

## Intro-Autoplay auf iPhone verifiziert — Issue #10 Follow-up

Nach dem Autoplay-Fix meldete Paul, die Animation liefe auf dem iPhone weiterhin nicht. Temporärer `?debug=1`-Diagnose-Overlay in `app.js` (PR #14) live geschaltet und mit Paul gemeinsam ausgewertet: Log zeigte `play() promise resolved` und `event: playing` — die Animation lief tatsächlich, Paul bestätigte das visuell. Ursprünglicher Report kam vermutlich vor Abschluss des Deployments. Debug-Overlay wieder entfernt (PR #15), `app.js` seitdem wieder byte-identisch zum Stand nach #12.

## Site-Polish — Issue #16

Paul beauftragt eigenständige Optimierung ("mega machen"). Umgesetzt, risikoarm, ohne neue Abhängigkeiten:
- P1-02: Hover-/Focus-Zustand auf Projekt-Zeilen (item-name dunkler, Plus dreht sich schon beim Hover statt erst beim Öffnen).
- P1-03: Footer „paul brink" → „paul brinkmann" (abgeschnittener Name korrigiert).
- P1-04: `dist/404.html` im bestehenden Design ergänzt (`noindex`, Link zurück zur Startseite).
- P0-01 Rest: `og:image`/`twitter:image` auf bestehendes Signatur-Endbild gesetzt (kein neues Asset), `twitter:card` auf `summary_large_image`.
- mysidibou-Beschreibung um recherchierten Hintergrund ergänzt: Sidi Bou Saïd wurde im Juli 2026 als UNESCO-Weltkulturerbe eingetragen (whc.unesco.org/en/list/1769), mit realen Erhaltungsdrücken durch Tourismus, Bebauung und Kliff-Erosion (Quellen: France24, The New Arab, Carthage Magazine).
- Issue #5 (Ritual-Plant-Link) als überholt geschlossen — ritual plant wurde per Issue #10 entfernt.
- kefir, sourdough, wim hof instructor, pure code bewusst unverändert (Paul: „kann man lassen"); kein Eingriff in Issue #11 (Produkt-Shop/Checkout).


## #28 — Brand-Zeilen korrigieren (2026-09-25)

- Status: umgesetzt und geprüft; unabhängiges Review ohne blockierende Befunde. Desktop sowie mobile Ansichten bei 320 px und 390 px visuell geprüft; QEFYR-Aufklappen und JavaScript-Syntaxprüfung erfolgreich.
- QEFYR, RYE und SKYN behalten Pauls ausdrücklich gewünschte Großschreibung.
- RYE und SKYN erhalten dieselben Zeilenhöhen und mobilen Innenabstände wie die bestehenden Projekte.
- `by BRINKMANN` wird als kleinerer Zusatz dargestellt.
- Inhalte, Reihenfolge, Intro und übriges Design bleiben erhalten.
- Issue: https://github.com/purmethod/brinkmannpaul/issues/28


## Issue #32 — Randloser mobiler Porträt-Einstieg

Status: ✅ fertig; PR #33, unabhängiger Agent-Review ohne blockierende Befunde.

- Mobile Intro-Fläche absolut auf die sichtbare Bildschirmgröße begrenzt; Foto füllt sie per object-fit: cover ohne seitliche Balken.
- Handschrift unabhängig vom beschnittenen Foto unten verankert und nach dynamischer Viewporthöhe skaliert, mit Safe-Area-Abstand.
- Globale Viewport-Einstellung unverändert; Desktop und Projektseite unverändert.
- Vercel-Browservorschau bei 393×660, 393×852 und 320×568 geprüft: Bildgrenzen jeweils exakt 0/0 bis Viewportbreite/-höhe, vollständige Handschrift sichtbar, Klick öffnet i build.
- Temporäre QA-Seite vor Merge entfernt. Syntax- und Diff-Prüfung bestanden.


## Issue #34 — Markante Unterschrift und natürliche Currency-Reihenfolge

Status: ✅ fertig; PR #35; unabhängiger Agent-Review ohne blockierende Befunde.

- Handschrift auf Mobilgeräten bis zu ein Drittel breiter (48dvh, maximal 96vw), auf Desktop 96% der Porträtbreite.
- Neuer reproduzierbarer Renderer verwendet unveränderte Fotopixel und ersetzt nur den Currency-Bereich des bisherigen Videos.
- Explizite Reihenfolge C → U → R → R → E → N → C → Y, anschließend der Auslauf/Unterstrich. Die vorherige komponentenbasierte Sortierung konnte den Y-Auslauf zu früh anzeigen.
- Gerenderte Einzelbilder geprüft: kein vorzeitiges Y; neue H.264-Datei 60 fps, 137 KB. Originalvideo und vollständiges Standbild bleiben erhalten.
- Vercel-Vorschau 393×660, 393×852, 320×568: komplette größere Handschrift sichtbar, keine Seitenränder, Einstieg zu i build. funktioniert. Temporäre QA-Seite entfernt.
- Syntax/Diff-Prüfung bestanden, keine neuen Website-Abhängigkeiten.


## Issue #36 — Porträt in natürlichen Farben

Status: umgesetzt und in mobiler Vercel-Vorschau geprüft; PR #37.

- Ausschließlich den CSS-Graustufenfilter entfernt; unveränderte Originalfarben ohne Sättigungsverstärkung.
- Stylesheet-Cache aktualisiert; Bilddatei, Handschrift, Animation, Layout und Interaktionen unverändert.
- Unabhängiger Review ohne blockierende Befunde. Mobile Vorschau 393×720: Originalfoto in Farbe und vollständige schwarze Handschrift sichtbar.
- Temporäre QA-Seite vor Merge entfernt.


## Landingpage fertigstellen (2026-10-02)

Auftrag Paul: Fehler finden, flüssig machen, fehlende Texte ergänzen, jede Zeile anklickbar.

- Intro: Fällt `<source>` aus, meldet der Browser den Fehler am `<source>`-Element, nicht am `<video>` — bisher wartete die Seite dann 10 s auf ein Porträt ohne Handschrift. Jetzt: Fehler am `<source>` und fehlende H.264-Unterstützung zeigen sofort das Handschrift-Standbild. War das Video beim Laden von `app.js` bereits bereit (Cache), wurden Tempo 1,25 und `play()` übersprungen — behoben. Video pausiert nach dem Einstieg (keine Dekodierung im Hintergrund).
- Inhalt: rye leer → Pauls Sauerteig-Text wiederhergestellt; skyn statisch → aufklappbar mit belegtem Text; jede Zeile hat eine Aktion (siehe docs/02).
- Design: Plus-Hover dreht das ganze Kreuz statt nur einen Balken (vorher schief), Hover nur auf Geräten mit Maus (kein „klebender" Hover auf dem iPhone); PURE-Kapitel mit +/− und Abstand zum Text; Typ-Spalte breiter (keine Umbrüche auf Desktop); Aktionen in Ink unterstrichen; sanftes Auf-/Zuklappen in Browsern mit `interpolate-size` (sonst wie bisher).
- Barrierefreiheit: Bei „Bewegung reduzieren" landete der Fokus nach dem Einstieg auf `<body>` statt auf dem Inhalt. Ursache: `transition-duration: 0.01ms` auf allen Elementen ließ auch die geerbte `visibility` einen Frame lang „hidden" — `focus()` schlug still fehl. Jetzt `0s`.
- 404: Header/Footer wie Startseite, absoluter CSS-Pfad (funktioniert auch auf tiefen URLs).
- Tests: `scripts/test-site.mjs` an das aktuelle Video-Intro angepasst (war seit dem Wechsel zurück auf Video rot) und um Inhaltsprüfungen ergänzt.
- Prüfung: `node --check`, `node scripts/test-site.mjs`, Playwright-Screenshots Desktop 1440×900 und Mobile 390×844/375×667, keine horizontale Scrollbar.
- Offen für Paul: skyn-Text bestätigen; qefyr-Linktext war vorher die E-Mail-Adresse.


## Issue #45 — Transparente Projektliste und @paulbuild (2026-10-06)

- Paul meldet weiße Flächen hinter den Projekten, die das neuronale Motiv verdecken. Desktop- und Mobile-Hintergründe der Projektliste vollständig transparent gesetzt.
- Starke Maskierung und Höhenbegrenzung der Grafik entfernt. Dekorativer Hintergrund füllt fest den Viewport, bleibt auch beim Scrollen und Öffnen langer Kapitel sichtbar und blockiert keine Interaktionen.
- Instagram-Anzeige, Follow-Link, Footer beider Seiten und strukturierte Metadaten auf @paulbuild / instagram.com/paulbuild geändert.
- Keine Änderung an E-Mail-Adressen, PURE-Wörtern, Intro, Projektinhalt oder JavaScript.
- Statischer unabhängiger Agent-Review im PR dokumentiert. Keine Tests, Screenshots oder Builds gemäß Pauls Anweisung.


## Issue #47 — adopt âlf direkt zum Shop (2026-10-06)

- Auf Pauls Wunsch führt adopt âlf jetzt zu https://souralf.com/ statt zum Instagram-Profil.
- Instagram-Symbol und zugehörige Klasse nur an diesem Shop-Link entfernt, Beschriftung und Öffnen im neuen Tab erhalten.
- Alle anderen Inhalte und Links unverändert. Unabhängiger statischer Review im PR; keine Tests, Screenshots oder Builds gemäß Nutzeranweisung.


## Issue #49 — order qefyr direkt zur Website (2026-10-06)

- Auf Pauls Wunsch führt order qefyr jetzt zu https://qefyr.com/ statt zur Bestell-E-Mail.
- Beschriftung erhalten; Shop öffnet wie âlf in einem neuen Tab mit rel=noreferrer.
- Alle anderen Inhalte und Links unverändert. Unabhängiger statischer Review im PR; keine Tests, Screenshots oder lokalen Builds gemäß Nutzeranweisung.


## Issue #51 — Abstrakte Gehirnzeichnung ohne „i build.“ (2026-10-07)

- Paul hat den letzten Entwurf (05) zur Veröffentlichung freigegeben: abstraktes Gehirn, DNA und neuronale Verbindungen als feine graue Bleistiftzeichnung.
- Zwei transparente WebP-Grafiken für Quer- und Hochformat halten die zentralen Motive auch auf schmalen Bildschirmen sichtbar. Der feste Hintergrund bleibt beim Öffnen langer Kapitel präsent, Projektzeilen bleiben transparent.
- Die große Zeile „i build.“ entfernt, Projektliste direkt unter den kleinen Header gerückt; keine Ersatz-Headline. Social-Beschreibungen und 404-Rücklink angepasst.
- Porträt/Handschrift-Intro, JavaScript, alle Projekttexte und bestehende Shop-/Instagram-Links bleiben unverändert.
- Status: umgesetzt; PR #52, unabhängiger statischer Agent-Review ohne blockierende Befunde. Keine Tests, Screenshots, Browservorschauen oder lokalen Builds gemäß Pauls Anweisung.


## Issue #53 — Leichte Gehirnkonturen und sichtbare Synapsen (2026-10-07)

- Paul hat die neue Vorschau ausdrücklich zur Veröffentlichung freigegeben: feine helle Gehirnkonturen, sichtbarere neuronale Verbindungen auch im Gehirn und dezente DNA.
- Exakt das freigegebene Querformatmotiv als komprimiertes WebP übernommen; dazu eine angepasste Hochformatkomposition für schmale Bildschirme.
- Ausschließlich Hintergrundgrafiken und Stylesheet-Cache erneuert. Transparente Projektzeilen, Layout, Texte, Links, Porträt-/Handschrift-Intro und JavaScript bleiben erhalten.
- Status: umgesetzt; PR #54, unabhängiger statischer Agent-Review ohne blockierende Befunde. Keine Tests, Screenshots, Browservorschauen oder lokalen Builds gemäß Pauls Anweisung.


## Issue #55 — Instagram auf @buildpaul korrigiert (2026-10-07)

- Paul hat den richtigen Handle klargestellt: @buildpaul.
- Instagram-Linkziele, sichtbare Follow-/Footer-Texte und strukturierte Social-Metadaten auf der Startseite sowie der 404-Seite korrigiert.
- E-Mail-Adressen, Shop-Links, Texte, Design und Intro unverändert.
- Umsetzung im Issue-Branch mit unabhängigem statischem Agent-Review im PR. Keine Tests, Screenshots, Browservorschauen oder lokalen Builds gemäß Pauls Anweisung.


## Issue #57 — all art und eigene Art-Rubrik (2026-10-07)

- Eigene Art-Rubrik vor PURE im vorhandenen Akkordeon ergänzt. Text erklärt Pauls Definition von Kunst durch Liebe und das Bild des ersten menschlichen Dominosteins bei KI-Projekten.
- Geldpassage entfernt; Abschluss: people need love. whatever you build, bring love to it.
- Kopfzeile: paul brinkmann, m.sc.; artist & architect. Mittiges kursives Zitat „all art.“ mit paul darunter.
- Umsetzung im Issue-Branch zur Veröffentlichung über main/Vercel. Keine Tests, Screenshots, Vorschauen oder Reviews gemäß ausdrücklichem Credit-Sparwunsch.


## Issue #59 — Endlosrolle und scrollgesteuerter Gehirnzoom (2026-10-07)

- Paul hat die überarbeitete interaktive Vorschau ausdrücklich zur Veröffentlichung freigegeben: dunkle Projektnamen, hellere Beschreibungen, flüssiges Scrollen und sichtbarer Zoom ab der ersten Bewegung.
- Vorhandene Gehirnzeichnung wird direkt vergrößert und geht in die bereits freigegebene gezeichnete Mikrostruktur über. WebP-Detailgrafik unter 300 KB; keine zusätzlichen Abhängigkeiten.
- Nativer Touch-Nachlauf mit Stoppen beim Berühren. Identische Projektkopien werden im Stillstand zurückgesetzt; beim Mausrad werden Position und Ziel gemeinsam am Rand versetzt, damit die Bewegung weiterläuft.
- Neuere Art-Rubrik, „all art.“, aktuelle Kopfzeile, Texte, Links und Porträt-/Handschrift-Intro aus main erhalten. Branding-Alternativen werden separat mit Paul besprochen.
- Originale IDs, Direktlink #art und Fokus bleiben erhalten. Ohne JavaScript bleibt eine normale Projektliste verfügbar; reduzierte Bewegung verzichtet auf zusätzliches Mausrad-Easing.
- Unabhängiger statischer Agent-Review im PR dokumentiert. Keine Tests, Screenshots, Browservorschauen oder lokalen Builds gemäß Pauls Anweisung. Veröffentlichung über main/Vercel.


## Issue #61 — „all art.“ gestrichen (2026-10-07)

- Auf Pauls Wunsch das alleinstehende Zitat „all art.“ samt Attribution „paul“ oberhalb der Projekte entfernt.
- Den zugehörigen Einleitungssatz „when i say …“ im Art-Text entfernt; die Art-Rubrik mit der übrigen Erklärung bleibt erhalten.
- Kopfzeile, Intro, Projekte, Links und Endlosrolle/Gehirnzoom unverändert. Unabhängiger statischer Review im PR; keine Tests, Screenshots, Browservorschauen oder lokalen Builds gemäß Pauls Anweisung.
- Veröffentlichung über den bestehenden main/Vercel-Ablauf.


## Issue #59 — Korrektur der Zoomrichtung (2026-10-07)

- Paul meldet nach dem Hineinzoomen ein erneutes Herauszoomen. Ursache: Ganzbild-Überblendung auf eine kleinere Kopie der Detailzeichnung.
- Detailzeichnung wächst jetzt als weich maskierte Ebene innerhalb des Gehirns vom selben Fokuspunkt aus. Auch der erste Übergang wechselt nicht mehr das ganze Bild auf einmal.
- Drei geschachtelte Ebenen ersetzen den bisherigen Zweibild-Fade. Vor dem Zurücksetzen verdeckt die nächste Ebene die vorherige vollständig; die kleinste neue Ebene beginnt transparent. Sichtbare Strukturen bewegen sich beim Weiterscrollen nur nach außen, entsprechend einem Hineinzoomen.
- Vorhandene Bilder wiederverwendet. Scrollverhalten, Inhalt, Links, Intro und Kopfzeile unverändert; CSS-/JS-Version angehoben.
- Unabhängiger statischer Review im PR. Keine Tests, Browservorschauen, Screenshots oder lokalen Builds gemäß Pauls Anweisung. Veröffentlichung über main/Vercel.


## Picker-Rad und Tauchfahrt bis zur letzten Synapse (2026-10-07)

Auftrag Paul: Schrift mittig wie das Timer-Rad am iPhone, Mitte dunkler hervorgehoben, Rest verschwindet dezent; beim Drehen zoomt der Hintergrund bis zur letzten Synapse hinein und wieder heraus; flüssiger, schärfer, Schrift darf nicht mit dem Hintergrund konkurrieren.

- **Rad:** Projektnamen zentriert auf einem Zylinder. Mittlere Zeile dunkelgrau mit Untertitel zwischen zwei Ink-Linien, Nachbarn werden perspektivisch kleiner, heller und blenden aus. Nativer Scroll mit Einrasten pro Zeile (Schwung am Handy bleibt erhalten), endlos in beide Richtungen. Tippen auf eine Nachbarzeile dreht sie in die Mitte, Tippen auf die Mitte öffnet das Projekt.
- **Haptik:** Pro Raste ein Tick. Android über die Vibration API; iOS 17.4–26.4 über den Switch-Trick von Safari. Ab iOS 26.5 blockiert Apple skriptgesteuerte Haptik auf Websites — dort bleibt das Einrasten sichtbar, fühlbar ist es technisch nicht möglich.
- **Tauchfahrt:** Eine Umdrehung des Rads (alle Projekte) = Fahrt von der freigegebenen Gehirnzeichnung über die freigegebene Mikrostruktur in ein vektorgezeichnetes Neuron, einen Dendriten mit Dornen bis zu einer einzelnen Synapse (Bouton mit Vesikeln, Mitochondrium, synaptischer Spalt, postsynaptische Dichte, Rezeptoren). Die nächste Umdrehung zoomt zurück zum ganzen Gehirn. Ab der Neuronebene ist alles Vektor: in jeder Tiefe gestochen scharf, auch auf Retina. Die Rasterzeichnung bleibt beim Übergang als unscharfer Hintergrund stehen (Tiefenschärfe).
- **Schrift vs. Hintergrund:** Weißer Schleier hinter dem Mittelband; die Synapse landet auf breiten Bildschirmen rechts neben dem Rad, auf schmalen über dem Band. Hintergrund folgt dem Drehen weich gedämpft.
- **Leseansicht:** Projekttext öffnet als Dialog; der Titel steht exakt an der Bandposition, der Text läuft darunter, Hintergrund stark abgeblendet. Schließen über Knopf unten, Escape oder Zurück-Geste. Jedes Projekt hat einen Direktlink (`#art`, `#pure`, `#mysidibou`, `#qefyr`, `#rye`, `#skyn`, `#alf`, `#wim-hof-weekends`, `#neuroarchitecture`).
- **Barrierefreiheit:** Echte Buttons pro Projekt (Tab, Screenreader), Pfeiltasten drehen das Rad, Enter öffnet; sichtbarer Fokus am Band. `prefers-reduced-motion`: kein Zoom, keine Dämpfung. Ohne JavaScript bleibt die bisherige Liste mit allen Texten (`noscript` unverändert).
- **Neue Projekte:** Ein weiteres `<details class="project-item" id="…">` in `dist/index.html` erscheint automatisch im Rad; die Tauchfahrt passt sich der Anzahl an.
- **Technik:** Vanilla JS/CSS, keine Abhängigkeiten, keine neuen Assets. Zwei Canvas-Ebenen (Raster, Vektor), Pfade nach Breite und Raster-Zellen vorsortiert, nur Sichtbares wird gezeichnet. Gemessen: konstant 60 fps über die ganze Fahrt, < 0,5 ms Main-Thread pro Frame (Desktop 1×/2×, Mobile 3×).
- **Prüfung:** `node --check`, `node scripts/test-site.mjs` (an aktuelle Seite angepasst; war seit Entfernen von „i build." rot), 37 Playwright-Interaktionstests (Tippen, Zentrieren, Lesen, Zurück-Geste, Escape, Pfeiltasten, Tab-Fokus, Direktlink, Endlos-Scroll, reduzierte Bewegung, ohne JavaScript), Screenshots 1440×900, 1920×1080, 1024×768, 768×1024, 844×390, 390×844, 320×568, keine horizontale Scrollbar, keine Konsolenfehler. Nur Chromium verfügbar — Safari/iPhone bitte auf dem echten Gerät prüfen.


## Picker-Rad: Zoom auch bei „Bewegung reduzieren", Lesefluss ins nächste Thema (2026-10-07)

Rückmeldung Paul nach Livegang von #65: „es scrollt nicht rein"; beim Öffnen muss das hineingezoomte Bild im Hintergrund in seiner Position bleiben; am Ende des Textes soll das nächste Thema schon sichtbar sein.

- **Zoom:** Ursache war die Systemeinstellung „Bewegung reduzieren" — #65 hatte den Zoom dort komplett abgeschaltet. Wie schon in #59 entschieden, entfällt jetzt nur die Dämpfung; der Zoom folgt weiter dem Rad, das man selbst dreht. Vektor-Ebenen und Mikrostruktur werden immer geladen; schlägt der Aufbau der Vektor-Ebenen fehl, zoomt die Zeichnung als Raster weiter statt weiß zu werden. `Path2D.addPath`/`DOMMatrix` entfernt.
- **Leseansicht:** Der Zoom bleibt beim Lesen exakt stehen. Schleier nur noch 55 % plus helle Lesespalte hinter dem Text, damit das gezoomte Bild sichtbar bleibt.
- **Weiterlesen:** Die Leseansicht zeigt alle Projekte in Radreihenfolge ab dem geöffneten. Das nächste Thema steht direkt unter dem Textende. Liest man hinein, dreht das Rad eine Zeile weiter: Zoom macht einen Schritt, Adresse wechselt (z. B. `#mysidibou`), Haptik-Tick. Schließen landet auf dem zuletzt gelesenen Projekt; der Fokus springt nicht mehr auf das Ausgangsprojekt zurück.
- **Prüfung:** `node --check`, `node scripts/test-site.mjs`, eslint ohne Befund, 49 Playwright-Interaktionstests (neu: Zoom bleibt beim Lesen stehen, nächstes Thema am Textende sichtbar, Weiterlesen dreht Rad und Zoom, Zurückscrollen, Schließen nach Weiterlesen, Zoom bei reduzierter Bewegung), 60 fps. Nur Chromium verfügbar.

## Tauchfahrt neu: gezeichnet auf Weiß, ruhig, Ende als Universum (2026-10-07)

Status: ✅ live. Paul prüft selbst auf seinen Geräten.

Rückmeldung Paul zur Vektor-Synapse aus #65/#66: „gefällt mir nicht, die Version davor war besser“. Der Zoom soll wie bei der ChatGPT-Version zeichnerisch und kunstvoll zeigen, wie 1 mm³ Gehirn aussieht, langsam und ruhig hineinzoomen und am Ende „wie ein Universum, ein neues Universum in jedem Gehirn“ sein. Eine Nacht-Variante wurde gebaut und auf Pauls Entscheid verworfen: „lass alles gezeichnet auf weißem Grund, genau so, aber nicht Nacht“.

- **Vorlage 1 mm³:** Der H01-Datensatz (Harvard, Lichtman-Labor, mit Google; Science 2024) zeigt 1 mm³ menschlichen Schläfenlappen-Kortex: rund 57.000 Zellen, rund 150 Millionen Synapsen, rund 230 mm Blutgefäße, 1,4 Petabyte Daten. Die Zeichnungen folgen diesem Aufbau. Keine dieser Zahlen erscheint auf der Seite.
- **Bildkette, alles Tusche auf weißem Papier:**
  - freigegebene Gehirnzeichnung
  - freigegebene Mikrostruktur
  - `neuro-cube.webp`: der Kubikmillimeter
  - `neuro-inside.webp`: im Kubus
  - `neuro-universe.webp`: das Netz wird zur Galaxie

  Die drei neuen Zeichnungen wurden über Higgsfield erzeugt (zunächst leuchtend auf Nachtblau). Für die Weiß-Fassung wurden sie per Tonwertumkehr ohne neue Generierung zu Tusche auf Weiß umgesetzt; beim Kubus nur sein Inneres. Jede Ebene sitzt exakt im Fokuspunkt der vorigen und blendet weich über. Die tiefen Ebenen sind mit 72 % Tusche gezeichnet, damit sie so fein wirken wie Gehirn und Mikrostruktur.
- **Ruhiger:** Hinein- und Hinausfahrt dauern je zwei volle Raddrehungen statt einer, mit sanftem Ein- und Ausgleiten und einer Dämpfung von 280 ms.
- **Lesbarkeit:** Ein weißer Schleier erscheint hinter dem Rad nur, solange der Kubus dahinter liegt (aus seiner Lage auf dem Bildschirm berechnet), und ab dem Inneren des Kubus. Gehirn und Mikrostruktur bleiben ohne Schleier wie bisher. Farben und Schrift sind exakt wie in #66.
- **Schleier-Fehler behoben:** Der weiße Schleier aus #65 wurde nie gezeichnet (eine Verlaufsgröße mit `min(…, 100% …)` ist ungültig). Er ist entfernt; der neue Schleier nutzt `vw`.
- **Entfernt:** die vektorgezeichnete Synapse samt Vektor-Canvas. Alles läuft auf einem Canvas.
- **Dateigrößen:** 427 KB, 628 KB und 624 KB, jeweils 1920 × 1920 WebP. Sie liegen über der 300-KB-Faustregel, weil sie bis etwa vierfach vergrößert gezeichnet werden. Sie laden erst kurz bevor die Fahrt sie erreicht, der Seitenaufruf bleibt gleich groß. `scripts/test-site.mjs` erlaubt dafür bis 700 KB, nur für `assets/neuro-*`, und prüft das Nachladen.
- **Prüfung (auf Pauls Wunsch reduziert, ohne Screenshots):** `node --check`, `node scripts/test-site.mjs` und eslint ohne Befund. Rauchtest Desktop und Mobile bis zum tiefsten Punkt: keine Konsolenfehler, Bild durchgehend auf weißem Grund. Die Nacht-Fassung davor hatte 49 Interaktionstests und 60 fps bestanden; die Mechanik von Rad und Leseansicht ist unverändert.

### Nachtrag: Würfel entfernt (2026-10-07)

Rückmeldung Paul nach Livegang von #67, mit iPhone-Screenshots: „so wie auf dem zweiten Foto, kein Würfel, der stört“.

- Die Kubus-Zeichnung (`neuro-cube.webp`) ist entfernt. Kette jetzt: Gehirn → Mikrostruktur → Inneres des Kubikmillimeters → Universum. Das Innere übernimmt Maßstab und Zeitpunkt des bisherigen Kubus, blüht also direkt aus der Mikrostruktur auf.
- Der weiße Schleier hinter dem Rad erscheint jetzt nur noch ab dem Inneren. Gehirn und Mikrostruktur bleiben ohne Schleier.
- Prüfung (reduziert, ohne Screenshots): `node --check`, `node scripts/test-site.mjs`, eslint, Rauchtest Desktop und Mobile bis zum tiefsten Punkt ohne Konsolenfehler, Grund durchgehend weiß.
- Hinweis: Das Vercel-Projekt „atelier“ (Datenbank einer App, nicht diese Seite) ist mit diesem Repo verknüpft und baut deshalb bei jedem Push mit und scheitert. Abhilfe nur im Vercel-Dashboard: atelier → Settings → Git → Disconnect.

### Nachtrag: feine H01-Zeichnung statt dicker Linien (2026-10-07)

Rückmeldung Paul nach Livegang von #68: „wie auf dem ersten Foto [Mikrostruktur], nicht wie auf dem zweiten, keine dicken Linien, sondern wie die Originale von Harvard und Google, aber im zeichnerischen Stil“.

- `neuro-inside.webp` neu: eine Higgsfield-Zeichnung (gpt_image_2_5, freigegebene Mikrostruktur als Stilvorlage). Haarfeine Graphitlinien auf Weiß zeigen Pyramidenzellen mit langen Apikaldendriten, Basaldendriten mit Dornen, Axone, Synapsen als Punkte und Kapillaren, angelehnt an H01. Ein großes Pyramidenneuron in der Mitte ist der Fokuspunkt (975, 959); aus ihm blüht die Galaxie. Papier auf reines Weiß gesetzt, 1920², 669 KB.
- Tuschestärke 80 %. Der weiße Schleier hinter dem Rad kommt erst mit der Galaxie, das Innere steht wie die Mikrostruktur ohne Schleier.
- Prüfung (reduziert, ohne Screenshots): `node --check`, `node scripts/test-site.mjs`, eslint, Rauchtest Desktop und Mobile bis zum tiefsten Punkt ohne Konsolenfehler.

