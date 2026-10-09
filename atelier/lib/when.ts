/**
 * Spoken time → a local "YYYY-MM-DDTHH:MM" (german + english).
 * "morgen um 18 uhr", "freitag abend", "in 2 stunden", "post it now", "halb sieben", "tomorrow 6pm".
 * Pure and dependency-free: runs in the browser while the creator is still talking.
 */

export interface When {
  /** local time the post goes out, or null when nothing was said about time */
  at: string | null;
  /** "jetzt / sofort / now" */
  now: boolean;
  /** what was said, without the time words */
  rest: string;
}

const WORDS: Record<string, number> = {
  ein: 1, eins: 1, eine: 1, einer: 1, einem: 1, one: 1, a: 1, an: 1,
  zwei: 2, two: 2, drei: 3, three: 3, vier: 4, four: 4, funf: 5, five: 5, sechs: 6, six: 6,
  sieben: 7, seven: 7, acht: 8, eight: 8, neun: 9, nine: 9, zehn: 10, ten: 10, elf: 11, eleven: 11, zwolf: 12, twelve: 12,
};
const HOUR_WORD = '(\\d{1,2}|eins|ein|zwei|drei|vier|funf|sechs|sieben|acht|neun|zehn|elf|zwolf|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)';
const COUNT_WORD = '(\\d{1,3}|einer|einem|eine|ein|zwei|drei|vier|funf|sechs|sieben|acht|neun|zehn|a|an|one|two|three|four|five|six|seven|eight|nine|ten)';
const num = (s: string) => (/^\d+$/.test(s) ? Number(s) : (WORDS[s] ?? NaN));

const WEEKDAYS: [RegExp, number][] = [
  [/sonntag|sunday/, 0],
  [/montag|monday/, 1],
  [/dienstag|tuesday/, 2],
  [/mittwoch|wednesday/, 3],
  [/donnerstag|thursday/, 4],
  [/freitag|friday/, 5],
  [/samstag|sonnabend|saturday/, 6],
];
const MONTHS = ['jan', 'feb', 'mar', 'apr', 'ma[iy]', 'jun', 'jul', 'aug', 'sep', 'o[ck]t', 'nov', 'de[cz]'];
const MONTH = `(${MONTHS.map((m) => `${m}[a-z]*`).join('|')})`;

type Part = 'morning' | 'late-morning' | 'noon' | 'afternoon' | 'evening' | 'night';
const PART_TIME: Record<Part, string> = {
  morning: '08:00',
  'late-morning': '10:00',
  noon: '12:00',
  afternoon: '15:00',
  evening: '19:00',
  night: '21:00',
};
const PARTS: [RegExp, Part][] = [
  [/\b(?:fruh|morgens|in the morning|this morning|morning)\b/, 'morning'],
  [/\bvormittags?\b/, 'late-morning'],
  [/\b(?:mittags?|noon|lunchtime|zu mittag)\b/, 'noon'],
  [/\b(?:nachmittags?|afternoon|this afternoon|in the afternoon)\b/, 'afternoon'],
  [/\b(?:abends?|evening|this evening|in the evening|tonight)\b/, 'evening'],
  [/\b(?:nachts|in der nacht|at night)\b/, 'night'],
];

// "am" is german for "on": "um 5 am freitag" is not 5 a.m.
const MERIDIEM = 'pm|p\\.m\\.|a\\.m\\.|am(?!\\s+(?:sonntag|montag|dienstag|mittwoch|donnerstag|freitag|samstag|sonnabend|wochenende|abend|morgen|mittag|nachmittag|vormittag|\\d))';
// "um 5" is a time only when nothing but time words follow ("um 5 kilo" is not)
const TIME_END = '(?=\\s*(?:$|[,.!?;]|und\\b|and\\b|posten|poste\\b|post\\b|raus|online|heute|morgen|today|tomorrow|abends?|morgens|fruh|nachmittags?|vormittags?|nachts|in the|tonight|on\\b|am\\b|this\\b|o.clock))';

const pad = (n: number) => String(n).padStart(2, '0');

function addDays(date: string, days: number) {
  const d = new Date(`${date}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}
function addMinutes(local: string, minutes: number) {
  const d = new Date(`${local}:00Z`);
  d.setUTCMinutes(d.getUTCMinutes() + minutes);
  return d.toISOString().slice(0, 16);
}

/**
 * @param text what the creator said
 * @param now the creator's local now, "YYYY-MM-DDTHH:MM"
 * @param fallback the time used when only a day was named (the next free slot), "YYYY-MM-DDTHH:MM"
 */
export function parseWhen(text: string, now: string, fallback?: string): When {
  // umlauts folded 1:1, so indices still point into the original text (\b only knows ascii)
  const low = text.toLowerCase().replace(/[äöüß]/g, (c) => ({ ä: 'a', ö: 'o', ü: 'u', ß: 's' })[c]!);
  const spans: [number, number][] = [];
  const take = (re: RegExp): RegExpExecArray | null => {
    const m = re.exec(low);
    if (m && !spans.some(([a, b]) => m.index < b && m.index + m[0].length > a)) {
      spans.push([m.index, m.index + m[0].length]);
      return m;
    }
    return null;
  };
  // a word that turned out not to be about time stays in the text
  const untake = (m: RegExpExecArray | null) => {
    const i = m ? spans.findIndex(([a]) => a === m.index) : -1;
    if (i >= 0) spans.splice(i, 1);
  };
  const today = now.slice(0, 10);

  let isNow = false;
  let at: string | null = null;

  // 1. now
  if (
    take(/\b(?:sofort|gleich jetzt|direkt jetzt|right now|right away|immediately|asap)\b/) ||
    take(/\b(?:jetzt|now)\s+(?:posten|poste|post|raus|online|hochladen|veroffentlichen|teilen|share)\b/) ||
    take(/\b(?:posten?|poste|post|veroffentliche|teile|share|lade)\s+(?:(?:es|das|it|this|ihn|sie)\s+)?(?:jetzt|now)\b/) ||
    take(/^\s*(?:jetzt|now)\s*[.!]?\s*$/)
  ) {
    isNow = true;
    at = now;
  }

  // 2. relative: "in 2 stunden", "in einer halben stunde", "in 20 min"
  if (!at) {
    const half = take(/\bin\s+(?:einer\s+halben\s+stunde|half\s+an\s+hour)\b/);
    const rel = half ? null : take(new RegExp(`\\bin\\s+${COUNT_WORD}\\s*(stunden?|std\\.?|hours?|hrs?|h|minuten?|min\\.?|minutes?|mins?)(?![a-z])`));
    if (half) at = addMinutes(now, 30);
    else if (rel) {
      const n = num(rel[1]);
      if (n > 0) at = addMinutes(now, /^(?:stu|std|hou|hr|h$)/.test(rel[2]) ? n * 60 : n);
    }
  }

  if (!at) {
    // 3. day
    let date: string | null = null;
    let part: Part | null = null;
    let todayWord: RegExpExecArray | null = null;
    // "heute abend", "tonight", "this morning" name a time on their own; a bare "morning" or "abends" may be content
    const strong = take(/\b(?:heute\s+(?:fruh|morgen|vormittag|mittag|nachmittag|abend|nacht)|tonight|this\s+(?:morning|afternoon|evening))\b/);
    if (strong) {
      date = today;
      const w = strong[0];
      part = /abend|evening|tonight/.test(w) ? 'evening' : /nacht/.test(w) ? 'night' : /nachmittag|afternoon/.test(w) ? 'afternoon' : /vormittag/.test(w) ? 'late-morning' : /mittag/.test(w) ? 'noon' : 'morning';
    } else if (take(/\b(?:ubermorgen|day after tomorrow)\b/)) date = addDays(today, 2);
    else if (take(/(?<!guten\s|am\s|jeden\s|good\s)\b(?:morgen|tomorrow)\b/)) date = addDays(today, 1);
    else if ((todayWord = take(/\b(?:heute|today)\b/))) date = today;

    if (!date) {
      const wd = take(/\b(?:(?:am|on|next|nachsten|nachster|kommenden)\s+)?(sonntag|montag|dienstag|mittwoch|donnerstag|freitag|samstag|sonnabend|sunday|monday|tuesday|wednesday|thursday|friday|saturday)\b/);
      if (wd) {
        const target = WEEKDAYS.find(([re]) => re.test(wd[1]))![1];
        const current = new Date(`${today}T12:00:00Z`).getUTCDay();
        date = addDays(today, (target - current + 7) % 7 || 7);
      }
    }
    if (!date) {
      // "am 12.10.", "12. oktober", "october 12"
      const dm =
        take(/\b(?:am|den|on)\s+(\d{1,2})\.(\d{1,2})\.?(?!\d)/) ??
        take(/\b(\d{1,2})\.(\d{1,2})\.(?!\d)/) ??
        take(new RegExp(`\\b(?:am\\s+|den\\s+|on\\s+)?(\\d{1,2})\\.?\\s+${MONTH}\\b`)) ??
        take(new RegExp(`\\b(?:on\\s+)?${MONTH}\\s+(\\d{1,2})(?:st|nd|rd|th)?\\b`));
      if (dm) {
        let day: number, month: number;
        if (/^\d+$/.test(dm[2])) [day, month] = [Number(dm[1]), Number(dm[2])];
        else if (/^\d+$/.test(dm[1])) [day, month] = [Number(dm[1]), monthIndex(dm[2]) + 1];
        else [day, month] = [Number(dm[2]), monthIndex(dm[1]) + 1];
        if (day >= 1 && day <= 31 && month >= 1 && month <= 12) {
          let year = Number(today.slice(0, 4));
          if (`${year}-${pad(month)}-${pad(day)}` < today) year++;
          date = `${year}-${pad(month)}-${pad(day)}`;
        }
      }
    }

    // 4. part of the day
    let partWord: RegExpExecArray | null = null;
    if (!part) {
      for (const [re, p] of PARTS) {
        if ((partWord = take(re))) {
          part = p;
          break;
        }
      }
    }

    // 5. clock time
    let hour: number | null = null;
    let minute = 0;
    let meridiem: string | undefined;
    const halb = take(new RegExp(`\\b(?:um\\s+|gegen\\s+)?halb\\s+${HOUR_WORD}\\b`));
    if (halb) {
      hour = (num(halb[1]) + 23) % 24;
      minute = 30;
    } else {
      const m =
        take(new RegExp(`\\b(?:(?:um|at|gegen|ab)\\s+)?(\\d{1,2}):(\\d{2})\\s*(uhr|h|${MERIDIEM})?(?![\\d])`)) ??
        take(new RegExp(`\\b(?:um|at|gegen|ab)\\s+(\\d{1,2})\\.(\\d{2})\\s*(uhr|h|${MERIDIEM})?(?![\\d.])`)) ??
        take(new RegExp(`\\b(\\d{1,2})\\.(\\d{2})\\s*(uhr|h)(?![a-z])`)) ??
        take(new RegExp(`\\b(?:(?:um|at|gegen|ab)\\s+)?${HOUR_WORD}\\s*uhr(?:\\s+(\\d{1,2})(?!\\s*[a-z]))?`)) ??
        take(new RegExp(`\\b(?:um|at|gegen|ab)\\s+${HOUR_WORD}(?:\\s*(${MERIDIEM}))?${TIME_END}`)) ??
        take(new RegExp(`\\b(\\d{1,2})\\s*(${MERIDIEM})`));
      if (m) {
        hour = num(m[1]);
        const second = m[2];
        if (second && /^\d+$/.test(second)) minute = Number(second);
        meridiem = [m[2], m[3]].find((x) => x && /^[ap]\.?m\.?$/.test(x));
        if (Number.isNaN(hour) || hour > 23 || minute > 59) hour = null;
      }
    }
    if (hour !== null) {
      const pm = meridiem?.startsWith('p') || part === 'afternoon' || part === 'evening' || part === 'night';
      if (hour < 12 && pm) hour += 12;
      else if (meridiem?.startsWith('a') && hour === 12) hour = 0;
      else if (!meridiem && !part && hour >= 1 && hour <= 6) hour += 12; // "um 6" means the evening, not dawn
    }

    // a bare "morning" or "abends" without a day or clock is content ("my morning routine")
    if (part && partWord && hour === null && !date) {
      untake(partWord);
      part = null;
    }
    const time = hour !== null ? `${pad(hour)}:${pad(minute)}` : part ? PART_TIME[part] : null;
    // "heute gab es brot" is no time; "heute um 18 uhr" is
    if (todayWord && !time) {
      untake(todayWord);
      date = null;
    }
    if (date || time) {
      const t = time ?? fallback?.slice(11, 16) ?? '18:00';
      let d = date ?? today;
      // a bare time that already passed today means tomorrow
      if (!date && `${d}T${t}` <= now) d = addDays(d, 1);
      at = `${d}T${t}`;
    }
  }

  return { at, now: isNow, rest: at ? stripSpans(text, spans) : text.trim() };
}

function monthIndex(word: string) {
  return MONTHS.findIndex((m) => new RegExp(`^${m}`).test(word));
}

/** removes the time words and the leftover "post it" around them */
function stripSpans(text: string, spans: [number, number][]) {
  let out = text;
  for (const [a, b] of [...spans].sort((x, y) => y[0] - x[0])) out = `${out.slice(0, a)} ${out.slice(b)}`;
  const verb = '(?:und\\s+|and\\s+)?(?:bitte\\s+|please\\s+)?(?:poste?n?|post|veroffentliche\\w*|teile|share|lade|schick\\w*)(?:\\s+(?:es|das|ihn|sie|it|this|hoch|up|raus|out))*';
  out = out
    .replace(new RegExp(`[,;:\\s]*${verb}[\\s.!]*$`, 'i'), '')
    .replace(new RegExp(`^\\s*${verb}[\\s,.:!]*`, 'i'), '')
    .replace(/\s+([,.!?;:])/g, '$1')
    .replace(/([,;:])(?=\s*[,.!?;:]|\s*$)/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
  return out;
}
