import React from 'react';
import {Teil01} from './Teil01';
import {Teil02} from './Teil02';
import {Teil03} from './Teil03';
import {Teil04} from './Teil04';
import {Teil05} from './Teil05';
import {Teil06} from './Teil06';
import {Teil07} from './Teil07';
import {Teil08} from './Teil08';
import {Teil09} from './Teil09';
import {Teil10} from './Teil10';
import {Teil11} from './Teil11';

/** Szene je Folge. Folgen ohne Eintrag werden (noch) nicht als Composition registriert. */
export const SCENES: Record<number, React.FC> = {
  1: Teil01,
  2: Teil02,
  3: Teil03,
  4: Teil04,
  5: Teil05,
  6: Teil06,
  7: Teil07,
  8: Teil08,
  9: Teil09,
  10: Teil10,
  11: Teil11,
};
