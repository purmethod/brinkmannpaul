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
- **Länge: rund 170 Seiten**, wie ein typisches kleines Sachbuch.
- Nichts wird weggekürzt, nur besser formuliert. Die Tiefe bleibt. Pauls Methodenkapitel bleiben vollständig, Wort für Wort. Der persönliche Teil behält jedes Element und sagt jeden Gedanken nur einmal, in seiner stärksten Form.
- Ziel: ein besseres Buch als vorher. Der Leser soll beim Lesen überwältigt werden und einen Aha-Effekt bekommen. Pauls Seele und Stimme brechen nicht weg.
- **Design innen:** ruhig, minimalistisch, leicht, wie pure und pact auf der Website. Kästchen mit dünnen Linien, viel Weißraum, keine Gedankenstriche.
- Paul will später aus vielen Blueprints Muster ziehen: was die meisten Männer ausmacht, was sie machen, in welcher Situation sie stehen. Das breiteste Muster wird ein eigenes Buch im selben Format.
- Technik: Repo `purmethod/pur`, Format in `blueprint/index.html` (`@page`), Wortmengen in `api/analyze.js`. Jedes geschriebene Buch meldet seine Wortzahl im Vercel-Log (`blueprint words`), damit die Länge nachjustiert werden kann.

## Text für Leser (EN)

Take the assessment and get a personalized PURE Blueprint, built for exactly where you stand today.

## Für Agenten

- Wissensgrundlage für den Blueprint ist dieses Repo: `knowledge/pure/`. Ein Blueprint zitiert die Kernaussagen und Buchtexte der passenden Module und hält sich an [sprache-und-stil.md](../00-system/sprache-und-stil.md).
- Offene Module (P1, E0 bis E2, Leiter-Sprossen) dürfen im Blueprint nicht erfunden werden.
