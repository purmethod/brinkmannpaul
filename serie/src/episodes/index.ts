import React from 'react';
import {Teil01} from './Teil01';
import {Teil02} from './Teil02';
import {Teil03} from './Teil03';

/** Szene je Folge. Folgen ohne Eintrag werden (noch) nicht als Composition registriert. */
export const SCENES: Record<number, React.FC> = {
  1: Teil01,
  2: Teil02,
  3: Teil03,
};
