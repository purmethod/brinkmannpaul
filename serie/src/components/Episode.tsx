import React, {createContext, useContext} from 'react';
import {AbsoluteFill, Html5Audio, Sequence, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {EPISODES} from '../data/episodes';
import {lerp} from '../lib/anim';
import {ensureFonts} from '../lib/fonts';
import {AUDIO, EpisodeTiming, episodeTiming, isSpeaking, wordFrame} from '../lib/timing';
import {FPS, HOOK_LEAD} from '../theme';
import {EpisodeBadge} from './EpisodeBadge';
import {Outro} from './Outro';
import {Paper} from './Paper';
import {VintageOverlay} from './VintageOverlay';

ensureFonts();

export type EpisodeProps = {voice: string | null; vintage: boolean};

type Ctx = EpisodeTiming & {
  /** Frame eines Wortes der Erzählung (n-tes Vorkommen). */
  cue: (word: string, occurrence?: number, edge?: 'start' | 'end') => number;
  outroFrame: number;
  endFrame: number;
};

const EpisodeContext = createContext<Ctx | null>(null);

export const useEpisode = () => {
  const c = useContext(EpisodeContext);
  if (!c) throw new Error('useEpisode außerhalb einer Folge');
  return c;
};

const DB_MINUS_18 = Math.pow(10, -18 / 20);

const Soundtrack: React.FC<{t: EpisodeTiming; mood: string}> = ({t, mood}) => {
  const outroFrame = Math.round(t.outroStart * FPS);
  const end = t.durationInFrames;
  const music = AUDIO.music[mood as keyof typeof AUDIO.music];
  const musicVolume = (f: number) => {
    const fadeIn = Math.min(1, f / 8);
    const fadeOut = interpolate(f, [outroFrame - 6, outroFrame + 8], [1, 0.35], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
    const endFade = interpolate(f, [end - 10, end], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
    if (!t.voiceFile) return 0.4 * fadeIn * fadeOut * endFade;
    let speaking = 0;
    for (let d = -6; d <= 6; d++) speaking += isSpeaking(t, f + d) ? 1 : 0;
    return fadeIn * fadeOut * endFade * lerp(0.4, DB_MINUS_18, speaking / 13);
  };
  return (
    <>
      {music ? <Html5Audio src={staticFile(music)} volume={musicVolume} loop /> : null}
      {AUDIO.crackle ? <Html5Audio src={staticFile(AUDIO.crackle)} volume={0.28} loop /> : null}
      {t.voiceFile ? (
        <Sequence from={Math.round(HOOK_LEAD * FPS)}>
          <Html5Audio src={staticFile(t.voiceFile)} />
        </Sequence>
      ) : null}
      {AUDIO.jingle ? (
        <Sequence from={outroFrame}>
          <Html5Audio src={staticFile(AUDIO.jingle)} volume={0.55} />
        </Sequence>
      ) : null}
      {t.outroVoiceFile && t.voice ? (
        <Sequence from={outroFrame + 4}>
          <Html5Audio src={staticFile(t.outroVoiceFile)} />
        </Sequence>
      ) : null}
    </>
  );
};

/**
 * Rahmen jeder Folge: Papier, Szene, Badge "Part X", Outro, Vintage-Overlay und Ton.
 * Die Szene bekommt ihr Timing über useEpisode().
 */
export const Episode: React.FC<{nr: number; voice: string | null; vintage?: boolean; children: React.ReactNode}> = ({
  nr,
  voice,
  vintage = true,
  children,
}) => {
  const ep = EPISODES.find((e) => e.nr === nr)!;
  const t = episodeTiming(nr, voice);
  const ctx: Ctx = {
    ...t,
    cue: (word, occurrence = 0, edge = 'start') => wordFrame(t, word, occurrence, edge),
    outroFrame: Math.round(t.outroStart * FPS),
    endFrame: t.durationInFrames,
  };
  const nextLine = nr >= 35 ? 'Follow to see what happens next' : `Follow for Part ${nr + 1}`;
  return (
    <EpisodeContext.Provider value={ctx}>
      <AbsoluteFill style={{backgroundColor: '#0b0805'}}>
        <VintageOverlay enabled={vintage}>
          <Paper id={`paper-${nr}`} />
          <LingerPush from={Math.round(t.narrationEnd * FPS) - 10} to={ctx.outroFrame}>
            {children}
          </LingerPush>
          <EpisodeBadge nr={nr} />
          <Outro start={ctx.outroFrame} nextLine={nextLine} />
        </VintageOverlay>
        <Soundtrack t={t} mood={ep.mood} />
      </AbsoluteFill>
    </EpisodeContext.Provider>
  );
};

/** Nach der Erzählung: langsame Kamerafahrt in die Szene, damit sie atmet. */
const LingerPush: React.FC<{from: number; to: number; children: React.ReactNode}> = ({from, to, children}) => {
  const frame = useCurrentFrame();
  const t = interpolate(frame, [from, to + 45], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const e = t * t * (3 - 2 * t);
  return <AbsoluteFill style={{transform: `scale(${1 + 0.09 * e})`, transformOrigin: '540px 1000px'}}>{children}</AbsoluteFill>;
};

/** Hilfs-Hook: aktueller Frame + Episode-Kontext. */
export const useScene = () => {
  const frame = useCurrentFrame();
  return {frame, ...useEpisode()};
};
