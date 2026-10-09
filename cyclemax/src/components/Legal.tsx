import type { ReactNode } from "react";
import { Screen, TopBar } from "./ui";

export function Legal({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Screen>
      <TopBar title={title} back="/settings/" />
      <article className="legal mt-6 flex flex-col gap-4 text-[16px] leading-relaxed [&_h2]:mt-6 [&_h2]:text-[19px] [&_h2]:font-semibold [&_li]:ml-5 [&_li]:list-disc [&_p]:text-ink">
        {children}
      </article>
    </Screen>
  );
}
