import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Bau deine Zyklus-App mit · Cyclemax",
  description: "20 kurze Fragen, 3 Minuten, anonym: Was wünschst du dir von einer Zyklus-App, die dir jeden Tag sagt, was dir guttut?",
};

export default function QuestionsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
