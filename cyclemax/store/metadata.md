# Cyclemax – Store-Metadaten (DE + EN)

| Feld | Deutsch | English |
|---|---|---|
| App-Name (≤ 30) | Cyclemax: Ihr Zyklus | Cyclemax: Her Cycle |
| Untertitel (≤ 30) | Versteh deine Partnerin | Know her cycle |
| Keywords (≤ 100) | Periode,Zyklus,Partnerin,Freundin,Beziehung,PMS,Frau,Stoiker | period,cycle,partner,girlfriend,wife,relationship,PMS,stoic |
| Kategorie | Lifestyle | Lifestyle |
| Sekundärkategorie (optional) | Gesundheit & Fitness – bewusst **nicht** gesetzt (keine Medizin-App) | – |
| Preis | Kostenlos (Entscheidung Paul) | Free (Paul's decision) |
| Support-URL | https://purmethod.com | https://purmethod.com |
| Marketing-URL | https://purmethod.com | https://purmethod.com |
| Datenschutz-URL | **offen** – Entwurf in [privacy.md](./privacy.md), muss öffentlich gehostet werden | see privacy.md |
| Copyright | © 2026 Paul Brinkmann | © 2026 Paul Brinkmann |
| Altersfreigabe | 4+ (Fragebogen: überall „Keine") – von Paul zu bestätigen | 4+ |

Bundle-ID / Package: `com.purmethod.cyclemax`

---

## Werbetext (≤ 170 Zeichen)

**DE:** Sei der Fels in der Brandung. Cyclemax zeigt dir, in welcher Phase ihres Zyklus sie ist – und erinnert dich im richtigen Moment. Be the Cycleman.

**EN:** Be the rock in the surf. Cyclemax shows you which phase of her cycle she is in – and reminds you at the right moment. Be the Cycleman.

---

## Beschreibung – Deutsch

Sei der Fels in der Brandung.

Cyclemax ist eine App für Männer, die Verantwortung übernehmen. Frag sie nach ihrem Zyklus, trag ihn ein – und du weißt jederzeit, in welcher Phase sie gerade ist. Nicht um sie zu analysieren. Sondern um selbst ruhig, loyal und aufmerksam zu bleiben, wenn es darauf ankommt.

VIER PHASEN, EINE HALTUNG
• Ruhe – Halt geben, Wärme, kein Druck.
• Aufwind – gute Zeit für Pläne, Dates, gemeinsame Projekte.
• Hochphase – Aufmerksamkeit zeigen, sie sehen, Initiative ergreifen.
• Brandung – nichts persönlich nehmen. Du musst nicht das letzte Wort haben.

Zu jeder Phase: ein Satz Haltung, drei konkrete Handlungen, ein Gedanke frei nach Marc Aurel und täglich ein neuer stoischer Impuls.

IM RICHTIGEN MOMENT ERINNERT
Genau vier Benachrichtigungen pro Zyklus – je eine, wenn eine neue Phase beginnt. Auf Wunsch neutral: Der Sperrbildschirm zeigt dann nur „Cyclemax".

AUFMERKSAMKEIT, DIE BLEIBT
Blumen, ein geplantes Date, ein Brief, eine Überraschung, Zeit nur für sie. Ist es zu lange her, erinnert Cyclemax dich – höchstens einmal im Monat. Nicht weil der Kalender es sagt. Weil du ein Mann bist, der Acht gibt.

WIE REAGIERE ICH?
Beschreib kurz die Situation und erhalte eine ruhige, stoische Empfehlung – in drei Sätzen, mit einer konkreten Handlung.

DEINE DATEN BLEIBEN AUF DEINEM GERÄT
Kein Konto, kein Login, kein Tracking. Die Zykluslänge lernt aus deinen Einträgen – lokal.

Das Fundament ist die PUR Method. Cyclemax ist das Werkzeug, PUR die Haltung.

Be the Cycleman.

Hinweis: Cyclemax ist keine medizinische App. Die Phasen sind Schätzungen und eignen sich weder zur Verhütung noch zur Familienplanung.

## Description – English

Be the rock in the surf.

Cyclemax is an app for men who take responsibility. Ask her about her cycle, log it – and you always know which phase she is in. Not to analyse her. But to stay calm, loyal and attentive yourself when it matters.

FOUR PHASES, ONE STANCE
• Rest – hold steady, warmth, no pressure.
• Rise – a good time for plans, dates and shared projects.
• Peak – pay attention, see her, take the initiative.
• Breakers – take nothing personally. You do not need the last word.

For every phase: one sentence of stance, three concrete actions, a thought loosely after Marcus Aurelius and a new stoic impulse every day.

REMINDED AT THE RIGHT MOMENT
Exactly four notifications per cycle – one whenever a new phase begins. Optionally neutral: the lock screen then shows only "Cyclemax".

ATTENTION THAT LASTS
Flowers, a planned date, a letter, a surprise, time just for her. If it has been too long, Cyclemax reminds you – at most once a month. Not because the calendar says so. Because you are a man who pays attention.

HOW DO I RESPOND?
Describe the situation in a few words and get a calm, stoic recommendation – three sentences, one concrete action.

YOUR DATA STAYS ON YOUR DEVICE
No account, no login, no tracking. The cycle length learns from your entries – locally.

The foundation is the PUR Method. Cyclemax is the tool, PUR is the mindset.

Be the Cycleman.

Note: Cyclemax is not a medical app. The phases are estimates and are not suitable for contraception or family planning.

---

## Neuigkeiten (Version 1.0.0)

**DE:** Die erste Version. Sei der Fels in der Brandung.
**EN:** The first version. Be the rock in the surf.

---

## App-Datenschutz („Nutrition Label") – App Store Connect

**Data Not Collected** – Cyclemax speichert alle Daten ausschließlich auf dem Gerät; es gibt kein Konto, keine Analytics,
kein Tracking, keine Werbe-SDKs. `NSPrivacyTracking = false`, keine Tracking-Domains (siehe `app.json`).

Wichtiger Hinweis zum KI-Coach (Entscheidung Paul, vor dem Einreichen):
Wenn der Coach-Proxy aktiv ist, wird der optionale Situationstext zusammen mit Phase, Zyklustag, Tagen seit der letzten
Geste und der Sprache an den eigenen Proxy und von dort an die Claude API (Anthropic) übertragen. Der Proxy speichert
nichts. Apple zählt Daten nicht als „gesammelt", wenn sie nur in Echtzeit verarbeitet und nicht länger aufbewahrt
werden. Laut Anthropic-Richtlinien werden API-Daten standardmäßig bis zu 30 Tage aufbewahrt (Trust & Safety; vor dem Einreichen aktuell prüfen). Für ein sauberes
„Data Not Collected" eine Zero-Data-Retention-Vereinbarung mit Anthropic abschließen – andernfalls ehrlich angeben:
„User Content → Other User Content", nicht mit der Identität verknüpft, nicht für Tracking, Zweck „App-Funktionalität".

## Google Play – Datensicherheit

- Daten erhoben: **Keine** (lokale Speicherung zählt nicht).
- Daten geteilt: Situationstext des Coaches wird nur **flüchtig verarbeitet** (ephemeral processing) – gleiche
  Anthropic-Retention-Frage wie oben.
- Verschlüsselung bei Übertragung: Ja (HTTPS).
- Löschung: „Alle Daten löschen" in den Einstellungen.
- Gesundheits-Apps-Deklaration (Play Console → App-Inhalte): Zyklus-Tracking ausfüllen, „keine medizinische App".

## Screenshots

Entwürfe im Format iPhone 6,9" (1320 × 2868) in `store/screenshots/` (aus der Web-Vorschau gerendert,
gleiche Schrift und Layouts wie die App). Vor dem Upload ideal durch Screenshots aus einem echten Build ersetzen.

1. `de-1-welcome.png` / `en-1-welcome.png` – Onboarding: „Sei der Fels in der Brandung."
2. `*-2-home-peak.png` – Heute: Phasenring Hochphase mit Haltung, Aktionen, Impuls, Zitat
3. `*-3-home-breakers.png` – Heute: Brandung („nicht das letzte Wort haben")
4. `*-4-gestures.png` – Gesten: „Nicht weil der Kalender es sagt."

Ein Coach-Screenshot fehlt bewusst: Er soll eine echte Claude-Antwort zeigen, sobald der Proxy mit Key läuft.

## Review-Notizen für Apple (Vorschlag)

Cyclemax is a lifestyle app for men. The user asks his partner about her cycle and enters the dates himself; the app
then reminds him to be supportive in each phase. All data stays on the device, there is no account and no data
sharing with the partner or third parties. The optional "How do I respond?" coach sends only the phase, cycle day,
days since the last gesture and an optional short text to our own stateless proxy (Claude API). The app makes no
medical, fertility or contraception claims.
