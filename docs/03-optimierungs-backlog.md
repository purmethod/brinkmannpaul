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

### Nachtrag: beim Antippen nur eine Sache aufklappen (2026-10-07)

Pauls Wunsch: „beim Draufklicken nur eine Sache aufklappen“, auf Nachfrage für beides entschieden.

- Die Leseansicht zeigt nur das angetippte Projekt. Die folgenden Projekte stehen nicht mehr darunter, und Weiterlesen dreht das Rad nicht mehr. Das ersetzt den Lesefluss ins nächste Thema aus #66.
- In pure ist immer nur ein Kapitel offen: Öffnet man ein anderes, schließt sich das vorige. Das läuft nativ über `<details name="pure-chapter">`, ohne zusätzliches Skript, und gilt auch in der Liste ohne JavaScript.
- Prüfung (reduziert, ohne Screenshots): `node --check`, `node scripts/test-site.mjs`, eslint und ein Rauchtest auf Desktop und Mobile. Er zeigt einen Abschnitt in der Leseansicht und genau ein offenes Kapitel, Escape schließt die Ansicht und leert die Adresse, keine Konsolenfehler.

### Nachtrag: Endlos-Tauchfahrt nur hinein, tiefer bis zu den Molekülen (2026-10-07)

Pauls Wunsch: Es soll nicht mehr stoppen und nicht wieder herauszoomen. Er will noch tiefer ins Universum, falls es echte Aufnahmen davon gibt; sonst soll es so zurückspringen, dass man es nicht merkt. Schrift und Bilder sollen nicht konkurrieren.

- **Recherche:**
  - H01 (Shapson-Coe et al., Science 2024): 1 mm³ menschlicher Kortex, mit dem Elektronenmikroskop in 34 nm dünnen Schnitten aufgenommen; jede einzelne Synapse ist abgebildet.
  - Kryo-Elektronentomographie zeigt Synapsen im Molekülmaßstab (2–4 nm): Vesikel, Tethers aus Munc13 und SNAP25, Glutamat-Rezeptoren (Lučić-Gruppe, MPI für Biochemie, Science Advances 2021).
  - Es gibt also echte Aufnahmen bis zur Molekülebene.
- **Neue Ebenen (Higgsfield, Mikrostruktur als Stilvorlage, Graphit auf Weiß):**
  - `neuro-synapse.webp` (573 KB): eine Synapse wie im Elektronenmikroskop, mit Bouton voller Vesikel, Mitochondrium, Spalt und Dorn.
  - `neuro-molecules.webp` (290 KB): ein großes Vesikel mit Tethers, SNARE-Komplexen, Rezeptoren und Transmittermolekülen.
- **Kette:** Gehirn → Mikrostruktur → Inneres des Kubikmillimeters → Universum → Synapse → Moleküle → im offenen Weiß des Vesikels erscheint das nächste Gehirn.
  - Die Tiefe wächst nur noch mit dem Drehen und läuft modulo eines Zyklus von etwa 50 Zeilen.
  - Synapse und Moleküle liegen exakt ineinander: Das zentrale Vesikel der Synapse (r = 34 px) liegt deckungsgleich auf dem großen Vesikel (r = 302 px).
  - Das Gehirn sitzt mit mindestens 10 % Abstand im Vesikel und wächst bis zur Startgröße. Die Kamera kehrt rechtzeitig zum Ausgangspunkt zurück.
  - Rückwärtsdrehen fährt denselben Weg zurück.
  - Die Galaxie löst sich beim Hineinfliegen in die Synapse auf. Ihre weißen Lücken (≈ 16 px) sind für ein exaktes Ineinander zu klein.
- **Schrift vs. Bild:** Ein ruhiger weißer Schleier liegt jetzt dauerhaft hinter dem Rad (85 %) und wird nicht mehr je nach Ebene geschaltet.
- **Prüfung (ohne Screenshots):**
  - `node --check`, `node scripts/test-site.mjs` und eslint ohne Befund.
  - Rauchtest über mehr als zwei Zyklen auf Desktop und Mobile ohne Konsolenfehler, durchgehend auf Weiß.
  - Nahtstelle: Helligkeitssprung 0,04, kleiner als ein normaler Zoomschritt (0,1). Der größte Helligkeitsschritt im ganzen Zyklus liegt bei 1,9 pro 0,02 Tiefe, beim Auflösen der Galaxie.
  - Leseansicht: ein Projekt, ein offenes pure-Kapitel.

### Nachtrag: Neuronen-Kosmos und Galaxie aus Neuronen (2026-10-07)

Pauls Wunsch, mit Referenzbild (1 mm³, Netz aus Neuronen wie Sterne): Der Kubikmillimeter soll in ein Detail übergehen, in dem man das Universum sieht, gezeichnet in Grautönen. Beim Scrollen soll man sich darin verlieren; der Aha-Effekt: Das Gehirn ist so verzweigt wie eine Galaxie. Den Würfel hatte Paul zuvor abgelehnt, er bleibt draußen.

- Neu (Higgsfield, Mikrostruktur als Stilvorlage, Graphit auf Weiß):
  - `neuro-cosmos.webp` (636 KB): das Neuronennetz als Kosmos. Zellkörper wie Sterne mit Punkthalo, Dendriten und Axone wie Sternbilder und kosmisches Netz, mit starker Tiefe. In der Mitte steht der hellste Neuronen-Stern (964, 947).
  - `neuro-galaxy.webp` (342 KB): eine Spiralgalaxie ganz aus Neuronen mit offenem, hellem Kern (964, 967), Radius etwa 600 px.
- `neuro-universe.webp` (die umgekehrte Nacht-Galaxie) ist entfernt.
- Kette: Gehirn → Mikrostruktur → Inneres → Kosmos → Galaxie → Synapse → Moleküle → nächstes Gehirn.
- Ruhiger: Die Galaxie kommt nach drei statt zwei Raddrehungen; ein voller Durchgang sind etwa 63 Zeilen, rund 7 Drehungen.
- Prüfung (ohne Screenshots): `node --check`, `node scripts/test-site.mjs` und eslint ohne Befund. Rauchtest über mehrere Zyklen ohne Konsolenfehler. An der Nahtstelle ändert sich die Helligkeit um 0,04; der größte Helligkeitsschritt liegt bei 1,85 pro 0,02 Tiefe. Leseansicht unverändert.

### Nachtrag: scharfer, lebendiger Flug durch ein Universum aus Neuronen (2026-10-07)

Rückmeldung Paul mit Screenshot der Molekülebene: Die Bilder sind nicht scharf. Er will den Eindruck, in ein Universum einzutauchen, nicht eine Zeichnung wie diese und nicht zu statisch: unser Gehirn ist ein Universum.

- **Ursache der Unschärfe:** Rasterzeichnungen wurden bis etwa 4-fach über ihre Auflösung vergrößert.
  - Jede Zeichnung übergibt jetzt, solange sie scharf ist: Ausblenden über [nächste Übergabe − 0,3, + 0,1], der Kosmos höchstens bis etwa 1,5-fach.
  - Neuronen-Sterne und Galaxien blenden aus, bevor sie über ihre Pixel hinaus wachsen.
  - Der Staub ist Vektorgrafik und bei jeder Größe scharf.
- **Flug statt Standbild:** Nach dem Kosmos beginnt ein endloser Flug.
  - Neuronen-Sterne strömen aus der Ferne, wachsen und ziehen spiralförmig vorbei. Ferne Sterne sind blass, nahe kräftig.
  - Dazu ziehen Galaxien aus Neuronen vorbei, und feiner Staub treibt dazwischen.
  - Alle Objekte sind deterministisch platziert. Rückwärts fliegt man denselben Weg zurück.
  - Nach etwa 5 Tiefeneinheiten Flug wächst in der Ferne das nächste Gehirn heran, und die Fahrt beginnt nahtlos neu.
- **Nicht statisch:** Das Universum treibt auch ohne Scrollen langsam weiter (0,012 Tiefe/s), außer beim Lesen und bei „Bewegung reduzieren“. Im Stillstand wird mit etwa 24 Bildern/s gezeichnet, um den Akku zu schonen.
- **Assets:**
  - `neuro-stars.webp` (274 KB): 16 Neuronen-Sterne aus den Originalen in 2880 px (Kosmos und Inneres), weich ins Papier auslaufend, 4 × 4 zu je 400 px.
  - Atlas und Galaxie werden beim Laden in halber, viertel und achtel Größe vorberechnet (Mipmaps).
  - `neuro-synapse.webp` und `neuro-molecules.webp` sind entfernt.
- **Fehler unterwegs behoben:** Nach den Sternen blieb ihre Transformation aktiv, sodass das nächste Gehirn verdreht und außerhalb des Bildes gezeichnet wurde. Jetzt wird die Transformation zurückgesetzt.
- **Prüfung:**
  - `node --check`, `node scripts/test-site.mjs` und eslint ohne Befund.
  - 45 Playwright-Interaktionstests, angepasst an die Ein-Projekt-Leseansicht.
  - Rauchtest über mehrere Zyklen ohne Konsolenfehler.
  - Nahtstelle: Helligkeitssprung 0,04. Größter Helligkeitsschritt 1,2 pro 0,02 Tiefe.
  - Die Zeichenzeit pro Bild ist nicht höher als in der Vorversion.
  - Der bisherige Bildraten-Test hat nichts gemessen: Seine 2-px-Scrollschritte rasteten zurück, und es wurde nie neu gezeichnet. Die früheren 60-fps-Angaben sind damit nicht belastbar.

### Nachtrag: pure-Kapitel einzeln und ruhig aufklappen (2026-10-07)

Pauls Wunsch: Öffnet man in pure ein Kapitel, soll das andere zuklappen, damit man angenehmer lesen kann.

- `<details name="pure-chapter">` aus #70 schloss das andere Kapitel zwar. Dessen Höhe wurde aber über 420 ms weich animiert (`::details-content`-Übergang in `styles.css`). Das angetippte Kapitel rutschte dadurch hinterher nach oben, auf dem Handy aus dem Bild.
- Jetzt: Das geöffnete Kapitel klappt weiter weich auf. Die anderen schließen sofort (`.is-snapping` schaltet ihren Übergang für einen Frame ab). Im selben Moment wird die Ansicht so verschoben, dass das angetippte Kapitel unter dem Finger stehen bleibt. Ein Skript sorgt dafür auch dort, wo der Browser `details name` nicht kennt.
- Prüfung: Kapitel 1 offen, Kapitel 2 angetippt. Danach ist nur Kapitel 2 offen, seine Überschrift steht vorher und nachher an derselben Stelle (Desktop 559 → 559 px, Mobile 528 → 527 px). Das gilt mit nativer Unterstützung und mit Skript. 45 Interaktionstests grün.

### Nachtrag: Schrift im Rad kleiner und linksbündig (2026-10-07)

Pauls Wunsch: Die Schrift im Rad verbessern, etwas kleiner und links angeschlagen.

- Namen etwa 20 % kleiner: `--name` von `clamp(1.6rem, 1.05rem + 1.55vw, 2.3rem)` auf `clamp(1.3rem, .95rem + 1.1vw, 1.85rem)`. Desktop 36,8 → 29,6 px, Mobile 25,6 → 20,8 px.
- Linksbündig an der linken Kante der Ink-Linien. Die Zylinder-Skalierung läuft um den linken Rand (`transform-origin: 0 50%`), sodass auch die kleiner werdenden Nachbarn exakt an derselben Kante stehen. Rechts bleibt Platz für das „+“.
- Die Leseansicht zieht mit: Titel, Linien und Text stehen an derselben Kante wie im Rad (Spalte = Bandbreite), beim Öffnen springt nichts.
- Prüfung: gemessen auf Desktop, Mobile und 320 px. Alle sichtbaren Namen beginnen an der Bandkante (472 bzw. 20 px), der längste Name endet weit vor dem „+“, der Lesetitel steht an derselben x-Position. 45 Interaktionstests grün.

### Nachtrag: tiefer statt vorbei, alles verbunden (2026-10-07)

Rückmeldung Paul mit Screenshot: Die Milchstraßen-Galaxien erscheinen plötzlich und schweben allein. Das ist unrealistisch, denn im Gehirn ist alles verbunden. Man soll tiefer und tiefer gehen und so in immer andere Sphären gelangen.

- **Kein Sternenfeld mehr:** Die frei fliegenden Neuronen-Sterne, die einzelnen Galaxien und der Staub sind entfernt (`neuro-stars.webp`, `neuro-galaxy.webp`).
- **Verbundene Sphären:** Jede Ebene wächst aus dem zentralen Neuron der vorigen, das Netz reißt nie ab.
  - Abfolge: Mikrostruktur → Kortex → Kosmos → kosmisches Netz → Kosmos → Kortex → kosmisches Netz → Kosmos → Kortex → nächstes Gehirn.
  - Abstand zwischen zwei Sphären: 0,85 Tiefe. Übergabe, solange die Zeichnung scharf ist (bis etwa 1,3–1,9-fach).
- **Neue Zeichnung `neuro-web.webp`** (677 KB, Higgsfield, Mikrostruktur als Stilvorlage): das kosmische Netz aus Neuronen. Knoten sind Neuronen-Haufen, verbunden durch Axon- und Dendritenfasern, dazwischen offene Leerräume. Mittelknoten bei (1003, 973).
  - Grundlage: Vazza & Feletti, Frontiers in Physics 2020. Sie verglichen das Neuronennetz des Gehirns quantitativ mit dem kosmischen Netz und fanden über 27 Größenordnungen vergleichbare Komplexität und Selbstorganisation.
- **Sog:** Über den Flug dreht sich die ganze Ansicht einmal langsam um 360°. Weil es genau eine Umdrehung ist, kommt das nächste Gehirn aufrecht an und die Naht bleibt unsichtbar. Jede wiederkehrende Sphäre ist zusätzlich anders gedreht, damit sie sich nicht wiederholt anfühlt.
- **Prüfung (ohne Screenshots):**
  - `node --check`, `node scripts/test-site.mjs` und eslint ohne Befund.
  - Mehrere Zyklen ohne Konsolenfehler.
  - Nahtstelle: Helligkeitssprung 0,04. Größter Helligkeitsschritt 1,1 (Desktop) bzw. 2,1 (Mobile) pro 0,02 Tiefe, jeweils beim Übergang in das dichtere Netz.
  - 45 Interaktionstests grün.

### Nachtrag: Start mit dem ganzen Gehirn, pure zuerst (2026-10-07)

Pauls Wunsch mit Foto: Wer auf die Seite kommt, sieht das ganze Gehirn; das ist die Startseite. Das erste Projekt ist pure, Untertitel „system for man“.

- **Ursache:** Das Universum trieb seit #75 schon ab dem Laden der Seite langsam weiter, auch während des Intros. Bis der Leser das Rad sah, war das Gehirn längst hineingezoomt.
- **Jetzt:** Das Treiben läuft nur noch im tiefen Teil (ab dem Kosmos). Das Gehirn beim Ankommen steht still und vollständig. Treibt der Flug bis zum nächsten Gehirn, bleibt er dort in derselben ruhigen Startansicht stehen. Am Start wird nicht laufend neu gezeichnet, das schont den Akku.
- **Inhalt:** pure steht vor art, das Rad startet auf pure. Untertitel `system for man`. Das Inventar ist angepasst.
- **Prüfung:** Hinter dem Intro und am Start wird nicht neu gezeichnet. In der Tiefe treibt es weiter (etwa 22 Bilder/s). 49 Interaktionstests grün, neu: Start auf pure, Startansicht bleibt still, Tippen auf die Zeile darüber dreht zurück.

### Nachtrag: art-Text überarbeitet (2026-10-07)

Pauls Vorgabe: „art begins with love“ nicht doppelt beim Aufklappen. Nach den Dominosteinen soll stehen, dass KI keine Liebe fühlen kann, deshalb keine Angst vor KI, alles mit Liebe tun, KI nur als Werkzeug, der erste Schritt mit Liebe, und „all art means all is art“.

- Text in Pauls Worten und Kleinschreibung umgesetzt (siehe Inventar), ohne Gedankenstriche.
- Der Lead-Absatz ist jetzt „anything we do can become art when we bring love to it.“
- Prüfung: `#art` öffnet die Leseansicht, „art begins with love.“ erscheint nur als Untertitel, 12 Absätze. `node scripts/test-site.mjs` grün.

### Nachtrag: Gehirn deutlich, danach nur Universum (2026-10-07)

Pauls Wunsch mit Foto: Das Gehirn muss beim Ankommen deutlich erkennbar sein. Danach soll es wie ein Universum aussehen und immer tiefer gehen. Man soll die Komplexität spüren, und das geht nur mit der universumsähnlichen Struktur.

- **Gehirn kräftiger:** Tinte 0,95 statt 0,6 (Mobile) bzw. 0,74 (Desktop).
- **Schleier abhängig von der Tiefe:** Am Gehirn 50 % statt 85 %, in der Tiefe 85 %. Zum nächsten Gehirn hin wird er wieder leichter, sodass die Naht stimmt. Gemessene Tintendichte im Gehirnbereich beim Start: Mobile 5,2 → 10,6, Desktop 8,3 → 12,1.
- **Flug nur durch Universums-Sphären:** Nach dem Kubikmillimeter folgen im Wechsel kosmisches Netz und Neuronen-Kosmos, ohne Rückkehr zum Kortex. Das nächste Gehirn wächst aus einem Neuronen-Stern.
- **Sternchen:** Die ✱ standen nur in der Chat-Nachricht als Markierung neuer Absätze, auf der Seite gibt es keine (geprüft).
- **Prüfung:** Nahtstelle mit Helligkeitssprung 0,05 bzw. 0,04, mehrere Zyklen ohne Konsolenfehler, 49 Interaktionstests grün.

### Nachtrag: art-Text, Einstieg „all art.“ und Schluss „you.“ (2026-10-07)

- Paul: „anything we do …“ in normaler Schriftgröße in den Text. Als großer Einstieg steht stattdessen „all art.“. Am Ende: Was Kunst ist, definiert allein der Erschaffer, und es muss mindestens einem Menschen gefallen, dem, der es erschaffen hat. Letztes Wort „you.“
- Umgesetzt in Pauls Worten, Kleinschreibung, ohne Gedankenstriche. `node scripts/test-site.mjs` grün.

### Nachtrag: Startansicht exakt wie Pauls Foto (2026-10-07)

Paul hat mit einem iPhone-Screenshot die Gehirngröße vorgegeben, die beim ersten Besuch zu sehen sein soll, mit pure in der Mitte.

- **Vermessung:** Die Gehirnzeichnung (Mobile-Version) wurde rechnerisch auf den Screenshot gelegt; Maßstab und Lage folgen aus der besten Kreuzkorrelation. Ergebnis bei 393 px Breite: 0,374 CSS-px pro Bildpixel, 383 px breit (97,5 % der Breite), mittig, Oberkante 32 px unter dem Seitenrand.
- **Umgesetzt für Hochformat:** Die Zeichnung startet mit 97,5 % der Breite, mittig, Oberkante bei 32 px, statt bildschirmfüllend und beschnitten. Desktop und Tablet bleiben bildschirmfüllend.
- **Prüfung:** Gemessen bei 393 × 791 px Maßstab 0,3742, Breite 383,2 px, links 4,9 px, oben 32 px; „pure“ in der Mitte. Naht 0,01, mehrere Zyklen ohne Fehler, 49 Interaktionstests grün.

## Fünf Sprachen, art-Text, ruhiger Film (2026-10-08)

Pauls Auftrag über Nacht: die Seite autonom prüfen und fertig machen. Dazu gehören der überarbeitete art-Text, der Architekten-Satz bei pure, keine Drehung, Scrollen wie ein Film und die Seite in Englisch, Deutsch, Französisch, Spanisch und Arabisch mit Sprachauswahl unten mittig statt „contact“.

- **art:** Pauls freigegebene Kurzfassung mit „whatever we do with love becomes art.“, 9 statt 14 Absätze, Schluss „you.“
- **pure, ego:** „i am an architect, and i built this system the way i design a building: from the foundation up. i believe your boundaries need foundations as solid as concrete.“
- **Keine Drehung:** Die 360°-Drehung des Flugs und die gedrehten Sphären sind entfernt, es geht nur noch geradeaus in die Tiefe. Jede Tiefenänderung wird gezeichnet, und die Gleitbewegung nach dem Scrollen ist mit 420 statt 280 ms länger. Der Übergang zum nächsten Gehirn bleibt.
- **Sprachen:**
  - `dist/index.html` (Englisch) ist die Quelle. `scripts/i18n.py extract` listet 124 Textbausteine (`i18n/units.json`). `scripts/i18n.py build` erzeugt daraus `dist/de|fr|es|ar/index.html`.
  - Der Build bricht ab, wenn eine Übersetzung fehlt oder Markup (Links, Klassen) verändert. Lokale Dateien werden auf Unterseiten ab dem Seitenstamm adressiert.
  - Je Seite werden `lang`, Arabisch mit `dir="rtl"`, Canonical, `og:url`, `og:locale` und hreflang-Verweise gesetzt.
  - Projektnamen und Anker (`#pure`, `#art` …) bleiben gleich, Direktlinks funktionieren also in jeder Sprache. Die Kapitelnamen von pure (physis, understanding, responsibility, ego) bleiben Englisch, denn ihre Anfangsbuchstaben bilden p·u·r·e.
- **Sprachauswahl:** Im Footer steht exakt mittig `en de fr es ar` statt „contact“, die aktuelle Sprache ist unterstrichen. Beim Wechsel bleibt ein offenes Projekt offen (der Anker wird mitgenommen). Die Bedienbeschriftungen des Rads („projects“, „close“) kommen aus der Seite und werden mit übersetzt.
- **Arabisch:** Rad, „+“, Lesekopf und die pure-Markierung sind gespiegelt, rechtsbündig mit Skalierung um den rechten Rand. Ohne Laufweite, damit die Buchstaben verbunden bleiben.
- **Prüfung und Bereinigung:**
  - 404-Seite einheitlich „paul brinkmann, m.sc. · artist & architect“, aktuelle Styles, Sprachlinks statt „contact“.
  - `og:site_name` lautet „paul brinkmann“.
  - HTML geprüft: Verschachtelung, Sprungmarken und Alt-Texte sind korrekt.
- **Prüfung vor dem Livegang:**
  - `node scripts/test-site.mjs` grün, inklusive der neuen Sprachprüfungen: jede Seite mit Sprache, Canonical, markierter Auswahl, denselben Projekten und Bestell-Links, Dateien ab Seitenstamm.
  - Je Sprache auf Mobile (393 px) und Desktop gemessen: Namen exakt an der Kante, Arabisch rechtsbündig mit „+“ links, Auswahl exakt mittig, kein Überlauf, übersetzte Bedienbeschriftungen, Leseansicht mit übersetztem Untertitel. Keine Konsolenfehler, keine fehlenden Dateien.
  - Auf `/de/` lädt die Tauchfahrt alle Zeichnungen. `/fr/#qefyr` öffnet direkt. Der Wechsel zu `es` führt auf `/es/#qefyr` mit offenem Projekt.
  - Nahtstelle mit Helligkeitssprung 0,05 bzw. 0,01. 49 Interaktionstests grün.

## Russisch als sechste Sprache (2026-10-08)

Pauls Auftrag: Russisch hinzufügen, sinngemäß und perfekt übersetzt, getestet und live.

- **Seite:** `/ru/` aus `i18n/ru.json` (124 Bausteine) über `scripts/i18n.py`. Auswahl im Footer `en de fr es ar ru`, hreflang `ru` auf der englischen Quelle und damit auf allen Sprachseiten, 404-Seite mit `ru`.
- **Footer schmal:** Mit sechs Kürzeln brach „paul brinkmann“ bei 360 px um. Unter 380 px ist der Abstand zwischen den Kürzeln 10 statt 14 px. Bei 320 px bricht der Name weiterhin um, wie schon mit fünf Sprachen.
- **Übersetzung geprüft:** Ein unabhängiger zweiter Durchgang hat alle 124 Bausteine gegen das Englische gelesen. Er fand 10 Fehler in Bedeutung oder Grammatik (fehlende Verben, Fall, mehrdeutige Pronomen), dazu ungelenke Stellen. Alle sind behoben, ein dritter Durchgang hat das bestätigt.
- **Prüfung:** `node scripts/test-site.mjs` grün mit sechs Sprachen. Auf `/ru/` sitzen die Namen an der Kante, das „+“ rechts, die Auswahl mittig, kein Überlauf, die Bedienung ist russisch, die Leseansicht zeigt „система для мужчины“. Der längste Name passt auch bei 320 px (219 von 256 px). `/ru/#qefyr` öffnet direkt, der Wechsel zu `de` behält das Projekt. Alle Zeichnungen laden, keine Fehler.

## Footer: Sprachen links, Instagram, WhatsApp und Mail rechts (2026-10-08)

Pauls Vorgabe: Der Name unten links wiederholt sich und kommt weg. Links stehen die Sprachen, rechts an der Kante die Kontakt-Icons (zuerst Instagram, WhatsApp und Mail, WhatsApp siehe Nachtrag), grau und gezeichnet wie der Rest. Schrift und Buttons werden größer.

- **Markup:** `<nav class="contact-links" aria-label="contact">` mit drei Links. Jeder Link trägt ein Linien-SVG (`stroke: currentColor`, 1,6), das Instagram-Zeichen ist dasselbe wie bei pure. Die Beschriftungen (contact, instagram, whatsapp, e-mail) sind in allen sechs Sprachen übersetzt.
- **Stil:**
  - Footer-Schrift 14 statt 11 px. Icons 22 px mit 40 × 40 px Tippfläche, Farbe wie der Footer (#52524e), beim Überfahren Tinte.
  - Die Reihe ist um den Innenraum des Icons nach außen gezogen, so steht das Mail-Zeichen exakt an derselben Kante wie die Sprachen links.
  - Arabisch ist gespiegelt.
- **404:** Gleicher Aufbau, Sprachen ohne Trennpunkte, unter 380 px enger.
- **Test:** `scripts/test-site.mjs` prüft, dass auf Startseite und 404 die drei Icons in dieser Reihenfolge stehen, WhatsApp eine Nummer hat und im Footer kein Name mehr steht.
- **Prüfung:** en, ar und ru bei 320, 360, 393 und 1440 px gemessen. Sprachen und Icons stehen auf einer Zeile, je 20 px (Desktop 32 px) von der Kante, ohne Überlauf. Die 404-Seite steht bei 320 px ebenfalls einzeilig. 49 Interaktionstests sind grün.

### Nachtrag: WhatsApp wieder entfernt (2026-10-08)

Paul will keine private Nummer veröffentlichen und nicht pro Nachricht zahlen, was die WhatsApp Business Platform für einen eigenen Bot verlangt. Deshalb laufen alle Anfragen über E-Mail. Der Footer zeigt rechts nur noch Instagram und Mail. `scripts/test-site.mjs` stellt sicher, dass auf Startseite und 404 keine Telefonnummer, kein `wa.me` und kein `tel:` steht.

### Nachtrag: Seiten getauscht, Sprachen als Buttons (2026-10-08)

Pauls Vorgabe: Mail und Instagram nach links, die Sprachauswahl rechts an die Kante, gestaltet wie die Buttons.

- **Reihenfolge:** Im Footer steht zuerst `.contact-links` (Mail, dann Instagram), danach `.footer-langs`. Arabisch spiegelt automatisch.
- **Sprachen als Buttons:** Jedes Kürzel ist 40 px hoch mit 9 px Innenabstand je Seite. Dadurch liegen alle Kürzel 18 px auseinander, genau wie die Icons.
- **Kanten:** Beide Reihen sind um ihren Innenraum nach außen gezogen. Mail-Icon und letztes Kürzel stehen exakt 20 px vom Rand (Desktop 32 px).
- **Aufgeräumt:** Startseite und 404 teilen sich die Klasse `.footer-langs` in `styles.css`. Die doppelten Regeln in `brain-scroll.css` sind entfernt.
- **Prüfung:**
  - en, ar, ru und 404 bei 320, 393 und 1440 px gemessen: Kanten 20 px, alle Abstände 18 px, Icons und Kürzel auf einer Linie, kein Überlauf.
  - `scripts/test-site.mjs` prüft die Reihenfolge.
  - 49 Interaktionstests grün, der Sprachwechsel behält das offene Projekt.

### Nachtrag: alles als gerahmte Buttons gleicher Größe (2026-10-08)

Pauls Vorgabe: Briefumschlag und Instagram-Zeichen bekommen eine Umrandung und sind gleich. Jede Sprache ist ein eigener Button in genau derselben Größe.

- **Buttons:** Alle acht Elemente (Mail, Instagram, en, de, fr, es, ar, ru) sind quadratisch.
  - Rahmen 1 px in der Footerfarbe, Ecken mit 28 % der Seitenlänge gerundet, wie beim Instagram-Zeichen. Abstand 6 px.
  - Beim Überfahren und bei der aktuellen Sprache werden Rahmen und Inhalt schwarz. Die Unterstreichung entfällt.
- **Zeichen:** Beide SVGs zeichnen im 40er-Raster auf voller Buttongröße.
  - Bei Instagram ist der Buttonrahmen der Umriss der Kamera, innen sitzen Kreis (17 Einheiten) und Punkt. Der Umschlag ist 17 Einheiten breit, also gleich breit wie der Kreis.
  - Linien mit `vector-effect: non-scaling-stroke` bleiben bei jeder Größe 1 px fein wie der Rahmen.
- **Größe:** `--button: clamp(28px, (100vw − 92px) / 8, 40px)`. Die 92 px sind 2 × 20 px Rand, 6 × 6 px Abstand und 16 px Mindestabstand in der Mitte, damit acht Buttons immer in eine Zeile passen. Der Footer-Abstand ist jetzt überall 16 px, sonst brach die 404-Seite bei 393 px um.
- **Aufgeräumt:** `min-height: 32px` der Footer-Links in `brain-scroll.css` entfällt, sonst wären die Buttons bei 320 px nicht quadratisch.
- **Prüfung:**
  - en, ar, ru und 404 bei 320, 360, 393, 430 und 1440 px gemessen: alle acht Buttons exakt gleich groß und quadratisch, Texte auf 0,0 px zentriert, Kanten 20 px (Desktop 32 px), Abstände 6 px, eine Zeile, kein Überlauf, Arabisch gespiegelt.
  - 49 Interaktionstests grün.

### Nachtrag: kleinere Buttons, Instagram-Logo, Sprachen in eigener Schrift (2026-10-08)

Pauls Vorgabe: Die Buttons sind zu groß. Das Instagram-Logo selbst soll im Button sitzen, kleiner und dezenter. Die Sprachauswahl zeigt die Anfangsbuchstaben in der jeweiligen Landessprache.

- **Größe:** `--button: clamp(24px, (100vw − 92px) / 8, 28px)`, also 28 px auf allen Handys ab 316 px Breite und auf dem Desktop.
- **Zeichen:**
  - Im Instagram-Button sitzt das komplette Logo (abgerundetes Quadrat, Linse, Punkt) mit 18,6 von 40 Einheiten, bei 28 px Button also rund 13 px.
  - Der Umschlag ist gleich breit.
  - Linien 1 px, wie der Rahmen.
- **Sprachen:** en, de, fr, es, ع, ру.
  - Jeder Link trägt `aria-label` mit dem Namen in der eigenen Sprache.
  - `scripts/i18n.py` übersetzt `aria-label` an Links mit `hreflang` nicht.
  - Die aktuelle Sprache wird über die Attribute markiert statt über den Linktext.
- **Tests:**
  - `scripts/test-site.mjs` prüft die eigenen Schriftzeichen und dass je Seite genau eine Sprache markiert ist.
  - en, ar, ru und 404 bei 300, 320, 393 und 1440 px gemessen: alle Buttons gleich und quadratisch, Text auf 0,0 px mittig (auch ع und ру), eine Zeile, Kanten 20 px, kein Überlauf.
  - Der Sprachwechsel behält das offene Projekt. 49 Interaktionstests grün.

### Nachtrag: WhatsApp Business, Linien 1,5 px (2026-10-08)

Paul hat eine eigene WhatsApp-Business-Nummer (+49 175 6257788). Sie kommt als Button in die Mitte der Kontaktgruppe. Die Linien von Rahmen und Zeichen werden für die Bedienbarkeit etwas kräftiger.

- **Reihenfolge links:** Mail, WhatsApp, Instagram. Das WhatsApp-Zeichen (Sprechblase mit Hörer) ist im 40er-Raster genauso breit wie Instagram-Logo und Umschlag (18,6 Einheiten) und mittig.
- **Größe:** Bei neun Buttons gilt `--button: clamp(24px, (100vw − 98px) / 9, 28px)`. Ab 350 px Breite sind es 28 px, bei 320 px 24,7 px, alle in einer Zeile.
- **Linien:**
  - Rahmen und Zeichen sind 1,5 statt 1 px.
  - Der Rahmen ist ein `box-shadow: inset 0 0 0 1.5px`, denn Browser runden einen 1,5-px-`border` auf 1 px ab (gemessen bei 1-, 2- und 3-facher Pixeldichte).
- **Test:**
  - `scripts/test-site.mjs` prüft die Reihenfolge Mail, WhatsApp, Instagram und die Business-Nummer.
  - Er stellt sicher, dass die frühere private Nummer und `tel:`-Links nirgends stehen.
- **Prüfung:** en, ar, ru und 404 bei 320, 360, 393 und 1440 px gemessen: neun gleich große quadratische Buttons, Zeichen und Texte mittig, eine Zeile, Kanten 20 px, kein Überlauf. 49 Interaktionstests grün.

### Nachtrag: Footer im Header-Grau (2026-10-08)

Pauls Vorgabe: Die Buttons wirken zu schwarz und konkurrieren mit der Schrift im Rad. Sie sollen dasselbe Grau haben wie „paul brinkmann, m.sc.“ und „artist & architect“ und sich farblich zurücknehmen.

- **Farbe:** Der Footer der Startseite hat jetzt #5c5c56 wie der Header, vorher #52524e. Rahmen, Zeichen und Sprachkürzel erben diese Farbe. Auf der 404-Seite sind Header und Footer gleich (#6a6a63).
- **Aktive Sprache und Berührung:** Statt Schwarz (#101010) gibt es eine Füllung mit 12 % des Grautons (`color-mix`, mit rgba-Rückfall). Hover und Fokus nutzen dieselbe Füllung. Die Regel für Schwarz in `brain-scroll.css` ist entfernt.
- **Prüfung:** Die berechneten Farben auf der Startseite sind für Header, Footer, Icons, Kürzel und aktive Sprache alle rgb(92, 92, 86). Die Füllung der aktiven Sprache liegt bei 12 %.

### Nachtrag: Buttons dezent und gezeichnet (2026-10-08)

Paul: Die Buttons sehen nicht gut aus. Sie sollen dezent und zeichnerisch wirken wie die Seite, ohne graue Innenfläche. Ich soll das selbst ansehen und lösen.

- **Befund im Screenshot (393 px, dreifache Pixeldichte):**
  - Dicke dunkle Rahmen mit runden Ecken wirkten wie App-Chips.
  - Die graue Fläche bei „en“ wirkte wie ein Formular.
  - Die Schrift war mit 14 px größer als der Header mit 11 px.
  - Zusammen mit dem Rad wirkte das zu laut.
- **Varianten verglichen:** abgerundet, eckig, rund, 24, 26 und 28 px, verschiedene Rahmentöne. Am besten passt eckig mit Haarlinie in `--soft-line`. Das liest sich wie eine Legende in einer Architekturzeichnung und nimmt die eckigen Linien des Rads auf.
- **Umsetzung:**
  - Die Buttons sind 26 px groß, bei sehr schmalen Handys kleiner.
  - Rahmen `inset 0 0 0 1px var(--soft-line)`, Grund `var(--paper)`. So deckt der Button am Desktop die Zeichnung dahinter ab, ohne als Fläche aufzufallen.
  - Schrift 12 px, unter 580 px 11 px wie der Header, Zeilenhöhe 1, 1 px optischer Ausgleich oben.
  - Zeichen mit 86 % der Buttongröße und 1-px-Linien. Der Umschlag ist auf 20 × 15 Einheiten vergrößert, damit er optisch so groß ist wie Sprechblase und Instagram-Logo.
  - Aktive Sprache, Hover und Fokus zeigen nur einen Rahmen in der Textfarbe, keine Füllung mehr.
- **Geprüft:**
  - Screenshots: Handy en und ar (gespiegelt) sowie Desktop 1440 px im Gesamtbild.
  - Messung: en, ar, ru und 404 bei 320, 393 und 1440 px. Alle Buttons gleich, Text mittig, eine Zeile, Kanten 20 px (Desktop 32 px), kein Überlauf.
  - 49 Interaktionstests grün.

### Nachtrag: Header kräftiger für Vertrauen in der ersten Sekunde (2026-10-08)

Paul: Die Seite ist der Funnel nach einem Reel. Name, Abschluss und Beruf müssen in ein, zwei Sekunden Vertrauen schaffen, also oben klar sichtbar sein.

- **Vorher:** alles 11 px (Desktop 12 px) in #5c5c56 mit weiter Laufweite. Am Handy blass und klein.
- **Varianten verglichen** (Screenshots 393 px): beides dunkel und gleich groß; Name groß und m.sc. grau; Titel grau; Name 16 px.
  - Gewählt: Name mit „m.sc.“ in #1d1d1b, 15 px. Titel in #3d3d39, 14 px. Laufweite 0,025em.
  - Das liest sich wie ein Briefkopf. Der Abschluss bleibt Teil des Namens.
- **Fließend:** `clamp(12px, 3.9vw, 15px)` für den Namen und `clamp(11px, 3.6vw, 14px)` für den Titel. Damit stehen alle sechs Sprachen und die 404-Seite bei 320, 360, 393 und 1440 px in einer Zeile, auch „художник & архитектор“.
- **Desktop:** Die Zeichnung läuft dort bis unter den Header. Ein papierweißer Schriftschatten (`text-shadow` 3/6/10 px) stellt die Schrift frei, ohne eine Fläche zu zeigen.
- **404:** `.site-header` in `styles.css` bekommt dieselben Werte.
- **Geprüft:** Screenshots am Handy (en, ru) und am Desktop. Fit-Messung in allen Sprachen. `test-site` und 49 Interaktionstests grün.

### Nachtrag: drei Farbtöne statt Schwarz (2026-10-08, noch nicht live)

Pauls Vorgabe: Name und Beruf oben sowie der Name in der Mitte des Rads im selben Dunkelgrau wie die Sprachkürzel („en“). Hellgrau ist der Ton von „system for man“. Dazu kommt als drittes die Linienfarbe der nicht gewählten Buttons.

- **Töne** als Variablen auf `#site-page`:
  - `--tone-dark: #5c5c56` (wie „en“);
  - `--tone-light: #5f5f59` (wie „system for man“);
  - `--tone-line: #cfcfca` (Rahmen der Buttons).
- **Dunkelgrau:** Header, Name in der Mitte und die blassen Nachbarn (über ihre Deckkraft), „+“, Lesetitel, Leittext, Fließtext, Kapitel, Links. Auch die Liste ohne JavaScript.
- **Hellgrau:** Untertitel im Rad und im Leser, Projekttypen in der Liste, Hinweise.
- **Kein Schwarz mehr:** `--ink` ist jetzt `var(--tone-dark)`. Damit sind die Linien um die Mitte, die Linien des Lesekopfs, der Schließen-Kreis und die Fokusrahmen im Dunkelgrau. Die obere Kante des Headers ebenfalls, auch auf der 404-Seite.
- **Geprüft:**
  - Vorher/Nachher-Screenshots von Startbildschirm und geöffnetem pure.
  - Die Mitte hebt sich weiter von den Nachbarn ab, der Lesetext ist gut lesbar (Kontrast 6,6 : 1).
  - `test-site` und 49 Interaktionstests grün.

### Nachtrag: Sprachwechsel ohne Intro, „×“ im offenen Projekt (2026-10-08)

Paul: Beim Sprachwechsel soll sich nur die Sprache ändern, ohne erneut Porträt und Unterschrift zu zeigen. Wo ein „+“ etwas öffnet, muss es im offenen Zustand oben ein „×“ zum Schließen geben, nicht nur unten.

- **Sprachwechsel:**
  - Ein Klick auf eine Sprache legt in `sessionStorage` (`bs-language-switch`) das Projekt in der Mitte des Rads, die gedrehten Raster und die Drift der Tauchfahrt ab.
  - `app.js` überspringt bei diesem Eintrag das Intro, genau wie bei einem Direktlink.
  - `brain-scroll.js` dreht das Rad auf dasselbe Projekt, setzt die Tiefe ohne Gleitbewegung und löscht den Eintrag. Der nächste frische Besuch zeigt das Intro wieder.
  - Ein offenes Projekt bleibt wie bisher über den Anker offen.
  - Ohne `sessionStorage` erscheint das Intro wie früher.
- **„×“ im Kopf:**
  - Jedes geöffnete Projekt hat im Lesekopf einen Schließen-Knopf (`.bs-head-close`), 44 × 44 px, exakt auf der Mitte des „+“ im Rad.
  - Das Zeichen ist aus zwei 1-px-Linien im Dunkelgrau gezeichnet. Die Beschriftung kommt aus der Seite und ist übersetzt, etwa „fermer“.
  - Auf Arabisch sitzt es links.
  - Die pure-Kapitel zeigen geöffnet schon „−“.
- **Getestet** (ohne Screenshots):
  - Erster Besuch zeigt das Intro. Der Wechsel en → fr kommt ohne Intro, mit demselben Projekt in der Mitte und derselben Tiefe, auch tief im Universum (Schleier 0,86 vorher wie nachher).
  - Ein offenes qefyr bleibt beim Wechsel zu de offen.
  - „×“ liegt auf der Stelle des „+“ (Abweichung 0 px) und schließt. Auf Arabisch ist es gespiegelt.
  - Ein späterer frischer Besuch zeigt das Intro. Keine Skriptfehler.
  - `test-site` enthält jetzt beide Fälle. 49 Interaktionstests grün.

### Nachtrag: Intro-Handschrift in Pauls Strichreihenfolge (2026-10-08)

Paul: Die Buchstaben öffneten sich von links nach rechts, statt geschrieben zu werden. Jeder Buchstabe soll in seiner echten Strichfolge erscheinen, flüssig wie eine schnelle Unterschrift, danach „trust is my currency“, nicht zu langsam.

- **Ursache:** Nur „currency“ hatte echte Stiftwege. Unterschrift, „trust“ und „is my“ wurden je zusammenhängendem Tintenstück vom linken Ende aus aufgedeckt (`trace_region`).
- **Neu: `scripts/render_signature_handwriting.py`.**
  - Jeder Buchstabe hat Striche in Pauls Reihenfolge, als wenige Wegpunkte.
  - Die Wegpunkte rasten auf der Mittellinie der Tinte ein (Skelett aus dem Standbild). Dazwischen folgt der Stift der Tinte per kürzestem Weg.
  - Die Tinte selbst bleibt die des freigegebenen Standbilds aus Pauls Fotos. Das Skript bestimmt nur, wann jedes Pixel erscheint. Kreuzt ein Strich einen anderen, legt der erste Durchgang die Tinte.
- **Strichfolge:**
  - B: linker Strich hoch, oben rüber, rechts runter, unten nach links.
  - r: von links hoch über den Bogen.
  - i: von oben nach unten.
  - n und k: runter, hoch, runter.
  - m: runter, hoch, runter, hoch, runter. „ann“ folgt ohne Absetzen.
  - P: der lange Strich ganz nach unten, dann die Schleife von links hoch nach rechts rüber.
  - Danach „aul“. „trust“, „is my“ und „currency“ ebenso Buchstabe für Buchstabe; „currency“ mit seinen bisherigen Wegen.
- **Tempo:**
  - Der Stift folgt dem Zwei-Drittel-Gesetz der Handbewegung: langsamer in Kurven, schneller auf geraden Strichen. Zwischen Buchstaben hebt er 50 ms ab.
  - Auf der Seite (1,25-fach): Unterschrift ab 0,24 s, fertig nach rund 2,6 s. Das ganze Intro dauert 6,6 s statt bisher rund 7,9 s.
- **Datei:** `dist/assets/intro-handwriting-signed.mp4`, H.264, 60 fps, 101 KB. Das Standbild bleibt `intro-handwriting-split-complete.png`.
- **Geprüft:**
  - Kontrollblatt (`--sheet`) mit den Stiftwegen und Zeitstreifen für B, r, m, P-Strich, P-Schleife und trust.
  - Einzelbilder direkt aus der fertigen MP4: Das letzte Bild gleicht dem Standbild.
  - Die Seite lädt das Video auf allen sechs Sprachen. Der Fallback auf das Standbild (Browser ohne H.264) funktioniert.

### Nachtrag: Motto ruhiger (2026-10-08)

Paul: Die Unterschrift bleibt so schnell, „trust is my currency“ wirkt hektisch und soll langsamer laufen.

- **Unterschrift:** unverändert, fertig nach rund 2,6 s auf der Seite.
- **Motto:**
  - Pen-Zeit pro Zeile: trust 1,35 s (vorher 0,95), is my 1,15 s (0,80), currency 2,05 s (1,45), jeweils Videosekunden.
  - Pausen vor den Zeilen: 0,40, 0,30 und 0,30 s.
  - Auf der Seite schreibt sich das Motto damit in rund 4 s statt 2,8 s. Das ganze Intro dauert 7,9 s.
- `intro-handwriting-signed.mp4?v=2` (136 KB), damit kein Handy das alte Video aus dem Cache zeigt.

### Nachtrag: Unterschrift im ruhigen Tempo des Mottos (2026-10-08)

Paul: Die Unterschrift wirkt hektisch. Sie soll so ruhig laufen wie „trust is my currency“, damit der Zuschauer merkt: Hier ist es entspannt, ruhig und angenehm.

- **Befund:** Pro Einheit Stiftweg lief die Unterschrift 3-mal so schnell wie das Motto (0,0018 gegenüber 0,0052 s). Ihre großen Buchstaben ließen den Stift dadurch sichtbar rasen.
- **Umsetzung:** Die Unterschrift hat keine eigene Dauer mehr. `render_signature_handwriting.py` misst das Tempo der Motto-Zeilen und gibt der Unterschrift genau dieses Tempo. Damit bleiben beide immer gleich ruhig.
- **Ergebnis auf der Seite (1,25-fach):**
  - Unterschrift von 0,24 s bis rund 6,5 s.
  - Motto danach wie bisher.
  - Ganzes Intro 11,8 s. Wer will, tippt oder scrollt jederzeit weiter.
- `intro-handwriting-signed.mp4?v=3` (167 KB).

