import type { Metadata } from "next";
import { Legal } from "@/components/Legal";

export const metadata: Metadata = { title: "Datenschutz · Cyclemax" };

export default function Datenschutz() {
  return (
    <Legal title="Datenschutz">
      <p>
        Cyclemax braucht kein Konto, kein Login und keinen Namen. Die App erzeugt beim ersten Start eine zufällige, anonyme
        Geräte-ID. Verantwortlich: siehe <a className="underline" href="/impressum/">Impressum</a>.
      </p>

      <h2>Was nur auf deinem Gerät bleibt</h2>
      <ul>
        <li>Alle Zyklusdaten: Blutungstage, Zykluslänge, Phase.</li>
        <li>Dein kompletter Chatverlauf.</li>
        <li>Deine Einstellungen und welche Tageszeilen du gesehen hast.</li>
      </ul>
      <p>Gespeichert wird im Web in IndexedDB deines Browsers, in der App im lokalen App-Speicher.</p>

      <h2>Was an unseren Server geht</h2>
      <ul>
        <li>
          <b>Benachrichtigungen im Web:</b> deine Push-Adresse des Browsers (Push-Subscription), die Uhrzeit für die tägliche Nachricht
          und für die nächsten 30 Tage je Zeitpunkt und Nachrichtentyp (z. B. „tägliche Zeile Nr. …“ oder „Phasen-Hinweis“). Dein Gerät
          rechnet die Termine selbst aus; Blutungsdaten werden nicht übertragen. Aus dem Nachrichtentyp eines Tages lässt sich die
          Phase dieses Tages ableiten – wer das vermeiden will, nutzt die App-Version oder schaltet Benachrichtigungen ab.
        </li>
        <li>
          <b>Benachrichtigungen in der App (iOS/Android):</b> werden komplett auf dem Gerät geplant. Es geht nichts an den Server; die App
          lädt nur die Liste der Tageszeilen herunter.
        </li>
        <li>
          <b>Chat:</b> deine Nachricht, die letzten Nachrichten des Verlaufs als Kontext, Modus (Beziehung/Single), aktuelle Phase und
          Zyklustag. Der Server leitet das an den KI-Dienst weiter und speichert keine Inhalte. Gespeichert wird nur ein anonymes
          Themen-Stichwort (z. B. „Streit“, „Grenzen“, „erstes Date“) mit Datum, ohne Geräte-ID, und ein Tageszähler pro Geräte-ID
          gegen Missbrauch.
        </li>
        <li>
          <b>Bewertungen:</b> Daumen hoch/runter mit Geräte-ID (damit pro Gerät nur eine Stimme zählt) und der ID der Zeile bzw. Antwort.
        </li>
        <li>
          <b>„Antwort melden“:</b> der Text der gemeldeten KI-Antwort und das Themen-Stichwort, ohne Geräte-ID und ohne deine Frage.
        </li>
      </ul>

      <h2>KI-Dienst</h2>
      <p>
        Chat-Antworten erzeugt Claude von Anthropic PBC (USA). Anthropic erhält den Chat-Inhalt der jeweiligen Anfrage, keine Geräte-ID.
        Ohne Verbindung antwortet die App mit einer Zeile aus der Wissensbasis auf dem Gerät.
      </p>

      <h2>Hosting und Push-Dienste</h2>
      <p>
        Server und Datenbank laufen bei Vercel Inc. und Neon Inc. (USA). Web-Push-Nachrichten werden verschlüsselt über den Push-Dienst
        deines Browsers zugestellt (z. B. Apple, Google, Mozilla); der Inhalt ist für diese Dienste nicht lesbar. Mit „Neutrale
        Benachrichtigungen“ zeigt der Sperrbildschirm nur „Cyclemax“.
      </p>

      <h2>Alle Daten löschen</h2>
      <p>
        In den Einstellungen löscht „Alle Daten löschen“ sofort alles auf dem Gerät und auf dem Server alles, was zu deiner Geräte-ID
        gehört: Push-Adresse, geplante Benachrichtigungen, Bewertungen und Chat-Zähler. Bist du offline, wird die Server-Löschung beim
        nächsten Start automatisch nachgeholt.
      </p>

      <h2>Keine Werbung, kein Tracking</h2>
      <p>Cyclemax nutzt keine Analyse-, Werbe- oder Tracking-Dienste und keine Cookies.</p>

      <h2>Deine Rechte</h2>
      <p>
        Auskunft, Berichtigung, Löschung, Einschränkung, Widerspruch und Beschwerde bei einer Aufsichtsbehörde (Art. 15–21, 77 DSGVO).
        Da wir keinen Namen kennen, nenne bei Anfragen deine Geräte-ID oder nutze direkt „Alle Daten löschen“.
      </p>
      <p className="text-[13px] text-muted">Stand: Oktober 2026</p>
    </Legal>
  );
}
