// Farbwelt: altes Buntstift-Kolorit auf vergilbtem Papier.
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
  hair: '#2E1F18',
} as const;

export const FPS = 30;
export const WIDTH = 1080;
export const HEIGHT = 1080;
export const DURATION_FRAMES = 15 * FPS;

/** Linien "kochen": alle N Frames neu zeichnen. */
export const BOIL_EVERY = 4;
