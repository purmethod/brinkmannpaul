# 02 — Inhalts-Inventar brinkmannpaul.com

Extrahierter Original-Stand 2026-09-22. **Nichts erfinden: Alle Texte 1:1 vom Live-System.**

## Metadaten

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
