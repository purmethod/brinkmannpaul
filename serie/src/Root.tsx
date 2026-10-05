import React from 'react';
import {Composition} from 'remotion';
import {CharacterSheet} from './components/CharacterSheet';
import {Episode, EpisodeProps} from './components/Episode';
import {PARTS, partId} from './data/story';
import {SCENES} from './scenes';
import {defaultVoice, partTiming} from './lib/timing';
import {FPS, HEIGHT, WIDTH} from './theme';

/** Eine Composition pro Folge — generiert aus PARTS in src/data/story.ts. */
export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="figuren" component={CharacterSheet} fps={FPS} width={WIDTH} height={HEIGHT} durationInFrames={90} />
    {PARTS.filter((p) => p.scenes.every((s) => SCENES[s])).map((p) => {
      const Comp: React.FC<EpisodeProps> = ({voice, vintage}) => <Episode nr={p.nr} voice={voice} vintage={vintage} scenes={SCENES} />;
      return (
        <Composition
          key={p.nr}
          id={partId(p.nr)}
          component={Comp}
          fps={FPS}
          width={WIDTH}
          height={HEIGHT}
          durationInFrames={partTiming(p.nr).durationInFrames}
          defaultProps={{voice: defaultVoice(), vintage: true}}
          calculateMetadata={({props}) => ({durationInFrames: partTiming(p.nr, props.voice).durationInFrames})}
        />
      );
    })}
  </>
);
