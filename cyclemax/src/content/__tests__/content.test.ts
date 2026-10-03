import { GESTURE_ORDER, PHASE_ORDER } from '@/engine';
import { STRINGS } from '@/i18n/strings';

import { GESTURE_NAMES, GESTURE_PUSH, LANGS, PHASE_PUSH, PHASES, impulseFor, quoteFor } from '..';

const EMOJI = /\p{Extended_Pictographic}/u;
const FORBIDDEN =
  /sex|fruchtbar|fertil|schwanger|pregnan|eisprung|ovulat|verhütung|contracept|rational|denkfähig|logisch/i;

function allTexts(value: unknown): string[] {
  if (typeof value === 'string') return [value];
  if (typeof value === 'function') return [];
  if (Array.isArray(value)) return value.flatMap(allTexts);
  if (value && typeof value === 'object') return Object.values(value).flatMap(allTexts);
  return [];
}

describe('phase content', () => {
  it.each(LANGS)('is complete in %s', (lang) => {
    for (const phase of PHASE_ORDER) {
      const c = PHASES[lang][phase];
      expect(c.name.length).toBeGreaterThan(0);
      expect(c.stance.length).toBeGreaterThan(0);
      expect(c.actions).toHaveLength(3);
      expect(c.quotes.length).toBeGreaterThanOrEqual(1);
      expect(c.impulses).toHaveLength(8);
      expect(new Set(c.impulses).size).toBe(8);
    }
  });

  it('uses the given Marcus Aurelius quotes (German original wording)', () => {
    expect(PHASES.de.ruhe.quotes[0]).toEqual({ text: 'Die Seele nimmt die Farbe deiner Gedanken an.', ref: '5,16' });
    expect(PHASES.de.aufwind.quotes[0]).toEqual({
      text: 'Rede nicht länger darüber, was ein guter Mann ist. Sei einer.',
      ref: '10,16',
    });
    expect(PHASES.de.hochphase.quotes[0]).toEqual({
      text: 'Tu, was vor dir liegt, mit Würde, Zuneigung und ganzer Aufmerksamkeit.',
      ref: '2,5',
    });
    expect(PHASES.de.brandung.quotes.map((q) => q.ref)).toEqual(['4,49', '11,18']);
    expect(PHASES.de.brandung.quotes[0]!.text).toBe(
      'Sei wie der Fels, an dem sich unaufhörlich die Wellen brechen. Er steht fest, und um ihn herum kommt das Wasser zur Ruhe.',
    );
    expect(PHASES.de.brandung.quotes[1]!.text).toBe(
      'Die Folgen unseres Zorns wiegen schwerer als das, was ihn ausgelöst hat.',
    );
  });

  it('never repeats an impulse across phases', () => {
    for (const lang of LANGS) {
      const all = PHASE_ORDER.flatMap((p) => PHASES[lang][p].impulses);
      expect(new Set(all).size).toBe(all.length);
    }
  });

  it('contains no emojis and no fertility, sexual or rationality claims', () => {
    const texts = [...allTexts(PHASES), ...allTexts(PHASE_PUSH), ...allTexts(GESTURE_PUSH), ...allTexts(GESTURE_NAMES)];
    for (const text of texts) {
      expect(text).not.toMatch(EMOJI);
      expect(text).not.toMatch(FORBIDDEN);
    }
    for (const text of allTexts(STRINGS)) expect(text).not.toMatch(EMOJI);
  });

  it('alternates the two Brandung quotes and keeps single quotes fixed', () => {
    expect(quoteFor('de', 'brandung', 1).ref).toBe('4,49');
    expect(quoteFor('de', 'brandung', 2).ref).toBe('11,18');
    expect(quoteFor('de', 'brandung', 3).ref).toBe('4,49');
    expect(quoteFor('de', 'ruhe', 4).ref).toBe('5,16');
  });

  it('rotates impulses day by day and continues across cycles', () => {
    const week = Array.from({ length: 8 }, (_, d) => impulseFor('de', 'hochphase', d + 1, 0, 12));
    expect(new Set(week).size).toBe(8);
    // A 5-day phase: the next cycle starts where the last one stopped.
    const cycle0 = Array.from({ length: 5 }, (_, d) => impulseFor('de', 'brandung', d + 1, 0, 5));
    const cycle1 = Array.from({ length: 5 }, (_, d) => impulseFor('de', 'brandung', d + 1, 1, 5));
    expect(cycle1[0]).not.toBe(cycle0[0]);
    expect(new Set([...cycle0, ...cycle1.slice(0, 3)]).size).toBe(8);
    // Negative cycle indices (dates before the logged start) stay valid.
    expect(PHASES.de.ruhe.impulses).toContain(impulseFor('de', 'ruhe', 1, -3, 5));
  });
});

describe('push and gesture copy', () => {
  it('matches the four phase pushes word for word', () => {
    expect(PHASE_PUSH.de).toEqual({
      ruhe: 'Ihre Periode beginnt. Wärme, Ruhe, kein Druck. Sei einfach da.',
      aufwind: 'Ihre Stimmung steigt. Guter Moment für Pläne und ein Date.',
      hochphase: 'Zeig ihr, dass du sie siehst. Nicht wegen des Kalenders – weil du es willst.',
      brandung: 'Brandung kommt. Sei der Fels. Du musst nicht das letzte Wort haben.',
    });
    expect(GESTURE_PUSH.de).toBe('Nicht weil der Kalender es sagt. Weil du ein Mann bist, der Acht gibt.');
  });

  it('names every gesture in both languages', () => {
    for (const lang of LANGS) {
      for (const g of GESTURE_ORDER) expect(GESTURE_NAMES[lang][g].length).toBeGreaterThan(0);
    }
  });
});
