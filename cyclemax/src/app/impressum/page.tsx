import type { Metadata } from "next";
import { Legal } from "@/components/Legal";

export const metadata: Metadata = { title: "Impressum · Cyclemax" };

const Placeholder = ({ children }: { children: string }) => (
  <mark className="rounded bg-[#fff3c4] px-1 font-medium text-ink" data-placeholder>
    {children}
  </mark>
);

export default function Impressum() {
  return (
    <Legal title="Impressum">
      <p className="rounded-xl bg-surface p-4 text-[14px]">Platzhalter – Paul trägt die markierten Angaben vor dem Launch ein.</p>
      <h2>Angaben gemäß § 5 DDG</h2>
      <p>
        <Placeholder>[NAME]</Placeholder>
        <br />
        <Placeholder>[ADRESSE]</Placeholder>
      </p>
      <h2>Kontakt</h2>
      <p>
        E-Mail: <Placeholder>[E-MAIL]</Placeholder>
      </p>
      <h2>Verantwortlich für den Inhalt</h2>
      <p>
        <Placeholder>[NAME]</Placeholder>, Anschrift wie oben.
      </p>
      <h2>Fundament</h2>
      <p>
        Inhalte basieren auf der PURE Method von Paul Brinkmann –{" "}
        <a className="underline" href="https://purmethod.com" target="_blank" rel="noreferrer">
          purmethod.com
        </a>
        .
      </p>
      <h2>Hinweis</h2>
      <p>
        Cyclemax ist kein Medizinprodukt, keine Verhütungs- oder Fruchtbarkeits-App und ersetzt keine Beratung. Bei Gewalt oder Krisen:
        Notruf 112, TelefonSeelsorge 0800 111 0 111.
      </p>
    </Legal>
  );
}
