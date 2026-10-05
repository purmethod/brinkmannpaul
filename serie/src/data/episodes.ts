// EINE Datenquelle für alle 35 Folgen: Nummer, Stimmung, Erzählung (englisch), Bildbeschreibung.
// Wird von den Remotion-Compositions UND vom Audio-Skript (scripts/generate-audio.mjs) gelesen.
// Nur "erasable" TypeScript (Typen + Daten), damit Node es direkt importieren kann.

export type Mood = 'playful' | 'longing' | 'dramatic' | 'festive';

export type Episode = {
  nr: number;
  mood: Mood;
  /** Erzählung — wird wortgetreu gesprochen. */
  narration: string;
  /** Regie: was im Bild passiert. */
  scene: string;
  /** Einzige erlaubte Schriftzüge im Bild (neben Badge + Outro). */
  lettering?: string[];
};

export const OUTRO_LINE = 'To be continued …';
export const OUTRO_SECONDS = 1.5;

export const EPISODES: Episode[] = [
  {nr: 1, mood: 'playful', narration: 'Once upon a time, there was a girl named Karima, full of dreams. She moved to a strange city. But she had a secret …', scene: 'A fairy-tale book opens, "Once upon a time …" writes itself; Karima hops with her suitcase into a doodle town and puts a finger to her lips conspiratorially.', lettering: ['Once upon a time …']},
  {nr: 2, mood: 'playful', narration: 'She had not the slightest sense of direction. And one morning, she got lost … right before the eyes of a stranger.', scene: 'Karima turns the town map around, the alleys knot themselves into a tangle; from the shadows two eyes flash beneath a hat brim.'},
  {nr: 3, mood: 'playful', narration: "His name was Pablo. A wanderer, wild and free, who would never be tied down. 'Where to?' he asked.", scene: 'Pablo strolls into the picture, a flock of birds takes off, a rope on a fence tries to wrap around him, he shakes it off; he tips his hat.'},
  {nr: 4, mood: 'playful', narration: "'To the bakery,' she said. 'There is no bakery here,' he laughed. But she was quite certain …", scene: 'Thought bubbles: hers shows a loaf of bread, his a crossed-out loaf; Karima puts her hands on her hips.'},
  {nr: 5, mood: 'playful', narration: 'And there was one. He walked her to the door. And in parting, they promised each other … carrier pigeons.', scene: 'A bakery appears, Pablo is amazed, Karima triumphs; two white pigeons flutter from their hands.'},
  {nr: 6, mood: 'playful', narration: 'The first pigeon flew. He waited in the pavilion before the castle. And she? She came late.', scene: 'A pigeon with a letter flies over rooftops; Pablo in the pavilion looks at a pocket watch.'},
  {nr: 7, mood: 'playful', narration: 'Three minutes. All out of breath. One hour turned into four. And on the way home, she thought …', scene: 'Karima runs up panting; a walk, the sun races across the sky; shared bread at the inn; the way home, she turns around smiling.'},
  {nr: 8, mood: 'longing', narration: "'He is truly kind.' She cooked for him, he brought strawberries. But a wanderer does not like to stay …", scene: "Little hearts above Karima; a steaming pot, a basket of strawberries; Pablo's boots already point towards the door."},
  {nr: 9, mood: 'longing', narration: 'One day, he moved on. Without a word. He invited her to a feast. But she did not go.', scene: "Pablo's silhouette disappears on the horizon; an invitation with a seal flutters to her, she puts it aside; colours tip to grey-blue."},
  {nr: 10, mood: 'longing', narration: 'Had he ever meant it? Then he came back. Not with words … but with little gestures.', scene: 'Karima at the window in the rain; a knock; Pablo stands outside hiding something behind his back.'},
  {nr: 11, mood: 'longing', narration: 'A book about a little prince. And between its pages: a letter, just for her.', scene: 'A book with a star and a rose on the cover (NO known character), a letter slides out, a paper heart flutters up.'},
  {nr: 12, mood: 'playful', narration: "'For the most beautiful desert flower in the world.' Sunflowers, for no reason at all. And then he showed her a secret …", scene: 'Lettering writes itself; sunflowers sprout in time-lapse; Pablo beckons her mysteriously.', lettering: ['For the most beautiful desert flower in the world']},
  {nr: 13, mood: 'longing', narration: 'The breath of the wild. She grew so light that she fell asleep in his arms.', scene: 'Both sit in the forest, breathing circles pulse around them, Karima floats lightly, falls asleep smiling on his shoulder.'},
  {nr: 14, mood: 'playful', narration: 'One morning, he laid a table for her and danced through the kitchen. A morning that would change everything …', scene: 'A festive table, croissants and cheese dance with little faces, Pablo whirls Karima around; a rosebud at the window opens.'},
  {nr: 15, mood: 'dramatic', narration: 'But Karima wanted more than beautiful moments. She sent a pigeon … with just one sentence.', scene: 'Karima serious at the writing desk, folds a note, the pigeon flies into dark clouds.'},
  {nr: 16, mood: 'dramatic', narration: "'This no longer suits me.' Then thunder rolled between the two. Would the wanderer simply move on?", scene: 'Lettering on the note; lightning, a doodle thundercloud over Pablo, the rose vine grows thorns.', lettering: ['This no longer suits me.']},
  {nr: 17, mood: 'longing', narration: 'They talked. A whole night long. Until the storm passed. And days later … a knock came at her window.', scene: 'Two silhouettes on a bench, the moon wanders, a cloud rains itself into stars; window in blue night, knocking waves.'},
  {nr: 18, mood: 'longing', narration: 'In the middle of a cold night. He kissed her awake and held her tight.', scene: 'Pablo steps in, a kiss on the forehead, an embrace; warm gold pushes away the cold blue.'},
  {nr: 19, mood: 'playful', narration: 'They could talk about anything, without fear of judgement. And at his side walked … a lion.', scene: 'Stars and hearts rise from their mouths; then a night alley, a doodle lion trots beside Pablo.'},
  {nr: 20, mood: 'dramatic', narration: 'Not a real one. But beside him, the world was safe. Until one day, Karima had had enough …', scene: 'The lion winks and vanishes in a puff; Karima walks along calmly; then a "BOOM" doodle explosion, Karima with crossed arms.'},
  {nr: 21, mood: 'longing', narration: 'She did not want to be just anyone. She wanted to be his one. So they sailed across the sea … to Barcelona.', scene: 'Karima points to her heart; a sailing ship on doodle waves, gulls, silhouette of a city with church towers on the horizon.'},
  {nr: 22, mood: 'playful', narration: 'There, everything was ten times more intense. Karima grew brave, playful, free. And the wanderer?', scene: 'Karima runs laughing through alleys pulling him along; kiss under a huge moon; Pablo looks thoughtfully at his bundle.'},
  {nr: 23, mood: 'festive', narration: 'The wanderer, who had never let himself be tied down … stayed.', scene: 'Pablo lays down bundle and walking stick, hat on the hook; a red ribbon knots itself into a heart between them; doodle fireworks.'},
  {nr: 24, mood: 'dramatic', narration: "Then came Karima's great exam. Fear rose like a wave. But every evening …", scene: 'Stacks of books pile up into a wave over Karima; a candle flickers; a door opens.'},
  {nr: 25, mood: 'longing', narration: '… he read her a story. And against his chest, her heart grew calm.', scene: 'Pablo reads, stars rise from the book; two heartbeat lines, hers frantic, his calm, become one line.'},
  {nr: 26, mood: 'dramatic', narration: 'On the day of the exam, it rained. He waited outside, flowers in hand. For hours. And then …', scene: 'Doodle rain, Pablo motionless before a great gate, drops on his hat, a bouquet; a clock spins.'},
  {nr: 27, mood: 'festive', narration: '… the door opened. She ran into his arms. It was their victory. Together.', scene: 'Karima runs with a certificate, embrace, the rain freezes into glitter drops, everything takes on colour; lettering "together" with hearts.', lettering: ['together']},
  {nr: 28, mood: 'playful', narration: 'As a reward, a pigeon came with a plan: tomorrow morning, at the ninth stroke of the bell, a carriage at the city gate.', scene: 'The pigeon lands, a plan unrolls (only doodle symbols: bell, carriage, gate); the tower clock strikes nine.'},
  {nr: 29, mood: 'playful', narration: 'She climbed in, without knowing where to. And who was already sitting inside?', scene: 'Karima with a bag climbs into a carriage; the door opens, Pablo sits there grinning and tips his hat.'},
  {nr: 30, mood: 'longing', narration: 'He took her to the greatest hot springs in the kingdom. There, for the first time, she felt completely free.', scene: 'Steaming springs, Pablo offers his hand, steam fills the picture; a cocoon opens, a colourful butterfly hatches.'},
  {nr: 31, mood: 'playful', narration: 'Hand in hand, they wandered through villages and the great royal city. But the best was yet to come …', scene: 'Colourful village cottages; a great city with a town-hall tower, Pablo rides laughing on a wild-boar statue.'},
  {nr: 32, mood: 'festive', narration: 'The Christmas markets. Glittering lights, mulled wine, snow. And at the very top of the Ferris wheel …', scene: 'Snowfall, strings of lights, steam forms a heart; a Ferris-wheel gondola rises, a kiss at the very top.'},
  {nr: 33, mood: 'longing', narration: 'In the end, Karima wrote him a book. And on the last page, it said …', scene: 'Karima writes at night by candlelight, vines and roses grow from the ink.'},
  {nr: 34, mood: 'festive', narration: "'That was only the beginning of our story. You are my gift, my blessing, my safe haven.'", scene: 'Pages fly and bind themselves into a book; at the end in red: "Я люблю тебя … mhebek".', lettering: ['Я люблю тебя … mhebek']},
  {nr: 35, mood: 'festive', narration: 'And their story? They are still writing it today. Page by page.', scene: 'The book closes, a red ribbon wraps around it; turquoise "To be continued…", small "(inshallah)"; a butterfly flies away. Outro: "Follow to see what happens next".', lettering: ['To be continued…', '(inshallah)']},
];

export const episodeId = (nr: number) => `teil-${String(nr).padStart(2, '0')}`;
