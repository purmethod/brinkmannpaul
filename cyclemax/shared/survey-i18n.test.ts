import { describe, expect, it } from "vitest";
import { AGE_GROUPS, ANNOYANCES, CURRENT_APPS, PRICES, QUESTION_IDS, SECTIONS } from "./survey";
import { fill, LANG_CODES, LANGS, pickLang, SURVEY_STRINGS } from "./survey-i18n";

describe("survey translations", () => {
  it("has the six languages, Arabic right-to-left", () => {
    expect(LANG_CODES).toEqual(["de", "en", "fr", "es", "ar", "ru"]);
    expect(LANGS.find((l) => l.code === "ar")?.dir).toBe("rtl");
  });

  for (const code of LANG_CODES) {
    it(`${code}: every text is there and filled`, () => {
      const t = SURVEY_STRINGS[code];
      expect(t.inviteTitle.trim() && t.inviteButton.trim()).toBeTruthy();
      expect(t.sections).toHaveLength(SECTIONS.length);
      for (const s of t.sections) expect(s.title && s.intro).toBeTruthy();
      expect(Object.keys(t.questions).sort()).toEqual([...QUESTION_IDS].sort());
      for (const id of QUESTION_IDS) expect(t.questions[id].trim().length).toBeGreaterThan(10);
      expect(t.scale).toHaveLength(4);
      expect(new Set(t.scale).size).toBe(4);
      for (const [keys, labels] of [
        [ANNOYANCES, t.annoyances],
        [CURRENT_APPS, t.apps],
        [PRICES, t.prices],
        [AGE_GROUPS, t.ages],
      ] as const)
        for (const k of keys) expect((labels as Record<string, string>)[k]?.trim()).toBeTruthy();
      expect(t.meta).toContain("{n}");
      expect(t.progress).toContain("{a}");
      expect(t.progress).toContain("{n}");
      for (const v of Object.values(t.errors)) expect(v.trim()).toBeTruthy();
    });
  }

  it("other languages contain no German leftovers (shown texts, not the stored keys)", () => {
    const german = /\b(und|nicht|deine|wichtig|Zyklus|Periode|Antworten|keine)\b/;
    const texts = (v: unknown): string[] => (typeof v === "string" ? [v] : Array.isArray(v) ? v.flatMap(texts) : v && typeof v === "object" ? Object.values(v).flatMap(texts) : []);
    for (const code of LANG_CODES.filter((c) => c !== "de")) for (const s of texts(SURVEY_STRINGS[code])) expect(s).not.toMatch(german);
  });

  it("picks ?lang first, then the browser, else German", () => {
    expect(pickLang("ar", ["en-US"])).toBe("ar");
    expect(pickLang("xx", ["fr-CH", "en"])).toBe("fr");
    expect(pickLang(null, ["ru-RU"])).toBe("ru");
    expect(pickLang(null, ["it-IT", "ja"])).toBe("de");
    expect(fill("{a} von {n}", { a: 3, n: 20 })).toBe("3 von 20");
  });
});
