"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { appLocked } from "@/lib/launch";
import { Screen, TopBar } from "./ui";

/**
 * Datenschutz/Impressum. In the app, back leads to the settings. On the web before launch it never leads into the app:
 * back to the page she came from (survey, upload) – or to the start page.
 */
export function Legal({ title, children }: { title: string; children: ReactNode }) {
  const router = useRouter();
  const [locked, setLocked] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLocked(appLocked());
  }, []);
  const back = () => (window.history.length > 1 ? window.history.back() : router.push("/"));
  return (
    <Screen>
      {locked ? <TopBar title={title} onBack={back} /> : <TopBar title={title} back="/settings/" />}
      <article className="legal mt-6 flex flex-col gap-4 text-[16px] leading-relaxed [&_h2]:mt-6 [&_h2]:text-[19px] [&_h2]:font-semibold [&_li]:ml-5 [&_li]:list-disc [&_p]:text-ink">
        {children}
      </article>
    </Screen>
  );
}
