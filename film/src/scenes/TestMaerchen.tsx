import React from 'react';
import {AbsoluteFill, Easing, Html5Audio, Sequence, interpolate, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {blinkAt, Kenza, KENZA_HEAD} from '../components/characters/Kenza';
import {PaperTexture} from '../components/effects/PaperTexture';
import {VintageFilm} from '../components/effects/VintageFilm';
import {Butterfly} from '../components/props/Butterfly';
import {DreamStars} from '../components/props/DreamStars';
import {QuestionMark, Sparkle} from '../components/props/Sparkle';
import {Rough} from '../components/rough/Rough';
import {Book, RIGHT_PAGE, WoodTable} from '../components/scenery/Book';
import {House, HouseProps} from '../components/scenery/House';
import {Lane} from '../components/scenery/Lane';
import {Cloud} from '../components/scenery/Cloud';
import {Lantern} from '../components/scenery/Lantern';
import {Rose, Vine} from '../components/scenery/Vines';
import {OrnateTitle} from '../components/text/OrnateTitle';
import {IrisWipe, irisRadius} from '../components/transitions/IrisWipe';
import {lerp, overshoot, progress} from '../lib/anim';
import {ensureFonts} from '../lib/fonts';
import {noise1} from '../lib/random';
import {AUDIO, CUES, isSpeaking, VOICE_OFFSET_FRAMES} from '../narration/narration';
import {DURATION_FRAMES, palette} from '../theme';

ensureFonts();

export type TestMaerchenProps = {
  /** Vintage-Filmeffekte an/aus. */
  vintage: boolean;
};

// ---------------------------------------------------------------------------
// Szene 1: Buch auf dem Tisch
// ---------------------------------------------------------------------------

const BookScene: React.FC = () => {
  const frame = useCurrentFrame();
  const open = progress(frame, 10, 46, Easing.out(Easing.back(1.2)));
  const write = progress(frame, CUES.titleStart, CUES.titleEnd, Easing.inOut(Easing.sin));
  const flourish = progress(frame, CUES.titleEnd - 4, CUES.titleEnd + 14);
  const vines = progress(frame, 30, 92, Easing.out(Easing.quad));
  const {x, y, w, h} = RIGHT_PAGE;

  const leftX = x - w;
  const leftPage = (
    <g>
      {/* Gedruckte Vignette auf der linken Seite (Rosen, Ranken, Schmetterling) */}
      <Rough shape={{kind: 'ellipse', cx: leftX + w / 2, cy: y + h * 0.42, w: 250, h: 300}} salt="lp-frame" strokeWidth={2.4} stroke={palette.inkSoft} />
      <Rough shape={{kind: 'ellipse', cx: leftX + w / 2, cy: y + h * 0.42, w: 264, h: 314}} salt="lp-frame2" strokeWidth={1.4} stroke={palette.inkSoft} />
      <Vine points={[[leftX + 120, y + 380], [leftX + 150, y + 300], [leftX + 190, y + 250], [leftX + 230, y + 200]]} grow={vines} id="lp-v1" leaves={4} />
      <Vine points={[[leftX + 280, y + 390], [leftX + 260, y + 320], [leftX + 270, y + 260], [leftX + 300, y + 230]]} grow={vines} id="lp-v2" leaves={3} />
      <Rose x={leftX + 200} y={y + 330} size={1.3} bloom={vines} salt="lp-rose" />
      <Butterfly x={leftX + 250} y={y + 150} size={0.75} rotation={-15} id="lp-bfly" />
      <Rough shape={{kind: 'line', x1: leftX + 110, y1: y + h - 80, x2: leftX + w - 110, y2: y + h - 80}} salt="lp-line" strokeWidth={1.6} stroke={palette.inkSoft} />
    </g>
  );

  return (
    <AbsoluteFill>
      <svg width={1080} height={1080}>
        <WoodTable />
        <Book open={open} leftPage={leftPage}>
          <OrnateTitle
            lines={[
              {text: 'Es war', x: x + 62, y: y + 150, size: 100},
              {text: 'einmal …', x: x + 92, y: y + 262, size: 100},
            ]}
            write={write}
            flourish={flourish}
          />
          {/* Ranken wachsen am Seitenrand */}
          <Vine points={[[x + 26, y + h - 20], [x + 44, y + h * 0.82], [x + 22, y + h * 0.66], [x + 46, y + h * 0.5], [x + 24, y + h * 0.34], [x + 48, y + h * 0.18], [x + 90, y + 34]]} grow={vines} id="rp-v1" leaves={9} />
          <Vine points={[[x + w - 20, y + h - 26], [x + w * 0.78, y + h - 44], [x + w * 0.6, y + h - 22], [x + w * 0.42, y + h - 46], [x + w * 0.26, y + h - 30]]} grow={vines} id="rp-v2" leaves={6} />
          <Butterfly x={x + w * 0.62} y={y + h * 0.6} size={0.9} rotation={12} id="rp-bfly" />
          <Vine points={[[x + w - 24, y + 30], [x + w - 34, y + 120], [x + w - 22, y + 210]]} grow={progress(frame, 50, 96)} id="rp-v3" leaves={3} />
        </Book>
      </svg>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// Szene 2–4: Welt in der Buchseite
// ---------------------------------------------------------------------------

const GROUND = 905;
const KENZA_SCALE = 1.22;

type HouseDef = Omit<HouseProps, 'draw' | 'face' | 'lean' | 'whisper' | 'lookX'> & {
  delay: number;
  leanTo: number;
  depth: number;
};

const HOUSES: HouseDef[] = [
  // hintere Reihe
  {id: 'h-b1', x: 455, y: 655, w: 96, h: 150, skew: -8, color: palette.rosa, roofColor: palette.salbei, delay: 0, leanTo: 4, depth: 0},
  {id: 'h-b2', x: 625, y: 650, w: 104, h: 172, skew: 12, color: palette.senf, roofColor: palette.rosenrot, delay: 4, leanTo: -4, depth: 0},
  // mittlere Reihe
  {id: 'h-m1', x: 318, y: 770, w: 150, h: 230, skew: 18, color: palette.paperDark, roofColor: palette.senf, delay: 8, leanTo: 7, depth: 1},
  {id: 'h-m2', x: 776, y: 772, w: 156, h: 214, skew: -20, color: palette.salbei, roofColor: palette.rosenrot, delay: 12, leanTo: -7, depth: 1},
  // vorne, groß
  {id: 'h-f1', x: 118, y: 985, w: 236, h: 380, skew: 34, color: palette.senf, roofColor: palette.rosenrot, delay: 16, leanTo: 9, depth: 2},
  {id: 'h-f2', x: 972, y: 985, w: 240, h: 400, skew: -36, color: palette.rosa, roofColor: palette.salbei, delay: 20, leanTo: -9, depth: 2},
];

/** Fensterposition (Weltkoordinaten) eines Hauses, inkl. Neigung. */
const windowPos = (hd: HouseDef, lean: number, side: number) => {
  const wx = (side === 0 ? -hd.w * 0.22 : hd.w * 0.2) + (hd.skew ?? 0) * 0.66;
  const wy = -hd.h * 0.66;
  const a = (lean * Math.PI) / 180;
  return {x: hd.x + wx * Math.cos(a) - wy * Math.sin(a), y: hd.y + wx * Math.sin(a) + wy * Math.cos(a)};
};

const kenzaX = (frame: number) => {
  const walkIn = progress(frame, CUES.girl + 4, CUES.girl + 96, Easing.out(Easing.quad));
  const follow = progress(frame, 386, 450, Easing.in(Easing.quad));
  return lerp(-170, 540, walkIn) + follow * 70;
};

const worldScale = (frame: number) =>
  lerp(1.32, 1, progress(frame, CUES.city - 4, CUES.city + 46, Easing.inOut(Easing.cubic))) +
  0.07 * progress(frame, CUES.city + 50, 450, Easing.inOut(Easing.sin));
const WORLD_PIVOT = {x: 540, y: 700};
const toScreen = (p: {x: number; y: number}, s: number) => ({
  x: WORLD_PIVOT.x + (p.x - WORLD_PIVOT.x) * s,
  y: WORLD_PIVOT.y + (p.y - WORLD_PIVOT.y) * s,
});

const kenzaHead = (frame: number) => ({
  x: kenzaX(frame) + KENZA_HEAD.x * KENZA_SCALE,
  y: GROUND + KENZA_HEAD.y * KENZA_SCALE,
});

const butterflyPos = (frame: number) => {
  const t = progress(frame, CUES.faces + 34, 452, (x) => x);
  return {
    x: lerp(-60, 1000, t),
    y: 470 - Math.sin(t * Math.PI) * 120 + Math.sin(frame * 0.21) * 26,
    rot: Math.sin(frame * 0.21 + 1) * 18,
  };
};

const WhisperGlyphs: React.FC<{leans: number[]}> = ({leans}) => {
  const frame = useCurrentFrame();
  const head = kenzaHead(frame);
  const start = CUES.faces + 18;
  const glyphs: React.ReactNode[] = [];
  const total = 22;
  for (let i = 0; i < total; i++) {
    // dichter getaktet Richtung "flüstern"
    const u = i / (total - 1);
    const born = Math.round(lerp(start, CUES.whisper + 6, Math.pow(u, 0.8)));
    const life = 54;
    const t = (frame - born) / life;
    if (t <= 0 || t >= 1) continue;
    const hi = i % HOUSES.length;
    const hd = HOUSES[hi];
    const from = windowPos(hd, leans[hi], i % 2);
    const side = from.x < head.x ? -1 : 1;
    const to = {x: head.x + side * (90 + (i % 3) * 30), y: head.y - 90 + ((i * 37) % 120) - 40};
    const e = Easing.out(Easing.quad)(t);
    const x = lerp(from.x, to.x, e) + Math.sin(t * 9 + i) * 16;
    const y = lerp(from.y, to.y, e) - Math.sin(t * Math.PI) * 80;
    const fade = t < 0.15 ? t / 0.15 : t > 0.75 ? (1 - t) / 0.25 : 1;
    const size = 26 + (i % 3) * 7;
    glyphs.push(
      <g key={i} opacity={fade}>
        {i % 3 === 1 ? (
          <Sparkle x={x} y={y} size={size} rotation={frame * 4 + i * 30} color={[palette.senf, palette.rosa, palette.salbei][i % 3]} salt={`wg-${i}`} />
        ) : (
          <QuestionMark x={x} y={y} size={size + 6} rotation={Math.sin(frame * 0.2 + i) * 20} color={i % 2 ? palette.ink : palette.rosenrot} salt={`wq-${i}`} />
        )}
      </g>,
    );
  }
  return <g>{glyphs}</g>;
};

const World: React.FC = () => {
  const frame = useCurrentFrame();
  const s = worldScale(frame);

  // Kenza-Zustand
  const kx = kenzaX(frame);
  const walkingIn = frame >= CUES.girl + 4 && frame < CUES.girl + 92;
  const following = frame >= 388;
  const walking = walkingIn || following;
  const walkCycle = walkingIn ? (frame - CUES.girl) / 17 : (frame - 388) / 20;
  const cityOn = frame >= CUES.city + 6;
  const bfly = butterflyPos(frame);
  const bflyOn = frame >= CUES.faces + 34;

  let expression: 'happy' | 'wonder' | 'curious' = 'happy';
  if (cityOn && frame < CUES.faces + 40) expression = 'wonder';
  if (bflyOn && frame >= CUES.faces + 44) expression = 'curious';
  if (frame > 432) expression = 'happy';

  let lookX = 0.55;
  let lookY = 0;
  if (cityOn && !bflyOn) {
    lookX = Math.sin((frame - CUES.city) * 0.07) * 0.9;
    lookY = -0.5;
  }
  if (bflyOn) {
    const head = kenzaHead(frame);
    const dx = bfly.x - head.x;
    const dy = bfly.y - head.y;
    const len = Math.hypot(dx, dy) || 1;
    lookX = Math.max(-1, Math.min(1, (dx / len) * 1.1));
    lookY = Math.max(-1, Math.min(1, (dy / len) * 1.1));
  }
  const pose = walking ? 'walk' : cityOn && frame < CUES.faces + 40 ? 'wonder' : 'stand';
  const blink = blinkAt(frame, [CUES.girl + 104, CUES.dreams + 40, CUES.city + 70, CUES.faces + 20, 438], 7);
  const headTilt = cityOn && !bflyOn ? Math.sin((frame - CUES.city) * 0.07) * 7 : bflyOn ? -6 : 0;

  // Häuser
  const faceT = progress(frame, CUES.faces, CUES.faces + 26, Easing.out(Easing.quad));
  const leanT = progress(frame, CUES.faces + 8, CUES.faces + 40, (t) => overshoot(t, 1.4));
  const leans = HOUSES.map((h, i) => h.leanTo * leanT + (leanT > 0 ? noise1(frame * 0.05, i) * 1.5 * leanT : 0));
  const whisper = frame >= CUES.faces + 20 && frame < CUES.whisper + 24 ? 1 : 0;

  // Dreams
  const dreamsIn = progress(frame, CUES.dreams - 10, CUES.dreams + 20);
  const dreamsOut = 1 - progress(frame, CUES.city, CUES.city + 20);

  const headScreen = kenzaHead(frame);

  return (
    <AbsoluteFill>
      <PaperTexture id="world-paper" />
      <AbsoluteFill style={{transform: `scale(${s})`, transformOrigin: `${WORLD_PIVOT.x}px ${WORLD_PIVOT.y}px`}}>
        <svg width={1080} height={1080}>
          {/* Hügel am Horizont */}
          <Rough
            shape={{kind: 'path', d: 'M-20,700 C120,600 260,610 380,680 C470,620 600,600 720,670 C840,610 980,620 1100,690 L1100,720 L-20,720 Z'}}
            salt="hills"
            base={palette.paper}
            fill={palette.salbei}
            hachureGap={9}
            hachureAngle={-30}
            fillWeight={1.2}
            strokeWidth={2}
            stroke={palette.inkSoft}
            opacity={0.85}
          />
          {/* Blumen und Grasbüschel am Wegrand */}
          {[90, 230, 330, 760, 880, 1000].map((fx, i) => (
            <g key={i}>
              <Rough shape={{kind: 'path', d: `M${fx},${GROUND + 6} q-4,-22 -12,-30 M${fx},${GROUND + 6} q2,-26 6,-34 M${fx},${GROUND + 6} q6,-18 16,-24`}} salt={`grass${i}`} stroke={palette.inkSoft} strokeWidth={1.8} />
              {i % 2 === 0 ? <Rose x={fx + 4} y={GROUND - 34} size={0.7} salt={`flower${i}`} /> : null}
            </g>
          ))}
          {/* Boden */}
          <Rough shape={{kind: 'curve', points: [[-20, GROUND + 8], [300, GROUND - 4], [700, GROUND + 6], [1100, GROUND - 2]]}} salt="ground" strokeWidth={2.6} />
          <Rough
            shape={{kind: 'polygon', points: [[-20, GROUND + 10], [1100, GROUND], [1100, 1100], [-20, 1100]]}}
            salt="ground-fill"
            stroke="transparent"
            fill={palette.salbei}
            hachureGap={10}
            hachureAngle={-20}
            fillWeight={1.4}
            opacity={0.6}
          />
          {/* Stadt zeichnet sich auf */}
          <Lane draw={progress(frame, CUES.city, CUES.city + 50)} />
          {HOUSES.map((h, i) => (
            <House
              key={h.id}
              {...h}
              draw={progress(frame, CUES.city + h.delay, CUES.city + h.delay + 44, Easing.out(Easing.quad))}
              face={faceT}
              lean={leans[i]}
              whisper={whisper}
              lookX={Math.max(-1, Math.min(1, (kx - h.x) / 300))}
            />
          ))}
          <Lantern id="lan-1" x={404} y={818} h={236} bend={-22} lean={leans[2] * 0.5} draw={progress(frame, CUES.unknown, CUES.unknown + 30)} />
          <Lantern id="lan-2" x={676} y={818} h={228} bend={22} lean={leans[3] * 0.5} draw={progress(frame, CUES.unknown + 8, CUES.unknown + 38)} />
          {/* Kritzel-Wolken */}
          <Cloud x={190} y={190} scale={1.1} drift={frame} draw={progress(frame, CUES.city + 20, CUES.city + 60)} id="cl-1" />
          <Cloud x={600} y={120} scale={0.8} drift={frame * 0.7} draw={progress(frame, CUES.city + 30, CUES.city + 70)} id="cl-2" />
          <Cloud x={420} y={300} scale={0.6} drift={frame * 1.2} draw={progress(frame, CUES.city + 40, CUES.city + 80)} id="cl-3" />
          {/* Mond-Kritzel am Himmel */}
          <Rough
            shape={{kind: 'path', d: 'M900,150 C860,170 860,240 905,260 C870,262 835,230 840,195 C845,160 875,145 900,150 Z'}}
            salt="moon"
            fill={palette.senf}
            wash={palette.senf}
            washOpacity={0.4}
            hachureGap={4}
            strokeWidth={2.4}
            draw={progress(frame, CUES.unknown + 10, CUES.unknown + 40)}
          />

          {/* Kenza */}
          <g transform={`translate(${kx},${GROUND}) scale(${KENZA_SCALE})`}>
            <Kenza
              pose={pose}
              expression={expression}
              blink={blink}
              walkCycle={walkCycle}
              withSuitcase
              lookX={lookX}
              lookY={lookY}
              headTilt={headTilt}
            />
          </g>
          {dreamsIn * dreamsOut > 0 ? (
            <g opacity={dreamsOut}>
              <DreamStars cx={headScreen.x} cy={headScreen.y - 30} radius={175} appear={dreamsIn} count={8} size={1.9} />
            </g>
          ) : null}

          <WhisperGlyphs leans={leans} />
          {bflyOn ? <Butterfly x={bfly.x} y={bfly.y} rotation={bfly.rot + 20} size={1.1} id="bfly-main" /> : null}
        </svg>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// Ton
// ---------------------------------------------------------------------------

const DB_MINUS_18 = Math.pow(10, -18 / 20); // ≈ 0.126

const Soundtrack: React.FC = () => {
  const {fps} = useVideoConfig();
  const hasVoice = Boolean(AUDIO.voice);
  const musicVolume = (f: number) => {
    const fade = Math.min(1, f / (fps * 0.6), (DURATION_FRAMES - f) / (fps * 0.8));
    if (!hasVoice) return 0.42 * Math.max(0, fade);
    // weiches Ducking: Anteil sprechender Frames in einem kleinen Fenster
    let speaking = 0;
    for (let d = -6; d <= 6; d++) speaking += isSpeaking(f + d) ? 1 : 0;
    const k = speaking / 13;
    return Math.max(0, fade) * lerp(0.4, DB_MINUS_18, k);
  };
  return (
    <>
      {AUDIO.music ? <Html5Audio src={staticFile(AUDIO.music)} volume={musicVolume} /> : null}
      {AUDIO.sfx ? <Html5Audio src={staticFile(AUDIO.sfx)} volume={0.32} loop /> : null}
      {AUDIO.voice ? (
        <Sequence from={VOICE_OFFSET_FRAMES}>
          <Html5Audio src={staticFile(AUDIO.voice)} volume={1} />
        </Sequence>
      ) : null}
    </>
  );
};

// ---------------------------------------------------------------------------
// Komposition
// ---------------------------------------------------------------------------

export const TestMaerchen: React.FC<TestMaerchenProps> = ({vintage}) => {
  const frame = useCurrentFrame();
  const {width, height} = useVideoConfig();

  // Kamerafahrt in die rechte Buchseite
  const zoomStart = CUES.girl - 14;
  const zoom = progress(frame, zoomStart, zoomStart + 30, Easing.in(Easing.cubic));
  const target = {x: RIGHT_PAGE.x + RIGHT_PAGE.w * 0.55, y: RIGHT_PAGE.y + RIGHT_PAGE.h * 0.62};
  const bookScale = interpolate(zoom, [0, 1], [1, 5.2]);
  const bookTx = (540 - target.x) * zoom;
  const bookTy = (540 - target.y) * zoom;
  const worldIn = progress(frame, zoomStart + 14, zoomStart + 30);

  // Iris: öffnet am Anfang, schließt am Ende auf Kenzas Gesicht
  const irisOpen = progress(frame, 0, 26, Easing.out(Easing.cubic));
  const irisClose = progress(frame, CUES.irisClose, 447, Easing.in(Easing.cubic));
  const s = worldScale(frame);
  const head = toScreen(kenzaHead(frame), s);
  const irisCenter = frame < 200 ? {x: 540, y: 540} : {x: head.x, y: head.y + 10};
  const irisR = frame < 200 ? irisRadius(irisOpen, width, height) : lerp(irisRadius(1, width, height), 0, irisClose);

  return (
    <AbsoluteFill style={{backgroundColor: '#0b0805'}}>
      <VintageFilm enabled={vintage}>
        {worldIn < 1 ? (
          <AbsoluteFill
            style={{
              transform: `translate(${bookTx}px,${bookTy}px) scale(${bookScale})`,
              transformOrigin: `${target.x}px ${target.y}px`,
            }}
          >
            <BookScene />
          </AbsoluteFill>
        ) : null}
        {worldIn > 0 ? (
          <AbsoluteFill style={{opacity: worldIn, transform: `scale(${lerp(0.82, 1, worldIn)})`}}>
            <World />
          </AbsoluteFill>
        ) : null}
        <IrisWipe cx={irisCenter.x} cy={irisCenter.y} radius={irisR} />
      </VintageFilm>
      <Soundtrack />
    </AbsoluteFill>
  );
};
