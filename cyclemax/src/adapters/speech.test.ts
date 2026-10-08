import { describe, expect, it, vi } from "vitest";
import { createNativeSpeech, createWebSpeech, type RecognitionLike, type SpeechPluginLike } from "./speech";

function fakeWindow() {
  const instances: RecognitionLike[] = [];
  class Rec implements RecognitionLike {
    lang = "";
    continuous = false;
    interimResults = false;
    onresult: RecognitionLike["onresult"] = null;
    onerror: RecognitionLike["onerror"] = null;
    onend: RecognitionLike["onend"] = null;
    start = vi.fn();
    stop = vi.fn(() => this.onend?.());
    constructor() {
      instances.push(this);
    }
  }
  return { win: { webkitSpeechRecognition: Rec }, instances };
}

describe("SpeechAdapter web", () => {
  it("delivers the full transcript in German and ends", async () => {
    const { win, instances } = fakeWindow();
    const s = createWebSpeech(win);
    expect(await s.available()).toBe(true);
    const texts: [string, boolean][] = [];
    const onEnd = vi.fn();
    await s.start((t, f) => texts.push([t, f]), onEnd);
    const rec = instances[0];
    expect(rec.lang).toBe("de-DE");
    expect(rec.continuous && rec.interimResults).toBe(true);
    rec.onresult!({ results: [{ isFinal: true, 0: { transcript: "Sie ist  oft müde" } }, { isFinal: false, 0: { transcript: " und gereizt" } }] });
    expect(texts.at(-1)).toEqual(["Sie ist oft müde und gereizt", false]);
    await s.stop();
    expect(onEnd).toHaveBeenCalledWith(undefined);
  });
  it("reports a missing microphone permission", async () => {
    const { win, instances } = fakeWindow();
    const s = createWebSpeech(win);
    const onEnd = vi.fn();
    await s.start(() => undefined, onEnd);
    instances[0].onerror!({ error: "not-allowed" });
    instances[0].onend!();
    expect(onEnd.mock.calls[0][0]).toMatch(/Mikrofon/);
  });
  it("unsupported browser → hint, no crash", async () => {
    const s = createWebSpeech({});
    expect(await s.available()).toBe(false);
    const onEnd = vi.fn();
    await s.start(() => undefined, onEnd);
    expect(onEnd.mock.calls[0][0]).toMatch(/Tastatur/);
  });
});

describe("SpeechAdapter native", () => {
  function plugin(permission = "granted") {
    const listeners: Record<string, (d: never) => void> = {};
    const p: SpeechPluginLike = {
      available: async () => ({ available: true }),
      checkPermissions: async () => ({ speechRecognition: permission }),
      requestPermissions: async () => ({ speechRecognition: permission }),
      start: vi.fn(async () => ({})),
      stop: vi.fn(async () => listeners.listeningState?.({ status: "stopped" } as never)),
      addListener: vi.fn(async (event: string, fn: (d: never) => void) => {
        listeners[event] = fn;
        return { remove: async () => void delete listeners[event] };
      }) as never,
    };
    return { p, listeners };
  }
  it("streams partial results and finishes with the final text", async () => {
    const { p, listeners } = plugin();
    const s = createNativeSpeech(p);
    const texts: [string, boolean][] = [];
    const onEnd = vi.fn();
    await s.start((t, f) => texts.push([t, f]), onEnd);
    expect(p.start).toHaveBeenCalledWith({ language: "de-DE", partialResults: true, popup: false, maxResults: 1 });
    listeners.partialResults({ matches: ["Wir streiten oft"] } as never);
    await s.stop();
    expect(texts).toEqual([
      ["Wir streiten oft", false],
      ["Wir streiten oft", true],
    ]);
    expect(onEnd).toHaveBeenCalled();
    expect(Object.keys(listeners)).toHaveLength(0);
  });
  it("asks for permission and reports denial", async () => {
    const { p } = plugin("denied");
    const onEnd = vi.fn();
    await createNativeSpeech(p).start(() => undefined, onEnd);
    expect(onEnd.mock.calls[0][0]).toMatch(/Mikrofon/);
    expect(p.start).not.toHaveBeenCalled();
  });
});
