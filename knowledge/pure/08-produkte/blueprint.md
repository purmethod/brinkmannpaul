# Der PURE Blueprint

> Status: **live** unter brinkmannpaul.com/pure/blueprint (Repo `purmethod/pur`): Fragen in sechs Sprachen, vier Säulen, Bezahlung über Stripe, danach schreibt Claude das persönliche Buch.

## Kernaussagen (Paul)

- Im Kern entwickeln wir einen Blueprint des Menschen, vor allem des Mannes.
- Er beantwortet zwischen 20 und 50 Fragen. Die Fragen sind so konzentriert, dass wir das meiste herausfinden: psychologisch, und was für diesen Mann wichtig ist, je nachdem, in welchem Alter er sich befindet. Die Fragen geben sehr viel preis.
- Daraus entsteht der Blueprint. Jeder bekommt nach Beantwortung der Fragen seinen eigenen.
- Er ist wie ein maßgeschneiderter Anzug: mit persönlicher Anrede, mit persönlichen Anleitungen.
- Ein Zwanzigjähriger hat andere Ansprüche als ein Achtzigjähriger. Ein Einundachtzigjähriger braucht andere Tipps als ein Zwanzigjähriger.
- Drei Komponenten fließen ein:
  1. **Meine Erfahrung.** Die Basis ist PURE.
  2. **Die Schnittstelle zu Claude.**
  3. **Die beantworteten Fragen des Lesers.**
- Ergebnis: ein persönlicher Auszug aus dem Buch, gebaut für genau den Punkt, an dem der Leser heute steht.
- Das ist das Hauptprodukt für die Online-Einnahmen. Geplanter Preis: etwa 9 $.

## Das Buch: Format, Länge, Design (entschieden Nov 2026)

- Paul: Es muss wertig sein wie ein Buch, darf aber nicht zu lang sein. 200 bis 300 Seiten waren zu lang.
- **Format: 12,7 × 20,3 cm (5 × 8 Zoll)**, wie *The War of Art*. Von Anfang an so festgelegt, weil Paul das Buch später verlegen will. Der Druck aus dem Blueprint hat dieses Format.
- **Länge: rund 190 bis 200 Seiten.** Zuerst waren 170 angedacht. Entschieden: Die natürliche Länge ist 190 bis 200, weil Pauls Methodenkapitel allein schon rund 146 Seiten füllen und der persönliche Teil knapp zwei Seiten pro Stufe braucht, damit er wirklich trifft.
- Nichts wird weggekürzt, nur besser formuliert. Die Tiefe bleibt. Pauls Methodenkapitel bleiben vollständig, Wort für Wort. Der persönliche Teil behält jedes Element und sagt jeden Gedanken nur einmal, in seiner stärksten Form.
- Ziel: ein besseres Buch als vorher. Der Leser soll beim Lesen überwältigt werden und einen Aha-Effekt bekommen. Pauls Seele und Stimme brechen nicht weg.
- **Design innen:** ruhig, minimalistisch, leicht, wie pure und pact auf der Website. Kästchen mit dünnen Linien, viel Weißraum, keine Gedankenstriche.
- Paul will später aus vielen Blueprints Muster ziehen: was die meisten Männer ausmacht, was sie machen, in welcher Situation sie stehen. Das breiteste Muster wird ein eigenes Buch im selben Format.
- Testen und Verschenken: Mit einem Gratis-Code schreibt der Blueprint das Buch ohne Bezahlung. Paul: ein Code, ein Buch. Das Feld "du hast einen code?" steht offen direkt unter dem Bezahlknopf.
- Kein Code steht irgendwo im Klartext: nicht im Repo, nicht in Commits, Issues oder PRs, nicht in dieser Wissensbasis, auch nicht in Vercel. Vercel (Projekt `brinkmannpaul`, Variable `BLUEPRINT_CODE_HASHES`) hält nur einen Fingerabdruck. Ein eingelöster Code wird in Stripe als archiviertes Produkt "pure blueprint · free code" markiert. Neuer Code: `scripts/blueprint-code-hash.js` (liest den Code von stdin), Ergebnis an `BLUEPRINT_CODE_HASHES` anhängen.
- Technik: Repo `purmethod/pur`, Format in `blueprint/index.html` (`@page`), Wortmengen in `api/analyze.js`. Jedes geschriebene Buch meldet seine Wortzahl im Vercel-Log (`blueprint words`), damit die Länge nachjustiert werden kann.

## Text für Leser (EN)

Take the assessment and get a personalized PURE Blueprint, built for exactly where you stand today.

## Für Agenten

- Wissensgrundlage für den Blueprint ist dieses Repo: `knowledge/pure/`. Ein Blueprint zitiert die Kernaussagen und Buchtexte der passenden Module und hält sich an [sprache-und-stil.md](../00-system/sprache-und-stil.md).
- Offene Module (P1, Leiter-Sprossen) dürfen im Blueprint nicht erfunden werden. Ego hat seit 10.11.2026 alle fünf Module (E1 bis E5).
