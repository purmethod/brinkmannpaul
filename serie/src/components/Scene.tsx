import React, {createContext, useContext} from 'react';
import {useCurrentFrame} from 'remotion';
import {Word, wordFrameIn} from '../lib/timing';

type SceneCtx = {
  scene: number;
  /** Wortzeiten relativ zum Szenenstart. */
  words: Word[];
  /** Szenenlänge in Frames (inkl. Umblättern). */
  durationInFrames: number;
};

export const SceneContext = createContext<SceneCtx | null>(null);

/** In einer Szene: lokaler Frame + cue('wort') = Frame, an dem das Wort gesprochen wird. */
export const useScene = () => {
  const frame = useCurrentFrame();
  const c = useContext(SceneContext);
  if (!c) throw new Error('useScene außerhalb einer Szene');
  return {
    frame,
    scene: c.scene,
    durationInFrames: c.durationInFrames,
    cue: (word: string, occurrence = 0, edge: 'start' | 'end' = 'start') => wordFrameIn(c.words, word, occurrence, edge, `Szene ${c.scene}`),
  };
};
