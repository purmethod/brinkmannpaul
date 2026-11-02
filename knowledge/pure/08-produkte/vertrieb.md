# Vertrieb · Vom Video zum Kauf

> Status: Der Weg Video → DM → Stan funktioniert bereits. Alles andere baut darauf auf.

## Bewährter Verkaufsweg

1. **Video** auf Instagram.
2. **Kommentar- oder DM-Keyword** (ManyChat).
3. **Direkt zu Stan** (Stan Store ist der Checkout).
4. **Kauf.**

Die Website ist nicht das Hauptwerkzeug für die Conversion. Sie baut Vertrauen bei Profilbesuchern auf.

## Ausbau

- **Ein Keyword pro Modul** in ManyChat (z. B. LEITER, DOPAMIN). Leads werden nach Interesse markiert und in E-Mail-Sequenzen (Brevo) geführt, die mit dem passenden Produkt auf Stan enden.
- **Ein Lead Magnet** gegen E-Mail: die Leiter (P2). Einzelne Modul-PDFs sind Produkte oder Boni, keine Gratis-Downloads.
- **Produkttreppe:** einzelne Protokolle → das komplette PURE-PDF → später ein 90-Tage-Programm. Preise siehe [Buchplan](../07-buecher/buchplan.md).
- **Themenseiten** zur Männlichkeitsschiene (Testosteron, Frauen, Beziehung, Partnerwahl) verkaufen den Blueprint.
- **PURE → Cyclemax:** Ein Mann kommt über PURE, findet seine Partnerin und wechselt dann zu Cyclemax. Das eine Produkt füttert das andere.

## Reichweite

- Laut Adam Mosseri (Instagram, Januar 2025) sind **Sends** (Teilen per DM), **Watch Time** und **Likes** die drei wichtigsten Signale für Reichweite.

## Website-Hinweis

- Die PURE-Seite ist **fertig und live**: Der Button „explore pure“ führt auf brinkmannpaul.com/pure. Ausgeliefert wird sie von purmethod.com/pure über eine Weiterleitung in `dist/vercel.json` (Rewrites für `/pure`, `/pure/` und `/pure/:path+`). Sie liegt deshalb nicht als Datei in `dist/`. Dasselbe gilt für `/pact` (→ purmethod.com/pure/pact).
