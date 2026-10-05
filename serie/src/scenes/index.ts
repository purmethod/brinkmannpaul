import React from 'react';
import {Szene01} from './Szene01';
import {Szene02} from './Szene02';
import {Szene03} from './Szene03';
import {Szene04} from './Szene04';
import {Szene05} from './Szene05';
import {Szene06} from './Szene06';
import {Szene07} from './Szene07';
import {Szene08} from './Szene08';
import {Szene09} from './Szene09';
import {Szene10} from './Szene10';
import {Szene11} from './Szene11';

/** Szene je Tabellenzeile (story.ts). Eine Folge wird registriert, sobald alle ihre Szenen existieren. */
export const SCENES: Record<number, React.FC> = {
  1: Szene01,
  2: Szene02,
  3: Szene03,
  4: Szene04,
  5: Szene05,
  6: Szene06,
  7: Szene07,
  8: Szene08,
  9: Szene09,
  10: Szene10,
  11: Szene11,
};
