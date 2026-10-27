// Short #5, "viral" version — modelled on the black-hole Shorts with millions
// of views (black hole composited into the real world, real astronaut footage,
// constant motion, a new shot every 2–3 s, music + whooshes + bass hits).
// Sources: physically lensed Poly Haven 360° photos (tools/lens_scene.py),
// ESO Milky Way lensing (tools/lens_render.py), NASA SVS black-hole
// simulations, NASA spacewalk footage, Einstein photo. No captions.
import {AbsoluteFill, Audio, Img, OffthreadVideo, Sequence, interpolate, staticFile, useVideoConfig} from 'remotion';
import {useSeconds} from '../../lib/map';
import {KUFI} from '../../lib/arabic';
import {SfxTrack, type Cue} from '../../lib/sfx';
import {Grain} from '../../lib/overlays';
import {DURATION} from './scene';

export {DURATION};
const XF = 0.25; // cross-dissolve at every cut

// from/to = on-screen window (cuts on word timings from words.json); src = clip, at = offset into it.
type Shot = {from: number; to: number; src: string; at?: number; still?: boolean; z?: [number, number]; focus?: string};
const SHOTS: Shot[] = [
  {from: 0.0, to: 2.52, src: 'viral/city_reveal'}, // ممكن تعدي أفق الحدث بتاع ثقب أسود
  {from: 2.52, to: 3.98, src: 'viral/astro_earth'}, // من غير ما تحس إنك عديت حاجة
  {from: 3.98, to: 5.84, src: 'viral/astro_visor'}, // وتفضل شايف ضوء جاي من بره
  {from: 5.84, to: 7.76, src: 'lens/fall_in', at: 8.6}, // ومع كده ما تقدرش ترجع
  {from: 7.76, to: 10.46, src: 'viral/savanna_huge'}, // لو الثقب الأسود ضخم جداً
  {from: 10.46, to: 12.74, src: 'clips/disk_face', at: 0.2}, // وبعيد عن الغاز الساخن
  {from: 12.74, to: 15.46, src: 'lens/wide'}, // أفق الحدث عبارة عن حد
  {from: 15.46, to: 17.6, src: 'clips/plunge_in', at: 7.0}, // ما فيش سطح صلب
  {from: 17.6, to: 19.6, src: 'viral/astro_wave', at: 0.7}, // ولا علامة تحس بيها
  {from: 19.6, to: 24.38, src: 'clips/plunge_cross', at: 6.0}, // لو بقيت جوا الحد ده… (then the silence)
  {from: 24.38, to: 26.48, src: 'horizon/art/einstein.jpg', still: true, z: [1.12, 1.24], focus: '50% 28%'}, // بحسب النسبية العامة
  {from: 26.48, to: 30.4, src: 'lens/last_light'}, // حتى الضوء… ما يقدرش يخرج
  {from: 30.4, to: 34.46, src: 'clips/flyby_ring'}, // شكل الزمكان… تفضل جوا الثقب
  {from: 34.46, to: 37.7, src: 'viral/city_outside'}, // أما العالم الخارجي فالضوء لسه بيدخل
  {from: 37.7, to: 40.32, src: 'viral/astro_selfie', at: 0.08}, // لكن إنك ترسل أي رسالة
  {from: 40.32, to: 41.86, src: 'lens/photon_ring'}, // مستحيل حتى لو ضوء
  {from: 41.86, to: 44.6, src: 'lens/look_back', at: 4.0}, // عبورك مش معنى إن كل حاجة هتختفي
  {from: 44.6, to: 47.48, src: 'viral/astro_dark'}, // ولو حاولت تبعت إشارة
  {from: 47.48, to: 49.64, src: 'clips/disk_hook', at: 1.0}, // الإشارة دي مش هتقدر تخرج
  {from: 49.64, to: 51.78, src: 'viral/streaks'}, // مش بتعدي سرعة الضوء
  {from: 51.78, to: 54.12, src: 'clips/plunge_in', at: 9.4}, // وهناك حتى الضوء مستحيل يخرج
  {from: 54.12, to: 57.82, src: 'viral/city_final'}, // فالسؤال الأهم…
  {from: 57.82, to: DURATION, src: 'lens/final', at: 3.8}, // كم ضعف سرعة الضوء؟
];

// A short push on every new shot (the "zoom-in cut" these Shorts use), then a slow drift.
const motion = (t: number, s: Shot) => {
  const k = (t - s.from) / Math.max(0.5, s.to - s.from);
  if (s.z) return s.z[0] + (s.z[1] - s.z[0]) * k;
  const punch = interpolate(t - s.from, [0, 0.35], [1.1, 1.0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: (x) => 1 - (1 - x) ** 3});
  return punch * (1 + 0.05 * k);
};

const ShotView: React.FC<{s: Shot; t: number; first: boolean; last: boolean}> = ({s, t, first, last}) => {
  const {fps} = useVideoConfig();
  const end = last ? s.to : s.to + XF;
  if (t < s.from || t > end) return null;
  let opacity = first ? 1 : interpolate(t, [s.from, s.from + XF], [0, 1], {extrapolateRight: 'clamp'});
  if (last) opacity *= 1 - interpolate(t, [s.to - 0.7, s.to], [0, 1], {extrapolateLeft: 'clamp'});
  // the silence after "صغيرة جداً": dip to black, then GR comes up
  if (s.src === 'clips/plunge_cross') opacity *= 1 - interpolate(t, [23.0, 23.6], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const style: React.CSSProperties = {width: '100%', height: '100%', objectFit: 'cover', objectPosition: s.focus ?? '50% 50%'};
  return (
    <AbsoluteFill style={{opacity, transform: `scale(${motion(t, s)})`, transformOrigin: s.focus ?? '50% 50%'}}>
      {s.still ? (
        <Img src={staticFile(s.src)} style={{...style, filter: 'grayscale(1) contrast(1.1) brightness(0.95)'}} />
      ) : (
        <Sequence from={Math.round(s.from * fps) - Math.round((s.at ?? 0) * fps)} layout="none">
          <OffthreadVideo src={staticFile(`horizon/${s.src}.mp4`)} muted style={style} />
        </Sequence>
      )}
    </AbsoluteFill>
  );
};

// Frame-0 hook line, gone before the first sentence ends.
const Hook: React.FC<{t: number}> = ({t}) => {
  const o = 1 - interpolate(t, [2.2, 2.5], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  if (o <= 0) return null;
  return (
    <div style={{position: 'absolute', left: 50, right: 50, top: 280, textAlign: 'center', direction: 'rtl', opacity: o, fontFamily: KUFI, fontWeight: 900, fontSize: 86, lineHeight: 1.2, color: '#fff', textShadow: '0 4px 18px rgba(0,0,0,0.95), 0 0 2px #000'}}>
      عدّيت… ومحسّتش؟
    </div>
  );
};

// whoosh on every cut, low hits on the four big moments
const SFX: Cue[] = [
  ...SHOTS.slice(1).map((s) => [s.from - 0.12, 'air', 0.22] as Cue),
  [7.02, 'impact', 0.45],
  [29.74, 'impact', 0.5],
  [40.32, 'impact', 0.5],
  [56.12, 'impact', 0.45],
];

export const HorizonViral: React.FC = () => {
  const t = useSeconds();
  return (
    <AbsoluteFill style={{background: '#000'}}>
      {SHOTS.map((s, i) => (
        <ShotView key={i} s={s} t={t} first={i === 0} last={i === SHOTS.length - 1} />
      ))}
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 50%, rgba(0,0,0,0) 58%, rgba(0,0,0,0.45) 100%)'}} />
      <Grain frame={Math.round(t * 30)} />
      <Hook t={t} />
      <Audio src={staticFile('horizon/vo.wav')} />
      {/* music is mixed in afterwards with side-chain ducking under the voice (see shorts/05-horizon/script.md) */}
      <SfxTrack cues={SFX} gain={0.5} />
    </AbsoluteFill>
  );
};
