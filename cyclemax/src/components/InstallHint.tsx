import { IconShare } from "./icons";

/** iPhone web: web push only works from the home screen. */
export function InstallHint() {
  return (
    <ol className="flex flex-col gap-3 rounded-2xl bg-surface p-5 text-[16px] leading-snug" data-testid="install-hint">
      <li className="flex items-center gap-3">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white text-[14px] font-semibold">1</span>
        <span className="flex items-center gap-1">
          Tippe unten auf <IconShare width={20} height={20} className="inline" /> <b>Teilen</b>.
        </span>
      </li>
      <li className="flex items-center gap-3">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white text-[14px] font-semibold">2</span>
        <span>
          Wähle <b>Zum Home-Bildschirm</b>.
        </span>
      </li>
      <li className="flex items-center gap-3">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white text-[14px] font-semibold">3</span>
        <span>Öffne Cyclemax vom Home-Bildschirm.</span>
      </li>
    </ol>
  );
}
