// Short #5 — "Pro" re-edit of the dark cinematic cut the owner liked.
// Changes from HorizonCut: no captions, no hook line, no white flashes or loud
// hits; the starfield is the ray-traced Milky Way (tools/lens_render.py); the
// diagrams sit in real space and use computed light paths (tools/geodesics.py),
// glowing photons, Flamm's funnel and the river-model flashes, with a real NASA
// astronaut (McCandless, 1984) instead of a drawn figure. Only explanatory
// text stays (speed of light card, closing question). Music is mixed afterwards.
import {AbsoluteFill, Audio, Easing, Img, OffthreadVideo, Sequence, interpolate, staticFile, useVideoConfig} from 'remotion';
import {useSeconds} from '../../lib/map';
import {KUFI} from '../../lib/arabic';
import {Grain} from '../../lib/overlays';
import {DURATION} from './scene';
import geo from './data/geodesics.json';

export {DURATION};
const RED = '#E0533F';
const IVORY = '#F4EEE2';
const WARM = '#FFC98A';
const XF = 0.35;

type Pt = [number, number];
const G = geo as unknown as {incoming: Pt[][]; inside: Pt[][]};
const sm = Easing.bezier(0.45, 0, 0.25, 1);
const k = (t: number, a: number, b: number, e: (x: number) => number = sm) => interpolate(t, [a, b], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: e});

// ---------- shared SVG pieces ----------
const Defs: React.FC = () => (
  <defs>
    <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="7" result="b" />
      <feMerge>
        <feMergeNode in="b" />
        <feMergeNode in="b" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
    <filter id="soft" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="18" />
    </filter>
    <radialGradient id="ring">
      <stop offset="0.86" stopColor={WARM} stopOpacity={0} />
      <stop offset="0.97" stopColor={WARM} stopOpacity={0.55} />
      <stop offset="1" stopColor={WARM} stopOpacity={0} />
    </radialGradient>
  </defs>
);

// The hole seen from above: black disk, warm photon-ring halo, dashed horizon.
const HoleTop: React.FC<{x: number; y: number; s: number; red?: number}> = ({x, y, s, red = 0}) => (
  <g>
    <circle cx={x} cy={y} r={s * 1.6} fill="url(#ring)" />
    <circle cx={x} cy={y} r={s} fill="#000" />
    <circle cx={x} cy={y} r={s} fill="none" stroke={red > 0 ? RED : IVORY} strokeOpacity={0.55 + 0.45 * red} strokeWidth={3 + 3 * red} strokeDasharray="16 12" filter={red > 0 ? 'url(#glow)' : undefined} />
  </g>
);

const toD = (pts: Pt[], s: number, ox: number, oy: number) => 'M' + pts.map(([x, y]) => `${(ox + x * s).toFixed(1)},${(oy + y * s).toFixed(1)}`).join('L');

// A photon running along a computed light path: faint track, bright glowing tail, head.
const Photon: React.FC<{pts: Pt[]; s: number; ox: number; oy: number; p: number; color: string; w?: number}> = ({pts, s, ox, oy, p, color, w = 4}) => {
  if (p <= 0) return null;
  const d = toD(pts, s, ox, oy);
  const tail = 0.18;
  return (
    <g>
      <path d={d} fill="none" stroke={color} strokeOpacity={0.22} strokeWidth={w * 0.5} pathLength={1} strokeDasharray={`${Math.min(1, p)} 1`} />
      <path d={d} fill="none" stroke={color} strokeWidth={w} strokeLinecap="round" pathLength={1} strokeDasharray={`${tail} 2`} strokeDashoffset={-(Math.min(p, 1) - tail)} filter="url(#glow)" opacity={p >= 1 ? 1 - Math.min(1, (p - 1) * 4) : 1} />
    </g>
  );
};

// The real astronaut (NASA photo cut-out), centred on (x, y), w px wide.
const Astronaut: React.FC<{x: number; y: number; w: number; rot: number; o?: number}> = ({x, y, w, rot, o = 1}) => (
  <Img
    src={staticFile('horizon/pro/astronaut.png')}
    style={{position: 'absolute', left: x - w / 2, top: y - w * 0.53, width: w, transform: `rotate(${rot}deg)`, opacity: o, filter: 'drop-shadow(0 0 18px rgba(255,201,138,0.35)) brightness(0.95)'}}
  />
);

// Real space behind the diagrams: the ray-traced Milky Way, dimmed and soft.
const Backdrop: React.FC<{from: number; clip: string; at?: number}> = ({from, clip, at = 0}) => {
  const {fps} = useVideoConfig();
  return (
    <AbsoluteFill style={{filter: 'brightness(0.32) blur(5px) saturate(0.8)', transform: 'scale(1.08)'}}>
      <Sequence from={Math.round((from - at) * fps)} layout="none">
        <OffthreadVideo src={staticFile(`horizon/lens/${clip}.mp4`)} muted style={{width: '100%', height: '100%'}} />
      </Sequence>
    </AbsoluteFill>
  );
};

// ---------- diagram scenes ----------
// A — you've crossed, and light from outside still reaches you (3.38–5.84)
const SceneArrive: React.FC<{t: number}> = ({t}) => {
  const s = interpolate(t, [3.38, 6.2], [560, 500]);
  const ax = 540;
  const ay = 930;
  const oy = ay + 0.82 * s;
  return (
    <>
      <svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
        <Defs />
        <HoleTop x={ax} y={oy} s={s} />
        {G.incoming.map((pts, i) => (
          <Photon key={i} pts={pts} s={s} ox={ax} oy={oy} p={k(t, 3.7 + i * 0.12, 5.3 + i * 0.12, (x) => x)} color={IVORY} />
        ))}
      </svg>
      <Astronaut x={ax} y={ay} w={210} rot={-14 + (t - 3.38) * 4} />
    </>
  );
};

// B — the horizon is a place, not a surface (12.74–24.38): Flamm's funnel
const SceneFunnel: React.FC<{t: number}> = ({t}) => {
  const az = (t - 12.74) * 0.1 + 0.5;
  const el = interpolate(t, [12.74, 24.38], [0.42, 0.52]);
  const S = interpolate(t, [12.74, 19.4, 20.8, 24.4], [175, 175, 330, 350], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: sm});
  const cy0 = interpolate(t, [12.74, 19.4, 20.8], [640, 640, 380], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: sm});
  const depth = (r: number) => (6 - 2 * Math.sqrt(Math.max(0, r - 1))) * Math.cos(el) * 0.62 * 0.9;
  const proj = (r: number, ph: number): Pt => [540 + r * Math.cos(ph + az) * S, cy0 + (r * Math.sin(ph + az) * Math.sin(el) * 0.9 + depth(r)) * S];
  const ring = (r: number) => 'M' + Array.from({length: 121}, (_, i) => proj(r, (i / 120) * Math.PI * 2).join(',')).join('L');
  const rings = [1.08, 1.2, 1.4, 1.7, 2.1, 2.6, 3.3, 4.2];
  const spokes = Array.from({length: 32}, (_, i) => (i / 32) * Math.PI * 2);
  const draw = k(t, 12.74, 14.8);
  const throatY = cy0 + depth(1) * S;
  // the astronaut slides down the left flank and through the throat at 18.9 s
  const flank = Math.PI * 0.92 - az;
  const rr = interpolate(t, [13.2, 18.9], [4.0, 1.0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.in(Easing.quad)});
  const into = k(t, 18.9, 21.2, Easing.out(Easing.quad)) * 0.25;
  const [fx, fy] = proj(rr, flank);
  const px = fx + (540 - fx) * into;
  const py = fy + (throatY - fy) * into;
  const red = k(t, 18.6, 19.2) * (1 - k(t, 23.0, 23.6));
  return (
    <>
      <svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
        <Defs />
        <g fill="none" filter="url(#glow)">
          {rings.map((r, i) => (
            <path key={r} d={ring(r)} stroke={IVORY} strokeOpacity={0.18 + 0.06 * (rings.length - i)} strokeWidth={2} pathLength={1} strokeDasharray={`${draw} 1`} />
          ))}
          {spokes.map((ph) => (
            <path key={ph} d={'M' + rings.map((r) => proj(r, ph).join(',')).join('L')} stroke={IVORY} strokeOpacity={0.22} strokeWidth={1.6} pathLength={1} strokeDasharray={`${draw} 1`} />
          ))}
        </g>
        <ellipse cx={540} cy={throatY} rx={S} ry={S * Math.sin(el) * 0.9} fill="#000" opacity={k(t, 13.4, 14.4)} />
        <path d={ring(1.0)} fill="none" stroke={red > 0.01 ? RED : WARM} strokeWidth={4 + 2 * red} pathLength={1} strokeDasharray={`${k(t, 13.6, 15.2)} 1`} filter="url(#glow)" />
        {t > 20.3 && (
          <g stroke={RED} strokeWidth={3} opacity={k(t, 20.4, 20.9) * (1 - k(t, 23.6, 24.2))} filter="url(#glow)">
            <line x1={px + 70} y1={fy} x2={px + 70} y2={py} />
            <line x1={px + 56} y1={fy} x2={px + 84} y2={fy} />
            <line x1={px + 56} y1={py} x2={px + 84} y2={py} />
          </g>
        )}
      </svg>
      <Astronaut x={px} y={py - 40 * (S / 175)} w={95 * (S / 175)} rot={-20 + (t - 12.74) * 3} o={k(t, 13.0, 13.5)} />
    </>
  );
};

// C — from inside, every path ends at the centre; then space itself flows in (26.48–34.46)
const SceneInside: React.FC<{t: number}> = ({t}) => {
  const s = 330;
  const ox = 540;
  const oy = 1180;
  const ay = oy - 0.82 * s;
  const fan = 1 - k(t, 30.2, 30.7);
  const river = k(t, 30.4, 30.9);
  // river model: a flash at r spreads at c while its centre is carried in at √(1/r)·c
  const flash = (r: number, i: number) => {
    const out: React.ReactNode[] = [];
    for (let j = 0; j < 3; j++) {
      const tau = (t - 30.8 - i * 0.55 - j * 0.9) / 1.6;
      if (tau <= 0 || tau > 1) continue;
      const size = 0.55 * tau;
      const v = Math.sqrt(1 / r);
      const ey = oy - r * s;
      const cy = ey + v * size * s;
      out.push(<circle key={j} cx={ox} cy={cy} r={size * s} fill="none" stroke={r < 1 ? RED : IVORY} strokeWidth={3} opacity={(1 - tau) * river} filter="url(#glow)" />);
    }
    return (
      <g key={r}>
        {out}
        <circle cx={ox} cy={oy - r * s} r={7} fill={r < 1 ? RED : IVORY} opacity={river} filter="url(#glow)" />
      </g>
    );
  };
  return (
    <>
      <svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
        <Defs />
        <HoleTop x={ox} y={oy} s={s} red={k(t, 29.6, 30.0) * (1 - k(t, 31.0, 31.6))} />
        <g opacity={fan}>
          {G.inside.map((pts, i) => (
            <Photon key={i} pts={pts} s={s} ox={ox} oy={oy} p={k(t, 27.9 + i * 0.07, 29.74 + i * 0.07, (x) => x)} color={RED} />
          ))}
        </g>
        {[2.4, 1.6, 1.0, 0.72].map(flash)}
      </svg>
      <Astronaut x={ox} y={ay} w={150} rot={8 + (t - 26.48) * 3} o={fan} />
    </>
  );
};

// D — light still comes in, nothing goes out (37.7–41.86)
const SceneMessage: React.FC<{t: number}> = ({t}) => {
  const s = 420;
  const ax = 540;
  const ay = 960;
  const oy = ay + 0.82 * s;
  return (
    <>
      <svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
        <Defs />
        <HoleTop x={ax} y={oy} s={s} red={k(t, 40.2, 40.5) * (1 - k(t, 41.4, 41.9))} />
        {G.incoming.map((pts, i) => (
          <Photon key={'in' + i} pts={pts} s={s} ox={ax} oy={oy} p={k(t, 37.75 + i * 0.1, 39.3 + i * 0.1, (x) => x)} color={IVORY} />
        ))}
        {G.inside.map((pts, i) => (
          <Photon key={'out' + i} pts={pts} s={s} ox={ax} oy={oy} p={k(t, 38.2 + i * 0.09, 40.2 + i * 0.09, (x) => x)} color={RED} />
        ))}
      </svg>
      <Astronaut x={ax} y={ay} w={190} rot={6 - (t - 37.7) * 3} />
    </>
  );
};

// E — a signal sent from inside: rings grow at c but are carried in faster (44.6–49.64)
const SceneSignal: React.FC<{t: number}> = ({t}) => {
  const s = 520;
  const ax = 540;
  const ay = 900;
  const oy = ay + 0.8 * s;
  const v = Math.sqrt(1 / 0.8);
  const rings: React.ReactNode[] = [];
  for (let j = 0; j < 7; j++) {
    const tau = t - 45.3 - j * 0.6;
    if (tau <= 0 || tau > 3.2) continue;
    const size = tau * 0.22;
    rings.push(<circle key={j} cx={ax} cy={ay + v * size * s} r={size * s} fill="none" stroke={WARM} strokeWidth={4} opacity={1 - tau / 3.2} filter="url(#glow)" />);
  }
  return (
    <>
      <svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
        <Defs />
        <HoleTop x={ax} y={oy} s={s} red={k(t, 47.4, 47.9)} />
        {rings}
      </svg>
      <Astronaut x={ax} y={ay} w={200} rot={-6 + (t - 44.6) * 2} />
    </>
  );
};

// ---------- shots ----------
type Shot = {from: number; to: number; kind: 'lens' | 'clip' | 'photo' | 'diagram' | 'speed' | 'question'; src?: string; at?: number; z?: [number, number]; focus?: string; scene?: string; bg?: string};
const SHOTS: Shot[] = [
  {from: 0, to: 3.38, kind: 'lens', src: 'approach_close'},
  {from: 3.38, to: 5.84, kind: 'diagram', scene: 'arrive', bg: 'wide'},
  {from: 5.84, to: 7.76, kind: 'lens', src: 'fall_in', at: 8.6},
  {from: 7.76, to: 10.46, kind: 'photo', src: 'art/m87.jpg', z: [1.05, 1.3]},
  {from: 10.46, to: 12.74, kind: 'clip', src: 'clips/disk_face', at: 0.2},
  {from: 12.74, to: 24.38, kind: 'diagram', scene: 'funnel', bg: 'orbit'},
  {from: 24.38, to: 25.38, kind: 'photo', src: 'art/einstein.jpg', z: [1.08, 1.16], focus: '50% 30%'},
  {from: 25.38, to: 26.48, kind: 'photo', src: 'art/schwarzschild.jpg', z: [1.06, 1.14], focus: '50% 30%'},
  {from: 26.48, to: 34.46, kind: 'diagram', scene: 'inside', bg: 'photon_ring'},
  {from: 34.46, to: 37.7, kind: 'lens', src: 'wide'},
  {from: 37.7, to: 41.86, kind: 'diagram', scene: 'message', bg: 'approach_close'},
  {from: 41.86, to: 44.6, kind: 'lens', src: 'look_back', at: 4.0},
  {from: 44.6, to: 49.64, kind: 'diagram', scene: 'signal', bg: 'last_light'},
  {from: 49.64, to: 51.78, kind: 'speed'},
  {from: 51.78, to: 54.12, kind: 'lens', src: 'photon_ring'},
  {from: 54.12, to: DURATION, kind: 'question'},
];

const SCENES: Record<string, React.FC<{t: number}>> = {arrive: SceneArrive, funnel: SceneFunnel, inside: SceneInside, message: SceneMessage, signal: SceneSignal};

const ShotView: React.FC<{s: Shot; t: number; first: boolean; last: boolean}> = ({s, t, first, last}) => {
  const {fps} = useVideoConfig();
  const end = last ? s.to : s.to + XF;
  if (t < s.from || t > end) return null;
  let opacity = first ? 1 : interpolate(t, [s.from, s.from + XF], [0, 1], {extrapolateRight: 'clamp'});
  if (last) opacity *= 1 - interpolate(t, [s.to - 0.8, s.to], [0, 1], {extrapolateLeft: 'clamp'});
  const kk = (t - s.from) / (s.to - s.from);
  const drift = 1 + 0.05 * kk; // slow, continuous push — no punch-ins
  const video = (src: string, at = 0) => (
    <Sequence from={Math.round((s.from - at) * fps)} layout="none">
      <OffthreadVideo src={staticFile(`horizon/${src}.mp4`)} muted style={{width: '100%', height: '100%', objectFit: 'cover'}} />
    </Sequence>
  );
  let body: React.ReactNode = null;
  if (s.kind === 'lens') body = <AbsoluteFill style={{transform: `scale(${drift})`}}>{video(`lens/${s.src}`, s.at)}</AbsoluteFill>;
  if (s.kind === 'clip') body = <AbsoluteFill style={{transform: `scale(${drift})`}}>{video(s.src!, s.at)}</AbsoluteFill>;
  if (s.kind === 'photo') {
    const z = s.z![0] + (s.z![1] - s.z![0]) * kk;
    const bw = s.src!.includes('einstein') || s.src!.includes('schwarzschild');
    body = (
      <AbsoluteFill style={{background: '#000', overflow: 'hidden'}}>
        <Img src={staticFile(`horizon/${s.src}`)} style={{width: '100%', height: '100%', objectFit: 'cover', objectPosition: s.focus ?? '50% 50%', transform: `scale(${z})`, transformOrigin: s.focus ?? '50% 50%', filter: bw ? 'grayscale(1) contrast(1.12) brightness(0.92)' : 'contrast(1.08) saturate(1.1)'}} />
      </AbsoluteFill>
    );
  }
  if (s.kind === 'diagram') {
    const Scene = SCENES[s.scene!];
    body = (
      <AbsoluteFill style={{background: '#020203'}}>
        <Backdrop from={s.from} clip={s.bg!} />
        <Scene t={t} />
      </AbsoluteFill>
    );
  }
  if (s.kind === 'speed') {
    const n = Math.round(299792 * k(t, 49.7, 50.9, (x) => 1 - (1 - x) ** 3));
    body = (
      <AbsoluteFill>
        <AbsoluteFill style={{filter: 'brightness(0.35) blur(4px)'}}>{video('lens/photon_ring', 0)}</AbsoluteFill>
        <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', direction: 'rtl'}}>
          <div style={{marginTop: -260, textAlign: 'center'}}>
            <div style={{fontFamily: KUFI, fontWeight: 900, fontSize: 150, color: IVORY, textShadow: `0 0 40px rgba(255,201,138,0.35)`}}>{n.toLocaleString('ar-EG')}</div>
            <div style={{fontFamily: KUFI, fontWeight: 700, fontSize: 60, color: 'rgba(244,238,226,0.65)'}}>كم في الثانية</div>
            <div style={{fontFamily: KUFI, fontWeight: 900, fontSize: 68, color: RED, marginTop: 50, opacity: k(t, 50.3, 50.7)}}>ولا حاجة أسرع</div>
          </div>
        </AbsoluteFill>
      </AbsoluteFill>
    );
  }
  if (s.kind === 'question') {
    const pop = k(t, 54.98, 55.4, Easing.out(Easing.back(1.4)));
    body = (
      <AbsoluteFill>
        <AbsoluteFill style={{filter: 'brightness(0.75)'}}>{video('lens/final', 0)}</AbsoluteFill>
        <div style={{position: 'absolute', left: 60, right: 60, top: 330, textAlign: 'center', direction: 'rtl', fontFamily: KUFI, fontWeight: 900, lineHeight: 1.25, textShadow: '0 6px 30px rgba(0,0,0,0.9)'}}>
          <div style={{fontSize: 70, color: 'rgba(244,238,226,0.8)', opacity: k(t, 54.2, 54.6)}}>عشان تخرج من هنا</div>
          <div style={{fontSize: 80, color: IVORY, opacity: pop, transform: `scale(${0.9 + 0.1 * pop})`}}>
            كم ضعف <span style={{color: RED}}>سرعة الضوء</span>؟
          </div>
        </div>
        {t > 60.2 && (
          <div style={{position: 'absolute', left: 0, right: 0, top: 1300, textAlign: 'center', fontFamily: KUFI, fontWeight: 900, fontSize: 80, color: IVORY, opacity: k(t, 60.26, 60.6), textShadow: '0 6px 30px rgba(0,0,0,0.9)'}}>
            اشترك
          </div>
        )}
      </AbsoluteFill>
    );
  }
  return <AbsoluteFill style={{opacity}}>{body}</AbsoluteFill>;
};

export const HorizonPro: React.FC = () => {
  const t = useSeconds();
  const {fps} = useVideoConfig();
  return (
    <AbsoluteFill style={{background: '#000'}}>
      {SHOTS.map((s, i) => (
        <ShotView key={i} s={s} t={t} first={i === 0} last={i === SHOTS.length - 1} />
      ))}
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 50%, rgba(0,0,0,0) 58%, rgba(0,0,0,0.5) 100%)'}} />
      <Grain frame={Math.round(t * fps)} />
      <Audio src={staticFile('horizon/vo.wav')} />
      <Audio src={staticFile('horizon/drone.wav')} volume={(f) => 0.18 * (1 - interpolate(f / fps, [23.1, 23.4, 24.2, 24.6], [0, 1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}) * 0.85)} />
    </AbsoluteFill>
  );
};
