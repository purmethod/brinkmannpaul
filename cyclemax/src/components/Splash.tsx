import { Logo } from "./Logo";

/** Same as the native/PWA splash: the ring centred on white. */
export function Splash() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-bg" aria-label="Cyclemax lädt" role="status">
      <Logo size={120} />
    </div>
  );
}
