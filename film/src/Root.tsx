import React from 'react';
import {Composition} from 'remotion';
import {Bausteine} from './scenes/Bausteine';
import {TestMaerchen} from './scenes/TestMaerchen';
import {DURATION_FRAMES, FPS, HEIGHT, WIDTH} from './theme';

export const RemotionRoot: React.FC = () => (
  <>
    <Composition
      id="TestMaerchen"
      component={TestMaerchen}
      durationInFrames={DURATION_FRAMES}
      fps={FPS}
      width={WIDTH}
      height={HEIGHT}
      defaultProps={{vintage: true}}
    />
    <Composition id="Bausteine" component={Bausteine} durationInFrames={120} fps={FPS} width={WIDTH} height={HEIGHT} />
  </>
);
