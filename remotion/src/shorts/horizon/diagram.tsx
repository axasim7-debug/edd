// Ink diagram of a (non-rotating) black hole, shared by both versions.
// World units: hole at (0, 0), horizon radius R. The "river" pictures follow the
// Gullstrand–Painlevé (river) model: space flows inward at v = c·sqrt(R/r), so a
// flash of light emitted at r spreads as a circle (radius c·τ) whose centre is
// carried inward by v·τ. At r = R the circle just touches the emitter; inside,
// every direction ends deeper in. Illustrations, not to scale.
import {createContext, useContext} from 'react';
import type {BoardCam} from '../../lib/paper';

export const R = 200;

export type Theme = {
  line: string; // main ink
  faint: string;
  hole: string;
  key: string; // red: danger / the key fact
  light: string; // light rays
  suit: string; // astronaut fill
};
export const PAPER_THEME: Theme = {line: '#292824', faint: 'rgba(41,40,36,0.35)', hole: '#171817', key: '#A43B32', light: '#292824', suit: '#E8DDC5'};
export const DARK_THEME: Theme = {line: '#E8DDC5', faint: 'rgba(232,221,197,0.3)', hole: '#000', key: '#C9483C', light: '#E8DDC5', suit: '#171817'};

const Ctx = createContext<{z: number; th: Theme}>({z: 1, th: PAPER_THEME});
const useD = () => {
  const {z, th} = useContext(Ctx);
  return {th, u: (px: number) => px / z};
};

// Full-screen SVG; world point cam.(x, y) lands on screen (cx, cy).
export const Diagram: React.FC<{cam: BoardCam; theme: Theme; cx?: number; cy?: number; children: React.ReactNode}> = ({cam, theme, cx = 540, cy = 1200, children}) => (
  <svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
    <Ctx.Provider value={{z: cam.z, th: theme}}>
      <g transform={`translate(${cx} ${cy}) scale(${cam.z}) translate(${-cam.x} ${-cam.y})`}>{children}</g>
    </Ctx.Provider>
  </svg>
);

const rnd = (i: number) => {
  const v = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return v - Math.floor(v);
};

export const Stars: React.FC<{show: number; n?: number; r0?: number; r1?: number}> = ({show, n = 140, r0 = R * 1.6, r1 = R * 7}) => {
  const {th, u} = useD();
  if (show <= 0) return null;
  return (
    <g opacity={show}>
      {Array.from({length: n}, (_, i) => {
        const a = rnd(i) * Math.PI * 2;
        const r = r0 + (r1 - r0) * Math.sqrt(rnd(i + 999));
        const s = 1.6 + 2.6 * rnd(i + 77);
        return <circle key={i} cx={Math.cos(a) * r} cy={Math.sin(a) * r} r={u(s)} fill={th.line} opacity={0.35 + 0.5 * rnd(i + 5)} />;
      })}
    </g>
  );
};

// The black region and the horizon line (`draw` traces it, `key` turns it red).
export const Hole: React.FC<{draw?: number; key_?: number; fill?: number}> = ({draw = 1, key_ = 0, fill = 1}) => {
  const {th, u} = useD();
  return (
    <g>
      {/* soft edge: the horizon is a boundary, not a surface */}
      <defs>
        <radialGradient id="holefill">
          <stop offset="0.55" stopColor={th.hole} stopOpacity={1} />
          <stop offset="1" stopColor={th.hole} stopOpacity={0.62} />
        </radialGradient>
      </defs>
      <circle r={R} fill="url(#holefill)" opacity={fill} />
      {draw > 0 && (
        <circle
          r={R}
          fill="none"
          stroke={key_ > 0.5 ? th.key : th.line}
          strokeWidth={u(key_ > 0.5 ? 7 : 5)}
          pathLength={1}
          strokeDasharray={draw >= 1 ? `${0.012} ${0.012}` : `${draw} 1`}
          transform="rotate(-90)"
        />
      )}
    </g>
  );
};

// Hot gas kept far away: a hatched ring.
export const Gas: React.FC<{show: number; r0?: number; r1?: number}> = ({show, r0 = R * 2.7, r1 = R * 3.3}) => {
  const {th, u} = useD();
  if (show <= 0) return null;
  return (
    <g opacity={show}>
      <circle r={(r0 + r1) / 2} fill="none" stroke={th.faint} strokeWidth={r1 - r0} strokeDasharray={`${u(3)} ${u(9)}`} />
      <circle r={r0} fill="none" stroke={th.line} strokeWidth={u(2)} strokeDasharray={`${u(10)} ${u(8)}`} />
      <circle r={r1} fill="none" stroke={th.line} strokeWidth={u(2)} strokeDasharray={`${u(10)} ${u(8)}`} />
    </g>
  );
};

export const Astronaut: React.FC<{x: number; y: number; s?: number; rot?: number; show?: number}> = ({x, y, s = 1, rot = 0, show = 1}) => {
  const {th, u} = useD();
  if (show <= 0) return null;
  const sw = u(3) / s;
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`} opacity={show} stroke={th.line} strokeWidth={sw} strokeLinejoin="round" strokeLinecap="round">
      <rect x={-13} y={-6} width={10} height={22} rx={3} fill={th.suit} />
      <path d="M-8,4 L-16,18 M8,4 L17,16" fill="none" strokeWidth={sw * 2.6} stroke={th.line} />
      <path d="M-8,4 L-16,18 M8,4 L17,16" fill="none" strokeWidth={sw * 1.2} stroke={th.suit} />
      <rect x={-9} y={-4} width={18} height={24} rx={6} fill={th.suit} />
      <path d="M-5,19 L-7,34 M5,19 L7,34" fill="none" strokeWidth={sw * 2.6} stroke={th.line} />
      <path d="M-5,19 L-7,34 M5,19 L7,34" fill="none" strokeWidth={sw * 1.2} stroke={th.suit} />
      <circle cx={0} cy={-14} r={11} fill={th.suit} />
      <path d="M-7,-17 Q0,-21 7,-17 L6,-11 Q0,-8 -6,-11 Z" fill={th.line} stroke="none" />
    </g>
  );
};

type P2 = [number, number];
const bez = (a: P2, c: P2, b: P2, k: number): P2 => [
  (1 - k) ** 2 * a[0] + 2 * (1 - k) * k * c[0] + k ** 2 * b[0],
  (1 - k) ** 2 * a[1] + 2 * (1 - k) * k * c[1] + k ** 2 * b[1],
];

// A light ray (quadratic curve) drawn up to `progress`, with an arrowhead.
export const Ray: React.FC<{a: P2; b: P2; c?: P2; progress: number; color?: string; width?: number; dashed?: boolean; head?: boolean}> = ({
  a,
  b,
  c,
  progress,
  color,
  width = 4,
  dashed = false,
  head = true,
}) => {
  const {th, u} = useD();
  if (progress <= 0) return null;
  const ctrl = c ?? [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  const n = 40;
  const pts = Array.from({length: n + 1}, (_, i) => bez(a, ctrl, b, (i / n) * Math.min(1, progress)));
  const end = pts[n];
  const prev = pts[n - 2];
  const ang = Math.atan2(end[1] - prev[1], end[0] - prev[0]);
  const hl = u(width * 5);
  const col = color ?? th.light;
  return (
    <g>
      <path
        d={'M' + pts.map((p) => p.join(',')).join('L')}
        fill="none"
        stroke={col}
        strokeWidth={u(width)}
        strokeLinecap="round"
        strokeDasharray={dashed ? `${u(width * 3)} ${u(width * 2.4)}` : undefined}
      />
      {head && (
        <polygon
          points={`${end[0] + Math.cos(ang) * hl * 0.6},${end[1] + Math.sin(ang) * hl * 0.6} ${end[0] + Math.cos(ang + 2.5) * hl},${end[1] + Math.sin(ang + 2.5) * hl} ${end[0] + Math.cos(ang - 2.5) * hl},${end[1] + Math.sin(ang - 2.5) * hl}`}
          fill={col}
        />
      )}
    </g>
  );
};

// Red pencil cross in world space.
export const Cross: React.FC<{x: number; y: number; s: number; progress: number}> = ({x, y, s, progress}) => {
  const {th, u} = useD();
  if (progress <= 0) return null;
  const p1 = Math.min(1, progress * 2);
  const p2 = Math.max(0, progress * 2 - 1);
  return (
    <g stroke={th.key} strokeWidth={u(12)} strokeLinecap="round" fill="none" opacity={0.9}>
      <path d={`M${x - s},${y - s} L${x + s},${y + s}`} pathLength={1} strokeDasharray={`${p1} 1`} />
      <path d={`M${x + s},${y - s} L${x - s},${y + s}`} pathLength={1} strokeDasharray={`${p2} 1`} />
    </g>
  );
};

// A brick "surface" on the horizon arc — the thing that is NOT there.
export const Wall: React.FC<{show: number; a0?: number; a1?: number}> = ({show, a0 = -125, a1 = -55}) => {
  const {th, u} = useD();
  if (show <= 0) return null;
  const rad = (d: number) => (d * Math.PI) / 180;
  const arc = (r: number) => `M${Math.cos(rad(a0)) * r},${Math.sin(rad(a0)) * r} A${r},${r} 0 0 1 ${Math.cos(rad(a1)) * r},${Math.sin(rad(a1)) * r}`;
  const bricks = [];
  for (let d = a0; d <= a1; d += 7) {
    const o = (Math.round((d - a0) / 7) % 2) * 3.5;
    bricks.push(<path key={d} d={`M${Math.cos(rad(d + o)) * R},${Math.sin(rad(d + o)) * R} L${Math.cos(rad(d + o)) * (R + 13)},${Math.sin(rad(d + o)) * (R + 13)}`} />);
    bricks.push(<path key={d + 'b'} d={`M${Math.cos(rad(d + 3.5 - o)) * (R + 13)},${Math.sin(rad(d + 3.5 - o)) * (R + 13)} L${Math.cos(rad(d + 3.5 - o)) * (R + 26)},${Math.sin(rad(d + 3.5 - o)) * (R + 26)}`} />);
  }
  return (
    <g opacity={show} stroke={th.line} strokeWidth={u(3)} fill="none">
      <path d={arc(R)} />
      <path d={arc(R + 13)} />
      <path d={arc(R + 26)} />
      {bricks}
    </g>
  );
};

// A tiny measured gap between the horizon and a point just inside it.
export const Gap: React.FC<{x: number; y0: number; y1: number; show: number}> = ({x, y0, y1, show}) => {
  const {th, u} = useD();
  if (show <= 0) return null;
  const t = u(10);
  return (
    <g opacity={show} stroke={th.key} strokeWidth={u(5)} fill="none">
      <path d={`M${x - t},${y0} L${x + t},${y0} M${x - t},${y1} L${x + t},${y1} M${x},${y0} L${x},${y1}`} />
    </g>
  );
};

// River-model light flash at radius r on the vertical axis (above the hole):
// emitter dot plus the circle light reaches after time τ (`size`).
export const Flash: React.FC<{r: number; size: number; show: number; ang?: number}> = ({r, size, show, ang = -90}) => {
  const {th, u} = useD();
  if (show <= 0) return null;
  const a = (ang * Math.PI) / 180;
  const [ex, ey] = [Math.cos(a) * r, Math.sin(a) * r];
  const v = Math.sqrt(R / r); // inflow speed in units of c
  const [cx, cy] = [ex - Math.cos(a) * v * size, ey - Math.sin(a) * v * size];
  const inside = r < R * 0.999;
  return (
    <g opacity={show}>
      <circle cx={cx} cy={cy} r={size} fill={inside ? 'rgba(164,59,50,0.18)' : 'none'} stroke={inside ? th.key : th.line} strokeWidth={u(3)} strokeDasharray={`${u(8)} ${u(6)}`} />
      <line x1={ex} y1={ey} x2={cx} y2={cy} stroke={th.faint} strokeWidth={u(2.5)} />
      <circle cx={ex} cy={ey} r={u(7)} fill={inside ? th.key : th.line} />
    </g>
  );
};

// Radio pulses from an emitter inside the horizon: each ring grows at c while
// being carried inward, so its outer edge never reaches the horizon.
export const Pulses: React.FC<{y: number; t: number; from: number; show: number; every?: number; c?: number}> = ({y, t, from, show, every = 0.7, c = 70}) => {
  const {th, u} = useD();
  if (show <= 0 || t < from) return null;
  const v = Math.sqrt(R / Math.abs(y));
  const rings = [];
  for (let k = 0; k < 6; k++) {
    const tau = t - from - k * every;
    if (tau <= 0) continue;
    const size = c * tau;
    const fade = Math.max(0, 1 - tau / 3.2);
    if (fade <= 0) continue;
    rings.push(<circle key={k} cx={0} cy={y + v * size} r={size} fill="none" stroke={th.key} strokeWidth={u(4)} opacity={fade} />);
  }
  return <g opacity={show}>{rings}</g>;
};

// Envelope (a "message") at (x, y).
export const Envelope: React.FC<{x: number; y: number; s?: number; show: number}> = ({x, y, s = 1, show}) => {
  const {th, u} = useD();
  if (show <= 0) return null;
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} opacity={show} stroke={th.line} strokeWidth={u(3) / s} strokeLinejoin="round">
      <rect x={-22} y={-15} width={44} height={30} fill={th.suit} />
      <path d="M-22,-15 L0,4 L22,-15" fill="none" />
    </g>
  );
};
