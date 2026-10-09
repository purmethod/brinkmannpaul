import { describe, expect, it } from "vitest";
import { headsUp, isPhasePushKey, pushUrl } from "./texts";

describe("texts", () => {
  it("heads-up: 'morgen' lower-case mid-sentence, capitalised at the start", () => {
    expect(headsUp("red", 1)).toBe("Hey Man, morgen beginnt Standfest. Mehr beobachten, mehr zuhören, Ruhe trainieren.");
    expect(headsUp("green", 2)).toBe("Übermorgen beginnt Nähe. Gute Tage für Gespräche, die anstehen.");
  });
  it("push keys and deep links", () => {
    expect(isPhasePushKey("checkin")).toBe(true);
    expect(isPhasePushKey("s-abc")).toBe(false);
    expect(isPhasePushKey("toString")).toBe(false);
    expect(pushUrl("checkin")).toBe("/profil/");
    expect(pushUrl("red7")).toBe("/heute/");
  });
});
