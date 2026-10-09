// Detects violence / threats / self-harm in a chat message. Used server-side and offline.

const PATTERNS = [
  /suizid|selbstmord|umbringen|mich (?:zu )?t[öo]ten|nicht mehr leben|leben beenden|ritzen|selbstverletz/i,
  /schl[äa]gt mich|geschlagen|gew[äa]lt|bedroh|droht mir|drohung|verletzt mich|w[üu]rgt/i,
  /ich (?:schlag|töte|bring) (?:sie|ihn)|sie (?:schlagen|umbringen)|ihr wehtun|ausrasten und zuschlagen/i,
];

export function needsHelp(text: string): boolean {
  return PATTERNS.some((p) => p.test(text));
}

export const HELP_TEXT =
  "Das braucht professionelle Hilfe – jetzt, nicht später. Akute Gefahr: Notruf 112 oder Polizei 110. " +
  "TelefonSeelsorge (24/7, anonym): 0800 111 0 111, 0800 111 0 222 oder 116 123. " +
  "Hilfetelefon Gewalt an Männern: 0800 123 99 00. Hilfetelefon Gewalt gegen Frauen: 116 016.";
