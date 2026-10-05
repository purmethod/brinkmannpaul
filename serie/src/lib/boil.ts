import {useCurrentFrame} from 'remotion';
import {BOIL_EVERY} from '../theme';
import {hashString} from './random';

/**
 * "Boiling lines": deterministischer Seed, der sich alle BOIL_EVERY Frames ändert.
 * Gleiches salt + gleicher Frame => gleiche Linie (renderstabil, auch parallel).
 */
export const boilSeed = (frame: number, salt: string, every = BOIL_EVERY) => {
  const step = Math.floor(frame / every);
  return ((hashString(salt) + step * 7919) % 2147483646) + 1;
};

export const useBoilSeed = (salt: string, every = BOIL_EVERY) => {
  const frame = useCurrentFrame();
  return boilSeed(frame, salt, every);
};
