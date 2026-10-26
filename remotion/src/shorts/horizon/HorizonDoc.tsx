// Short #5, version 3 (after feedback: "drawings and jumpy cuts look amateur,
// captions are bad"). Documentary edit on real NASA simulations + real photos:
// one shot per sentence, soft 0.5 s crossfades only at sentence ends, slow
// continuous camera moves, no captions, no drawings.
// Clips: tools/horizon_clips.py (NASA Goddard SVS 14576 and 13326).
import {AbsoluteFill, Audio, Img, OffthreadVideo, Sequence, interpolate, staticFile, useVideoConfig} from 'remotion';
import {ramp, useSeconds} from '../../lib/map';
import {KUFI} from '../../lib/arabic';
import {SfxTrack, type Cue} from '../../lib/sfx';
import {DURATION} from './scene';

export {DURATION};
const FADE = 0.5;

type Shot = {from: number; to: number; clip?: string; still?: string; z: [number, number]; y?: number; focus?: string};

// Each shot starts on a sentence boundary from words.json and overlaps the next by FADE.
const SHOTS: Shot[] = [
  {from: 0, to: 7.76, clip: 'disk_hook', z: [1.0, 1.14]}, // you can cross… and can't come back
  {from: 7.76, to: 10.46, still: 'art/m87.jpg', z: [1.15, 1.35]}, // if the hole is huge
  {from: 10.46, to: 12.74, clip: 'disk_face', z: [1.0, 1.06]}, // …and far from the hot gas
  {from: 12.74, to: 24.38, clip: 'plunge_in', z: [1.0, 1.08]}, // the horizon: a boundary, no surface
  {from: 24.38, to: 26.48, still: 'art/einstein.jpg', z: [1.05, 1.14], focus: '50% 30%'}, // general relativity
  {from: 26.48, to: 41.86, clip: 'plunge_cross', z: [1.0, 1.1]}, // inside, light can't get out
  {from: 41.86, to: 49.64, clip: 'inside_sky', z: [1.0, 1.06]}, // the sky doesn't vanish
  {from: 49.64, to: 54.12, clip: 'flyby_ring', z: [1.0, 1.05]}, // nothing outruns light
  {from: 54.12, to: DURATION, clip: 'disk_end', z: [1.0, 7], focus: '50% 41%'}, // how fast would you need to go?
];

const ShotView: React.FC<{s: Shot; t: number; first: boolean; last: boolean}> = ({s, t, first, last}) => {
  const {fps} = useVideoConfig();
  const end = last ? s.to : s.to + FADE;
  if (t < s.from || t > end) return null;
  const k = (t - s.from) / (end - s.from);
  // Last shot eases into the black shadow; the rest drift at constant speed.
  const z = last ? s.z[0] * Math.pow(s.z[1] / s.z[0], k * k) : s.z[0] + (s.z[1] - s.z[0]) * k;
  const opacity = (first ? 1 : ramp(t, s.from, s.from + FADE, (x) => x)) * (last ? 1 - ramp(t, s.to - 0.9, s.to, (x) => x) : 1);
  const style: React.CSSProperties = {width: '100%', height: '100%', objectFit: 'cover', objectPosition: s.focus ?? '50% 50%'};
  return (
    <AbsoluteFill style={{opacity, transform: `translateY(${s.y ?? 0}px) scale(${z})`, transformOrigin: s.focus ?? '50% 50%'}}>
      {s.clip ? (
        <Sequence from={Math.round(s.from * fps)} layout="none">
          <OffthreadVideo src={staticFile(`horizon/clips/${s.clip}.mp4`)} muted style={style} />
        </Sequence>
      ) : (
        <Img src={staticFile(`horizon/${s.still}`)} style={style} />
      )}
    </AbsoluteFill>
  );
};

// Frame-0 hook line (channel rule), gone before the first sentence ends.
const Hook: React.FC<{t: number}> = ({t}) => {
  const o = 1 - ramp(t, 3.0, 3.6, (x) => x);
  if (o <= 0) return null;
  return (
    <div style={{position: 'absolute', left: 60, right: 60, top: 300, textAlign: 'center', direction: 'rtl', opacity: o, fontFamily: KUFI, fontWeight: 800, fontSize: 82, color: '#F2EBDD', textShadow: '0 4px 24px rgba(0,0,0,0.9)'}}>
      عدّيت… ومحسّتش؟
    </div>
  );
};

const SFX: Cue[] = [
  [7.02, 'impact', 0.35],
  [7.6, 'air', 0.14], [10.3, 'air', 0.1], [12.6, 'air', 0.14], [24.2, 'air', 0.12], [26.3, 'air', 0.12],
  [29.74, 'impact', 0.4],
  [41.7, 'air', 0.14], [49.5, 'air', 0.12], [52.94, 'impact', 0.32], [54.0, 'air', 0.16],
];

export const HorizonDoc: React.FC = () => {
  const t = useSeconds();
  const {fps} = useVideoConfig();
  return (
    <AbsoluteFill style={{background: '#000'}}>
      {SHOTS.map((s, i) => (
        <ShotView key={i} s={s} t={t} first={i === 0} last={i === SHOTS.length - 1} />
      ))}
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 50%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.5) 100%)'}} />
      <Hook t={t} />
      <Audio src={staticFile('horizon/vo.wav')} />
      {/* low space ambience; drops out for the pause after "صغيرة جداً" */}
      <Audio
        src={staticFile('horizon/drone.wav')}
        volume={(f) => 0.55 * (1 - interpolate(f / fps, [23.1, 23.4, 24.2, 24.6], [0, 1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}) * 0.85)}
      />
      <SfxTrack cues={SFX} />
    </AbsoluteFill>
  );
};
