# 02 — Inhalts-Inventar brinkmannpaul.com

Extrahierter Original-Stand 2026-09-22. **Nichts erfinden: Alle Texte 1:1 vom Live-System.**

## Aktualisierung: pure führt zu purmethod.com (2026-11-01)

- **Paul:** Über brinkmannpaul.com sollen die Leute auf purmethod.com kommen, dort liegt alles. purmethod.com bekommt ein Redesign auf „pure“ (Repo `purmethod/pur`, PR #3).
- **Rubrik pure:** Die Kapitel physis, understanding, responsibility und ego bleiben, aufklappbar wie bisher.
  - Die Notiz „coming soon. follow for the blueprint.“ heißt jetzt „the method, the blueprint and everything behind it live on purmethod.com.“
  - Statt des Instagram-Buttons steht „explore purmethod.com“. Er öffnet https://purmethod.com/ in einem neuen Tab.
  - Alle sechs Sprachen.
- **www.purmethod.com** hat bei Wix keinen DNS-Eintrag und ist deshalb nicht erreichbar. Nötig ist ein CNAME `www` auf `cname.vercel-dns.com` bei Wix und die Domain `www.purmethod.com` im Vercel-Projekt `pur`.

## Aktualisierung: Neuroarchitektur-Journal mit sechs Studien, keine Pfeile mehr (2026-11-01)

- **Paul:**
  - Kein „get in touch“ in der Neuroarchitektur-Rubrik.
  - Keine blauen Pfeile mehr, auf der ganzen Seite: iOS zeichnet „↗“ als blaues Emoji.
  - Den Research-Code von ChatGPT prüfen.
  - Fünf weitere Studien im gleichen, nüchternen Format, mit Zusammenfassung auf der Website.
- **Code-Prüfung** (die Seite von ChatGPT):
  - Die russische Seite war ohne Kopfzeile, Sprachwahl, Quellenblock und Stil gebaut und enthielt einen Gedankenstrich.
  - Der Link zurück zeigte auf `/de#…` statt `/de/#…`.
  - Es fehlten og:url, og:locale, og:image, hreflang x-default, datePublished und Favicon.
  - Die Seiten standen nicht in der Sitemap.
  - Der Teaser auf der Startseite hatte Inline-Styles.
- **Neu:**
  - `research/articles.json` enthält alle Artikel in sechs Sprachen. `scripts/research.py` erzeugt daraus jede Artikelseite, eine Liste `/research/` je Sprache und den Teaser in der Neuroarchitektur-Zeile. Der Teaser zeigt Nummer, Frage, Zusammenfassung und „read more“, darunter steht „all articles“.
  - Die Seiten behalten das Design von ChatGPT.
  - `i18n.py` nimmt die Journal-Seiten in die Sitemap auf (jetzt 84 Seiten).
- **Die sechs Artikel** (alle Daten an den Primärquellen geprüft):
  1. Quinones et al. 2026: Wohnviertel und Gehirnalterung, Berlin, 334 Personen, DOI 10.1016/j.envres.2026.124671.
  2. Ulrich 1984, Science: Blick auf Bäume und Genesung nach OP, 23 und 23 Patienten, DOI 10.1126/science.6143402.
  3. Lederbogen et al. 2011, Nature: Stadtleben, Aufwachsen in der Stadt und soziale Stressverarbeitung, DOI 10.1038/nature10190.
  4. Vartanian et al. 2013, PNAS: geschwungene Räume, Schönheitsurteil und anteriorer cingulärer Cortex, 18 Personen, 200 Bilder, DOI 10.1073/pnas.1301227110.
  5. Kühn et al. 2017, Scientific Reports: Wald am Wohnort und Integrität der Amygdala, 341 Personen der Berliner Altersstudie II, DOI 10.1038/s41598-017-12046-7.
  6. Sudimac, Sale & Kühn 2022, Molecular Psychiatry: eine Stunde im Grunewald senkt die Aktivität der Amygdala, 63 Personen, randomisiert, DOI 10.1038/s41380-022-01720-6.
- **Formulierung:** Beobachtungsstudien sind als Zusammenhang beschrieben, nicht als Ursache. Nur Sudimac 2022 ist randomisiert.
- **Freigabe:** Laut `docs/neuroarchitecture-editorial-i18n.md` gehen neue Studien erst nach Pauls Freigabe live.

## Aktualisierung: Timeline-Bilder zeigen Geschichte, Pauls Fotos stehen beim Text (2026-10-31)

- **Paul:** Seine eigenen Fotos erzählen nur das heutige Dorf. In die Timeline gehören Bilder, die das jeweilige Datum zeigen, zum Beispiel für die Antike ein Bild aus der Antike.
- **Timeline-Bilder** (alle historisch und frei):
  - Antike: `photo-carthage-1894.webp`, Tempelruinen in Karthago, W. H. Jackson 1894.
  - 1231: Postkarte um 1900.
  - 18./19. Jh.: Jackson 1894.
  - 1914: Klee.
  - 1915: d'Erlanger.
  - 1942/43: `photo-tunis-1943.webp`, die Alliierten ziehen in Tunis ein, Nick Parrino, OWI.
  - Ende 1940er: `drawing-sidi-1949.webp`, eine Straße in Sidi Bou Saïd, gezeichnet vom Architekten Victor Lundy 1949.
  - Herkunft: alle Library of Congress, „no known restrictions“, außer Klee (Centre Pompidou, gemeinfrei) und d'Erlanger (CC BY-SA, genannt).
- **Pauls Fotos** stehen jetzt zwischen den Absätzen über der Timeline: Meer, blaue Tür, Gassen-Video, Dächer. In der Timeline stehen keine eigenen Fotos mehr.
- Der Bildnachweis ist um Parrino und Lundy ergänzt.

## Aktualisierung: mysidibou-Timeline, 29 Daten ohne Lücke (2026-10-31)

- **Paul:**
  - Der Sprung von 1915 auf 2026 ist zu groß, die Recherche soll tiefer gehen: Krieg, Revolution, alles.
  - Kein Porträt und keine blaue Tür in der Timeline. Sie soll eine historische Zeitreise sein, auch durch die Künstler.
  - Keine Tagesdaten, nur Monate.
  - Sein Eintrag ist die Mission: Mitglied im wissenschaftlichen UNESCO-Komitee, Schutz vor Erdrutschen und ihren Gefahren, Beantwortung und Koordination des Massentourismus, Einführung des QR-Code-Kassensystems.
- **Neu zwischen 1915 und 2026** (Recherche 2026-10-31, Quellen siehe PR):
  - 1920er und 1930er: Blau und Weiß wird Regel, Gide.
  - 1932: d'Erlangers Tod.
  - 1942 und 1943: Krieg in Tunis, die Alliierten ziehen im Mai 1943 ein.
  - Ende der 1940er: École de Tunis.
  - März 1956: Unabhängigkeit.
  - 1966 bis 1968: Foucault lebt hier und schreibt die Archäologie des Wissens.
  - 1979: Karthago wird Welterbe.
  - 1985: Nationalpark Karthago und Sidi Bou Saïd.
  - 1992: Musikzentrum.
  - Januar 2011: Revolution, Ben Alis Palast auf dem Hügel.
- **Neu davor:**
  - 11. Jh.: Wach- und Feuertürme.
  - 1860: Leuchtturm.
  - 1893: Gemeinde per Dekret des Beys.
  - 1914 ergänzt um Mackes Bild des Cafés.
  - 1915 ergänzt: eines der ersten Denkmalschutzgesetze Tunesiens.
- **Entfernt:** das 9. Jh. (nur „möglich“ belegt), Pauls Porträt (`photo-paul-sidi.webp` gelöscht) und die blaue Tür.
- **Pauls Eintrag „2026“** steht mit gefülltem Punkt nach Juli 2026, dazu das Gassen-Video als Bild für den Massentourismus. Ein eigener Eintrag „next“ entfällt.
- **Daten:** nur noch Monate und Jahre, keine Tage.

## Aktualisierung: mysidibou-Timeline ausgebaut, Text oben (2026-10-31)

- **Paul:** Die Timeline hatte zu wenige Daten und machte zu große Sprünge. Sein eigener Eintrag soll wissenschaftlich klingen. Der Fließtext rückt nach oben, die Timeline steht darunter.
- **Aufbau:** Leitsatz zur Mission, „one earth“, Torfoto, Massentourismus (Venedig), Studenten. Danach die Timeline mit 20 Daten und der Bildnachweis.
- **Neue Daten** (Recherche 2026-10-31):
  - **Antike:** Wache auf dem Kap, Jebel el-Manar. Dazu das Hafenfoto bei Nacht.
  - **9. Jh.:** Ribat.
  - **1231:** Grab des Abu Saïd al-Baji.
  - **18. und 19. Jh.:** Sommerresidenzen der Beys. Dazu `photo-sidi-1894.webp`, W. H. Jackson, Library of Congress, no known restrictions.
  - **1912:** Baubeginn von Ennejma Ezzahra, Bauzeit zehn Jahre.
  - **1932:** d'Erlanger stirbt.
  - **1992:** Zentrum für arabische und mediterrane Musik.
  - **12. Januar 2013:** Brandanschlag auf das Mausoleum.
  - **25. Mai 2023:** Erlangers Archiv kommt ins UNESCO-Register Memory of the World.
  - **15. April 2024:** Tentativliste.
  - **Februar 2025:** Nominierung.
  - **Oktober 2026:** Freigabe der Hangsicherung. Nur eine Quelle.
  - **2028:** Prüfung auf der 50. Sitzung.
- **Pauls Eintrag 2026:** „paul brinkmann, architect (m.sc.) and artist, member of the scientific committee for tunisia's report to unesco. his fields: landslide risk on the clay cliff, the carrying capacity of the village for visitors, and the protection of residents and built heritage.“
- **Hinweis:** Beim Erwerb des Palastes sind die Quellen uneins (1987 oder 1988). Der Text sagt deshalb „since the late 1980s“.

## Aktualisierung: mysidibou-Timeline mit einem Bild pro Datum (2026-10-31)

- **Paul:** Jede Station der Timeline bekommt ein rundes Bild wie die Türen, zum Beispiel Paul Klee mit einem berühmten Werk.
- **Bilder** (rund, 240 px, wie die übrigen Fotos):
  - 13. Jh.: `photo-sidi-1900.webp`, das Dorf auf seinem Hügel, Postkarte um 1900 (Library of Congress, „No known restrictions on publication“). Vom Heiligen selbst gibt es kein Bildnis.
  - 1914: `photo-klee-1914.webp`, Paul Klee, „St. Germain bei Tunis (landeinwärts)“, Aquarell 1914, Centre Pompidou, gemeinfrei (Klee † 1940).
  - 1915: `photo-erlanger.webp`, Selbstporträt des Barons d'Erlanger in Ennejma Ezzahra. Das Foto stammt von Issam Barhoumi, CC BY-SA 4.0, deshalb steht die Namensnennung unter der Timeline.
  - Januar 2026: das Meerfoto.
  - 25. Juli 2026: die Dächer.
  - 2026: `photo-paul-sidi.webp`, Pauls Porträt.
  - 1. Dezember 2027: die blaue Tür.
  - als Nächstes: das Gassen-Video.
- Unter der Timeline steht eine kleine Bildnachweis-Zeile („pictures: …“). Die Fotos mit dem Tor und dem Hafen stehen weiter bei den Absätzen darunter.

## Aktualisierung: mysidibou-Timeline (2026-10-31)

- **Paul:** Wer die Rubrik öffnet, soll eine Timeline von oben nach unten sehen, deren Daten beim Scrollen erscheinen. Darin die Kerndaten von Sidi Bou Saïd und Paul selbst als Architekt und Künstler mit Master, Mitglied des wissenschaftlichen Komitees, mit der Tourismusfrage (QR-Kassensystem) und dem Schutz von Anwohnern und Dorf.
- **Aufbau:** Unter „my mission: to protect sidi bou saïd from landslides.“ stehen acht Daten an einer dünnen Linie mit einem Punkt pro Datum. Pauls Eintrag hat einen gefüllten Punkt.
  1. 13. Jh.: Abu Saïd al-Baji
  2. 1914: Klee, Macke, Moilliet (mit Türfoto)
  3. 1915: Dekret von d'Erlanger (mit Dächerfoto)
  4. Januar 2026: fast 300 mm Regen, Risse, acht Gebäude evakuiert (mit Meerfoto)
  5. 25. Juli 2026: Welterbe
  6. 2026: Paul Brinkmann, Architekt und Künstler, M.Sc., im wissenschaftlichen Komitee
  7. 1. Dezember 2027: Bericht fällig
  8. als Nächstes: QR-Ticketsystem mit Studenten, Schutz für Anwohner und Dorf, Finanzierung von Universität und Stadt
- **Darunter** stehen die Absätze zu „one earth“, zum Massentourismus (Venedig) und zu den Studenten, mit Video und den übrigen Fotos. Die Absätze, die jetzt in der Timeline stehen, sind entfallen.
- **Animation:** Jedes Datum steigt beim Scrollen ein (CSS `animation-timeline: view()`). Ohne diese Browser-Unterstützung oder bei reduzierter Bewegung ist alles sofort sichtbar. Arabisch ist gespiegelt.
- **Offen:** Paul sagte „2016“ für seinen Eintrag. Gesetzt ist 2026, weil Komitee und Welterbe 2026 sind. Ist 2016 sein Masterjahr, bekommt es einen eigenen Eintrag.

## Aktualisierung: mysidibou, die Mission zuerst (2026-10-31)

- **Paul:** Der Leser soll gleich am Anfang verstehen, worum es geht. Die Mission: das Dorf vor Erdrutschen schützen. Paul ist Mitglied des wissenschaftlichen Komitees für den UNESCO-Bericht zum 1. Dezember 2027 und will Teil der Antwort sein, die die UNESCO von Tunesien erwartet. Dazu kommen die Künstler, die hier gelebt und gearbeitet haben, und die Lösung des Massentourismus mit Studenten: ein Ticketsystem nach Venedigs Vorbild mit QR-Code, das Universität und Stadt finanziert.
- **Neuer Aufbau der Rubrik** (die Fotos bleiben dazwischen):
  1. Leitsatz „my mission: to protect sidi bou saïd from landslides.“, danach das Komitee und der Bericht zum 1. Dezember 2027.
  2. UNESCO-Welterbe seit 25. Juli 2026. Das Dorf steht auf einer Tonklippe über dem Golf von Tunis.
  3. Januar 2026: fast 300 mm Regen in zwei Tagen, Risse am Hang, acht Gebäude evakuiert. Die UNESCO fordert Studien zu den Erdrutschen, eine Kartierung der Risse, Notfallplanung und Tourismussteuerung.
  4. Künstler: 1914 Klee, Macke und Moilliet. 1915 Schutzdekret für Weiß und Blau auf Betreiben von Baron Rodolphe d'Erlanger. Danach École de Tunis, Schriftsteller, Denker, Musiker. Paul recherchiert die Liste weiter.
  5. „we only have one earth …“ und Pauls Beitrag als Architekt und Künstler.
  6. Massentourismus: ein Ticketsystem mit Studenten nach Venedigs Vorbild (Tagesgebühr, online gebucht, per QR-Code geprüft). Die Einnahmen gehen an Dorf und Universität.
  7. Ideen mit den Studenten für öffentlichen Raum, Müll, Erbe und den Hang.
- **Quellen** (Recherche 2026-10-31):
  - Tunisie Numérique / News Tunisia zur Einschreibung am 25.07.2026 (Kriterium iii, Bericht bis 01.12.2027, 50. Sitzung 2028).
  - Kapitalis, Web Manager Center und L'Écho touristique zum Januar 2026 (ca. 300 mm in 48 h, acht evakuierte Gebäude).
  - Zentrum Paul Klee und AramcoWorld zur Tunisreise im April 1914.
  - Webdo zum Dekret vom August 1915.
  - Venezia Unica zur Venedig-Gebühr (5 € bzw. 10 €).
- **Nebenbei:**
  - Der Forschungs-Teaser „research journal / 001“ aus #189 stand nur auf der englischen Startseite. Er ist jetzt in allen sechs Sprachen übersetzt und verlinkt auf den Artikel in der jeweiligen Sprache.
  - `i18n.py` übersetzt dafür auch `h3` und hält `research/`-Links in der Sprache.
  - `test-site.mjs` beendet die Projektliste an ihrer eigenen `</section>`, nicht an der des Teasers.

## Metadaten

## Aktualisierung: „book a session“ nur noch unten in der Wim-Hof-Rubrik (2026-10-30)

- **Paul:** Der Button oben wirkt zu sehr nach Verkaufen, und verkaufen will er nicht. „book a session“ gehört nur nach unten.
- **Neu:** Der Button unter „fifteen years of breath.“ ist entfernt. Die Rubrik beginnt wieder mit der Geschichte. „book a session“ steht nur noch am Ende.

## Aktualisierung: compaz ist live, nicht „coming soon“ (2026-10-29)

- **Paul:** mycompaz.com ist schon live. Statt „coming soon“: Probier es aus, teste es, und schreib mir, wenn du Ideen und Anregungen hast.
- **Startseite:**
  - Untertitel „live · mycompaz.com“.
  - Unten steht „mycompaz.com is live. try it, test it, and write to me if you have ideas or suggestions.“
  - Der Button „explore mycompaz.com ↗“ öffnet die Seite in einem neuen Tab.
  - Dazu der Link „send me your ideas ↗“ (E-Mail mit Betreff „compaz ideas“).
- **Seite `/compaz/`:** Keine Warteliste mehr. Der Button oben öffnet mycompaz.com, darunter steht derselbe Satz, und es gibt einen Abschnitt „ideas and suggestions“ (WhatsApp oder E-Mail).
- Alle sechs Sprachen. Die Liste `compaz` bleibt in `/api/waitlist` erlaubt, die Seite nutzt sie aber nicht mehr.

## Aktualisierung: compaz als App mit Name, Link auf mycompaz.com (2026-10-29)

- **Paul:** Das Projekt heißt compaz, die Website ist mycompaz.com. Das App-Logo zeigt nur den Kompass, darunter steht der Schriftzug exakt wie im Logo.
- **Neu:**
  - Die Rubrik heißt „compaz“ statt „compaz.com“.
  - Die Kachel zeigt nur den Kompass (`assets/compaz-icon.webp`). Er ist aus Pauls Logo als Vektor nachgezeichnet, Tinte auf dem Creme der Seite. Darunter steht wie ein App-Name der Schriftzug COMPAZ aus dem Logo (`assets/compaz-wordmark.webp`).
  - Beides führt zu https://mycompaz.com/ (neuer Tab), auf der Startseite und auf `/compaz/`. Release-Button und Warteliste bleiben.
  - CSS `.app-with-name` in `brain-scroll.css` (v=179).
- **mycompaz.com:** Das Repo `purmethod/compaz` bekommt in purmethod/compaz#2 die Icons für den Homebildschirm (apple-touch-icon, Manifest-Icons). Die Seite wird nicht aus dem Repo veröffentlicht. Paul muss die Dateien so ausrollen wie bisher.

## Aktualisierung: neue Rubrik compaz.com (2026-10-28)

- **Paul:** Neue App-Rubrik compaz („Kompass mit Z“), gleiches Layout wie cyclemax und cutcake, mit seinem Logo. Der Kern: Du liebst Reisen, bist in einer neuen Stadt und weißt nicht, was abgeht. Du tippst deinen Ort ein und findest Party, Yoga Retreat, Atemsession und das beste Restaurant, handverlesen. Dazu einfaches Design ohne Schnickschnack, „explore easy“.
- **Startseite:** Die Zeile „compaz.com · coming soon“ steht nach cutcake.
  - Leitsatz mit Logo-Kachel rechts (`assets/compaz-logo.webp`, aus Pauls Logo zugeschnitten).
  - Drei Absätze: Party und Yoga Retreat als Frage, „type in where you are. find your party. …“, „hand-picked: only the best places. simple and clean, nothing overwhelming. explore easy.“
  - Darunter der Release-Block.
- **Seite `/compaz/`:** wie `/cutcake/`, mit Warteliste `compaz`. Alle sechs Sprachen, Sitemap jetzt 42 Seiten.
- **Links:** Logo und Button führen zu `/compaz/`. compaz.app zeigt derzeit eine fremde Seite („Tu guía de teleférico en La Paz“), und ein compaz-Repo ist für Claude nicht sichtbar. Der Codex-Zweig `codex/183-add-compaz` ist leer.
- **Tests:** an die vereinheitlichten Projekt-Buttons aus #179 angepasst (Links mit `class="row-cta"`).

## Textvorgabe von Paul (2026-10-26, #181)

- Den ungefragt ergänzten Satz „that is my experience, not a promise for every starter in every kitchen.“ aus dem ÂLF-Verkaufstext und allen Übersetzungen entfernen. Der übrige Text bleibt unverändert. Keine ungefragten relativierenden Zusätze in Pauls Verkaufstexte einbauen; sachliche Bedenken separat besprechen, statt seine Aussagen still umzuschreiben.

## Aktualisierung: Sauerteig und einheitliche Buttons (2026-10-26, #178)

- Eine gemeinsame Sauerteig-Rubrik statt der doppelten Einträge: ÂLF und Pauls persönliche Methode stehen zuerst, Rye bleibt darunter als eigenständiges Angebot mit bestehendem Bestellweg. ÂLF-Vorbestellung führt zum vorhandenen Angebot unter souralf.com/adopt; Preise und Zahlungslogik bleiben unangetastet.
- Pauls Geschichte: eigenes Brot, weniger Betreuungsaufwand, Methode aus persönlicher Begeisterung, Teilen auf Nachfrage. Ein Monat Pause als persönliche Erfahrung, nicht universelle Lageranweisung. Keine pauschale Behauptung über schädliches Supermarktbrot oder Glutenfreiheit; ohne zugesetzte Backhefe statt ohne natürliche Hefen. Keine unbelegte Gesamtzeit von ein bis zwei Stunden inklusive Fermentation.
- Rubrikübergreifend derselbe bestehende dunkle, rechteckige Aktionsbutton. Wim Hof oben und unten identisch „book a session“, gleiches Buchungsziel.

## Aktualisierung: „book a session“-Button oben in der Wim-Hof-Rubrik (2026-10-23)

- **Paul:** Der Button war zu klein und stand ganz unten. Wer die Rubrik öffnet, soll ihn sofort sehen: oben, sauber, „book session“.
- **Neu:** Direkt unter „fifteen years of breath.“ steht ein Button über die volle Breite: graphit (`--tone-dark`), weiße Schrift, 54 px hoch, ohne Unterstreichung. Text „book a session“ (de: „session buchen“). Er führt zu `weekends/#book`, dort ist die Session vorausgewählt.
  - Im Browser bei 390 px geprüft: Er steht beim Öffnen sichtbar im ersten Bildschirm.
  - Der Link „book a breathing session ↗“ am Ende der Rubrik bleibt.
  - CSS `.row-cta` in `brain-scroll.css` (v=155).

## Aktualisierung: Breathing Sessions buchen, 100 € (2026-10-23)

- **Paul:** In der Wim-Hof-Rubrik soll es einen Button „Breathing Session buchen“ geben. Danach wählt man zwischen Weekend und Breathing Session. Die Session kostet 100 € und lässt sich direkt über Stripe kaufen.
- **Startseite:** In der Wim-Hof-Zeile führt „book a breathing session ↗“ (de: „atemsession buchen ↗“) zu `weekends/#book`. Er ersetzt „book a weekend ↗“.
- **Seite `/weekends/`:**
  - Neuer Kopf: „wim hof method“, „breathing sessions · weekends in poland“.
  - Oben steht die Auswahl „what would you like to book?“ mit zwei Optionen: breathing session (100 €) und weekend in poland (1490 €). Vorausgewählt ist die Session, `#weekend` wählt das Wochenende.
  - Die Sicherheitshinweise stehen jetzt direkt danach und gelten für beides.
  - Abschnitt „breathing session“: Leitsatz „breathe with me. personally.“, Beschreibung, Preis 100 €, drei Buchungsschritte (nach der Zahlung schreibt Paul persönlich, Zeit und Ort werden vereinbart) und die eingebettete Stripe-Kasse nach dem Haken bei den Sicherheitshinweisen.
  - Das Wochenende ist unverändert, nur in seinen eigenen Abschnitt gefasst.
- **Danke-Seite:** Nach einer Session zeigt sie „your breathing session is booked …“.
- **Technik:**
  - `shop.json` hat das Produkt `session` (10000 Cent, ohne Versand, `max_quantity` 1, `path` weekends). Die Anzahl ist in der Kasse fest.
  - `order.js` (v=149) kann jetzt mehrere Bestellblöcke auf einer Seite. Stripe zeigt immer nur eine Kasse auf einmal.
  - Die Rücksprungadresse trägt `&product=`.
- **Offen:** Dauer und Ort der Session (online oder vor Ort) hat Paul nicht genannt. Der Text sagt deshalb nur: Ich schreibe dir persönlich, und wir legen Zeit und Ort fest.

## Aktualisierung: cyclemax, Ehe und Verantwortung (2026-10-17)

- **Paul:** Nach dem Absatz über die Kinder kommt ein neuer Absatz in seinen Worten: Partnerschaft und Ehe sind heilig. Wer eine Familie gründet, übernimmt Verantwortung, die sich nicht einfach emotional auflösen lässt. Wenn Kinder im Spiel sind, beginnt die Verantwortung.
- **Neu (Startseite, cyclemax, „why i built it“, vor „that is my goal.“):** „a partnership, a marriage, is sacred. when you decide to start a family, you take on a responsibility. and this responsibility cannot simply be dissolved by emotion. when children are involved, responsibility begins.“ Deutsch wörtlich: „eine partnerschaft, eine ehe ist heilig. …“. Alle sechs Sprachen.

## Aktualisierung: all art zuerst im Rad (2026-10-17)

- **Paul:** all art soll im Rad als Erstes erscheinen.
- **Neue Reihenfolge:**
  1. all art
  2. neuroarchitecture
  3. cutcake.app
  4. cyclemax.app
  5. pure
  6. mysidibou
  7. kefir
  8. sourdough (rye)
  9. skincare
  10. sourdough (âlf)
  11. wim hof method instructor
- **Beim Öffnen:** all art steht in der Mitte. Darüber steht wim hof, darunter neuroarchitecture.

## Aktualisierung: neuroarchitecture zuerst im Rad (2026-10-17)

- **Paul:** Wer die Seite öffnet, sieht zuerst neuroarchitecture. Darüber steht wim hof method instructor, darunter all art, dann die Apps (cutcake zuerst).
- **Neue Reihenfolge:**
  1. neuroarchitecture
  2. all art
  3. cutcake.app
  4. cyclemax.app
  5. pure
  6. mysidibou
  7. kefir (qefyr)
  8. sourdough (rye)
  9. skincare (skyn)
  10. sourdough (âlf)
  11. wim hof method instructor
- **Warum das reicht:** Das Rad ist endlos und startet beim ersten Eintrag. Der letzte Eintrag, wim hof, steht deshalb direkt darüber. In allen sechs Sprachen geprüft.

## Aktualisierung: neue Rubrik cutcake.app (2026-10-17)

- **Paul:** Neue Rubrik für die App cutcake.app, Layout und Logo-Anordnung wie bei cyclemax. Text: „love creating videos, but social media drains your energy? i designed an app for creators who want more from life. coming soon.“
- **Startseite:** Die Zeile „cutcake.app · coming soon“ steht direkt nach cyclemax.
  - Links der Leitsatz, rechts das Logo als App-Kachel (104 px, `assets/cutcake-logo.webp`, aus Pauls Logo zugeschnitten, weißes Papier).
  - Darunter der Satz und der Release-Block mit „sign up for the release ↗“.
  - Logo und Button führen zu `/cutcake/`, nicht zu cutcake.app: die App verlangt dort noch einen Login.
- **Seite `/cutcake/`:** Gebaut wie `/cyclemax/`: Logo-Kachel oben, Leitsatz, Satz, Release-Button, dann die Release-Karte mit dem Formular und ein schwebender Button beim Lesen. Alle sechs Sprachen, in der Sitemap (jetzt 36 Seiten).
- **Warteliste:** `/api/waitlist` kennt die Liste `cutcake`. Einträge landen in Stripe als Kunden mit `metadata.waitlist = cutcake`.
- **Tests:** Die Suite lief auf `main` nicht mehr durch, weil frühere Änderungen sie nicht mitgenommen hatten:
  - `document.addEventListener` in `app.js`
  - pagehide/pageshow-Listener, die die ganze Zeit bestehen
  - Links mit `class` vor `href`
  - Wochenendpreis 1490 €

  Die Prüfungen sind daran angepasst. Die Wartelisten-Prüfung gilt jetzt für cyclemax und cutcake.

## Aktualisierung: Wim Hof Weekend Preis (2026-10-15, #166)

- Paul legt den Preis auf 1490 € statt 490 € pro Person fest. Sichtbare Preise und Metabeschreibungen in sechs Sprachen sowie der serverseitige Buchungspreis (149000 Cent) werden angepasst. Termine, Kontingente und andere Produkte bleiben unverändert.

## Aktualisierung: Cyclemax-Einstieg (2026-10-13, #164)

- Auf Pauls Wunsch ersetzt „cyclemaxing for women, men and couples.“ die Überschrift „the rock in the storm.“. Bisherige Unterzeile entfällt, damit der Satz nur einmal erscheint. Bestehende Übersetzungen in allen sechs Startseiten; Langtext und übrige Inhalte unverändert.

## Aktualisierung: Claude-Fassung Neuroarchitektur wiederhergestellt (2026-10-13, #162)

- Paul wählt ausdrücklich die zuletzt von Claude bearbeitete Fassung aus PR #127 (56b0058). Nur der Neuroarchitektur-Langtext wird wortgleich wiederhergestellt, einschließlich der damaligen fünf Übersetzungen. Die reine Unterschrift aus #160 bleibt erhalten.

## Aktualisierung: Neuroarchitektur und Unterschrift (2026-10-13, #160)

- Von Paul zuletzt freigegebener Neuroarchitektur-Text vollständig übernommen: persönliche Überzeugung zum „first brain“, Forschungsfragen zu gebauter Umwelt, Gewohnheiten und Mikrobiom, Genesung und Krankenhausgestaltung sowie das Ziel, unbemerkte Einflüsse sichtbar zu machen. Englischer Wortlaut unverändert; fünf Übersetzungen ergänzt und Startseiten generiert.
- „trust is my currency“ aus dem Intro entfernt. Pauls originale Unterschrift bleibt mit gleicher Strichfolge, Größe, Position und Schreibgeschwindigkeit. Neue Animation und Standbild aus der vorhandenen Handschriftquelle gerendert; Originaldateien erhalten.

## Aktualisierung: ausführlicher Cyclemax-Text ergänzt (2026-10-13, #158)

- Paul stellt klar: Das neue Intro einschließlich der Ansprache für Frauen, Männer und Paare bleibt vollständig stehen. Beim Weiterlesen soll zusätzlich der frühere ausführliche Text erscheinen.
- In der Cyclemax-Rubrik folgt deshalb nach dem neuen Einstieg „why i built it“ mit den zehn ursprünglichen Absätzen aus dem Stand vor #152: Motivation, Fels-in-der-Brandung-Gedanke, Unterschiede, Farbhilfe und langfristiges Beziehungs-/Familienziel. Wortlaut und vorhandene Übersetzungen wiederverwendet.
- Frühere doppelte Release-Links und der bereits ausdrücklich gestrichene Satz „because he no longer loves her.“ kommen nicht zurück. Aktuelles Farblogo und ein gemeinsamer Release-Button bleiben bestehen. Keine Änderungen an der separaten Release-Seite, anderen Rubriken, CSS oder JavaScript.

## Aktualisierung: animiertes Cyclemax-Logo (2026-10-13, #154)

- Paul möchte das aktuelle Logo von cyclemax.app einschließlich Farbwechsel übernehmen. Ringgeometrie, Rot/Gelb/Grün/Pink und gleichmäßige 12-Sekunden-Drehung entsprechen dem Original. Die originale Wortmarke bleibt als Vektor erhalten. Auf Start- und Release-Seite in allen Sprachen.
- Bei reduzierter Bewegung bleibt der farbige Ring statisch. Das Logo bleibt zu cyclemax.app verlinkt.

## Aktualisierung: cyclemax für Frauen, Männer und Paare (2026-10-13, #152)

- **Paul:** Cyclemaxing für Frauen, Männer und Paare; Single oder Partnerschaft als wählbarer Modus. Frauen tragen ihre Periode ein und erhalten vorausschauende Orientierung zu Ernährung und Nährstoffen. Männer erhalten Erinnerungen, ruhig und präsent zu bleiben: der Fels in der Brandung.
- **Startseite:** „cyclemax.app · coming soon“ am Rad. Geöffnet beginnt die Rubrik mit „the rock in the storm.“ und „cyclemaxing for women, men and couples.“ Danach Moduswahl, „for her.“, „for him.“ und das gemeinsame Ziel. Die Wettervorhersage-Metapher bleibt; keine pauschalen Nährstoffvorgaben oder garantierten Wirkungen.
- **Gestaltung:** Original-App-Logo rechts neben dem Intro, am Ende ein klarer Release-Button. Die separate Release-Seite verwendet dasselbe Logo und dieselbe Ansprache. Die frühere rein männliche Ansprache und Scheidungsargumentation entfallen.
- **Umfang:** Ankündigung der von Paul beschriebenen App-Funktionen, keine Implementierung dieser Funktionen. Bestehendes Anmeldeformular und Backend unverändert. Alle sechs Sprachen über den Übersetzungs-Generator aktualisiert.

## Aktualisierung: Wim Hof Weekends mit festen Terminen und Restplätzen (2026-10-11)

- **Paul:** Die Termine stehen fest, jeweils Donnerstag bis Sonntag: 12. bis 15. November, 19. bis 22. November, 26. bis 29. November, 3. bis 6. Dezember und 10. bis 13. Dezember 2026.
- **Seite `/weekends/`:**
  - Unter „dates“ stehen die fünf Termine.
  - In „book your place“ wählt man sein Wochenende. Jeder Termin zeigt, wie viele Plätze noch frei sind („20 places left“, „1 place left“, „fully booked“). Ausgebuchte Termine lassen sich nicht wählen.
  - Man kann nie mehr Personen wählen, als Plätze frei sind.
  - Das Rückzahlungsversprechen für den Fall, dass kein Termin passt, ist entfallen.
- **Zählung:** `api/_places.js` zählt die bezahlten Plätze pro Termin direkt in Stripe (abgeschlossene Checkout-Sitzungen, `metadata.date` und `metadata.places`). 20 Plätze pro Termin; ein Termin, der begonnen hat, ist geschlossen. `/api/checkout` prüft die freien Plätze vor jeder Buchung. Die Personenzahl ist in der Stripe-Kasse fest, damit die Zählung stimmt. Der Termin steht im Produktnamen der Zahlung, zum Beispiel „wim hof weekend · poland · 12 to 15 november 2026“.
- **`order.js` v=3.**

## Aktualisierung: Wim Hof Weekends direkt bezahlen (2026-10-11)

- **Paul:** Die Wim Hof Weekends sollen sich direkt auf der Seite bezahlen lassen, mit der Stripe-Kasse wie bei skyn und rye. Der Stripe-Schlüssel für brinkmannpaul.com ist eingetragen.
- **Seite `/weekends/`:** Statt Anfrage per E-Mail oder WhatsApp gibt es den Abschnitt „book your place“.
  - Preis 490 € pro Person, 1 bis 4 Personen, mit Gesamtsumme.
  - Haken bei „i have read the safety notes.“, erst dann geht der Button „book your place“.
  - Die Stripe-Kasse öffnet sich eingebettet auf der Seite. Apple Pay und andere Zahlarten erscheinen, sobald sie in Stripe eingeschaltet sind.
- **Termine:** Die genauen Termine stehen noch nicht fest. Der Text sagt deshalb: Ich schreibe dir persönlich, du wählst dein Wochenende, und passt keiner der Termine, bekommst du dein Geld vollständig zurück. Das ist ein Versprechen von Paul. Sobald die Termine feststehen, kommt eine Terminauswahl dazu.
- **Danke-Seite `/weekends/thanks/`** in allen Sprachen (noindex). Zeigt die Bestätigung oder, wenn nicht bezahlt wurde, den Hinweis, es noch einmal zu versuchen.
- **Technik:**
  - `shop.json` hat jetzt das Produkt `weekend` (49000 Cent, `shipping: false`, `max_quantity: 4`, `path: weekends`).
  - `/api/checkout` fragt bei Produkten ohne Versand keine Adresse ab. Die Metadaten enthalten Produkt und Anzahl der Plätze.
  - `order.js` (v=2) kann jetzt Produkte ohne Versand und wartet bei `data-agree` auf den Haken.

## Aktualisierung: cyclemax als Versicherung für die Beziehung (2026-10-11)

- **Paul:** cyclemax ist kein nettes Extra, sondern eine Versicherung für die Beziehung. Die Alternative ist Streit, Trennung, Scheidung, und eine Scheidung kostet mehr als ein Abo.
- **Neu, mit Hook (Paul: reißerisch, seine Worte):** „streit. trennung. scheidung. eine scheidung kostet mehr als ein leben lang cyclemax. cyclemax ist die versicherung für deine beziehung.“ (en: „arguments. separation. divorce. …“). Drei harte Worte als Einstieg, die Rechnung als Schlag, die Versicherung als Auflösung. Auf der cyclemax-Seite etwas größer gesetzt. Der Satz steht auf der Startseite unter dem Leitsatz der cyclemax-Zeile, vor dem Release-Link, und auf der cyclemax-Seite vor dem Release-Button. Alle sechs Sprachen.

## Aktualisierung: cyclemax als Release-Seite, Warteliste speichert automatisch (2026-10-11)

- **Paul:** Die Warteliste darf keine E-Mail öffnen, die der Leser selbst abschicken muss. Die Anmeldung soll automatisch gespeichert werden. Die Seite soll wie ein professioneller Release wirken, mit einem Button oben: „trag dich für den release ein“.
- **Speichern:** `/api/waitlist` gibt die Anmeldung an `souralf.com/api/waitlist` weiter (souralf#3). Das souralf-Projekt hat den Stripe-Schlüssel von Pauls Konto. Jede Adresse wird dort ein Stripe-Kunde mit `metadata.waitlist = cyclemax`, nie doppelt. Live getestet mit brinkmannbuild@gmail.com.
  - Bekommt brinkmannpaul einen eigenen `STRIPE_SECRET_KEY`, schreibt die Seite selbst nach Stripe.
  - Kein `mailto` mehr. Bei einem Fehler steht dort: bitte gleich noch einmal versuchen.
- **Release-Seite:**
  - Oben ein Ring: ihre 28 Tage in fünf ruhigen Phasenfarben, innen deine 24 Stunden, und ein Punkt läuft langsam um (still bei reduzierter Bewegung).
  - Darunter „sei der fels in der brandung.“, ein Satz, was die App tut, und der dunkle Button „trag dich für den release ein“.
  - Dann „was die app macht“ in drei Schritten, „warum ich sie gebaut habe“ mit Pauls Text, und eine Release-Karte mit dem Formular.
  - Beim Lesen schwebt der Button unten. Er verschwindet, sobald das Formular zu sehen ist.
- **Nach dem Eintragen:** In der Release-Karte steht nur noch die Bestätigung, groß. „leave your e-mail“ und das Kleingedruckte verschwinden (Paul: Er hat die E-Mail ja schon hinterlassen).
- **Startseite:** Die cyclemax-Zeile hat den Link „sign up for the release ↗“ direkt unter dem Leitsatz und noch einmal am Ende.

## Aktualisierung: neue Rubrik cyclemax.app mit Warteliste (2026-10-11)

- **Paul:** Neue Rubrik cyclemax.app mit seinen Worten. Der Mann als Fels in der Brandung, emotional führen, gleichwertig aber nicht gleich, 28 Tage gegen 24 Stunden, die App zeigt mit Farben und warnt vor, Revolution im Dating und in Beziehungen. Dazu eine Warteliste, live.
- **Startseite:** Neue Zeile „cyclemax.app · an app for men · coming soon“ nach pure, mit dem ganzen Text und dem Link „join the waitlist ↗“. Damit sind es zehn Rubriken.
- **Seite `/cyclemax/`:** Gleiche Bauart wie die rye- und skyn-Seiten: der Text, dann die Warteliste (ein E-Mail-Feld, ein Knopf), dann Fragen per WhatsApp oder E-Mail. Die Seite gibt es in allen sechs Sprachen, und sie steht in der Sitemap (jetzt 30 Seiten).
- **Warteliste (`/api/waitlist`):** Jede Adresse wird in Stripe als Kunde mit `metadata.waitlist = cyclemax` angelegt, dazu Sprache, Quelle und Datum. Eine Adresse, die schon eingetragen ist, kommt nicht doppelt hinein.
  - Export: Stripe → Kunden → Filter nach Metadaten.
  - Bots fängt ein unsichtbares Feld ab.
- **Ohne `STRIPE_SECRET_KEY`, oder wenn Stripe ausfällt:** Der Knopf öffnet eine fertige E-Mail an brinkmannbuild@gmail.com mit der Adresse. So geht keine Anmeldung verloren.
- **i18n:** `button` zählt jetzt als Texteinheit, damit auch der Knopf übersetzt wird.
- **Offen:** Datenschutzerklärung. Wer E-Mails sammelt, muss Zweck, Speicherort (Stripe, USA) und Löschung nennen.

## Aktualisierung: Foto mit Wim gesund statt fahl (2026-10-10)

- **Paul:** Der Filter beim Foto mit Wim hatte einen grünen, blassen Stich, es muss gesund aussehen.
- **Ursache:** Der Honig-Filter hob in der Haut das Grün an. Rot zu Grün fiel von 1,47 im Original auf 1,25, dazu kamen aufgehellte, matte Schatten.
- **Neu:** Look „healthy“ in `scripts/grade_photo.py`. Er hält die Wärme, nimmt aber das Matte und den Gelbstich heraus: volle Farbe, mehr Tiefe, Haut pfirsich statt gelbgrün (Hauttönung als eigener Parameter `skin_tint`, für den Honig-Look unverändert). Gemessen in der Haut: Rot zu Grün 1,40, Grün zu Blau 1,19.
- **Befehl:** `python3 scripts/grade_photo.py e453f816-image.jpg wim-hof 936 1376 560 0 0 healthy`. URL jetzt `photo-wim-hof.webp?v=6`. Die anderen Fotos behalten den Honig-Look.

## Aktualisierung: Unterschrift schreibt sich erst, wenn das Porträt da ist (2026-10-10)

- **Fehler (Paul: „die unterschrift funktioniert nicht“):** Das Handschrift-Video hatte `autoplay`. Der Browser startete es, sobald die 137 KB da waren, also oft vor dem Porträt (183 KB). Gemessen auf langsamem Mobilnetz: Die Schrift begann nach 0,6 s auf leerem Weiß, das Porträt kam erst nach 3,1 s. Bis dahin war „Brinkmann Paul“ schon geschrieben.
- **Fix in `dist/app.js`:** kein `autoplay` mehr. Die Unterschrift startet per `play()` erst, wenn das Porträt geladen ist, und dann immer von vorn. `play()` lädt das Video selbst: iOS lädt ein nicht angefordertes Video nicht vor, und stumme Inline-Videos dürfen ohne Antippen starten. Die 10-s-Sicherung (sonst Standbild der fertigen Unterschrift) gilt jetzt, bis das Video wirklich läuft. Hat der Besucher das Intro schon verlassen, startet nichts mehr hinter dem Tor.
- **Gemessen:** auf langsamem Netz Porträt nach 3,0 s, Unterschrift ab 0 s im selben Moment. Auf schnellem Netz Start nach 0,08 s. Die Tests in `scripts/test-site.mjs` decken Warten aufs Porträt, fehlendes Porträt, Stromsparmodus, Quellfehler, fehlendes H.264, Zeitüberschreitung und verlassenes Tor ab.

## Aktualisierung: Preise skyn 100 €, rye 20 € (2026-10-10)

- `dist/shop.json`: skyn 10000 Cent pro Tiegel, rye 2000 Cent pro Anstellgut. Paul: runde Preise wirken selbstbewusster, 99 und 19 „sieht wie ramsch aus“. Versand unverändert: Deutschland 6,19 €, EU 14,49 €, weltweit 27,49 €.
- Der Checkout öffnet sich, sobald `STRIPE_SECRET_KEY` im Vercel-Projekt gesetzt ist. `/api/shop` meldet dann `ready: true`.

## Aktualisierung: live mit Freigabe, ohne gezeichnete Galaxien; rye-Bestellseite, skyn mit Bestellschritten (2026-10-10)

- **Freigabe Paul:** Der große Durchgang vom 9.10. geht live (Texte, Übersetzungen, Schwarz-Fixes, Ladeverbesserungen, Sitemap), **ohne** das Punktfeld und die gezeichneten Spiralgalaxien. O-Ton: „sieht nicht realistisch aus“. Das All bleibt bei den Zeichnungen nach der H01-Rekonstruktion (Harvard und Google). Das weiche Licht an der Schwelle bleibt.
- **Checkout für mehrere Produkte:**
  - `dist/shop.json` hat jetzt `products` (skyn, rye), jeweils mit Name, Beschreibung, Preis in Cent (`null`, bis Paul ihn nennt), Währung, Bild und Hinweis im Checkout. Die Versandzonen sind gemeinsam.
  - `/api/shop?product=…` und `/api/checkout {product, …}` bedienen beide Produkte. Der Rücksprung geht auf `/<sprache>/<produkt>/thanks/`.
  - Gemeinsames Bestellskript `dist/order.js`, das Produkt steht in `data-product`.
- **skyn:** neuer Abschnitt „how ordering works“ im Aufbau der Weekends-Seite:
  1. choose your shipping and how many jars.
  2. pay securely with stripe, right here on the page.
  3. your skyn ships with dhl, tracked, as soon as the batch is ready.
- **rye (neu, `/rye/` in sechs Sprachen, mit Danke-Seite):**
  - Kopf „rye by brinkmann · sourdough starter · german organic rye · shipped worldwide“
  - „flour. water. time.“ und die zwei Absätze aus der Projektliste
  - **what you get:** an active rye starter · feeding instructions · a first-loaf guide
  - **how ordering works:** die drei Schritte, Preis „per starter“, Stripe-Checkout auf der Seite
  - **Startseite:** „pre-order rye ↗“ führt jetzt dorthin statt zur E-Mail. „get in touch for current availability.“ ist gestrichen.
- **Damit Kunden bezahlen können, fehlt noch:**
  - `STRIPE_SECRET_KEY` im Vercel-Projekt brinkmannpaul (gleicher Wert wie bei souralf). Der Zugriff auf das Team pur1 ist von hier aus gesperrt (403).
  - Die Preise für skyn (pro Tiegel) und rye (pro Anstellgut) in `dist/shop.json`.

  Bis dahin zeigen beide Seiten „the pre-order opens here shortly.“

## Aktualisierung: großer Durchgang, Texte, Zoom mit Tiefe, Sitemap (2026-10-09, zur Freigabe, noch nicht live)

- **all art. (Pauls Kürzung):** Die Absätze „ai is one more tool …“ und „learn the tools …“ sind gestrichen. „ai cannot feel love …“, „all art means …“ und „you.“ bleiben.
- **Textdurchgang (Englisch), Pauls Worte bleiben, nur klarer:**
  - **pure:**
    - „what it needs, how it responds …“
    - „gives you the foundation to lead your life“
    - „your mind is not your brain … your mind is your thoughts, your feelings, your awareness, your inner experience.“
    - „picture it as hardware and software. your brain is the hardware, your mind is the software. they are connected, but they are not the same.“
    - „understand this: …“
    - „self-control“
  - **kefir:** „in one milk kefir study, vitamin b3 rose by about 202%, b5 by about 42% and b7 by about 58% compared with the milk it was made from.“ Quelle der Zahlen ist Pauls Commit 9dd9fde: B3 von 116,64 auf 352,67 µg/l.
  - **sourdough (rye):** „a starter is a living culture: you feed it flour and water, it raises your dough, and a small part is always kept for the next bake.“
  - **sourdough (âlf):** „âlf brings you news and tips about everything sourdough. adopt âlf, wherever you are in the world.“
  - **skincare:** „… my energy to whoever uses them.“
  - **neuroarchitecture:**
    - britische Schreibweise wie der Rest der Seite: behaviour, colours, organisation, standardisation
    - kein Serienkomma
    - „what shapes us every day without our being aware of it?“
    - „we already know that architecture affects us consciously. the more compelling question is:“
  - **weekends/skyn:** „write to me on whatsapp or by e-mail. i answer personally.“ Sicherheitshinweis als Anweisung: „never practise the breathing in or near water, while driving or standing.“
  - **Teilen-Beschreibung (og/twitter):** „pure, all art, mysidibou, qefyr, rye, skyn, âlf, wim hof method instructor and neuroarchitecture.“
- **Übersetzungen:**
  - Alle inhaltlichen Änderungen sind in de, fr, es, ar und ru nachgezogen.
  - **Deutsch zusätzlich geglättet:** „das fundament“, „es ständig weiter reizt“, „wir wissen bereits …“, „unseres eigenen hautfetts“, „weil ich sie liebe“, „an jeden weitergeben“.
  - **Russisch:** drei Gedankenstriche entfernt, gemäß der Regel „keine Gedankenstriche“: „всё есть искусство.“, „основа: говяжий жир.“, „… творить: вот моя страсть.“
- **Zoom (Tiefe und Weltall):**
  - **Tiefenfeld:** Graphitpunkte, durch die die Fahrt hindurchfliegt. Im Gehirn sind es Vesikel, nach der Schwelle Sterne, einige davon funkelnd. Jeder Punkt hängt nur von der Tiefe ab, beim Zurückdrehen fliegt man also durch dasselbe Feld zurück.
  - **Galaxien:** Fünf Spiralgalaxien aus Graphitpunkten (drei Varianten, einmal gezeichnet) gleiten nach außen vorbei. Sie drehen sich nicht.
  - **Schwelle:** Wo das Kleinste zum Größten wird (Molekül → Kosmos), ein weicher Lichtschein aus der Mitte und ein feiner Ring, der sich öffnet.
  - **Schnelles Drehen:** kurze Spuren in Bewegungsrichtung. Im Lesetempo bleiben die Punkte Punkte.
  - **Reduzierte Bewegung:** Das Feld bleibt aus, nur das Licht an der Schwelle bleibt.
  - **Kein Hänger mehr beim ersten Erscheinen einer Zeichnung:**
    - Die Randverblendung steckt jetzt fest in den Dateien (`scripts/bake_dive_edges.py`, markiert, nicht größer als vorher).
    - Bilder werden im Hintergrund dekodiert und beim Laden einmal an die Grafik übergeben.
    - Gemessen im Software-Renderer: erster sichtbarer Frame vorher 61–95 ms, jetzt 31–38 ms. Normale Frames sind schneller als vorher.
  - **Ladepriorität:** Die Zeichnungen laden mit niedriger Priorität. Beim ersten Besuch kommt das Intro (Porträt, Handschrift) zuerst.
  - **Kein schwarzer Frame mehr nach einer Größenänderung** (alter Fehler, gefunden bei einer unabhängigen Prüfung): Die Leinwand hat keine Transparenz. Beim Drehen des Handys oder wenn ein In-App-Browser seine Höhe ändert, war sie bis zum nächsten Frame komplett schwarz (gemessen: Helligkeit 0). Jetzt wird sofort Papier gemalt und im selben Frame neu gezeichnet.
  - **Ausfallsicher:** Verweigert der Browser unter Speicherdruck das Dekodieren, kommt die Zeichnung trotzdem. Die Galaxien werden 2,5 s nach dem Start in Ruhe vorgezeichnet.
- **Suchmaschinen:**
  - `dist/robots.txt` (Sitemap, `/api/` ausgeschlossen).
  - `dist/sitemap.xml` erzeugt `scripts/i18n.py build`: 18 Seiten mit hreflang, Danke-Seiten ausgeschlossen.
  - Strukturierte Daten: knowsAbout um Wim Hof Method, Breathwork und Fermentation ergänzt.
- **Geprüft:** alle 25 Seiten in sechs Sprachen auf Handy und Desktop. Ohne Konsolenfehler, kaputte Links, doppelte IDs, fehlende Alt-Texte und horizontales Scrollen. Sprache und Leserichtung, Canonical und hreflang stimmen.
- **Offen (braucht Paul):**
  - Impressum (§ 5 DDG) und Datenschutzerklärung, vor dem ersten Verkauf zusätzlich Widerrufsbelehrung.
  - Die Wochenend-Termine.

## Aktualisierung: neue Projektnamen, kein Grauschleier beim Zurückdrehen (2026-10-09)

- **Projektnamen im Rad** (groß / klein):
  - art → **all art.** / art begins with love. (de: alles kunst. / kunst beginnt mit liebe.)
  - qefyr → **kefir** / qefyr by brinkmann
  - rye → **sourdough** / rye by brinkmann · german organic rye (de: sauerteig / rye by brinkmann · deutscher bioroggen)
  - skyn → **skincare** / skyn by brinkmann (de: hautpflege)
  - âlf → **sourdough** / âlf · the strongest sourdough on earth (de: sauerteig / âlf · der stärkste sauerteig der welt)
  - pure / system for man bleibt.
- **Marken stehen jetzt klein:** qefyr, rye, skyn und âlf stehen in der Unterzeile. Sie bleiben in allen Sprachen in lateinischer Schrift. Die Klasse `by-brinkmann` wird nicht mehr gebraucht und ist entfernt.
- **art:** Die erste Zeile „art begins with love.“ steht jetzt als Unterzeile. Damit sie nicht doppelt erscheint, beginnt der Text mit „whatever we do with love becomes art.“
- **Grauschleier beim Zurückdrehen behoben:**
  - Ursache: Wer gleich nach dem Laden das Rad zurückdreht, landet am Ende der Reise im Weltraum. Diese Zeichnungen waren noch nicht geladen. Bis dahin blieb die zuletzt geladene Zeichnung stehen und wurde bis zu e¹² ≈ 160.000-fach vergrößert. Daraus wurde ein grauer Schleier über der ganzen Seite, je nach Mittelpunkt fast schwarz.
  - Fix: Eine Zeichnung, deren Nachfolgerin noch fehlt, bleibt nur kurz über ihre Größe hinaus stehen und weicht dann dem Papier. Im Browser gemessen: Die Helligkeit fiel vorher drei Sekunden lang auf 197 von 255, jetzt bleibt sie beim Laden papierweiß bei 253.
  - Geladen wird in beide Drehrichtungen nur, was als Nächstes kommt, statt alle acht Zeichnungen (4,8 MB) auf einmal. Die tiefste Weltraum-Zeichnung lädt 2,5 s nach dem Start vor.
  - Jede Zeichnung blendet nach dem Laden in 0,6 s ein, statt plötzlich zu erscheinen.

## Aktualisierung: skyn-Creme rein weiß, ohne Flimmern, Sidi ruhig, Bilder ohne Unterschrift (2026-10-08)

- **Bildunterschriften:** alle entfernt, außer „at wim's house · poland“. Die Bilder sprechen für sich; die alt-Texte für Bildschirmleser bleiben. Die neun Übersetzungen der alten Unterschriften sind aus `i18n/*.json` gelöscht.
- **Abstand der Kreise:** oben 14 px statt 8 px, damit der Kreis ohne Unterschrift mittig zwischen den Absätzen sitzt (Startseite und `/weekends/`).
- **skyn-Video** (`video-skyn.mp4?v=2`):
  - Neuer Look `--look clean` in `scripts/grade_video.py`: Weißabgleich aus den hellsten Stellen des Clips, die Creme ist neutral weiß (helle Bereiche RGB 246/246/246 statt vorher 240/229/204 honigwarm), mehr Kontrast, Farbe stark zurückgenommen, kein Korn.
  - Das „Zittern“ war Lampenflimmern: Die Helligkeit pulsierte 12,5-mal pro Sekunde um rund ±5 Stufen, in Bändern von oben nach unten. `--deflicker` gleicht jedes Zeilenband an seinen Mittelwert über 12 Bilder an. Flimmern −89 % (7,5 → 0,8).
  - Keine Stabilisierung: Der Clip ist ruhig gefilmt, vidstab brachte hier erst Wackeln hinein.
- **Sidi-Gasse** (`video-sidi-lane.mp4?v=3`):
  - `--steady`: vidstab in zwei Durchgängen hält die Handkamera ruhig. Das Bildzittern sinkt von 1,46 auf 0,21 px.
  - minterpolate rechnet echte Zwischenbilder aus der Bewegung (4 pro gefilmtem Bild), statt benachbarte Bilder zu überblenden. Die Zeitlupe läuft damit ohne Ruckeln.
  - Höchsttempo 1,0 statt 0,75, also etwa ein Drittel schneller. Vor, zurück und die weichen Wendepunkte bleiben.
  - 277 KB statt 469 KB.

## Aktualisierung: Footer mit Kontakt-Icons links, Sprachen rechts (2026-10-08)

- Der Name unten links ist weg (er steht schon oben).
- **Links, an der Kante:** drei gezeichnete Icons in Grau:
  - E-Mail (`mailto:brinkmannbuild@gmail.com`);
  - WhatsApp Business (`https://wa.me/491756257788`, Pauls Geschäftsnummer);
  - Instagram (`https://www.instagram.com/buildpaul/`).
- **Rechts, an der Kante:** die Sprachauswahl `en de fr es ar ru`.
- **Alle neun Elemente sind kleine Quadrate gleicher Größe (26 px)**, gezeichnet wie eine Legende auf einem Plan: Mail, WhatsApp, Instagram und jede Sprache einzeln.
  - Haarlinien-Rahmen (1 px) in der Linienfarbe der Seite (#cfcfca), eckig wie die Linien des Rads, innen papierweiß.
  - Zeichen und Kürzel im Grau und in der Größe des Headers (#5c5c56, 11 px am Handy, 12 px am Desktop). Die Zeichen sind feine 1-px-Linien, Umschlag, Sprechblase und Instagram-Logo optisch gleich groß.
  - Die aktuelle Sprache erkennt man nur am Rahmen im Textgrau, ohne Füllung. Beim Antippen bekommt jeder Button kurz denselben Rahmen.
- **Sprachen in ihrer eigenen Schrift:** en, de, fr, es, ع (Arabisch), ру (Russisch). Bildschirmleser hören den vollen Namen in der jeweiligen Sprache (english, deutsch, français, español, العربية, русский). Diese Namen werden nicht übersetzt.
- **WhatsApp:** nur die Business-Nummer, nie die private.
- Schrift 14 px.
- Bildschirmleser hören „e-mail“ und „instagram“ in der jeweiligen Sprache.
- Die 404-Seite hat denselben Footer, auf Arabisch ist er gespiegelt.

## Aktualisierung: Russisch als sechste Sprache (2026-10-08)

- **Sprachen:** zusätzlich ru (`/ru/`). Auswahl im Footer jetzt `en de fr es ar ru`.
- **Regeln wie bei den anderen Sprachen:** sinngemäß, Pauls Stimme, durchgehend klein (auch юнеско, ии), keine Gedankenstriche, Anrede ты. Wo das Russische einen Gedankenstrich verlangen würde, ist der Satz umgebaut (является, и есть, Doppelpunkt, Verneinung).
  - Unverändert in lateinischer Schrift: pure, physis, mysidibou, qefyr, rye, skyn, âlf, by brinkmann, @buildpaul, paul brinkmann, m.sc.
  - Übersetzt: art (искусство), neuroarchitecture (нейроархитектура), wim hof weekends (выходные по виму хофу, wie das gängige „дыхание по Виму Хофу“), system for man (система для мужчины), „all art.“ (всё — искусство.), „you.“ (ты.).
  - Namen russisch: пауль клее, август макке, луи муайе, сиди-бу-саид, чингисхан, гора снежка.
  - „mind“ heißt психика (Gedanken, Gefühle, Bewusstsein), nicht разум (Verstand); „boundaries“ werden нарушать (verletzt), nicht überschritten.
  - Gegengelesen von einem zweiten, unabhängigen Durchgang auf Bedeutung, Grammatik, Zeichensetzung und Natürlichkeit; alle Fehler sind behoben.

## Aktualisierung: fünf Sprachen, art kürzer, pure-Architektensatz (2026-10-08)

- **Sprachen:** en (Quelle, `/`), de (`/de/`), fr (`/fr/`), es (`/es/`), ar (`/ar/`, von rechts nach links).
  - Übersetzt wird sinngemäß nach festen Regeln: Pauls Stimme, Kleinschreibung (auch deutsche Substantive), keine Gedankenstriche, keine Heilversprechen. Der Leser wird mit du, tu, tú bzw. أنت angesprochen.
  - Unverändert bleiben pure, mysidibou, qefyr, rye, skyn, âlf, by brinkmann, wim hof, unesco, sidi bou saïd sowie die Kapitelnamen von pure.
  - Übersetzt werden art (kunst, art, arte, فن), neuroarchitecture (neuroarchitektur, neuroarchitecture, neuroarquitectura, العمارة العصبية) und wim hof weekends. „all art.“ wird als kurzes Motto übertragen.
- **Footer:** Sprachauswahl `en de fr es ar` statt „contact“. Die Kontaktadresse bleibt in jedem Projekt über dessen Aktion erreichbar.
- **art:** Pauls Kurzfassung, Untertitel „all art.“, Einstieg „art begins with love.“, dann „whatever we do with love becomes art.“, 9 Absätze, Schluss „you.“
- **pure, ego:** „i am an architect, and i built this system the way i design a building: from the foundation up. i believe your boundaries need foundations as solid as concrete. …“

## Aktualisierung: skyn, Leidenschaft im Text, Vorbestellung über Stripe-Checkout (2026-10-08)

**Text, in Pauls Worten:** Er teilt skyn, weil er davon überzeugt ist und weil er es liebt. Produkte entwickeln, bauen und erschaffen ist seine Leidenschaft. Durch die Dinge, die er erschafft, will er seine Erkenntnisse und seine Energie an den weitergeben, der sie benutzt. Weil er sie für sich selbst macht, ist jede Charge klein und immer sehr begrenzt. Die Notizzeile lautet jetzt „pre-order · limited batch · shipped worldwide“.

**Vorbestellung:** nicht mehr per E-Mail oder WhatsApp, sondern direkt per eingebettetem Stripe-Checkout, gebaut wie „adopt âlf“ auf souralf.com.

| Teil | Aufgabe |
|---|---|
| `dist/shop.json` (öffentlich lesbar, wie bei souralf) | Produkt, Preis (`amount` in Cent), Versandzonen. Die Zonen sind von souralf übernommen: DHL Deutschland 6,19 €, EU 14,49 €, weltweit 27,49 €. |
| `api/shop.js` | sagt der Seite, ob die Vorbestellung offen ist (Preis gesetzt und `STRIPE_SECRET_KEY` vorhanden), dazu Preis und Zonen; ruft Stripe nicht auf |
| `api/checkout.js` | legt die Checkout-Session an. Nach der Zahlung geht es auf die Danke-Seite in der Sprache der Bestellung. |
| `api/session-status.js`, `api/_stripe.js` | wie bei souralf |
| `/skyn/` | Preis pro Tiegel, Versandzone, Menge, Gesamtsumme, „pre-order“, danach Stripe direkt auf der Seite. Solange nicht bereit: „the pre-order opens here shortly.“ |
| `/skyn/thanks/` | Danke-Seite in allen Sprachen, zeigt bei nicht bezahlter Session, wie man es noch einmal versucht |

Der öffentliche Stripe-Schlüssel ist derselbe wie bei souralf, also dasselbe Stripe-Konto.

Die Funktionen liegen in `dist/api/`, weil das Vercel-Projekt `dist/` als Wurzel nutzt. Ein `api/` im Repo-Hauptverzeichnis wird nicht ausgeliefert.

**Zum Freischalten fehlt:**
1. **Schlüssel:** Im Vercel-Projekt brinkmannpaul unter Settings → Environment Variables `STRIPE_SECRET_KEY` anlegen, mit demselben Wert wie im Projekt souralf. Claude hat keinen Zugriff auf das Vercel-Team „pur1“.
2. **Preis:** In `dist/shop.json` `product.amount` setzen, in Cent, z. B. 3900 für 39 €. Dazu Tiegelgröße und Lieferzeit.
3. **Versand:** prüfen, ob skyn wie âlf mit DHL aus Deutschland verschickt wird. Sonst die Zonen in `dist/shop.json` anpassen.

## Aktualisierung: Videos loopen unsichtbar, skyn-Video, Sidi langsamer (2026-10-08)

Pauls Vorgabe: endlose Schleife, deren Neubeginn man nicht bemerkt. Das Sidi-Video soll langsamer laufen.

`scripts/grade_video.py` hat dafür zwei Arten, die Schleife zu verbergen:

- **dissolve:** für Texturen und ruhige Szenen. Das Skript sucht die zwei ähnlichsten Momente des Clips und blendet sie 1,2 s lang ineinander.
  - Neues skyn-Video: Creme beim Aufschlagen, ohne Bildzeile, nach dem ersten Absatz.
  - 4,5 s Schleife, 176 KB.
- **glide:** für eine fahrende Kamera, deren Anfang und Ende nie gleich aussehen. Der Clip läuft vor, bremst auf null ab, läuft zurück und bremst wieder ab, wie eine Kosinuskurve. Dazwischen werden Bilder für die Zeitlupe gemischt.
  - Sidi Bou Saïd: Höchsttempo 0,75 statt 1, im Schnitt etwa halb so schnell wie gefilmt.
  - 16,9 s Schleife, 469 KB.

**Gemessen** als mittlere Bilddifferenz:

| Video | Schritt am Loop-Punkt | Normaler Bildschritt |
|---|---|---|
| Sidi | 5,0 | 6,1 |
| skyn | 9,0 | 8,3 bis 11,4 |

Der Loop-Punkt ist damit von einem normalen Bildwechsel nicht zu unterscheiden.

**Weitere Änderungen:**
- Schleifen-Videos dürfen bis 600 KB groß sein, weil sie erst laden, wenn man beim Lesen in ihre Nähe kommt. Alles andere bleibt unter 300 KB.
- Das Skript erkennt jetzt, ob ein Video HDR (bt2020) oder normal (bt709) ist, und dekodiert entsprechend.

## Aktualisierung: skyn neu erzählt, Vorbestellseite (2026-10-08)

Pauls Geschichte zu skyn:
- jahrelange Experimente für eine Creme, so rein wie ein Lebensmittel
- nur natürliche Fette und Öle, kein Erdöl, nichts Synthetisches
- die Weltreise bis in die Souks der Medina von Tunis
- das Kaktusfeigenkernöl als kostbarste Zutat
- Rindertalg als Basis, dazu Jojoba, fünf Zutaten insgesamt
- zwei Jahre Selbsttest
- zuerst gemacht für sich, die Familie und die engsten Freunde
- jetzt zum Vorbestellen, Versand weltweit

**Bewusst so formuliert, weil es belegbar ist:**
- „so rein wie ein Lebensmittel“ statt „nur essbare Zutaten“. Jojoba ist ein unverdauliches Wachs mit Erucasäure und gilt nicht als Lebensmittel.
- Zum Talg nur die belegte Aussage: Seine Hauptfettsäuren gehören auch zu den Hauptfettsäuren im Hautfett. Nicht „identisch mit dem Sebum“, denn Sebum besteht zu großen Teilen aus Wachsestern und Squalen.
- Jojoba als flüssiges Wachs, nah an den Wachsen der Haut.
- Kaktusfeigenkernöl als „eines der seltensten Öle der Welt“: Die Kerne enthalten nur etwa 5 bis 14 % Öl.
- Keine Heil- oder Superlativ-Versprechen.

**Neue Seite `/skyn/`** in allen 6 Sprachen. Der Button in der Rubrik heißt jetzt „pre-order skyn ↗“. Ablauf: Vorbestellung per E-Mail oder WhatsApp (Anzahl Tiegel, Land) → Paul bestätigt den Preis inklusive Versand und schickt den Zahlungslink → Versand weltweit, sobald die Charge fertig ist.

**Offen:**
- **Angaben:** Preis, Tiegelgröße, Lieferzeit und die zwei weiteren Zutaten.
- **Stripe:** Die Schlüssel kommen von Paul.
- **Vor dem ersten Versand in die EU:** Sicherheitsbewertung (CPSR), verantwortliche Person, CPNP-Meldung und Etikett mit INCI-Liste nach EU-Kosmetikverordnung 1223/2009.

## Aktualisierung: art wieder ohne Bilder (2026-10-08)

Nach Rücksprache mit Paul sind die vier Bilder wieder raus. Der Text trägt sich allein, Bilder hätten die Gedankenkette bis zum „you.“ unterbrochen. art bleibt die einzige Rubrik nur mit Text, als Manifest.

Die Dateien liegen in `archive/photos/` (nicht veröffentlicht), falls sie später woanders hinkommen. Für die Lehmziegel und das Verputzen wäre das zum Beispiel neuroarchitecture, für Zeichnung und Mona Lisa eine eigene Werkschau.

## Aktualisierung: art mit vier Bildern (2026-10-08)

Auf Pauls Vorgabe stehen in art vier Bilder im Wechsel mit dem Text. Alle haben den Honig-Look:

| Nach dem Absatz | Bild | Bildzeile |
|---|---|---|
| „whatever we do with love becomes art.“ | seine Zeichnung eines Gesichts auf braunem Papier | „a drawing on brown paper“ |
| „a meal. a building. …“ | Lehmziegel beim Trocknen | „clay bricks drying in the sun“ |
| „… that is where art begins.“ | Paul verputzt eine Lehmwand an einer Kasbah | „plastering a clay wall“ |
| „ai cannot feel love …“ | die neu interpretierte Mona Lisa | „after leonardo“ |

Die Zeichnung ist mit EV +0,3 aufgehellt, weil das Foto dunkel war.

## Aktualisierung: mysidibou, neues Dorf-Panorama und der Hafen bei Nacht (2026-10-08)

Auf Pauls Vorgabe ersetzt sein Panorama das bisherige Dächer-Foto: weiße Häuser über dem Golf von Tunis, klarer Himmel. Die Bildzeile „the rooftops of the village“ bleibt.

Neu als Abschlussbild nach dem letzten Absatz: „the harbour at night“. Der Hafen unterhalb von Sidi Bou Saïd bei Nacht, der Mond über dem Meer.

Der Hafen ist mit EV -0,5 und BLUE 3 gerendert. BLUE über 1 hält auch weichere Blautöne wie den Nachthimmel. Bei BLUE bis 1 bleibt alles wie zuvor, die übrigen Fotos sind unverändert.

## Aktualisierung: max 20 Personen, Kreise ohne Vergrößern (2026-10-08)

Auf Pauls Vorgabe:
- **Gruppengröße:** Statt „20–25 people“ steht überall „max 20 people“. Das gilt für den wim-hof-Text („in a small group, max 20 people“), die Notizzeile und die Buchungsseite („small group, max 20 people“), in allen Sprachen.
- **Kreise:** Fotos und Video vergrößern sich beim Antippen nicht mehr, sie bleiben, wie sie sind. Die Vollbilder (`*-full.webp`, `*-full.mp4`) sind entfernt. `grade_photo.py` und `grade_video.py` erzeugen nur noch den Kreis und beim Video das Vorschaubild.

## Aktualisierung: mysidibou mit Fotos und Video aus Sidi Bou Saïd (2026-10-08)

Pauls Fotos und sein Video aus Sidi Bou Saïd stehen in der Rubrik mysidibou. Text und Medien wechseln sich ab. Die drei Absätze sind dafür an ihren Satzgrenzen geteilt, der Wortlaut ist unverändert.

| Medium | Bildzeile |
|---|---|
| Foto | „the gulf of tunis“ |
| Foto | „a blue door in white marble“ |
| Video | „a lane in the village“ |
| Foto | „the rooftops of the village“ |
| Foto | „bougainvillea at a blue gate“ |

- **Das Blau:** Paul war es wichtig. `scripts/grade_photo.py` hat dafür den Wert BLUE (0 bis 1). Er hält kräftige Blautöne (Türen, Gitter, Fensterläden, Meer, Himmel) in voller Farbe und nimmt sie aus dem warmen Honig-Ton heraus. Der Rest bekommt den gewohnten Look. Alle Sidi-Fotos nutzen BLUE 1. Bestehende Fotos bleiben unverändert, BLUE ist dort 0.
- **Das Video:** `scripts/grade_video.py` erzeugt es aus dem Original (4 s, 4K, HDR, 14 MB).
  - Gleicher Look Bild für Bild, ohne Korn.
  - Die letzten 0,4 s blenden in den Anfang über, so loopt es ohne Sprung.
  - Kreis: 480 px, 225 KB. Dazu ein Vorschaubild.
  - Kodiert als H.264 mit Schnellstart, ohne Ton.
- **Flüssiges Laden:** Das Video lädt erst, wenn es beim Lesen in die Nähe kommt (300 px vorher), spielt im Bild und pausiert außerhalb. Bei „weniger Bewegung“ bleibt das Vorschaubild stehen, das ganze Video hat dann Steuerelemente. Die Fotos laden ebenfalls erst bei Bedarf.

## Aktualisierung: Buchungsseite für die wim hof weekends (2026-10-08)

Neue Seite `/weekends/` in allen 6 Sprachen (`/de/weekends/` usw.). In der wim-hof-Rubrik führt „book a weekend ↗“ dorthin statt auf eine Mail.

**Pauls Angaben:**
- 490 € pro Person, alles inklusive, voller Preis bei Buchung.
- Donnerstag Anreise, Sonntag Abreise.

**Inhalt der Seite:**
- Kopf „wim hof weekends · poland · november & december · thursday to sunday“, × zurück zur Rubrik.
- Einstieg und Gruppenfoto.
- „the weekend“: die Programmpunkte aus Pauls Text.
- „dates“: Anreise und Abreise, kleine Gruppen von 20 bis 25 Menschen.
- „price“, „how booking works“ in 3 Schritten, „safety“ mit den offiziellen Sicherheitsregeln.
- Die Anfrage-Buttons (E-Mail, WhatsApp) öffnen erst nach dem Häkchen „i have read the safety notes“.

**Noch offen:**
- **Termine:** Die genauen Wochenenden fehlen. Pauls Bild mit den eingekreisten Terminen kam nicht an, bis dahin steht „follow here shortly“.
- **Stripe:** Pauls Wunsch „am Schluss“. Dann bekommt jeder Termin einen eigenen Zahlungslink mit Platzlimit.
- **Rechtliches:** Anbieterangaben, Buchungsbedingungen und Datenschutz fehlen. Sie sind spätestens nötig, sobald online bezahlt wird.

**Technik:**
- `scripts/i18n.py` baut jetzt mehrere Seiten (`PAGES`).
- Links auf Startseite, Anker und Buchungsseite bleiben in der jeweiligen Sprache.
- `label` wird mit übersetzt.

## Aktualisierung: wim hof, Text und Bilder im Wechsel (2026-10-08)

Auf Pauls Vorgabe ist „the idea is simple …“ gestrichen. „places are limited“ steht jetzt kurz in der Notizzeile („· limited places“).

Text und Bilder wechseln sich ab:

1. fifteen years of breath.
2. Instructor-Absatz
3. Foto „at wim's house · poland“
4. november/dezember, kleine Gruppe, atmen und Kälte
5. Foto „breathing in the snow“ (Paul meditiert im Schnee)
6. śnieżka, kochen, Feuer
7. Foto „on the way up“ (Gruppe im Schnee auf dem Bergweg)
8. Kefir, Sauerteig, Mikrobiom, mit dem Hinweis „keine Heilversprechen“
9. Foto „together on the mountain“ (Gruppenbild)
10. Notizzeile
11. „join a weekend“

Alle Fotos laufen durch denselben Honig-Filter. Für helle Schneebilder nimmt `scripts/grade_photo.py` eine Belichtungskorrektur EV in Blendenstufen an, damit der Schnee Struktur behält:

| Foto | EV |
|---|---|
| Meditation | -0,2 |
| Aufstieg | -0,6 |
| Gruppe | -0,25 |

## Aktualisierung: wim hof method instructor mit Foto (2026-10-08)

Auf Pauls Vorgabe heißt die Rubrik jetzt „wim hof method instructor“ statt „wim hof weekends“. Der offizielle Titel lautet „Wim Hof Method Instructor“.

- **Untertitel:** „certified · 15 years of breathwork“.
- **Erster Satz:** „fifteen years of breath.“
- **Neuer Absatz:** 15 Jahre Atemarbeit, Begleitung durch Atemsessions und Kälte, zertifizierter Instructor, „a friend of wim“.
- **Unverändert:** Der Text zum Polen-Wochenende steht weiter darunter.
- **Foto:**
  - Paul und Wim beim Händedruck in Polen, als Kreis mit feinem Ring und der Bildzeile „at wim's house · poland“. Das Foto steht nach dem Instructor-Absatz, also nach „a friend of wim.“. Die Bildzeile wird jetzt in allen Sprachen übersetzt.
  - Antippen öffnet das ganze Foto unbeschnitten. ×, Escape oder ein Tippen schließt es.
- **Bildstil für alle Fotos:** „honig“ (Pauls Wahl nach „warm golden“, „film“ und „nordisch matt“). Dezent, aber warm: Farben zurückgenommen, laute Orangetöne stärker, bernsteinfarbene Lichter, warmbraune Schatten, sanfte Kurve, feines Korn, kein hartes Schwarz. Auf Pauls Hinweis „Gesichter zu kalt“: Hauttöne (rosa bis pfirsich, sanft gesättigt) werden gezielt erkannt, behalten ihre Farbe und werden von kühlem Rosa Richtung Pfirsich geschoben; das ganze Bild ist etwas wärmer.
- **Neue Fotos:** `python3 scripts/grade_photo.py QUELLE NAME CX CY R` erzeugt `photo-NAME.webp` (Kreis, 720 px) und `photo-NAME-full.webp` (ganzes Foto). CX, CY und R setzen den Kreis in Pixeln der Quelle, Gesichter ins obere Drittel.
- **Alle Sprachen:**

  | Sprache | Rubrik |
  |---|---|
  | Deutsch | wim hof methode instructor |
  | Französisch | instructeur méthode wim hof |
  | Spanisch | instructor método wim hof |
  | Arabisch | مدرّب طريقة ويم هوف |
  | Russisch | инструктор метода вима хофа |

- **Meta-Beschreibungen:** in allen Sprachen angepasst.

## Aktualisierung: Untertitel „all art.“ (2026-10-08)

Auf Pauls Vorgabe steht bei art im Rad und im Kopf des geöffneten Textes jetzt „all art.“ statt „art begins with love.“. Damit der Satz nicht direkt zweimal untereinander steht, ist „art begins with love.“ der große Einstiegssatz im Text.

| Sprache | Untertitel | Einstieg |
|---|---|---|
| Deutsch | alles kunst. | kunst beginnt mit liebe. |
| Französisch | tout est art. | l'art commence par l'amour. |
| Spanisch | todo es arte. | el arte empieza con amor. |
| Arabisch | كل شيء فن. | الفن يبدأ بالحب. |
| Russisch | всё — искусство. | искусство начинается с любви. |

Im Russischen ist die Form kürzer und natürlicher geworden: „всё — искусство.“ statt „всё есть искусство.“.

## Aktualisierung: art-Text, „all art.“ und „you.“ (2026-10-07)

Auf Pauls Vorgabe: Der große Einstiegssatz ist jetzt „all art.“. „anything we do can become art when we bring love to it.“ steht als normaler Absatz im Text. Neuer Schluss: „all art means everything is art when it is made with love. what art is, only its creator defines. and it has to please at least one person in this world: the person who created it.“ Letzte Zeile: „you.“

## Aktualisierung: art-Text, KI und Liebe (2026-10-07)

Auf Pauls Vorgabe (sinngemäß, seine Worte beibehalten):
- Die doppelte Zeile „art begins with love.“ im aufgeklappten Text ist entfernt; sie steht nur noch als Untertitel.
- Nach den Dominosteinen neu: KI kann Liebe nicht fühlen und kennt keine Liebe. Sie kann Liebe erklären, nachahmen, kopieren, aber nicht fühlen wie ein Mensch. Das ist der Unterschied zwischen KI und uns, deshalb braucht niemand Angst vor KI zu haben. Was immer du tust, tu es mit Liebe, dann wird es zur Kunst. KI ist nur ein weiteres Werkzeug, ein Mensch muss den ersten Schritt mit Liebe tun.
- Schluss: „all art means all is art.“

## Aktualisierung: pure zuerst, „system for man“ (2026-10-07)

Auf Pauls Wunsch („das erste ist pure, und dann würde ich sagen system for man“): Reihenfolge im Rad pure, art, mysidibou, qefyr, rye, skyn, âlf, wim hof weekends, neuroarchitecture. Das Rad startet auf pure. Der Untertitel von pure lautet wieder `system for man` (statt der Kapitelliste „physis · understanding · responsibility · ego“). Texte, Kapitel und Links unverändert.

## Aktualisierung: Picker-Rad (2026-10-07)

Reihenfolge im Rad: art, pure, mysidibou, qefyr, rye, skyn, âlf, wim hof weekends, neuroarchitecture (endlos). Texte und Links unverändert. Neu sind nur Anker pro Projekt, die die Leseansicht direkt öffnen: `#art`, `#pure`, `#mysidibou`, `#qefyr`, `#rye`, `#skyn`, `#alf`, `#wim-hof-weekends`, `#neuroarchitecture`.

## Aktualisierung: Landingpage fertigstellen (2026-10-02)

Reihenfolge: pure, mysidibou, qefyr, rye, skyn, âlf, wim hof weekends, neuroarchitecture. Alle acht Zeilen sind aufklappbar, haben Text und eine Aktion.

| Projekt | Aktion (neu/geändert) |
|---|---|
| pure | `follow @brinkbuild` → `https://www.instagram.com/brinkbuild/` (Text sagt bereits „follow for the blueprint.") |
| qefyr | Linktext `brinkmannbuild@gmail.com` → `order qefyr ↗`, Betreff `qefyr order` |
| rye | Text wiederhergestellt: Pauls freigegebener Sauerteig-Text, der beim Commit „Move sourdough copy from souralf to rye" verloren ging („flour. water. time." …), ergänzt um „german organic rye" aus dem Deskriptor. Aktion `order rye ↗`, Betreff `rye order` |
| skyn | Neu aufklappbar. Text: Talg = ausgelassenes Rinderfett, traditionelle Hautpflege; Hauptfettsäuren Ölsäure, Palmitinsäure, Stearinsäure kommen auch im Hauttalg (Sebum) vor. Keine Heil-/Wirkversprechen, keine Rezeptur-, Preis- oder Herkunftsangaben. Aktion `ask about skyn ↗`. **Von Paul zu bestätigen.** |
| âlf | Linktext `adopt souralf` → `adopt âlf` (Umbenennung war unvollständig) |
| neuroarchitecture | Aktion `get in touch ↗`, Betreff `neuroarchitecture` |

Quellen skyn: Fettsäureprofil Rindertalg (Ölsäure ~37–47 %, Palmitinsäure ~24–32 %, Stearinsäure ~19–25 %, z. B. en.wikipedia.org/wiki/Tallow); Sebum-Fettsäuren überwiegend C16/C18 (J. Lipid Res., „Sebaceous gland lipids: friend or foe?").

Metadaten: Titel `brinkmann paul, m.sc. · architect`, neue Beschreibung, `og:image` = `assets/og-image.jpg` (1200×630, Porträt + „i build."), Person-JSON-LD mit `jobTitle`, `honorificSuffix`, `image`, `email`.

## Aktualisierung: PURE, Issue #38 (2026-09-28)

- Paul hat die vollständigen englischen Kapiteltexte im Chat freigegeben und ihre Veröffentlichung beauftragt.
- `physical control`: den eigenen Körper verstehen und bewusst führen, statt ihn zu kommandieren.
- `understanding the mind`: Gehirn und innere Erfahrung über die Hardware/Software-Analogie erklären; Belohnungssystem, leicht verfügbare Reize und bewusste Entscheidungen verständlich machen.
- `responsibility`: Verantwortung für sich selbst, Beziehung und Familie übernehmen; Freiheit ohne Besitzdenken oder Kontrolle anderer Menschen.
- `ego`: Selbstbild und Abwehrreaktionen erkennen, klare Grenzen setzen, den Partner kennenlernen, persönliche Praxis und den Glauben an etwas Größeres erklären.
- Freigegebener Wortlaut vollständig in den vier bestehenden `.pure-branch`-Abschnitten von `dist/index.html`, mit 5/8/6/15 Absätzen, durchgehend kleingeschrieben und ohne Bindestriche oder Gedankenstriche.
- Bestehende Kapitelüberschriften, Aufklappverhalten und `coming soon. follow for the blueprint.` bleiben erhalten.
- Diese Aktualisierung ersetzt frühere PURE-Beschreibungen in diesem historischen Inventar.

## Aktualisierung — Issue #24 (2026-09-22)

- Hero: `one man, one purpose: build`.
- Reihenfolge: mysidibou, pure, kefir, sourdough, wim hof instructor, neuroarchitecture.
- Pauls jüngste Namenskorrektur: `pure` / `system for man`.
- Jede Rubrik erhält eine kurze Einleitung, zwei Hintergrundabsätze und einen Fokus-/Format-Hinweis.
- mysidibou: Pauls Ziel eines sauberen Dorfs, Schutz der Hanglage, geplante Finanzierung über Kunstcafé und Kunstverkäufe; keine unbelegte UNESCO-Eintragungsbehauptung im Fließtext.
- pure: System in Entwicklung, Ernährung/Bewegung/Erholung/Routine; keine Heilversprechen.
- Kefir/Sauerteig: vorhandene Kulturen und Guides erklärt; Verfügbarkeit auf Anfrage, keine neuen Preise, Versand- oder Wirkversprechen.
- Wim Hof: bestätigte Zertifizierung, persönliche Coaching-Anfrage, keine medizinischen Anleitungen.
- Neuroarchitecture: PhD in progress, Architektur und menschliche Wahrnehmung; keine erfundenen Forschungsergebnisse oder Institutionen.
- Footer-Kontakt nutzt die bestehende Adresse orders@brinkmannpaul.com.
- Intro: aus dem originalen Foto-basierten MP4 exportiertes WebP (900×1100, 30 fps, einmalige Wiedergabe); Originaldateien bleiben erhalten.
- Dekoration: statisches, hellgraues neuronales SVG-Netz ohne Interaktion, Tracking oder zusätzliche Abhängigkeiten.

Die folgenden Abschnitte dokumentieren den historischen Stand vor dieser Aktualisierung.

| Feld | Wert |
|---|---|
| `<title>` | `brinkmann paul` |
| `<meta description>` | `The projects and products of Paul Brinkmann.` |
| `<html lang>` | `en` |
| `theme-color` | `#ffffff` |
| Favicon | Inline-SVG (weißes Quadrat, schwarzes „P") |
| Domain | brinkmannpaul.com (ChatGPT-Hosting) |

## Header

- `brinkmann paul` (links)
- Link `@brinkbuild` → `https://www.instagram.com/brinkbuild/` (rechts, new tab)

## Hero

```
one person.
different fields.
one purpose: build.
```

## Aktuelle Projektliste (Stand Issue #10 — flach, kuratiert)

| Projekt | Typ | Beschreibung (aktuell) | Status / CTA |
|---|---|---|---|
| neuroarchitecture | phd research | research into how the built environment shapes the brain, behaviour and identity — how light, space and materials affect mood, stress, cognition and wellbeing. | **in progress** (kein Link) |
| mysidibou | unesco project | one generation taking responsibility for the next 500 years of sidi bou saïd. | `open project ↗` → `https://www.instagram.com/mysidibou/` |
| pure code | life system for man | a practical system for building health through food, movement, recovery and daily discipline. | **in development** (kein Link) |
| kefir | living culture | living kefir grains with a simple guide for making fresh kefir at home. | `order ↗` → `mailto:orders@brinkmannpaul.com?subject=kefir%20order` |
| sourdough | living culture | an active sourdough starter with feeding instructions and a first-loaf guide. | `order ↗` → `mailto:orders@brinkmannpaul.com?subject=sourdough%20order` |
| wim hof instructor | 1:1 coaching worldwide | private one-to-one coaching in breath, cold and mindset — wherever you are. | `request coaching ↗` → `mailto:orders@brinkmannpaul.com?subject=1%3A1%20wim%20hof%20coaching` |

**Entfernt auf Wunsch von Paul (Issue #10):** real estate agency, ritual plant, blueprints.
**Umbenannt (Issue #10):** pure method → pure code, health system → life system for man.

## Footer

- `paul brink`

## Assets

| Datei | Größe | Technische Daten |
|---|---|---|
| intro-handwriting-split.mp4 | 138.912 B | h264, 900×1100, 60 fps, 9,617 s, ~116 kbit/s |
| intro-handwriting-split-complete.png | 82.767 B | 900×1100 RGB |

## Externe Ziele (alle Links der Seite)

1. `https://www.instagram.com/brinkbuild/`
2. `https://www.instagram.com/mysidibou/`
3. `mailto:orders@brinkmannpaul.com` (+ 3 Betreff-Varianten: kefir order · sourdough order · 1:1 wim hof coaching)

## Bekannte Schwester-Projekte (Umfeld, nicht verlinkt)

- ritualplantseeds.higgsfield.app (Ritual Plant Shop, live) — Kandidat für echten Link statt mailto
- brand-site Brinkmann (brinkmann.higgsfield.app, Atelier Neuroarchitektur/Mikrobiom/Kunst) — „Das Präparat"
