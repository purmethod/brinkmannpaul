import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Zyklus teilen · Cyclemax",
  description: "Teile Screenshots deiner Zyklus-App anonym. Gespeichert werden nur Zahlen – keine Bilder, kein Datum, kein Name.",
};

export default function UploadLayout({ children }: { children: React.ReactNode }) {
  return children;
}
