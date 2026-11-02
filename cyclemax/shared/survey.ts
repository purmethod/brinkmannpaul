// Survey at cyclemax.app/questions: what women want from a cycle app that works like a weather forecast.
// One catalog for the page and the server. Question ids are stable – never reuse an id for a different question.

export const SURVEY_VERSION = "2026-11";

/** Rating scale, stored as 1–4. */
export const SCALE = ["unwichtig", "wichtig", "sehr wichtig", "ultra wichtig"] as const;

export interface SurveyQuestion {
  id: string;
  text: string;
}
export interface SurveySection {
  title: string;
  intro: string;
  questions: SurveyQuestion[];
}

export const SECTIONS: SurveySection[] = [
  {
    title: "Dein Kalender",
    intro: "Wie wichtig ist dir …",
    questions: [
      { id: "one_tap", text: "Mit einem Tipp eintragen, dass deine Periode beginnt – fertig." },
      { id: "forecast_period", text: "Eine verlässliche Vorhersage, wann deine nächste Periode kommt." },
      { id: "reminder", text: "Eine Erinnerung 1–2 Tage bevor deine Periode beginnt." },
      { id: "phase_glance", text: "Auf einen Blick sehen, in welcher Phase du gerade bist – als Farbe statt Zahlen." },
      { id: "log_symptoms", text: "Symptome und Stimmung in Sekunden festhalten (z. B. Krämpfe, Energie, Laune)." },
      { id: "contraception", text: "Die App versteht, wenn du hormonell verhütest (Pille, Hormonspirale)." },
    ],
  },
  {
    title: "Deine Tagesvorhersage",
    intro: "Wie ein Wetterbericht für deinen Körper – wie wichtig ist dir …",
    questions: [
      { id: "daily_tip", text: "Jeden Morgen ein Satz: wie du dich heute vermutlich fühlst – und was dir hilft." },
      { id: "food_macros", text: "Essen passend zur Phase: heute eher mehr Kohlenhydrate oder mehr Eiweiß." },
      { id: "food_avoid", text: "Was du heute besser weglässt (z. B. Alkohol, Koffein, Salz, Zucker)." },
      { id: "training", text: "Training passend zur Phase: heute Kraft, heute eher locker." },
      { id: "heat_cold", text: "Sauna, Eisbad, kalte Dusche: wann ja – und wann lieber nicht." },
      { id: "sleep", text: "Schlaf und Erholung: was dir hilft, besonders vor deiner Periode." },
      { id: "pain_pms", text: "Was bei Regelschmerzen und PMS wirklich hilft." },
      { id: "supplements", text: "Nahrungsergänzung (z. B. Eisen, Magnesium) – nur wenn sinnvoll, mit Schadstoff-Check." },
      { id: "clean_products", text: "Periodenprodukte ohne Schadstoffe finden (Mikroplastik, Schwermetalle)." },
    ],
  },
  {
    title: "Vertrauen und Einfachheit",
    intro: "Und wie wichtig ist dir …",
    questions: [
      { id: "science", text: "Jeder Tipp ist wissenschaftlich belegt – mit Quelle, keine Trends." },
      { id: "privacy", text: "Deine Daten bleiben auf deinem Handy – kein Konto nötig." },
      { id: "no_ads", text: "Keine Werbung und keine Verkaufstricks in der App." },
      { id: "partner", text: "Deinen Partner verbinden, damit er weiß, wo du stehst – nur wenn du willst." },
      { id: "ten_seconds", text: "Höchstens 10 Sekunden am Tag: öffnen, lesen, fertig." },
    ],
  },
];

export const QUESTIONS: SurveyQuestion[] = SECTIONS.flatMap((s) => s.questions);
export const QUESTION_IDS = QUESTIONS.map((q) => q.id);

export const ANNOYANCES = [
  "zu kompliziert",
  "zu viele Benachrichtigungen",
  "Werbung oder Abo-Druck",
  "Vorhersagen stimmen nicht",
  "nur Zahlen, keine echten Tipps",
  "Sorge um meine Daten",
  "zu verspielt",
  "dreht sich nur um Kinderwunsch",
  "ich nutze keine App",
] as const;

export const CURRENT_APPS = ["Apple Health", "Flo", "Clue", "Natural Cycles", "Kalender / Notizen", "andere", "keine"] as const;
export const AGE_GROUPS = ["unter 20", "20-29", "30-39", "40-49", "50+"] as const;
export const PRICES = ["nur kostenlos", "bis 3 € im Monat", "bis 5 € im Monat", "bis 10 € im Monat", "mehr als 10 €"] as const;

export const WISH_MAX = 3000;

export interface SurveyAnswer {
  consent: true;
  version: string;
  /** language she answered in (see shared/survey-i18n.ts) */
  lang: string;
  /** question id → 1 (unwichtig) … 4 (ultra wichtig) */
  ratings: Record<string, number>;
  annoyances: string[];
  currentApp: string | null;
  ageGroup: string | null;
  price: string | null;
  wish: string;
  voice: boolean;
}
