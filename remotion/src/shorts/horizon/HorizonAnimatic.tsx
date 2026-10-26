// Short #5, version 4 — animatic. Real NASA simulations and photos redrawn as
// pencil and charcoal (tools/animatic.py: 12 drawings/s, line boil, each panel
// draws itself on). One panel per sentence, 0.5 s dissolves, slow camera
// pushes, an astronaut (NASA photo, redrawn) falling in. No captions.
import {AbsoluteFill, Audio, Img, OffthreadVideo, Sequence, interpolate, staticFile, useVideoConfig} from 'remotion';
import {ramp, useSeconds} from '../../lib/map';
import {RUQAA} from '../../lib/arabic';
import {SfxTrack, type Cue} from '../../lib/sfx';
import {DURATION} from './scene';

export {DURATION};
const FADE = 0.5;
const GRAPHITE = '#2a2b2e';

type Panel = {from: number; to: number; clip: string; z: [number, number]; focus?: string};

// Panels start on sentence boundaries from words.json.
const PANELS: Panel[] = [
  {from: 0, to: 7.76, clip: 'disk_hook', z: [1.45, 1.6], focus: '50% 47%'}, // you can cross… and never come back
  {from: 7.76, to: 12.74, clip: 'disk_face', z: [1.3, 1.45], focus: '50% 47%'}, // if it's huge, far from the hot gas
  {from: 12.74, to: 24.38, clip: 'plunge_in', z: [1.0, 1.08]}, // the horizon: a boundary, no surface
  {from: 24.38, to: 26.48, clip: 'einstein', z: [1.0, 1.06], focus: '50% 35%'}, // general relativity
  {from: 26.48, to: 41.86, clip: 'plunge_cross', z: [1.0, 1.08]}, // inside, light can't get out
  {from: 41.86, to: 49.64, clip: 'inside_hold', z: [1.0, 1.06]}, // the sky is still there; no message gets out
  {from: 49.64, to: 54.12, clip: 'flyby_ring', z: [1.0, 1.05]}, // nothing outruns light
  {from: 54.12, to: DURATION, clip: 'disk_end', z: [1.45, 9], focus: '50% 43%'}, // how fast would you need to go?
];

const PanelView: React.FC<{p: Panel; t: number; first: boolean; last: boolean}> = ({p, t, first, last}) => {
  const {fps} = useVideoConfig();
  const end = last ? p.to : p.to + FADE;
  if (t < p.from || t > end) return null;
  const k = (t - p.from) / (end - p.from);
  const z = last ? p.z[0] * Math.pow(p.z[1] / p.z[0], k * k * k) : p.z[0] + (p.z[1] - p.z[0]) * k;
  const opacity = first ? 1 : ramp(t, p.from, p.from + FADE, (x) => x);
  return (
    <AbsoluteFill style={{opacity, transform: `scale(${z})`, transformOrigin: p.focus ?? '50% 50%', mixBlendMode: 'multiply'}}>
      <Sequence from={Math.round(p.from * fps)} layout="none">
        <OffthreadVideo src={staticFile(`horizon/animatic/${p.clip}.mp4`)} muted style={{width: '100%', height: '100%'}} />
      </Sequence>
    </AbsoluteFill>
  );
};

// The astronaut: paper-white suit (so it reads over the charcoal) + pencil lines.
const Astronaut: React.FC<{x: number; y: number; w: number; rot: number; opacity?: number}> = ({x, y, w, rot, opacity = 1}) => (
  <div style={{position: 'absolute', left: x - w / 2, top: y - w / 2, width: w, transform: `rotate(${rot}deg)`, opacity}}>
    <Img src={staticFile('horizon/animatic/astronaut_fill.png')} style={{position: 'absolute', width: '100%', opacity: 0.92}} />
    <Img src={staticFile('horizon/animatic/astronaut.png')} style={{position: 'relative', width: '100%'}} />
  </div>
);

// Frame-0 hook line in pencil handwriting; gone before the first sentence ends.
const Hook: React.FC<{t: number}> = ({t}) => {
  const o = 1 - ramp(t, 3.0, 3.5, (x) => x);
  if (o <= 0) return null;
  return (
    <div style={{position: 'absolute', left: 60, right: 60, top: 290, textAlign: 'center', direction: 'rtl', opacity: o * 0.9, fontFamily: RUQAA, fontWeight: 700, fontSize: 96, color: GRAPHITE, transform: 'rotate(-2deg)'}}>
      عدّيت… ومحسّتش؟
    </div>
  );
};

const SFX: Cue[] = [
  [0.05, 'pencil', 0.3],
  [7.02, 'impact', 0.3],
  ...PANELS.slice(1).map((p) => [p.from + 0.05, 'pencil', 0.32] as Cue),
  [29.74, 'impact', 0.35],
];

export const HorizonAnimatic: React.FC = () => {
  const t = useSeconds();
  const {fps} = useVideoConfig();
  // Hook: drifts down onto the shadow, crossing its edge on "عديت" (3.1 s) and sinking in.
  const hookY = interpolate(t, [0, 3.1, 7.9], [560, 820, 905], {extrapolateRight: 'clamp'});
  return (
    <AbsoluteFill style={{backgroundColor: '#EDE6D6', backgroundImage: `url(${staticFile('horizon/paper.jpg')})`, backgroundSize: 'cover'}}>
      {PANELS.map((p, i) => (
        <PanelView key={i} p={p} t={t} first={i === 0} last={i === PANELS.length - 1} />
      ))}
      {t < 8.3 && <Astronaut x={560} y={hookY} w={interpolate(t, [0, 7.9], [180, 120])} rot={-18 + t * 4} opacity={1 - ramp(t, 7.76, 8.26, (x) => x)} />}
      {t > 41.86 && t < 50.2 && (
        <Astronaut x={560} y={interpolate(t, [41.86, 50.14], [1020, 1080])} w={230} rot={-25 + (t - 41.86) * 2} opacity={ramp(t, 42.3, 42.9, (x) => x) * (1 - ramp(t, 49.64, 50.14, (x) => x))} />
      )}
      <Hook t={t} />
      {/* soft edge darkening, like a scanned page */}
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 48%, rgba(0,0,0,0) 60%, rgba(60,45,30,0.22) 100%)', pointerEvents: 'none'}} />
      <Audio src={staticFile('horizon/vo.wav')} />
      <Audio
        src={staticFile('horizon/drone.wav')}
        volume={(f) => 0.4 * (1 - interpolate(f / fps, [23.1, 23.4, 24.2, 24.6], [0, 1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}) * 0.85)}
      />
      <SfxTrack cues={SFX} />
    </AbsoluteFill>
  );
};
