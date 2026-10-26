// Short #5, versions "cinema" and "hybrid".
// Cinema: a Schwarzschild black hole lensing the real Milky Way (ESO panorama),
// ray-traced per pixel by tools/lens_render.py — approach, Einstein ring,
// photon ring, the shadow swallowing the view, the shrinking sky behind you.
// Hybrid: the same shots for the moments you *feel*, the 3Blue1Brown-style
// diagrams (HorizonMath) for the moments that *explain*. No captions.
import {AbsoluteFill, Audio, OffthreadVideo, Sequence, interpolate, staticFile, useVideoConfig} from 'remotion';
import {useSeconds} from '../../lib/map';
import {KUFI} from '../../lib/arabic';
import {SfxTrack, type Cue} from '../../lib/sfx';
import {DURATION} from './scene';
import {C, MathLayer} from './HorizonMath';

export {DURATION};
const FADE = 0.5;

type Shot = {from: number; to: number; clip?: string; math?: boolean};

const CINEMA: Shot[] = [
  {from: 0, to: 7.76, clip: 'approach_close'},
  {from: 7.76, to: 12.74, clip: 'wide'},
  {from: 12.74, to: 24.38, clip: 'fall_in'},
  {from: 24.38, to: 26.48, clip: 'orbit'},
  {from: 26.48, to: 41.86, clip: 'last_light'},
  {from: 41.86, to: 49.64, clip: 'look_back'},
  {from: 49.64, to: 54.12, clip: 'photon_ring'},
  {from: 54.12, to: DURATION, clip: 'final'},
];

const HYBRID: Shot[] = [
  {from: 0, to: 7.76, clip: 'approach_close'},
  {from: 7.76, to: 12.74, clip: 'wide'},
  {from: 12.74, to: 26.48, math: true}, // funnel + field equations
  {from: 26.48, to: 30.4, clip: 'last_light'},
  {from: 30.4, to: 41.86, math: true}, // light cones, light in / nothing out
  {from: 41.86, to: 49.64, clip: 'look_back'},
  {from: 49.64, to: 54.12, math: true}, // v ≤ c
  {from: 54.12, to: DURATION, clip: 'final'},
];

const ShotView: React.FC<{s: Shot; t: number; first: boolean; last: boolean}> = ({s, t, first, last}) => {
  const {fps} = useVideoConfig();
  const end = last ? s.to : s.to + FADE;
  if (t < s.from || t > end) return null;
  const opacity = (first ? 1 : interpolate(t, [s.from, s.from + FADE], [0, 1], {extrapolateRight: 'clamp'})) * (last ? 1 - interpolate(t, [s.to - 0.8, s.to], [0, 1], {extrapolateLeft: 'clamp'}) : 1);
  return (
    <AbsoluteFill style={{opacity}}>
      {s.math ? (
        <AbsoluteFill style={{background: C.bg}}>
          <MathLayer t={t} />
        </AbsoluteFill>
      ) : (
        <Sequence from={Math.round(s.from * fps)} layout="none">
          <OffthreadVideo src={staticFile(`horizon/lens/${s.clip}.mp4`)} muted style={{width: '100%', height: '100%'}} />
        </Sequence>
      )}
    </AbsoluteFill>
  );
};

const Hook: React.FC<{t: number}> = ({t}) => {
  const o = 1 - interpolate(t, [3.0, 3.5], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  if (o <= 0) return null;
  return (
    <div style={{position: 'absolute', left: 60, right: 60, top: 300, textAlign: 'center', direction: 'rtl', opacity: o, fontFamily: KUFI, fontWeight: 800, fontSize: 82, color: '#F2EFE8', textShadow: '0 4px 30px rgba(0,0,0,0.9)'}}>
      عدّيت… ومحسّتش؟
    </div>
  );
};

const SFX: Cue[] = [
  [7.02, 'impact', 0.3],
  [29.74, 'impact', 0.35],
  [40.32, 'impact', 0.3],
];

const Edit: React.FC<{shots: Shot[]}> = ({shots}) => {
  const t = useSeconds();
  const {fps} = useVideoConfig();
  return (
    <AbsoluteFill style={{background: '#000'}}>
      {shots.map((s, i) => (
        <ShotView key={i} s={s} t={t} first={i === 0} last={i === shots.length - 1} />
      ))}
      <Hook t={t} />
      <Audio src={staticFile('horizon/vo.wav')} />
      <Audio
        src={staticFile('horizon/drone.wav')}
        volume={(f) => 0.5 * (1 - interpolate(f / fps, [23.1, 23.4, 24.2, 24.6], [0, 1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}) * 0.85)}
      />
      <SfxTrack cues={SFX} />
    </AbsoluteFill>
  );
};

export const HorizonCinema: React.FC = () => <Edit shots={CINEMA} />;
export const HorizonHybrid: React.FC = () => <Edit shots={HYBRID} />;
