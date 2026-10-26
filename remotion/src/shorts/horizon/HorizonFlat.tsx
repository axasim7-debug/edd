// Short #5, version "flat" — Kurzgesagt-inspired flat illustration: deep
// violet sky, layered stars, a round-suited astronaut, soft halos, smooth
// easing and gentle secondary motion. The "space flows inward like a river"
// scene follows the river model of a black hole (inflow = c at the horizon).
// No captions.
import {AbsoluteFill, Audio, Easing, interpolate, staticFile, useVideoConfig} from 'remotion';
import {useSeconds} from '../../lib/map';
import {KUFI} from '../../lib/arabic';
import {SfxTrack, type Cue} from '../../lib/sfx';
import {DURATION} from './scene';
import {MATH} from './HorizonMath'; // also loads the STIX math font

export {DURATION};
const P = {
  skyTop: '#120D33',
  skyBot: '#31195A',
  star: '#FFF4D6',
  yellow: '#FFC93C',
  orange: '#FF8A3D',
  pink: '#FF5D8F',
  cyan: '#4FD8EB',
  suit: '#F5F2EC',
  suitShade: '#C8C1D8',
  visor: '#1C2A55',
  visorHi: '#6CC8F0',
  ink: '#140F2E',
  white: '#FFFFFF',
};
const sm = Easing.bezier(0.45, 0, 0.25, 1);
const k = (t: number, a: number, b: number, e = sm) => interpolate(t, [a, b], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: e});
const on = (t: number, a: number, b: number, f = 0.35) => Math.min(k(t, a - f, a + f * 0.2), 1 - k(t, b - f * 0.2, b + f));
const lerp = (a: number, b: number, x: number) => a + (b - a) * x;
const rnd = (i: number) => {
  const v = Math.sin(i * 12.9898 + 4.1414) * 43758.5453;
  return v - Math.floor(v);
};

// ---------- sky ----------
const STARS = Array.from({length: 160}, (_, i) => ({x: rnd(i) * 1080, y: rnd(i + 300) * 1920, r: 1.2 + 3.2 * rnd(i + 600) ** 3, layer: i % 3, tw: rnd(i + 900) * 6.28}));
const Sky: React.FC<{t: number; drift?: number}> = ({t, drift = 0}) => (
  <svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
    <defs>
      <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor={P.skyTop} />
        <stop offset="1" stopColor={P.skyBot} />
      </linearGradient>
    </defs>
    <defs>
      <radialGradient id="nebA">
        <stop offset="0" stopColor={P.pink} stopOpacity={0.16} />
        <stop offset="1" stopColor={P.pink} stopOpacity={0} />
      </radialGradient>
      <radialGradient id="nebB">
        <stop offset="0" stopColor={P.cyan} stopOpacity={0.12} />
        <stop offset="1" stopColor={P.cyan} stopOpacity={0} />
      </radialGradient>
    </defs>
    <rect width={1080} height={1920} fill="url(#sky)" />
    {/* soft nebula glows */}
    <circle cx={180} cy={420} r={620} fill="url(#nebA)" />
    <circle cx={950} cy={1500} r={720} fill="url(#nebB)" />
    {STARS.map((s, i) => {
      const y = (((s.y + drift * (s.layer + 1) * 0.35) % 1920) + 1920) % 1920;
      const tw = 0.6 + 0.4 * Math.sin(t * 2 + s.tw);
      return s.r > 3.2 ? (
        <g key={i} transform={`translate(${s.x} ${y})`} opacity={tw}>
          <circle r={s.r * 3} fill={P.star} opacity={0.12} />
          <path d={`M0,${-s.r * 2.6} Q0,0 ${s.r * 2.6},0 Q0,0 0,${s.r * 2.6} Q0,0 ${-s.r * 2.6},0 Q0,0 0,${-s.r * 2.6}Z`} fill={P.star} />
        </g>
      ) : (
        <circle key={i} cx={s.x} cy={y} r={s.r} fill={P.star} opacity={0.5 + 0.5 * tw * (s.layer / 2)} />
      );
    })}
  </svg>
);

// ---------- black hole (front view): black disk, bright ring, soft halo, optional far gas ----------
const Hole: React.FC<{x: number; y: number; r: number; gas?: number; t: number}> = ({x, y, r, gas = 0, t}) => (
  <g>
    {[2.2, 1.8, 1.5, 1.3].map((m, i) => (
      <circle key={i} cx={x} cy={y} r={r * m} fill={P.orange} opacity={0.035 + i * 0.015} />
    ))}
    {gas > 0 && (
      <g opacity={gas} transform={`translate(${x} ${y}) rotate(-8)`}>
        <ellipse rx={r * 3.4} ry={r * 0.55} fill="none" stroke={P.orange} strokeWidth={r * 0.32} opacity={0.35} />
        <ellipse rx={r * 3.4} ry={r * 0.55} fill="none" stroke={P.yellow} strokeWidth={r * 0.1} opacity={0.8} strokeDasharray={`${r * 0.6} ${r * 0.25}`} strokeDashoffset={-t * r * 0.8} />
      </g>
    )}
    <circle cx={x} cy={y} r={r * 1.12} fill="none" stroke={P.yellow} strokeWidth={r * 0.06} opacity={0.9} />
    <circle cx={x} cy={y} r={r * 1.05} fill="none" stroke={P.white} strokeWidth={r * 0.025} opacity={0.9} />
    <circle cx={x} cy={y} r={r} fill="#05030F" />
  </g>
);

// ---------- astronaut ----------
// (x, y) = centre of the body; s = scale (1 ≈ 220 px tall). arm: 0 relaxed … 1 reaching up.
const Astronaut: React.FC<{x: number; y: number; s: number; rot?: number; arm?: number; torch?: boolean; t: number}> = ({x, y, s, rot = 0, arm = 0, torch = false, t}) => {
  const bob = Math.sin(t * 1.6) * 6;
  const aL = lerp(25, -150, arm) + Math.sin(t * 2.1) * 6;
  const aR = lerp(-25, 160, arm * 0.4) + Math.sin(t * 1.7 + 1) * 6;
  const limb = (len: number, w: number, ang: number, ox: number, oy: number, key: string) => (
    <g key={key} transform={`translate(${ox} ${oy}) rotate(${ang})`}>
      <rect x={-w / 2} y={0} width={w} height={len} rx={w / 2} fill={P.suit} />
      <rect x={w * 0.05} y={0} width={w * 0.45} height={len} rx={w / 4} fill={P.suitShade} opacity={0.7} />
      <circle cx={0} cy={len} r={w * 0.62} fill={P.suitShade} />
    </g>
  );
  return (
    <g transform={`translate(${x} ${y + bob}) rotate(${rot}) scale(${s})`}>
      {/* backpack */}
      <rect x={-62} y={-70} width={124} height={130} rx={26} fill={P.suitShade} />
      {limb(70, 34, 18 + Math.sin(t * 1.3) * 5, -24, 52, 'legL')}
      {limb(70, 34, -14 + Math.sin(t * 1.5 + 2) * 5, 24, 52, 'legR')}
      {limb(64, 28, aL, -46, -26, 'armL')}
      {limb(64, 28, aR, 46, -26, 'armR')}
      {/* body */}
      <rect x={-50} y={-60} width={100} height={120} rx={44} fill={P.suit} />
      <path d="M8,-58 Q50,-55 50,0 L50,16 Q50,58 8,60 Z" fill={P.suitShade} opacity={0.55} />
      <rect x={-22} y={-8} width={44} height={26} rx={8} fill={P.orange} />
      <circle cx={-9} cy={5} r={5} fill={P.yellow} />
      <circle cx={9} cy={5} r={5} fill={P.cyan} />
      {/* helmet */}
      <circle cx={0} cy={-104} r={58} fill={P.suit} />
      <path d="M20,-158 A58,58 0 0 1 20,-50 A70,70 0 0 0 20,-158Z" fill={P.suitShade} opacity={0.5} />
      <ellipse cx={4} cy={-104} rx={42} ry={36} fill={P.visor} />
      <ellipse cx={-12} cy={-118} rx={14} ry={8} fill={P.visorHi} opacity={0.75} transform="rotate(-25 -12 -118)" />
      <circle cx={20} cy={-92} r={4} fill={P.visorHi} opacity={0.6} />
      {torch && (
        <g transform={`translate(-46 -26) rotate(${aL})`}>
          <rect x={-10} y={58} width={20} height={26} rx={4} fill={P.ink} />
        </g>
      )}
    </g>
  );
};

// A beam of light with a soft halo, drawn along a quadratic curve up to p.
const Beam: React.FC<{a: [number, number]; c: [number, number]; b: [number, number]; p: number; color?: string; w?: number}> = ({a, c, b, p, color = P.yellow, w = 10}) => {
  if (p <= 0) return null;
  const d = `M${a[0]},${a[1]} Q${c[0]},${c[1]} ${b[0]},${b[1]}`;
  return (
    <g>
      <path d={d} fill="none" stroke={color} strokeWidth={w * 3.2} strokeLinecap="round" opacity={0.15} pathLength={1} strokeDasharray={`${p} 1`} />
      <path d={d} fill="none" stroke={color} strokeWidth={w} strokeLinecap="round" pathLength={1} strokeDasharray={`${p} 1`} />
      <path d={d} fill="none" stroke={P.white} strokeWidth={w * 0.35} strokeLinecap="round" pathLength={1} strokeDasharray={`${p} 1`} opacity={0.8} />
    </g>
  );
};

const Bubble: React.FC<{x: number; y: number; p: number; text: string; size?: number}> = ({x, y, p, text, size = 90}) => {
  if (p <= 0) return null;
  const s = Easing.out(Easing.back(2))(Math.min(1, p));
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <circle r={size * 0.7} fill={P.white} />
      <circle cx={-size * 0.55} cy={size * 0.7} r={size * 0.12} fill={P.white} />
      <circle cx={-size * 0.75} cy={size * 0.95} r={size * 0.07} fill={P.white} />
      <text y={size * 0.3} textAnchor="middle" fontFamily={KUFI} fontWeight={900} fontSize={size} fill={P.ink}>
        {text}
      </text>
    </g>
  );
};

// ---------- scenes ----------
// 1. 0–7.76: you cross without noticing; light still comes in; no way back.
const SceneCross: React.FC<{t: number; o: number}> = ({t, o}) => {
  if (o <= 0) return null;
  const hy = 1720;
  const hr = 900;
  const ay = interpolate(t, [0, 3.1, 7.8], [690, 880, 1040], {extrapolateRight: 'clamp', easing: Easing.inOut(Easing.quad)}); // horizon top at y = 820
  const reach = k(t, 5.9, 6.6) * (1 - k(t, 7.4, 7.76));
  return (
    <g opacity={o}>
      <Hole x={540} y={hy} r={hr} t={t} />
      {/* the horizon itself: a dashed line, nothing solid */}
      <circle cx={540} cy={hy} r={hr + 4} fill="none" stroke={P.orange} strokeWidth={5} strokeDasharray="22 18" strokeDashoffset={t * 20} opacity={0.9} />
      {/* starlight still reaching the visor (4.0–5.8) */}
      {[[-380, 380], [120, 280], [460, 420]].map(([sx, sy], i) => (
        <Beam key={i} a={[sx + 540, sy]} c={[lerp(sx + 540, 540, 0.5), lerp(sy, ay - 120, 0.4)]} b={[540 + (i - 1) * 14, ay - 110]} p={k(t, 4.0 + i * 0.15, 5.2 + i * 0.15) * (1 - k(t, 7.3, 7.7))} w={8} />
      ))}
      <Astronaut x={540} y={ay} s={0.85} rot={interpolate(t, [0, 7.8], [-12, 10])} arm={reach} t={t} />
      <Bubble x={720} y={ay - 300} p={k(t, 3.3, 3.7) * (1 - k(t, 5.4, 5.8))} text="؟" />
    </g>
  );
};

// 2. 7.76–12.74: the hole is huge; the hot gas is far away.
const SceneScale: React.FC<{t: number; o: number}> = ({t, o}) => {
  if (o <= 0) return null;
  const z = interpolate(t, [7.6, 9.4, 12.9], [1, 0.32, 0.28], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: sm});
  const r = 900 * z;
  return (
    <g opacity={o}>
      <Hole x={540} y={1000 + 720 * z} r={r} gas={k(t, 10.4, 11.4)} t={t} />
      <Astronaut x={540} y={1000 + 720 * z - r - 40 * z} s={0.85 * z} rot={10} t={t} />
    </g>
  );
};

// 3. 12.74–24.38: the horizon is just a line in space — no wall, no sign.
const SceneNoWall: React.FC<{t: number; o: number}> = ({t, o}) => {
  if (o <= 0) return null;
  const lineY = 1050;
  const ax = interpolate(t, [12.74, 24.4], [380, 700]);
  const ay = interpolate(t, [12.74, 18.9, 21.2], [700, lineY, lineY + 130], {extrapolateRight: 'clamp', easing: Easing.inOut(Easing.quad)});
  const wall = on(t, 15.6, 17.4, 0.3);
  const shatter = k(t, 16.9, 17.6);
  const zoom = interpolate(t, [19.6, 20.6], [1, 1.5], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: sm});
  return (
    <g opacity={o} transform={`translate(540 ${lineY}) scale(${zoom}) translate(-540 ${-lineY})`}>
      <rect x={-200} y={lineY} width={1480} height={1400} fill="#05030F" opacity={0.85} />
      <line x1={-200} y1={lineY} x2={1280} y2={lineY} stroke={P.orange} strokeWidth={6} strokeDasharray="26 20" strokeDashoffset={t * 24} />
      {/* a wall appears… and isn't there */}
      {wall > 0 &&
        Array.from({length: 12}, (_, i) => {
          const bx = 300 + (i % 6) * 80 + (Math.floor(i / 6) % 2) * 40;
          const by = lineY - 80 + Math.floor(i / 6) * 44;
          const fly = shatter * (1 + rnd(i) * 2);
          return (
            <rect
              key={i}
              x={bx + (rnd(i + 5) - 0.5) * 300 * fly}
              y={by - 60 * fly + 400 * fly * fly}
              width={74}
              height={38}
              rx={6}
              fill={P.pink}
              opacity={wall * (1 - shatter)}
              transform={`rotate(${(rnd(i + 9) - 0.5) * 160 * fly} ${bx + 37} ${by + 19})`}
            />
          );
        })}
      <Astronaut x={ax} y={ay} s={0.7} rot={interpolate(t, [12.74, 24.4], [-8, 14])} t={t} />
      {/* a tiny gap below the line (20–24) */}
      {t > 20.2 && (
        <g opacity={k(t, 20.4, 20.9) * (1 - k(t, 24.0, 24.4))} stroke={P.cyan} strokeWidth={5} strokeLinecap="round">
          <line x1={ax + 120} y1={lineY} x2={ax + 120} y2={ay - 120} />
          <line x1={ax + 100} y1={lineY} x2={ax + 140} y2={lineY} />
          <line x1={ax + 100} y1={ay - 120} x2={ax + 140} y2={ay - 120} />
        </g>
      )}
    </g>
  );
};

// 4. 24.38–26.48: general relativity card.
const SceneGR: React.FC<{t: number; o: number}> = ({t, o}) => {
  if (o <= 0) return null;
  const pop = Easing.out(Easing.back(1.6))(k(t, 24.4, 24.9, (x) => x));
  return (
    <g opacity={o} transform={`translate(540 900) scale(${0.85 + 0.15 * pop}) translate(-540 -900)`}>
      <rect x={110} y={700} width={860} height={400} rx={48} fill={P.ink} opacity={0.75} />
      <circle cx={540} cy={700} r={70} fill={P.yellow} />
      <text x={540} y={728} textAnchor="middle" fontFamily={MATH} fontStyle="italic" fontSize={80} fill={P.ink}>
        G
      </text>
      <foreignObject x={110} y={830} width={860} height={180}>
        <div style={{textAlign: 'center', fontFamily: MATH, fontSize: 76, color: P.white}}>
          <i>G</i>
          <sub style={{fontSize: 40}}>μν</sub> = <span style={{color: P.yellow}}>8π<i>G</i></span>/<i style={{color: P.yellow}}>c</i>
          <sup style={{fontSize: 40}}>4</sup> <i>T</i>
          <sub style={{fontSize: 40}}>μν</sub>
        </div>
      </foreignObject>
      <text x={540} y={1060} textAnchor="middle" fontFamily={MATH} fontSize={40} fill={P.suitShade}>
        Einstein · 1915
      </text>
    </g>
  );
};

// 5–6. 26.48–34.46: the torch beam turns back; space itself flows inward.
const RIVER = Array.from({length: 70}, (_, i) => ({x: rnd(i + 40) * 1080, ph: rnd(i + 80), len: 40 + 60 * rnd(i + 120)}));
const SceneRiver: React.FC<{t: number; o: number}> = ({t, o}) => {
  if (o <= 0) return null;
  const lineY = 980;
  const ax = 540;
  const ay = 1250;
  // the beam goes up, slows and is carried back down (26.5–29.8)
  const bp = k(t, 28.2, 29.7, (x) => x);
  const tipY = ay - 140 - Math.sin(bp * Math.PI) * 260;
  const riverO = k(t, 30.4, 31.2);
  return (
    <g opacity={o}>
      <rect x={0} y={lineY} width={1080} height={940} fill="#05030F" opacity={0.85} />
      <line x1={0} y1={lineY} x2={1080} y2={lineY} stroke={P.orange} strokeWidth={6} strokeDasharray="26 20" strokeDashoffset={t * 24} />
      {/* flowing space: streaks speeding up downward (river model) */}
      <g opacity={riverO}>
        {RIVER.map((s, i) => {
          const speed = 380;
          const yy = ((s.ph * 2400 + (t - 30.4) * speed * (1 + s.ph)) % 2400) - 300;
          return <rect key={i} x={s.x} y={yy} width={6} height={s.len * (1 + Math.max(0, (yy - 400) / 600))} rx={3} fill={P.cyan} opacity={0.35} />;
        })}
      </g>
      {t > 26.4 && t < 30.6 && (
        <Beam a={[ax - 30, ay - 150]} c={[ax + 60, tipY - 160]} b={[ax + 140, ay - 120 + (1 - Math.sin(bp * Math.PI)) * 120 * bp]} p={k(t, 28.1, 29.8, (x) => x)} w={10} />
      )}
      <Astronaut x={ax} y={ay} s={0.8} rot={-6 + Math.sin(t) * 4} arm={k(t, 26.6, 27.4)} torch t={t} />
      {/* swimming up, still carried down (32–34.4) */}
      {riverO > 0 && (
        <g opacity={riverO * (1 - k(t, 34.2, 34.5))}>
          <path d={`M${ax + 200},${ay - 140} l0,-120`} stroke={P.white} strokeWidth={10} strokeLinecap="round" opacity={0.6} />
          <path d={`M${ax + 170},${ay - 230} l30,-36 l30,36`} fill="none" stroke={P.white} strokeWidth={10} strokeLinecap="round" strokeLinejoin="round" opacity={0.6} />
          <path d={`M${ax - 200},${ay - 260} l0,${120 + 40 * k(t, 31, 34)}`} stroke={P.cyan} strokeWidth={16} strokeLinecap="round" />
          <path d={`M${ax - 236},${ay - 140 + 40 * k(t, 31, 34)} l36,40 l36,-40`} fill="none" stroke={P.cyan} strokeWidth={16} strokeLinecap="round" strokeLinejoin="round" />
        </g>
      )}
    </g>
  );
};

// 7–8. 34.46–44.6: the sky still shines in; your message can't get out.
const SceneMessage: React.FC<{t: number; o: number}> = ({t, o}) => {
  if (o <= 0) return null;
  const lineY = 760;
  const ax = 540;
  const ay = 1180;
  const plane = k(t, 38.2, 40.3, (x) => x);
  const px = ax + 60 + plane * 120;
  const py = ay - 160 - Math.sin(plane * Math.PI) * 300;
  return (
    <g opacity={o}>
      <rect x={0} y={lineY} width={1080} height={1200} fill="#05030F" opacity={0.85} />
      <line x1={0} y1={lineY} x2={1080} y2={lineY} stroke={P.orange} strokeWidth={6} strokeDasharray="26 20" strokeDashoffset={t * 24} />
      {[[160, 260], [540, 180], [900, 300]].map(([sx, sy], i) => (
        <Beam key={i} a={[sx, sy]} c={[lerp(sx, ax, 0.6), lerp(sy, ay, 0.3)]} b={[ax + (i - 1) * 16, ay - 130]} p={k(t, 35.6 + i * 0.2, 36.9 + i * 0.2) * (1 - k(t, 44.2, 44.6))} w={8} />
      ))}
      {plane > 0 && plane < 1 && (
        <g transform={`translate(${px} ${py}) rotate(${-40 + plane * 140})`}>
          <path d="M-40,0 L40,-14 L-10,26 Z" fill={P.white} />
          <path d="M-40,0 L40,-14 L-6,6 Z" fill={P.suitShade} />
        </g>
      )}
      <Astronaut x={ax} y={ay} s={0.8} rot={-4} arm={k(t, 37.8, 38.3) * (1 - k(t, 40.4, 41))} t={t} />
      <Bubble x={720} y={ay - 330} p={k(t, 40.32, 40.6) * (1 - k(t, 41.6, 41.86))} text="✕" size={80} />
    </g>
  );
};

// 9. 44.6–54.12: radio waves can't outrun the inflow; nothing beats light.
const SceneSignal: React.FC<{t: number; o: number}> = ({t, o}) => {
  if (o <= 0) return null;
  const lineY = 760;
  const ax = 540;
  const ay = 1200;
  const rings = [];
  for (let i = 0; i < 6; i++) {
    const tau = t - 45.3 - i * 0.7;
    if (tau <= 0 || tau > 3.4) continue;
    const R = tau * 150;
    const cy = ay - 150 + tau * 175; // carried inward faster than it spreads
    rings.push(<circle key={i} cx={ax} cy={cy} r={R} fill="none" stroke={P.yellow} strokeWidth={8} opacity={(1 - tau / 3.4) * 0.9} />);
  }
  const card = on(t, 49.64, 51.8);
  return (
    <g opacity={o}>
      <rect x={0} y={lineY} width={1080} height={1200} fill="#05030F" opacity={0.85} />
      <line x1={0} y1={lineY} x2={1080} y2={lineY} stroke={P.orange} strokeWidth={6} strokeDasharray="26 20" strokeDashoffset={t * 24} />
      {rings}
      <Astronaut x={ax} y={ay} s={0.8} rot={4} arm={0.6} t={t} />
      <g transform={`translate(${ax - 46} ${ay - 230})`}>
        <line x1={0} y1={0} x2={0} y2={-70} stroke={P.suitShade} strokeWidth={6} />
        <circle cx={0} cy={-74} r={10} fill={P.orange} />
      </g>
      {card > 0 && (
        <g opacity={card}>
          <rect x={190} y={330} width={700} height={250} rx={40} fill={P.ink} opacity={0.85} />
          <text x={540} y={450} textAnchor="middle" fontFamily={KUFI} fontWeight={900} fontSize={84} fill={P.yellow} direction="rtl">
            ٣٠٠٬٠٠٠ كم/ث
          </text>
          <text x={540} y={535} textAnchor="middle" fontFamily={KUFI} fontWeight={700} fontSize={44} fill={P.white} direction="rtl">
            أقصى سرعة في الكون
          </text>
        </g>
      )}
    </g>
  );
};

// 10. 54.12–end: the question.
const SceneQuestion: React.FC<{t: number; o: number}> = ({t, o}) => {
  if (o <= 0) return null;
  const z = interpolate(t, [54.12, DURATION], [0.45, 1.6], {easing: Easing.in(Easing.quad)});
  const r = 600 * z;
  const pop = Easing.out(Easing.back(1.8))(k(t, 54.9, 55.4, (x) => x));
  return (
    <g opacity={o}>
      <Hole x={540} y={1250} r={r} t={t} />
      <Astronaut x={540} y={1250 - r - 60} s={0.5} rot={Math.sin(t) * 8} t={t} />
      <g transform={`translate(540 520) scale(${pop})`}>
        <rect x={-360} y={-120} width={720} height={240} rx={48} fill={P.white} />
        <text y={40} textAnchor="middle" fontFamily={MATH} fontSize={120} fill={P.ink}>
          <tspan fontStyle="italic">c</tspan> × <tspan fill={P.orange} fontFamily={KUFI} fontWeight={900}>؟</tspan>
        </text>
      </g>
    </g>
  );
};

const Hook: React.FC<{t: number}> = ({t}) => {
  const o = 1 - k(t, 3.0, 3.5);
  if (o <= 0) return null;
  return (
    <div style={{position: 'absolute', left: 60, right: 60, top: 290, textAlign: 'center', direction: 'rtl', opacity: o}}>
      <span style={{display: 'inline-block', background: P.white, color: P.ink, fontFamily: KUFI, fontWeight: 900, fontSize: 80, padding: '4px 40px', borderRadius: 60}}>عدّيت… ومحسّتش؟</span>
    </div>
  );
};

const SFX: Cue[] = [
  [3.3, 'tap', 0.4],
  [7.02, 'impact', 0.25],
  [16.9, 'paper2', 0.35],
  [29.74, 'impact', 0.3],
  [40.32, 'tap', 0.45],
  [54.9, 'tap', 0.45],
];

export const flatScenes = (t: number) => ({
  cross: on(t, -1, 7.76),
  scale: on(t, 7.76, 12.74),
  wall: on(t, 12.74, 24.38),
  gr: on(t, 24.38, 26.48),
  river: on(t, 26.48, 34.46),
  msg: on(t, 34.46, 44.6),
  sig: on(t, 44.6, 54.12),
  q: on(t, 54.12, DURATION + 1),
});

export const HorizonFlat: React.FC = () => {
  const t = useSeconds();
  const {fps} = useVideoConfig();
  const o = flatScenes(t);
  return (
    <AbsoluteFill>
      <Sky t={t} drift={t * 6} />
      <svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
        <SceneCross t={t} o={o.cross} />
        <SceneScale t={t} o={o.scale} />
        <SceneNoWall t={t} o={o.wall} />
        <SceneGR t={t} o={o.gr} />
        <SceneRiver t={t} o={o.river} />
        <SceneMessage t={t} o={o.msg} />
        <SceneSignal t={t} o={o.sig} />
        <SceneQuestion t={t} o={o.q} />
      </svg>
      <Hook t={t} />
      <Audio src={staticFile('horizon/vo.wav')} />
      <Audio src={staticFile('horizon/drone.wav')} volume={(f) => 0.3 * (1 - interpolate(f / fps, [23.1, 23.4, 24.2, 24.6], [0, 1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}) * 0.85)} />
      <SfxTrack cues={SFX} />
    </AbsoluteFill>
  );
};
