# Shot-Liste: echte Fotos und Videos für qefyr.com

Die Seite nutzt gezeichnete Illustrationen (Glas, Knollen, Bergkamm), weil es noch keine echten Produktfotos gibt.
Keine KI-Bilder, wie bei ÂLF. Sobald diese Aufnahmen da sind, ersetzt Claude die Illustrationen. Format jeweils
mindestens 2000 px an der kurzen Kante, Tageslicht, ruhiger Hintergrund (Leinen, Holz, Stein), keine Plastikbehälter im Bild.

| # | Motiv | Wo es hinkommt | Format |
|---|---|---|---|
| 1 | qefyr wird in ein Glas gegossen, Licht von der Seite, cremige Textur sichtbar | Startseite, Hero (ersetzt das Glas) | 4:5 Foto + 6–10 s Video, h264 |
| 2 | Kefirknollen in der Hand oder auf einem Löffel, Makro | „a small culture“, Story | 1:1 |
| 3 | Die Flasche/das Gefäß, wie es beim Kunden ankommt, mit Etikett | Bestellseite, Stripe-Produktbild, Share-Bild | 4:5 und 1:1 |
| 4 | Ausgepacktes Paket: Gefäß, Anleitung, Methode | Bestellseite „inklusive“ | 4:5 |
| 5 | Frische Milch wird auf die Knollen gegossen | Methode, Schritt „milch dazu“ | 4:5 |
| 6 | Berchtesgaden: Watzmann oder Almwiese mit Kühen | Story „milch aus den bergen“ | 16:9 |
| 7 | Anne Maria, Porträt im gleichen Stil wie Pauls Foto | Gründerseite | 4:5 |
| 8 | Anne Maria und Paul zusammen in der Küche | Gründer-Streifen auf der Startseite | 3:2 |

Dateien einfach in den Chat legen. Claude schneidet zu, komprimiert auf unter 300 KB pro Datei und baut sie mit `srcset` ein.
