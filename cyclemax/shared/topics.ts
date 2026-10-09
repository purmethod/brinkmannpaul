// Anonymous topic keyword for a chat request. Only this keyword is stored server-side.

const TOPICS: [string, RegExp][] = [
  ["Gewalt/Krise", /gew[äa]lt|bedroh|suizid|selbstmord|schl[äa]gt|geschlagen/i],
  ["Streit", /streit|gestritten|zoff|schrei|geschrien|lauter|vorw[üu]rf|eskal/i],
  ["Wut", /wut|w[üu]tend|sauer|aggress|ausgerastet|ausrasten/i],
  ["Eifersucht", /eifers[üu]cht|eifers[üu]chtig|ex[- ]?freund|fremdgeh/i],
  ["Vertrauen", /vertrau|gelogen|l[üu]ge|betrug|betrogen/i],
  ["Grenzen", /grenze|respekt|nein sagen|respektlos/i],
  ["erstes Date", /erste[sn]? date|erstes treffen|\bdate\b|kennengelernt|ansprechen|tinder|hinge|bumble/i],
  ["Trennung", /trennung|schluss gemacht|verlassen|getrennt|scheidung/i],
  ["Familie", /kind|kinder|familie|hochzeit|heirat|schwanger|eltern/i],
  ["Nähe", /n[äa]he|kuscheln|distanz|zur[üu]ckgezogen|kalt zu mir/i],
  ["Kommunikation", /antworten|reden|gespr[äa]ch|schreiben|nachricht|sagen/i],
];

export function topicOf(text: string): string {
  for (const [topic, re] of TOPICS) if (re.test(text)) return topic;
  return "Sonstiges";
}
