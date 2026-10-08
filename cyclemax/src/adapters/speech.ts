// SpeechAdapter: talk instead of type.
//   Web    = Web Speech API (Chrome/Edge/Safari). Falls back to the keyboard's dictation key.
//   Native = @capacitor-community/speech-recognition (on-device/OS speech service).
// `onText` always receives the FULL transcript of the current session (not a delta).

export interface SpeechAdapter {
  readonly kind: "web" | "native" | "none";
  available(): Promise<boolean>;
  start(onText: (text: string, final: boolean) => void, onEnd: (error?: string) => void): Promise<void>;
  stop(): Promise<void>;
}

export const SPEECH_LANG = "de-DE";

// ---------------------------------------------------------------- web

interface RecognitionResultLike {
  isFinal: boolean;
  0: { transcript: string };
}
export interface RecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((e: { results: ArrayLike<RecognitionResultLike> }) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
}
type RecognitionCtor = new () => RecognitionLike;

export function speechCtor(win: object): RecognitionCtor | null {
  const w = win as { SpeechRecognition?: RecognitionCtor; webkitSpeechRecognition?: RecognitionCtor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

const ERRORS: Record<string, string> = {
  "not-allowed": "Mikrofon nicht erlaubt. Erlaube es in den Einstellungen – oder nutz das Mikrofon der Tastatur.",
  "service-not-allowed": "Spracheingabe ist hier nicht verfügbar. Nutz das Mikrofon der Tastatur.",
  network: "Spracheingabe braucht gerade Internet.",
  "audio-capture": "Kein Mikrofon gefunden.",
};

export function createWebSpeech(win: object = globalThis): SpeechAdapter {
  let current: RecognitionLike | null = null;
  return {
    kind: "web",
    async available() {
      return speechCtor(win) !== null;
    },
    async start(onText, onEnd) {
      const Ctor = speechCtor(win);
      if (!Ctor) return onEnd("Spracheingabe wird von diesem Browser nicht unterstützt. Nutz das Mikrofon der Tastatur.");
      current?.stop();
      const rec = new Ctor();
      current = rec;
      rec.lang = SPEECH_LANG;
      rec.continuous = true;
      rec.interimResults = true;
      let failed: string | undefined;
      rec.onresult = (e) => {
        let text = "";
        let final = true;
        for (let i = 0; i < e.results.length; i++) {
          text += e.results[i][0].transcript;
          if (!e.results[i].isFinal) final = false;
        }
        onText(text.replace(/\s+/g, " ").trim(), final);
      };
      rec.onerror = (e) => {
        if (e.error !== "no-speech" && e.error !== "aborted") failed = ERRORS[e.error] ?? "Spracheingabe abgebrochen.";
      };
      rec.onend = () => {
        if (current === rec) current = null;
        onEnd(failed);
      };
      rec.start();
    },
    async stop() {
      current?.stop();
    },
  };
}

// ---------------------------------------------------------------- native

/** Minimal surface of @capacitor-community/speech-recognition (mockable). */
export interface SpeechPluginLike {
  available(): Promise<{ available: boolean }>;
  checkPermissions(): Promise<{ speechRecognition: string }>;
  requestPermissions(): Promise<{ speechRecognition: string }>;
  start(o: { language: string; partialResults: boolean; popup: boolean; maxResults: number }): Promise<{ matches?: string[] }>;
  stop(): Promise<void>;
  addListener(event: "partialResults", fn: (d: { matches: string[] }) => void): Promise<{ remove(): Promise<void> }>;
  addListener(event: "listeningState", fn: (d: { status: "started" | "stopped" }) => void): Promise<{ remove(): Promise<void> }>;
}

export function createNativeSpeech(plugin: SpeechPluginLike): SpeechAdapter {
  let handles: { remove(): Promise<void> }[] = [];
  let last = "";
  const cleanup = async () => {
    const h = handles;
    handles = [];
    await Promise.all(h.map((x) => x.remove().catch(() => undefined)));
  };
  return {
    kind: "native",
    async available() {
      try {
        return (await plugin.available()).available;
      } catch {
        return false;
      }
    },
    async start(onText, onEnd) {
      let perm = (await plugin.checkPermissions()).speechRecognition;
      if (perm !== "granted") perm = (await plugin.requestPermissions()).speechRecognition;
      if (perm !== "granted") return onEnd(ERRORS["not-allowed"]);
      await cleanup();
      last = "";
      handles.push(
        await plugin.addListener("partialResults", (d) => {
          last = d.matches?.[0] ?? last;
          onText(last, false);
        }),
        await plugin.addListener("listeningState", async (d) => {
          if (d.status === "stopped") {
            onText(last, true);
            await cleanup();
            onEnd();
          }
        }),
      );
      plugin.start({ language: SPEECH_LANG, partialResults: true, popup: false, maxResults: 1 }).catch(async (e) => {
        await cleanup();
        onEnd(e instanceof Error ? e.message : "Spracheingabe abgebrochen.");
      });
    },
    async stop() {
      await plugin.stop().catch(() => undefined);
    },
  };
}
