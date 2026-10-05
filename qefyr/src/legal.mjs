// Legal pages. German is binding; English is a convenience translation.
// Seller details come from site.json → legal. Missing values render as a visible marker
// and are listed as launch blockers by scripts/check.mjs. Have a lawyer review before launch.
import { esc } from "./util.mjs";

const LABELS = {
  de: { seller: "Name / Firma", represented_by: "vertreten durch", street: "Straße und Hausnummer", postcode_city: "PLZ und Ort", phone: "Telefon", vat_id: "USt-IdNr.", organic_control_body: "Öko-Kontrollstelle (DE-ÖKO-0xx)", privacy_contact: "Datenschutz-Kontakt" },
  en: { seller: "name / company", represented_by: "represented by", street: "street and number", postcode_city: "postcode and city", phone: "phone", vat_id: "VAT ID", organic_control_body: "organic control body (DE-ÖKO-0xx)", privacy_contact: "privacy contact" },
};

export function makeLegal(site, lang) {
  const L = site.legal;
  const v = (key) => (L[key] ? esc(L[key]) : `<mark class="missing">[${LABELS[lang][key]}]</mark>`);
  const address = `${v("seller")}<br>${v("street")}<br>${v("postcode_city")}<br>${esc(L.country[lang])}`;
  const mail = `<a href="mailto:${esc(site.email)}">${esc(site.email)}</a>`;
  return { v, address, mail, has: (key) => Boolean(L[key]), smallBusiness: L.small_business === true };
}

export function vatText(site, t) {
  return site.legal.small_business === true ? t.common.vatSmall : t.common.vatIncl;
}

/* ---------------------------------------------------------------- Deutsch */

const de = {
  imprint: (x) => `
    <h2>Angaben gemäß § 5 DDG</h2>
    <p>${x.address}</p>
    ${x.has("represented_by") ? `<p>Vertreten durch: ${x.v("represented_by")}</p>` : ""}
    <h2>Kontakt</h2>
    <p>E-Mail: ${x.mail}<br>Telefon: ${x.v("phone")}</p>
    ${x.smallBusiness ? "" : `<h2>Umsatzsteuer</h2><p>Umsatzsteuer-Identifikationsnummer gemäß § 27a UStG: ${x.v("vat_id")}</p>`}
    <h2>Öko-Kontrollstelle</h2>
    <p>${x.v("organic_control_body")}</p>
    <h2>Verantwortlich für den Inhalt</h2>
    <p>${x.v("seller")}, Anschrift wie oben.</p>
    <h2>Verbraucherstreitbeilegung</h2>
    <p>Wir sind nicht bereit und nicht verpflichtet, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.</p>`,

  privacy: (x, r) => `
    <h2>1. Verantwortlicher</h2>
    <p>${x.address}<br>E-Mail: ${x.mail}</p>
    <h2>2. Das Wichtigste vorab</h2>
    <p>Wir verarbeiten personenbezogene Daten nur, soweit es für den Betrieb dieser Website und die Abwicklung deiner Bestellung nötig ist. Wir setzen keine Analyse- oder Marketing-Tools und keine Tracking-Cookies ein. Unsere Schriften liegen auf unserem eigenen Server; es wird dafür keine Verbindung zu Google oder anderen Anbietern aufgebaut.</p>
    <h2>3. Hosting</h2>
    <p>Diese Website wird bei Vercel Inc., 440 N Barranca Avenue #4133, Covina, CA 91723, USA gehostet. Beim Aufruf der Website verarbeitet Vercel technisch notwendige Daten wie IP-Adresse, Datum und Uhrzeit, aufgerufene Seite, Referrer und Browser-Kennung (Server-Logfiles), um die Website auszuliefern und vor Missbrauch zu schützen. Rechtsgrundlage ist unser berechtigtes Interesse an einem sicheren und stabilen Betrieb (Art. 6 Abs. 1 lit. f DSGVO). Vercel ist unter dem EU-US Data Privacy Framework zertifiziert; außerdem gilt der Auftragsverarbeitungsvertrag von Vercel einschließlich der EU-Standardvertragsklauseln. Server-Logfiles werden nur kurzzeitig gespeichert.</p>
    <h2>4. Bestellung und Zahlung über Stripe</h2>
    <p>Wenn du bestellst, gibst du im Bezahlformular unseres Zahlungsdienstleisters deine E-Mail-Adresse, Liefer- und gegebenenfalls Rechnungsadresse, Telefonnummer und Zahlungsdaten ein. Anbieter ist die Stripe Payments Europe, Limited, 1 Grand Canal Street Lower, Grand Canal Dock, Dublin, D02 H210, Irland. Stripe verarbeitet diese Daten, um die Zahlung abzuwickeln und Betrug zu verhindern; dabei können Daten an Stripe, LLC in den USA übermittelt werden, die unter dem EU-US Data Privacy Framework zertifiziert ist. Wir erhalten von Stripe die Bestelldaten, die wir für Versand, Buchhaltung und Kundenservice brauchen. Rechtsgrundlagen sind die Erfüllung des Vertrags (Art. 6 Abs. 1 lit. b DSGVO) und unsere gesetzlichen Pflichten (Art. 6 Abs. 1 lit. c DSGVO).</p>
    <p>Das Bezahlformular (Stripe.js) wird erst geladen, wenn du auf „jetzt bestellen“ klickst. Stripe setzt dabei Cookies und ähnliche Technologien ein, die für die sichere Zahlung und die Betrugsprävention technisch notwendig sind (§ 25 Abs. 2 Nr. 2 TDDDG). Mehr dazu: <a href="https://stripe.com/de/privacy" rel="noopener" target="_blank">stripe.com/de/privacy</a>.</p>
    <h2>5. Versand mit DHL</h2>
    <p>Damit dein Paket ankommt, geben wir deinen Namen und deine Lieferadresse an DHL weiter (DHL Paket GmbH, Sträßchensweg 10, 53113 Bonn). Für Sendungen außerhalb der EU können zusätzlich Daten an die Zollbehörden und an Partner von DHL im Empfängerland gehen, soweit das für Zustellung und Verzollung nötig ist. Rechtsgrundlage ist die Erfüllung des Vertrags (Art. 6 Abs. 1 lit. b DSGVO). Deine Sendungsnummer schicken wir dir selbst per E-Mail.</p>
    <h2>6. Kontakt per E-Mail</h2>
    <p>Wenn du uns schreibst, verarbeiten wir deine Angaben, um deine Anfrage zu beantworten (Art. 6 Abs. 1 lit. b DSGVO bei Fragen zu einer Bestellung, sonst Art. 6 Abs. 1 lit. f DSGVO).</p>
    <h2>7. Sendungsverfolgung</h2>
    <p>Auf unserer Seite zur Sendungsverfolgung gibst du deine Sendungsnummer ein und wirst zu DHL weitergeleitet. Die Sendungsnummer geht dabei direkt an DHL; wir speichern sie nicht.</p>
    <h2>8. Speicherdauer</h2>
    <p>Bestell- und Rechnungsdaten bewahren wir so lange auf, wie es das Handels- und Steuerrecht vorschreibt (bis zu zehn Jahre). Alles andere löschen wir, sobald es für den Zweck nicht mehr gebraucht wird.</p>
    <h2>9. Deine Rechte</h2>
    <p>Du hast das Recht auf Auskunft (Art. 15 DSGVO), Berichtigung (Art. 16), Löschung (Art. 17), Einschränkung der Verarbeitung (Art. 18), Datenübertragbarkeit (Art. 20) und Widerspruch gegen Verarbeitungen auf Grundlage berechtigter Interessen (Art. 21 DSGVO). Schreib uns dafür einfach an ${x.mail}. Außerdem kannst du dich bei einer Datenschutz-Aufsichtsbehörde beschweren, zum Beispiel in dem Bundesland, in dem du wohnst.</p>
    <p class="legal-date">Stand: Oktober 2026</p>`,

  terms: (x, r, s) => `
    <h2>§ 1 Geltungsbereich</h2>
    <p>Diese Allgemeinen Geschäftsbedingungen gelten für alle Bestellungen über qefyr.com zwischen ${x.v("seller")}, ${x.v("street")}, ${x.v("postcode_city")} („wir“) und dir als Kundin oder Kunde.</p>
    <h2>§ 2 Vertragsschluss</h2>
    <p>Die Darstellung von qefyr auf unserer Website ist kein bindendes Angebot. Du wählst Versandzone und Menge und gelangst über „jetzt bestellen“ zum Bezahlformular unseres Zahlungsdienstleisters Stripe. Dort gibst du deine Daten ein und kannst sie vor dem Absenden prüfen und korrigieren. Mit dem Klick auf den Bezahl-Button gibst du ein verbindliches Angebot ab. Der Vertrag kommt zustande, sobald die Zahlung erfolgreich abgeschlossen ist. Du erhältst darüber eine Bestätigung per E-Mail.</p>
    <h2>§ 3 Preise und Versandkosten</h2>
    <p>Alle Preise sind Endpreise in Euro, ${s.vat}. Hinzu kommen die Versandkosten der gewählten Versandzone, die dir vor der Bestellung angezeigt werden (<a href="${r.shipping}">Versand &amp; Zahlung</a>). Bei Lieferungen außerhalb der EU können Zölle, Steuern und Gebühren anfallen, die du als Empfänger trägst.</p>
    <h2>§ 4 Zahlung</h2>
    <p>Die Zahlung erfolgt über Stripe. Welche Zahlungsarten dir zur Verfügung stehen, siehst du im Bezahlformular. Der Kaufpreis ist mit der Bestellung fällig.</p>
    <h2>§ 5 Lieferung</h2>
    <p>Wir liefern mit DHL nach Deutschland, in die EU und in die Länder, die im Bestellprozess angeboten werden. Die üblichen Lieferzeiten findest du unter <a href="${r.shipping}">Versand &amp; Zahlung</a>. qefyr ist ein frisches, lebendes Lebensmittel: Bitte gib deine Adresse vollständig und richtig an und sorg dafür, dass du die Sendung zeitnah annehmen kannst. Kann eine Sendung nicht zugestellt werden, melden wir uns bei dir und klären das weitere Vorgehen.</p>
    <h2>§ 6 Eigentumsvorbehalt</h2>
    <p>Die Ware bleibt bis zur vollständigen Bezahlung unser Eigentum.</p>
    <h2>§ 7 Kein Widerrufsrecht</h2>
    <p>Für qefyr besteht kein Widerrufsrecht, weil es sich um eine Ware handelt, die schnell verderben kann (§ 312g Abs. 2 Nr. 2 BGB). Mehr dazu unter <a href="${r.withdrawal}">Widerruf</a>.</p>
    <h2>§ 8 Gewährleistung</h2>
    <p>Es gelten die gesetzlichen Mängelrechte. Wenn mit deiner Lieferung etwas nicht stimmt, melde dich bitte möglichst schnell mit einem Foto unter ${x.mail}, dann können wir am schnellsten helfen. Deine gesetzlichen Rechte hängen davon nicht ab.</p>
    <h2>§ 9 Eine lebende Kultur</h2>
    <p>qefyr ist ein Naturprodukt. Geschmack, Konsistenz und Aussehen können je nach Milch, Temperatur und Zeit leicht schwanken; das ist kein Mangel. Für die Pflege der Kultur zuhause folge bitte der Anleitung, die deinem qefyr beiliegt.</p>
    <h2>§ 10 Haftung</h2>
    <p>Wir haften unbeschränkt bei Vorsatz und grober Fahrlässigkeit, bei Verletzung von Leben, Körper oder Gesundheit sowie nach dem Produkthaftungsgesetz. Bei leichter Fahrlässigkeit haften wir nur für die Verletzung wesentlicher Vertragspflichten, deren Erfüllung die ordnungsgemäße Durchführung des Vertrags erst ermöglicht, und begrenzt auf den vorhersehbaren, vertragstypischen Schaden.</p>
    <h2>§ 11 Vertragssprache und Vertragstext</h2>
    <p>Vertragssprachen sind Deutsch und Englisch; maßgeblich ist die deutsche Fassung. Wir speichern den Vertragstext nicht gesondert. Deine Bestelldaten erhältst du per E-Mail; diese AGB kannst du jederzeit auf dieser Seite abrufen und speichern.</p>
    <h2>§ 12 Streitbeilegung</h2>
    <p>Wir sind nicht bereit und nicht verpflichtet, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.</p>
    <h2>§ 13 Anwendbares Recht</h2>
    <p>Es gilt deutsches Recht unter Ausschluss des UN-Kaufrechts. Als Verbraucher behältst du den Schutz der zwingenden Vorschriften des Staates, in dem du deinen gewöhnlichen Aufenthalt hast.</p>
    <p class="legal-date">Stand: Oktober 2026</p>`,

  withdrawal: (x) => `
    <h2>Kein Widerrufsrecht für qefyr</h2>
    <p>Bei Verträgen über die Lieferung von Waren, die schnell verderben können oder deren Verfallsdatum schnell überschritten würde, besteht kein Widerrufsrecht (§ 312g Abs. 2 Nr. 2 BGB).</p>
    <p>qefyr ist ein frisches, lebendes Milcherzeugnis und fällt unter diese Ausnahme. Eine Bestellung kann daher nach Abschluss nicht widerrufen werden.</p>
    <h2>Deine Gewährleistungsrechte bleiben</h2>
    <p>Deine gesetzlichen Rechte bei Mängeln bleiben davon unberührt. Wenn mit deiner Lieferung etwas nicht stimmt, schreib uns bitte möglichst schnell mit einem Foto an ${x.mail}.</p>`,
};

/* ---------------------------------------------------------------- English */

const en = {
  imprint: (x) => `
    <h2>Information pursuant to § 5 DDG</h2>
    <p>${x.address}</p>
    ${x.has("represented_by") ? `<p>Represented by: ${x.v("represented_by")}</p>` : ""}
    <h2>Contact</h2>
    <p>Email: ${x.mail}<br>Phone: ${x.v("phone")}</p>
    ${x.smallBusiness ? "" : `<h2>VAT</h2><p>VAT identification number pursuant to § 27a UStG: ${x.v("vat_id")}</p>`}
    <h2>Organic control body</h2>
    <p>${x.v("organic_control_body")}</p>
    <h2>Responsible for content</h2>
    <p>${x.v("seller")}, address as above.</p>
    <h2>Consumer dispute resolution</h2>
    <p>We are neither willing nor obliged to take part in dispute resolution proceedings before a consumer arbitration board.</p>`,

  privacy: (x) => `
    <h2>1. Controller</h2>
    <p>${x.address}<br>Email: ${x.mail}</p>
    <h2>2. In short</h2>
    <p>We only process personal data where it is needed to run this website and to handle your order. We use no analytics or marketing tools and no tracking cookies. Our fonts are served from our own server; no connection to Google or other providers is made for them.</p>
    <h2>3. Hosting</h2>
    <p>This website is hosted by Vercel Inc., 440 N Barranca Avenue #4133, Covina, CA 91723, USA. When you visit, Vercel processes technically necessary data such as IP address, date and time, the page requested, referrer and browser identifier (server log files) to deliver the website and protect it against abuse. The legal basis is our legitimate interest in secure and stable operation (Art. 6(1)(f) GDPR). Vercel is certified under the EU-U.S. Data Privacy Framework; Vercel's data processing agreement, including the EU Standard Contractual Clauses, also applies. Server log files are kept only briefly.</p>
    <h2>4. Orders and payment via Stripe</h2>
    <p>When you order, you enter your email address, shipping and, where applicable, billing address, phone number and payment details in the checkout of our payment provider, Stripe Payments Europe, Limited, 1 Grand Canal Street Lower, Grand Canal Dock, Dublin, D02 H210, Ireland. Stripe processes this data to handle the payment and prevent fraud; data may be transferred to Stripe, LLC in the USA, which is certified under the EU-U.S. Data Privacy Framework. We receive the order data from Stripe that we need for shipping, accounting and customer service. The legal bases are the performance of the contract (Art. 6(1)(b) GDPR) and our legal obligations (Art. 6(1)(c) GDPR).</p>
    <p>The checkout (Stripe.js) only loads once you click “order now”. Stripe then uses cookies and similar technologies that are technically necessary for secure payment and fraud prevention (§ 25(2) no. 2 TDDDG). More: <a href="https://stripe.com/privacy" rel="noopener" target="_blank">stripe.com/privacy</a>.</p>
    <h2>5. Shipping with DHL</h2>
    <p>To deliver your parcel, we pass your name and shipping address to DHL (DHL Paket GmbH, Sträßchensweg 10, 53113 Bonn, Germany). For shipments outside the EU, data may also go to customs authorities and DHL partners in the destination country where needed for delivery and customs clearance. The legal basis is the performance of the contract (Art. 6(1)(b) GDPR). We send you your tracking number ourselves by email.</p>
    <h2>6. Contact by email</h2>
    <p>When you write to us, we process your details to answer your request (Art. 6(1)(b) GDPR for questions about an order, otherwise Art. 6(1)(f) GDPR).</p>
    <h2>7. Parcel tracking</h2>
    <p>On our tracking page you enter your tracking number and are taken to DHL. The number goes directly to DHL; we do not store it.</p>
    <h2>8. Retention</h2>
    <p>We keep order and invoice data for as long as commercial and tax law requires (up to ten years). Everything else is deleted as soon as it is no longer needed.</p>
    <h2>9. Your rights</h2>
    <p>You have the right of access (Art. 15 GDPR), rectification (Art. 16), erasure (Art. 17), restriction of processing (Art. 18), data portability (Art. 20) and to object to processing based on legitimate interests (Art. 21 GDPR). Just write to ${x.mail}. You can also lodge a complaint with a data protection supervisory authority, for example in the place where you live.</p>
    <p class="legal-date">Last updated: October 2026</p>`,

  terms: (x, r, s) => `
    <h2>§ 1 Scope</h2>
    <p>These terms and conditions apply to all orders placed via qefyr.com between ${x.v("seller")}, ${x.v("street")}, ${x.v("postcode_city")} (“we”) and you as our customer.</p>
    <h2>§ 2 Conclusion of contract</h2>
    <p>The presentation of qefyr on our website is not a binding offer. You choose your shipping zone and quantity and reach the checkout of our payment provider Stripe via “order now”. There you enter your details and can check and correct them before submitting. By clicking the pay button you make a binding offer. The contract is concluded as soon as the payment has been completed successfully. You receive a confirmation by email.</p>
    <h2>§ 3 Prices and shipping costs</h2>
    <p>All prices are final prices in euros, ${s.vat}. Shipping costs for the chosen zone are added and shown before you order (<a href="${r.shipping}">shipping &amp; payment</a>). For deliveries outside the EU, customs duties, taxes and fees may apply, which are borne by you as the recipient.</p>
    <h2>§ 4 Payment</h2>
    <p>Payment is made via Stripe. The payment methods available to you are shown in the checkout. The purchase price is due with your order.</p>
    <h2>§ 5 Delivery</h2>
    <p>We deliver with DHL to Germany, the EU and the countries offered during checkout. Usual delivery times are listed under <a href="${r.shipping}">shipping &amp; payment</a>. qefyr is a fresh, living food: please enter your address completely and correctly and make sure you can take the parcel in promptly. If a parcel cannot be delivered, we will contact you to agree on how to proceed.</p>
    <h2>§ 6 Retention of title</h2>
    <p>The goods remain our property until paid for in full.</p>
    <h2>§ 7 No right of withdrawal</h2>
    <p>There is no right of withdrawal for qefyr, as it is a product that can spoil quickly (§ 312g(2) no. 2 BGB). See <a href="${r.withdrawal}">cancellation</a>.</p>
    <h2>§ 8 Warranty</h2>
    <p>Statutory warranty rights apply. If something is wrong with your delivery, please contact us as soon as possible with a photo at ${x.mail} so we can help quickly. Your statutory rights do not depend on this.</p>
    <h2>§ 9 A living culture</h2>
    <p>qefyr is a natural product. Taste, texture and appearance may vary slightly with milk, temperature and time; this is not a defect. To care for the culture at home, please follow the guide that comes with your qefyr.</p>
    <h2>§ 10 Liability</h2>
    <p>We are liable without limitation for intent and gross negligence, for injury to life, body or health and under the Product Liability Act. In cases of slight negligence we are only liable for breaches of essential contractual obligations whose fulfilment makes the proper performance of the contract possible, limited to the foreseeable damage typical for the contract.</p>
    <h2>§ 11 Language and contract text</h2>
    <p>The contract languages are German and English; the German version prevails. We do not store the contract text separately. You receive your order details by email; you can view and save these terms on this page at any time.</p>
    <h2>§ 12 Dispute resolution</h2>
    <p>We are neither willing nor obliged to take part in dispute resolution proceedings before a consumer arbitration board.</p>
    <h2>§ 13 Applicable law</h2>
    <p>German law applies, excluding the UN Convention on Contracts for the International Sale of Goods. As a consumer, you keep the protection of the mandatory provisions of the country in which you habitually reside.</p>
    <p class="legal-date">Last updated: October 2026</p>`,

  withdrawal: (x) => `
    <h2>No right of withdrawal for qefyr</h2>
    <p>There is no right of withdrawal for contracts for the supply of goods that can spoil quickly or whose expiry date would quickly be exceeded (§ 312g(2) no. 2 BGB).</p>
    <p>qefyr is a fresh, living dairy product and falls under this exception. An order therefore cannot be withdrawn once it has been placed.</p>
    <h2>Your warranty rights remain</h2>
    <p>Your statutory rights in case of defects are not affected. If something is wrong with your delivery, please write to us as soon as possible with a photo at ${x.mail}.</p>`,
};

export const LEGAL = { de, en };
