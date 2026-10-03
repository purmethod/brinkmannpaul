import type { PhaseId } from '@/engine';

import type { Lang } from './types';

export interface Quote {
  text: string;
  /** Book,chapter in Marcus Aurelius' Meditations. */
  ref: string;
}

export interface PhaseContent {
  name: string;
  /** One sentence: the stance for this phase. */
  stance: string;
  /** Max. three concrete actions. */
  actions: readonly [string, string, string];
  quotes: readonly [Quote, ...Quote[]];
  /** Eight short stoic impulses (loyalty, transparency, self-control, calm, listening, standing firm). */
  impulses: readonly [string, string, string, string, string, string, string, string];
}

export const QUOTE_SOURCE: Record<Lang, string> = {
  de: 'frei nach Marc Aurel, Selbstbetrachtungen',
  en: 'loosely after Marcus Aurelius, Meditations',
};

export const PHASES: Record<Lang, Record<PhaseId, PhaseContent>> = {
  de: {
    ruhe: {
      name: 'Ruhe',
      stance: 'Halt geben, Wärme, Ruhe, kein Druck – da sein, ohne viel zu fragen.',
      actions: [
        'Übernimm eine Aufgabe, bevor sie danach fragt.',
        'Biete Wärme an: Tee, Decke, Wärmflasche – ohne Kommentar.',
        'Halte Pläne leicht. Kein Druck, keine Erwartungen.',
      ],
      quotes: [{ text: 'Die Seele nimmt die Farbe deiner Gedanken an.', ref: '5,16' }],
      impulses: [
        'Präsenz braucht keine Worte. Bleib im Raum.',
        'Frag einmal, wie es ihr geht. Dann hör zu, ohne zu reparieren.',
        'Nur wer selbst ruhig ist, kann Ruhe geben.',
        'Loyalität zeigt sich in kleinen Diensten, die niemand sieht.',
        'Geduld ist keine Schwäche. Sie ist Kraft unter Kontrolle.',
        'Sag, was du tust. Und tu, was du sagst.',
        'Nicht jede Stille ist ein Problem. Lass sie stehen.',
        'Erwarte keinen Dank. Tu es, weil es richtig ist.',
      ],
    },
    aufwind: {
      name: 'Aufwind',
      stance: 'Ihre Stimmung steigt – gute Zeit für Pläne, Dates und gemeinsame Projekte.',
      actions: [
        'Plane ein Date für diese Woche – konkret, mit Tag und Uhrzeit.',
        'Sprich ein gemeinsames Projekt an, das liegen geblieben ist.',
        'Schlag etwas Neues vor: ein Ort, ein Kurs, ein Weg.',
      ],
      quotes: [{ text: 'Rede nicht länger darüber, was ein guter Mann ist. Sei einer.', ref: '10,16' }],
      impulses: [
        'Ein Plan zeigt mehr Zuneigung als tausend Vielleicht.',
        'Halte, was du zusagst. Auch das Kleine.',
        'Sag offen, was du vorhast. Offenheit schafft Vertrauen.',
        'Gestalte den Tag, statt ihn geschehen zu lassen.',
        'Frag sie etwas, das du noch nicht über sie weißt.',
        'Mut im Kleinen: Schlag als Erster vor.',
        'Wer zuhört, plant besser. Merk dir, was sie sich wünscht.',
        'Disziplin heute schafft Freiheit für euch beide.',
      ],
    },
    hochphase: {
      name: 'Hochphase',
      stance: 'Sie fühlt sich gut – zeig Aufmerksamkeit, sieh sie, ergreif die Initiative.',
      actions: [
        'Sag ihr konkret, was du an ihr schätzt.',
        'Plane den Abend, statt zu fragen, was sie will.',
        'Leg das Handy weg, wenn sie mit dir spricht.',
      ],
      quotes: [{ text: 'Tu, was vor dir liegt, mit Würde, Zuneigung und ganzer Aufmerksamkeit.', ref: '2,5' }],
      impulses: [
        'Aufmerksamkeit ist die seltenste Form von Respekt.',
        'Sieh genau hin. Was hat sich bei ihr verändert?',
        'Ein ehrliches Kompliment: konkret und ohne Absicht.',
        'Sei ganz da. Halb zuhören ist nicht zuhören.',
        'Initiative ist eine Entscheidung, keine Stimmung.',
        'Loyal ist, wer gut über sie spricht, wenn sie nicht im Raum ist.',
        'Dein Wort gilt. Auch wenn es unbequem wird.',
        'Gute Tage verdienen Aufmerksamkeit, nicht Gewohnheit.',
      ],
    },
    brandung: {
      name: 'Brandung',
      stance: 'Sei der Fels in der Brandung: nichts persönlich nehmen, nicht das letzte Wort haben.',
      actions: [
        'Zuhören. Nicht verteidigen, nicht erklären.',
        'Verschiebe schwere Gespräche um ein paar Tage, wenn es geht.',
        'Nimm ihr etwas ab – still, ohne es anzukündigen.',
      ],
      quotes: [
        {
          text: 'Sei wie der Fels, an dem sich unaufhörlich die Wellen brechen. Er steht fest, und um ihn herum kommt das Wasser zur Ruhe.',
          ref: '4,49',
        },
        { text: 'Die Folgen unseres Zorns wiegen schwerer als das, was ihn ausgelöst hat.', ref: '11,18' },
      ],
      impulses: [
        'Du musst nicht gewinnen. Du musst stehen.',
        'Atme, bevor du antwortest. Die Pause gehört dir.',
        'Ein scharfer Satz ist eine Welle, kein Urteil.',
        'Das letzte Wort ist nichts wert. Der Frieden danach schon.',
        'Hör zu, um zu verstehen – nicht, um zu antworten.',
        'Bleib loyal, gerade wenn es schwer ist.',
        'Ruhe ist ansteckend. Sei die Quelle.',
        'Erklären kannst du dich später. Jetzt reicht: Ich bin da.',
      ],
    },
  },
  en: {
    ruhe: {
      name: 'Rest',
      stance: 'Hold steady: warmth, calm, no pressure – be there without asking much.',
      actions: [
        'Take over a task before she has to ask.',
        'Offer warmth: tea, a blanket, a hot-water bottle – no comment needed.',
        'Keep plans light. No pressure, no expectations.',
      ],
      quotes: [{ text: 'The soul takes on the colour of your thoughts.', ref: '5.16' }],
      impulses: [
        'Presence needs no words. Stay in the room.',
        'Ask once how she is. Then listen without fixing.',
        'Only a calm man can give calm.',
        'Loyalty shows in small services nobody sees.',
        'Patience is not weakness. It is strength under control.',
        'Say what you do. And do what you say.',
        'Not every silence is a problem. Let it be.',
        'Expect no thanks. Do it because it is right.',
      ],
    },
    aufwind: {
      name: 'Rise',
      stance: 'Her mood is rising – a good time for plans, dates and shared projects.',
      actions: [
        'Plan a date for this week – specific, with a day and a time.',
        'Bring up a shared project that has been left lying.',
        'Suggest something new: a place, a class, a route.',
      ],
      quotes: [{ text: 'No more talk about what a good man is. Be one.', ref: '10.16' }],
      impulses: [
        'A plan shows more care than a thousand maybes.',
        'Keep what you promise. Even the small things.',
        'Say openly what you intend. Openness builds trust.',
        'Shape the day instead of letting it happen.',
        'Ask her something you do not know about her yet.',
        'Courage in small things: be the first to suggest.',
        'A man who listens plans better. Remember what she wishes for.',
        'Discipline today creates freedom for you both.',
      ],
    },
    hochphase: {
      name: 'Peak',
      stance: 'She feels good – pay attention, see her, take the initiative.',
      actions: [
        'Tell her specifically what you value about her.',
        'Plan the evening instead of asking what she wants.',
        'Put your phone away when she talks to you.',
      ],
      quotes: [{ text: 'Do what lies before you with dignity, affection and full attention.', ref: '2.5' }],
      impulses: [
        'Attention is the rarest form of respect.',
        'Look closely. What has changed for her?',
        'One honest compliment: specific and without an agenda.',
        'Be fully there. Half listening is not listening.',
        'Initiative is a decision, not a mood.',
        'Loyal is the man who speaks well of her when she is not in the room.',
        'Your word holds. Even when it gets uncomfortable.',
        'Good days deserve attention, not routine.',
      ],
    },
    brandung: {
      name: 'Breakers',
      stance: 'Be the rock in the surf: take nothing personally, let go of the last word.',
      actions: [
        'Listen. Do not defend, do not explain.',
        'Postpone heavy conversations by a few days if you can.',
        'Take something off her plate – quietly, without announcing it.',
      ],
      quotes: [
        {
          text: 'Be like the rock that the waves keep breaking against. It stands firm, and around it the water falls calm.',
          ref: '4.49',
        },
        { text: 'The consequences of our anger weigh more than whatever caused it.', ref: '11.18' },
      ],
      impulses: [
        'You do not have to win. You have to stand.',
        'Breathe before you answer. The pause is yours.',
        'A sharp sentence is a wave, not a verdict.',
        'The last word is worth nothing. The peace afterwards is.',
        'Listen to understand – not to reply.',
        'Stay loyal, especially when it is hard.',
        'Calm is contagious. Be the source.',
        'You can explain yourself later. For now: I am here.',
      ],
    },
  },
};

export function getPhaseContent(lang: Lang, phase: PhaseId): PhaseContent {
  return PHASES[lang][phase];
}

/**
 * Quote for a given day of the phase. Phases with two quotes alternate day by day.
 */
export function quoteFor(lang: Lang, phase: PhaseId, dayInPhase: number): Quote {
  const quotes = PHASES[lang][phase].quotes;
  return quotes[Math.max(0, dayInPhase - 1) % quotes.length]!;
}

/**
 * The impulse of the day. The rotation continues across cycles (cycleIndex), so a phase that recurs
 * every month does not start with the same sentence again.
 */
export function impulseFor(lang: Lang, phase: PhaseId, dayInPhase: number, cycleIndex: number, phaseLength: number): string {
  const impulses = PHASES[lang][phase].impulses;
  const n = impulses.length;
  const offset = cycleIndex * Math.max(1, phaseLength) + Math.max(0, dayInPhase - 1);
  return impulses[((offset % n) + n) % n]!;
}
