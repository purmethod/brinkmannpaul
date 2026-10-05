// Farbwelt der Serie: altes Buntstift-Kolorit auf vergilbtem Papier.
export const palette = {
  rosa: '#E8A0A8',
  senf: '#D9A93B',
  rosenrot: '#C0392B',
  salbei: '#8FA67A',
  paper: '#EFE3C6',
  paperDark: '#E2D1A8',
  ink: '#2A1C14',
  inkSoft: '#5A4232',
  wood: '#7A4E2C',
  woodDark: '#4E301A',
  skin: '#F6DCC4',
  skinPablo: '#E9C4A0',
  hair: '#2E1F18',
  coat: '#8A6A4A',
  nightBlue: '#5F7590',
  turquoise: '#3FA7A0',
  white: '#FBF6EA',
} as const;

export const FPS = 30;
export const WIDTH = 1080;
export const HEIGHT = 1920;

/** Linien "kochen": alle N Frames neu zeichnen. */
export const BOIL_EVERY = 4;

/** Zeitraster jeder Folge (Sekunden). */
export const HOOK_LEAD = 0.3; // Stimme setzt nach 0,3 s ein — Bewegung ab Frame 0
export const TAIL = 0.4; // Luft nach der Erzählung
