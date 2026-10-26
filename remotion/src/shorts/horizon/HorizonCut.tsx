// Short #5, version 2 — dark cinematic cut. Hard cuts on word timings between
// (1) a starfield bent by the black hole (point-lens equation, so the Einstein
// ring is real optics, not a drawn effect), (2) the shared ink diagram in ivory
// on charcoal, (3) full-bleed archival images. Kinetic Arabic captions from
// words.json, key words in red.
import {AbsoluteFill, Audio, Easing, Img, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {ramp, useSeconds} from '../../lib/map';
import {boardCamAt} from '../../lib/paper';
import {KUFI} from '../../lib/arabic';
import {Grain} from '../../lib/overlays';
import {SfxTrack, type Cue} from '../../lib/sfx';
import {DARK_THEME, Diagram} from './diagram';
import {CAMERA, DURATION, Scene} from './scene';
import words from './words.json';

export {DURATION};
const RED = '#C9483C';
const IVORY = '#F2EBDD';
const A = (f: string) => `horizon/art/${f}.jpg`;

// ---------- lensed sky ----------
const rnd = (i: number) => {
  const v = Math.sin(i * 91.7 + 17.3) * 43758.5453;
  return v - Math.floor(v);
};
const STARS = Array.from({length: 4200}, (_, i) => ({x: (rnd(i) - 0.5) * 2800, y: (rnd(i + 5000) - 0.5) * 3000, b: 1.1 + 2.6 * rnd(i + 9000) ** 3, warm: rnd(i + 7000) < 0.18}));

// Point lens: a star at angular offset β has two images at
// θ± = (β ± sqrt(β² + 4θE²)) / 2 along its direction, magnified by μ±.
const LensSky: React.FC<{cx: number; cy: number; thetaE: number; shadow: number; drift: [number, number]}> = ({cx, cy, thetaE, shadow, drift}) => {
  const dots: React.ReactNode[] = [];
  STARS.forEach((s, i) => {
    const bx = s.x + drift[0];
    const by = s.y + drift[1];
    const beta = Math.hypot(bx, by) || 0.01;
    const u = beta / thetaE;
    const root = Math.sqrt(beta * beta + 4 * thetaE * thetaE);
    const base = (u * u + 2) / (2 * u * Math.sqrt(u * u + 4));
    [
      [(beta + root) / 2, base + 0.5],
      [(beta - root) / 2, base - 0.5],
    ].forEach(([th, mu], k) => {
      if (Math.abs(th) < shadow) return;
      const x = cx + (bx / beta) * th;
      const y = cy + (by / beta) * th;
      if (x < -10 || x > 1090 || y < -10 || y > 1930) return;
      const r = Math.min(7, s.b * Math.sqrt(Math.abs(mu)));
      dots.push(<circle key={i * 2 + k} cx={x} cy={y} r={r} fill={s.warm ? '#D9B98A' : IVORY} opacity={Math.min(1, 0.5 + 0.3 * Math.abs(mu))} />);
    });
  });
  return (
    <svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
      <rect width={1080} height={1920} fill="#050505" />
      {dots}
      <circle cx={cx} cy={cy} r={shadow} fill="#000" />
      <circle cx={cx} cy={cy} r={shadow * 1.02} fill="none" stroke={IVORY} strokeOpacity={0.35} strokeWidth={2} />
    </svg>
  );
};

// ---------- shots ----------
type Shot =
  | {from: number; kind: 'sky'; cx: number; cy: number; e0: number; e1: number; shadow: number; v: [number, number]}
  | {from: number; kind: 'diagram'}
  | {from: number; kind: 'photo'; src: string; z0: number; z1: number; fx?: number; fy?: number}
  | {from: number; kind: 'speed'}
  | {from: number; kind: 'question'};

const SHOTS: Shot[] = [
  {from: 0, kind: 'sky', cx: 540, cy: 980, e0: 290, e1: 380, shadow: 0.62, v: [0, 30]},
  {from: 3.38, kind: 'diagram'},
  {from: 5.84, kind: 'sky', cx: 540, cy: 1080, e0: 430, e1: 560, shadow: 0.68, v: [20, -40]},
  {from: 7.76, kind: 'photo', src: A('m87'), z0: 1.0, z1: 1.25},
  {from: 10.46, kind: 'photo', src: A('nasadisk'), z0: 1.0, z1: 1.12, fx: 50, fy: 50},
  {from: 12.74, kind: 'diagram'},
  {from: 24.38, kind: 'photo', src: A('einstein'), z0: 1.05, z1: 1.15, fy: 30},
  {from: 25.38, kind: 'photo', src: A('schwarzschild'), z0: 1.05, z1: 1.15, fy: 30},
  {from: 26.48, kind: 'diagram'},
  {from: 34.46, kind: 'sky', cx: 540, cy: 1000, e0: 150, e1: 190, shadow: 0.6, v: [-40, 20]},
  {from: 37.7, kind: 'diagram'},
  {from: 41.86, kind: 'sky', cx: 540, cy: 1750, e0: 900, e1: 980, shadow: 0.8, v: [0, -30]},
  {from: 44.6, kind: 'diagram'},
  {from: 49.64, kind: 'speed'},
  {from: 51.78, kind: 'diagram'},
  {from: 54.12, kind: 'question'},
];

const PUNCH = [3.1, 7.02, 9.74, 16.12, 29.74, 33.54, 40.32, 43.9, 47.48, 52.52, 56.12, 58.66];
const punch = (t: number) => PUNCH.reduce((acc, p) => acc + (t >= p && t < p + 0.35 ? 0.07 * (1 - (t - p) / 0.35) : 0), 0);

const ShotView: React.FC<{shot: Shot; t: number; until: number}> = ({shot, t, until}) => {
  const k = Math.min(1, Math.max(0, (t - shot.from) / Math.max(0.5, until - shot.from)));
  const pz = 1 + punch(t);
  if (shot.kind === 'sky') {
    const e = shot.e0 + (shot.e1 - shot.e0) * Easing.inOut(Easing.quad)(k);
    const dt = t - shot.from;
    return (
      <AbsoluteFill style={{transform: `scale(${pz})`}}>
        <LensSky cx={shot.cx} cy={shot.cy} thetaE={e} shadow={e * shot.shadow} drift={[shot.v[0] * dt, shot.v[1] * dt]} />
      </AbsoluteFill>
    );
  }
  if (shot.kind === 'photo') {
    const z = (shot.z0 + (shot.z1 - shot.z0) * Easing.out(Easing.quad)(k)) * pz;
    return (
      <AbsoluteFill style={{background: '#050505', overflow: 'hidden'}}>
        <Img
          src={staticFile(shot.src)}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: `${shot.fx ?? 50}% ${shot.fy ?? 50}%`,
            transform: `scale(${z})`,
            transformOrigin: `${shot.fx ?? 50}% ${shot.fy ?? 50}%`,
            filter: 'grayscale(1) sepia(0.3) contrast(1.15) brightness(0.92)',
          }}
        />
      </AbsoluteFill>
    );
  }
  if (shot.kind === 'diagram') {
    return (
      <AbsoluteFill style={{background: '#1b1c1a', transform: `scale(${pz})`}}>
        <Diagram cam={boardCamAt(CAMERA, t)} theme={DARK_THEME} cy={900}>
          <Scene t={t} th={DARK_THEME} />
        </Diagram>
      </AbsoluteFill>
    );
  }
  if (shot.kind === 'speed') {
    const n = Math.round(299792 * ramp(t, 49.7, 50.9));
    return (
      <AbsoluteFill style={{background: '#050505', justifyContent: 'center', alignItems: 'center', transform: `scale(${pz})`, direction: 'rtl'}}>
        <div style={{fontFamily: KUFI, fontWeight: 900, fontSize: 150, color: IVORY, marginTop: -300}}>{n.toLocaleString('ar-EG')}</div>
        <div style={{fontFamily: KUFI, fontWeight: 700, fontSize: 64, color: 'rgba(242,235,221,0.6)'}}>كم في الثانية</div>
        <div style={{fontFamily: KUFI, fontWeight: 900, fontSize: 70, color: RED, marginTop: 60, opacity: ramp(t, 50.3, 50.6)}}>ولا حاجة أسرع</div>
      </AbsoluteFill>
    );
  }
  // question: the black hole behind, the question in front
  const e = 330 + 400 * ramp(t, 54.12, DURATION, (x) => x);
  return (
    <AbsoluteFill>
      <LensSky cx={540} cy={1250} thetaE={e} shadow={e * 0.66} drift={[0, -20 * (t - 54.12)]} />
      <div style={{position: 'absolute', left: 60, right: 60, top: 330, textAlign: 'center', direction: 'rtl', fontFamily: KUFI, fontWeight: 900, lineHeight: 1.25}}>
        <div style={{fontSize: 70, color: 'rgba(242,235,221,0.75)', opacity: ramp(t, 54.2, 54.5)}}>عشان تخرج من هنا</div>
        <div style={{fontSize: 90, color: IVORY, opacity: ramp(t, 54.98, 55.3), transform: `scale(${interpolate(t, [54.98, 55.2], [1.2, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})})`}}>
          كم ضعف <span style={{color: RED}}>سرعة الضوء</span>؟
        </div>
      </div>
      {t > 60.26 && (
        <div style={{position: 'absolute', left: 0, right: 0, top: 1300, textAlign: 'center', fontFamily: KUFI, fontWeight: 900, fontSize: 80, color: IVORY, transform: `scale(${interpolate(t, [60.26, 60.45], [1.3, 1], {extrapolateRight: 'clamp'})})`}}>
          اشترك
        </div>
      )}
    </AbsoluteFill>
  );
};

// ---------- kinetic captions ----------
type Wd = {w: string; s: number; e: number};
const WORDS = words as Wd[];
const KEY = /(ضوء|الضوء|ترجع|ضخم|سطح|مستحيل|يخرج|تخرج|الزمكان|رسالة|إشارة|الإشارة|فجأة|سرعة|عديت|أفق|النسبية)/;
const CHUNKS: {text: Wd[]; s: number}[] = (() => {
  const out: {text: Wd[]; s: number}[] = [];
  let cur: Wd[] = [];
  WORDS.forEach((w, i) => {
    cur.push(w);
    const end = cur.length >= 3 || (WORDS[i + 1] && WORDS[i + 1].s - w.e > 0.3);
    if (end) {
      out.push({text: cur, s: cur[0].s});
      cur = [];
    }
  });
  if (cur.length) out.push({text: cur, s: cur[0].s});
  return out;
})();

const Captions: React.FC<{t: number; y: number}> = ({t, y}) => {
  const i = CHUNKS.findIndex((c, j) => t >= c.s - 0.05 && (j === CHUNKS.length - 1 || t < CHUNKS[j + 1].s - 0.05));
  if (i < 0) return null;
  const c = CHUNKS[i];
  if (t > c.text[c.text.length - 1].e + 0.6) return null;
  const pop = interpolate(t - c.s, [0, 0.1], [0.8, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.back(2.5))});
  return (
    <div style={{position: 'absolute', left: 60, right: 150, top: y, textAlign: 'center', direction: 'rtl', transform: `scale(${pop})`}}>
      {c.text.map((w, j) => (
        <span
          key={j}
          style={{
            fontFamily: KUFI,
            fontWeight: 900,
            fontSize: 96,
            lineHeight: 1.3,
            color: KEY.test(w.w) ? RED : IVORY,
            opacity: t >= w.s - 0.03 ? 1 : 0.35,
            WebkitTextStroke: '12px #000',
            paintOrder: 'stroke fill',
            textShadow: '0 10px 30px rgba(0,0,0,0.85)',
            marginLeft: 22,
            display: 'inline-block',
          }}
        >
          {w.w}
        </span>
      ))}
    </div>
  );
};

// Frame-0 hook strip (3–5 words), gone when the first sentence ends.
const Hook: React.FC<{t: number}> = ({t}) => {
  const show = 1 - ramp(t, 3.7, 3.98);
  if (show <= 0) return null;
  return (
    <div style={{position: 'absolute', left: 60, right: 60, top: 300, textAlign: 'center', direction: 'rtl', opacity: show}}>
      <span style={{display: 'inline-block', background: '#E8DDC5', color: '#171817', fontFamily: KUFI, fontWeight: 900, fontSize: 84, padding: '6px 34px', transform: 'rotate(-1.5deg)'}}>
        عدّيت… ومحسّتش؟
      </span>
    </div>
  );
};

const SFX: Cue[] = [
  [0, 'impact', 0.3],
  [3.38, 'air', 0.15], [5.84, 'air', 0.15], [7.02, 'impact', 0.4],
  [7.76, 'air', 0.15], [10.46, 'air', 0.12], [12.74, 'air', 0.15],
  [24.38, 'paper2', 0.25], [25.38, 'paper1', 0.25], [26.48, 'air', 0.12],
  [29.74, 'impact', 0.42],
  [34.46, 'air', 0.15], [37.7, 'air', 0.12], [40.32, 'impact', 0.45],
  [41.86, 'air', 0.15], [44.6, 'air', 0.12], [49.64, 'air', 0.15], [51.78, 'air', 0.12],
  [54.12, 'air', 0.18], [56.12, 'impact', 0.42],
];

export const HorizonCut: React.FC = () => {
  const t = useSeconds();
  const frame = useCurrentFrame();
  const i = SHOTS.findIndex((s, j) => t >= s.from && (j === SHOTS.length - 1 || t < SHOTS[j + 1].from));
  const shot = SHOTS[Math.max(0, i)];
  const until = SHOTS[i + 1]?.from ?? DURATION;
  const flash = [7.02, 29.74, 40.32].some((f) => t >= f && t < f + 0.07);
  const noCaptions = shot.kind === 'speed' || shot.kind === 'question';
  return (
    <AbsoluteFill style={{background: '#050505'}}>
      <ShotView shot={shot} t={t} until={until} />
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 50%, rgba(0,0,0,0.55) 100%)'}} />
      <Hook t={t} />
      {!noCaptions && <Captions t={t} y={1290} />}
      {flash && <AbsoluteFill style={{background: '#fff', opacity: 0.5}} />}
      <Grain frame={frame} />
      <Audio src={staticFile('horizon/vo.wav')} />
      <SfxTrack cues={SFX} />
    </AbsoluteFill>
  );
};
