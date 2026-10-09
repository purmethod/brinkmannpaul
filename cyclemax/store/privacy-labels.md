# Ausfüllhilfe: Apple App-Datenschutz & Google Data Safety

Grundlage: native App (iOS/Android). Benachrichtigungen werden lokal geplant, kein Konto, keine Werbe-/Analyse-SDKs.

## Apple – App Privacy

**Tracking:** Nein. Keine Daten werden zum Tracking verwendet.

| Datentyp (Apple) | Erhoben? | Mit Identität verknüpft? | Zweck |
|---|---|---|---|
| Nutzerinhalte → Sonstige Nutzerinhalte (Chat-Nachrichten, Profil-Erzählung) | Ja | Nein | App-Funktionalität (Weiterleitung an KI, keine Speicherung) |
| Sensible Informationen (Beziehungs-/Intimitätsthemen in der Profil-Erzählung) | Konservativ: Ja | Nein | App-Funktionalität, flüchtig verarbeitet |
| Audiodaten | Nein – Spracheingabe läuft über die Spracherkennung des Betriebssystems, die App speichert/sendet kein Audio | – | – |
| Kennungen → Geräte-ID (zufällige App-ID, nicht IDFA) | Ja | Nein (nicht mit Person verknüpft) | App-Funktionalität (eine Stimme pro Gerät, Missbrauchsschutz) |
| Nutzungsdaten → Produktinteraktion (Daumen hoch/runter) | Ja | Nein | App-Funktionalität (bessere Zeilen) |
| Gesundheit & Fitness | **Nein** – Zyklusdaten verlassen das Gerät nicht. Achtung: Im Chat schickt die App die *aktuelle Phase* und den *Zyklustag* als Kontext mit. Konservativ: „Gesundheit“ = Ja, nicht verknüpft, Zweck App-Funktionalität. Empfehlung: konservativ angeben. |
| Kontakt, Standort, Finanzen, Browserverlauf, Suchverlauf, Diagnose | Nein | – | – |

## Google Play – Data Safety

- Werden Daten erhoben oder geteilt? **Ja (erhoben), Nein (nicht geteilt)** – Anthropic ist Auftragsverarbeiter („service provider“), zählt nicht als Teilen.
- Verschlüsselung bei der Übertragung: **Ja** (HTTPS).
- Löschung anfordern: **Ja** – „Alle Daten löschen“ in der App.
- Datentypen:
  - Nachrichten → Sonstige In-App-Nachrichten (Chat): erhoben, optional, App-Funktionalität, flüchtig verarbeitet (nicht gespeichert).
  - Gesundheit und Fitness → Gesundheitsinformationen (Phase/Zyklustag im Chat-Kontext): erhoben, optional, App-Funktionalität, flüchtig.
  - App-Aktivität → Sonstige Aktionen (Bewertungen): erhoben, optional, App-Funktionalität.
  - Geräte- oder andere IDs (zufällige App-ID): erhoben, App-Funktionalität, Betrugsprävention.
