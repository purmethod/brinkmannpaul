import React from 'react';
import {AbsoluteFill, Easing, Html5Audio, Sequence, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {PARTS, TIMING} from '../data/story';
import {lerp} from '../lib/anim';
import {ensureFonts} from '../lib/fonts';
import {AUDIO, PartTiming, Segment, isSpeakingIn, partTiming} from '../lib/timing';
import {FPS} from '../theme';
import {EpisodeBadge} from './EpisodeBadge';
import {Outro} from './Outro';
import {PageTurn} from './PageTurn';
import {Paper} from './Paper';
import {SceneContext} from './Scene';
import {VintageOverlay} from './VintageOverlay';

ensureFonts();

export type EpisodeProps = {voice: string | null; vintage: boolean};

const DB_MINUS_18 = Math.pow(10, -18 / 20);
const TURN = Math.round(TIMING.sceneLead * FPS);
const f = (s: number) => Math.round(s * FPS);

const Soundtrack: React.FC<{t: PartTiming}> = ({t}) => {
  const outroFrame = f(t.outroStart);
  const end = t.durationInFrames;
  return (
    <>
      {/* Musik je Szene in ihrer Stimmung, weich überblendet, unter der Stimme geduckt */}
      {t.segments.map((s, i) => {
        const music = AUDIO.music[s.mood as keyof typeof AUDIO.music];
        if (!music) return null;
        const from = Math.max(0, f(s.start) - (i ? 8 : 0));
        const len = f(s.end) - from + (i < t.segments.length - 1 ? 8 : 0);
        return (
          <Sequence key={i} from={from} durationInFrames={len}>
            <Html5Audio
              src={staticFile(music)}
              loop
              volume={(lf: number) => {
                const g = from + lf;
                const xfade = Math.min(1, lf / 12, (len - lf) / 12);
                const outro = interpolate(g, [outroFrame - 6, outroFrame + 8], [1, 0.35], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
                const endFade = interpolate(g, [end - 10, end], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
                let speaking = 0;
                for (let d = -6; d <= 6; d++) speaking += isSpeakingIn(t.words, g + d) ? 1 : 0;
                const duck = t.voice ? lerp(0.4, DB_MINUS_18, speaking / 13) : 0.4;
                return Math.max(0, xfade) * outro * endFade * duck;
              }}
            />
          </Sequence>
        );
      })}
      {AUDIO.crackle ? <Html5Audio src={staticFile(AUDIO.crackle)} volume={0.28} loop /> : null}
      {t.segments.map((s, i) =>
        s.voiceFile ? (
          <Sequence key={`v${i}`} from={f(s.voiceStart)}>
            <Html5Audio src={staticFile(s.voiceFile)} />
          </Sequence>
        ) : null,
      )}
      {AUDIO.jingle ? (
        <Sequence from={outroFrame}>
          <Html5Audio src={staticFile(AUDIO.jingle)} volume={0.55} />
        </Sequence>
      ) : null}
      {t.outroVoiceFile ? (
        <Sequence from={outroFrame + 4}>
          <Html5Audio src={staticFile(t.outroVoiceFile)} />
        </Sequence>
      ) : null}
    </>
  );
};

/** Eine Szene in ihrem eigenen Zeitfenster (lokale Frames, eigene Wortzeiten). */
const SceneSlot: React.FC<{seg: Segment; Scene: React.FC; extra: number}> = ({seg, Scene, extra}) => {
  const len = f(seg.end) - f(seg.start) + extra;
  return (
    <Sequence from={f(seg.start)} durationInFrames={len}>
      <SceneContext.Provider value={{scene: seg.scene, words: seg.localWords, durationInFrames: len}}>
        <Scene />
      </SceneContext.Provider>
    </Sequence>
  );
};

/** Szenenfolge mit Umblättern: die alte Seite schlägt um, darunter beginnt die neue Szene. */
const Scenes: React.FC<{t: PartTiming; scenes: Record<number, React.FC>}> = ({t, scenes}) => {
  const frame = useCurrentFrame();
  const segs = t.segments;
  const slot = (i: number) => {
    const Scene = scenes[segs[i].scene];
    return Scene ? <SceneSlot seg={segs[i]} Scene={Scene} extra={i < segs.length - 1 ? TURN : 0} /> : null;
  };
  // aktive Szene / laufendes Umblättern bestimmen
  for (let i = 1; i < segs.length; i++) {
    const b = f(segs[i].start);
    if (frame >= b && frame < b + TURN) {
      const p = interpolate(frame, [b, b + TURN], [0, 1], {easing: Easing.inOut(Easing.cubic)});
      return (
        <PageTurn
          progress={p}
          from={
            <AbsoluteFill>
              <Paper id={`turn-from-${i}`} />
              {slot(i - 1)}
            </AbsoluteFill>
          }
          to={
            <AbsoluteFill>
              <Paper id={`turn-to-${i}`} />
              {slot(i)}
            </AbsoluteFill>
          }
        />
      );
    }
  }
  let active = 0;
  for (let i = 0; i < segs.length; i++) if (frame >= f(segs[i].start)) active = i;
  return (
    <AbsoluteFill>
      <Paper id={`paper-${active}`} />
      {slot(active)}
    </AbsoluteFill>
  );
};

/** Nach der Erzählung: langsame Kamerafahrt in die Szene, damit sie atmet. */
const LingerPush: React.FC<{from: number; to: number; children: React.ReactNode}> = ({from, to, children}) => {
  const frame = useCurrentFrame();
  const t = interpolate(frame, [from, to + 45], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const e = t * t * (3 - 2 * t);
  return <AbsoluteFill style={{transform: `scale(${1 + 0.09 * e})`, transformOrigin: '540px 1000px'}}>{children}</AbsoluteFill>;
};

/**
 * Rahmen einer Folge: Szenen (mit Umblättern), Badge "Part X", Outro, Vintage-Overlay, Ton.
 */
export const Episode: React.FC<{nr: number; voice: string | null; vintage?: boolean; scenes: Record<number, React.FC>}> = ({
  nr,
  voice,
  vintage = true,
  scenes,
}) => {
  const t = partTiming(nr, voice);
  const last = nr >= PARTS[PARTS.length - 1].nr;
  const nextLine = last ? 'Follow to see what happens next' : `Follow for Part ${nr + 1}`;
  const outroFrame = f(t.outroStart);
  return (
    <AbsoluteFill style={{backgroundColor: '#0b0805'}}>
      <VintageOverlay enabled={vintage}>
        <LingerPush from={f(t.narrationEnd) - 10} to={outroFrame}>
          <Scenes t={t} scenes={scenes} />
        </LingerPush>
        <EpisodeBadge nr={nr} />
        <Outro start={outroFrame} nextLine={nextLine} />
      </VintageOverlay>
      <Soundtrack t={t} />
    </AbsoluteFill>
  );
};
