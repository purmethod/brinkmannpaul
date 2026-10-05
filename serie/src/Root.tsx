import React from 'react';
import {Composition} from 'remotion';
import {CharacterSheet} from './components/CharacterSheet';
import {Episode, EpisodeProps} from './components/Episode';
import {EPISODES, episodeId} from './data/episodes';
import {SCENES} from './episodes';
import {defaultVoice, episodeTiming} from './lib/timing';
import {FPS, HEIGHT, WIDTH} from './theme';

/** Eine Composition pro Folge — generiert aus src/data/episodes.ts. */
export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="figuren" component={CharacterSheet} fps={FPS} width={WIDTH} height={HEIGHT} durationInFrames={90} />
    {EPISODES.filter((e) => SCENES[e.nr]).map((e) => {
      const Scene = SCENES[e.nr];
      const Comp: React.FC<EpisodeProps> = ({voice, vintage}) => (
        <Episode nr={e.nr} voice={voice} vintage={vintage}>
          <Scene />
        </Episode>
      );
      return (
        <Composition
          key={e.nr}
          id={episodeId(e.nr)}
          component={Comp}
          fps={FPS}
          width={WIDTH}
          height={HEIGHT}
          durationInFrames={episodeTiming(e.nr).durationInFrames}
          defaultProps={{voice: defaultVoice(), vintage: true}}
          calculateMetadata={({props}) => ({durationInFrames: episodeTiming(e.nr, props.voice).durationInFrames})}
        />
      );
    })}
  </>
);
