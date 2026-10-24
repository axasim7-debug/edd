// Paper investigation-board system (docs/paper-documentary-master-prompt.md):
// a board in "board pixels" filmed by a virtual camera, with paper, prints,
// pins, red string, typed labels, stamps and an ink map.
import {createContext, useContext, useMemo} from 'react';
import {Easing, Img, interpolate, staticFile} from 'remotion';
import {loadFont} from '@remotion/fonts';
import {geoGraticule10, geoMercator, geoPath, type GeoProjection} from 'd3-geo';
import {feature} from 'topojson-client';
import type {Topology, GeometryCollection} from 'topojson-specification';
import type {FeatureCollection} from 'geojson';
import land50 from 'world-atlas/land-50m.json';
import {ramp} from './map';

loadFont({family: 'Special Elite', url: staticFile('fonts/SpecialElite-Regular.ttf')});
loadFont({family: 'Caveat', url: staticFile('fonts/Caveat.ttf')});
loadFont({family: 'Playfair Display', url: staticFile('fonts/PlayfairDisplay.ttf')});
loadFont({family: 'Courier Prime', url: staticFile('fonts/CourierPrime-Regular.ttf')});

export const INK = {
  ivory: '#E8DDC5',
  beige: '#D5C4A1',
  charcoal: '#171817',
  ink: '#292824',
  walnut: '#49382C',
  olive: '#62634A',
  red: '#A43B32',
  brass: '#AD9163',
  gray: '#77736C',
};
export const TYPE = "'Special Elite', 'Courier Prime', monospace";
export const HAND = "'Caveat', cursive";
export const SERIF = "'Playfair Display', serif";

const W = 1080;
const H = 1920;

export type BoardCam = {x: number; y: number; z: number};
export type BoardKey = {t: number; x: number; y: number; z: number};

export const boardCamAt = (keys: BoardKey[], t: number): BoardCam => {
  if (t <= keys[0].t) return keys[0];
  const last = keys[keys.length - 1];
  if (t >= last.t) return last;
  const i = keys.findIndex((k) => k.t > t) - 1;
  const a = keys[i];
  const b = keys[i + 1];
  const k = interpolate(t, [a.t, b.t], [0, 1], {easing: Easing.inOut(Easing.cubic)});
  return {
    x: a.x + (b.x - a.x) * k,
    y: a.y + (b.y - a.y) * k,
    z: Math.exp(Math.log(a.z) + (Math.log(b.z) - Math.log(a.z)) * k),
  };
};

const CamCtx = createContext<BoardCam>({x: 0, y: 0, z: 1});

// The board: everything inside is positioned in board pixels.
export const Board: React.FC<{cam: BoardCam; width: number; height: number; children: React.ReactNode}> = ({cam, width, height, children}) => (
  <CamCtx.Provider value={cam}>
    <div
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        width,
        height,
        transformOrigin: '0 0',
        transform: `translate(${W / 2 - cam.x * cam.z}px, ${H / 2 - cam.y * cam.z}px) scale(${cam.z})`,
      }}
    >
      {/* Cork extends past the board so wide shots never reveal an edge. */}
      <Img src={staticFile('paper/cork.jpg')} style={{position: 'absolute', left: -1600, top: -1600, width: width + 3200, height: height + 3200}} />
      {children}
    </div>
  </CamCtx.Provider>
);

// Small parallax: objects closer to the lens drift a little more than the board.
const useParallax = (x: number, y: number, depth: number) => {
  const cam = useContext(CamCtx);
  return [(x - cam.x) * depth * 0.035, (y - cam.y) * depth * 0.035];
};

// Deterministic torn edge as a CSS polygon.
const tornPolygon = (seed: number, rough = 1) => {
  const pts: string[] = [];
  const r = (i: number) => {
    const v = Math.sin(seed * 12.9898 + i * 78.233) * 43758.5453;
    return v - Math.floor(v);
  };
  const n = 24;
  for (let i = 0; i <= n; i++) pts.push(`${(i / n) * 100}% ${r(i) * 1.2 * rough}%`);
  for (let i = 0; i <= n; i++) pts.push(`${100 - r(i + 50) * 0.9 * rough}% ${(i / n) * 100}%`);
  for (let i = n; i >= 0; i--) pts.push(`${(i / n) * 100}% ${100 - r(i + 100) * 1.2 * rough}%`);
  for (let i = n; i >= 0; i--) pts.push(`${r(i + 150) * 0.9 * rough}% ${(i / n) * 100}%`);
  return `polygon(${pts.join(',')})`;
};

// Physical entrance: slides in from `from`, lands with a small rotation settle.
const landing = (show: number) => {
  const k = Easing.out(Easing.cubic)(Math.min(1, show));
  const settle = show < 1 ? Math.sin(Math.min(1, show) * Math.PI) * 0.6 : 0;
  return {k, settle};
};

export const Paper: React.FC<{
  x: number;
  y: number;
  w: number;
  h: number;
  rotate?: number;
  show: number;
  from?: [number, number];
  torn?: number;
  depth?: number;
  tone?: string;
  seed?: number;
  children?: React.ReactNode;
  style?: React.CSSProperties;
}> = ({x, y, w, h, rotate = 0, show, from = [0, 90], torn = 0, depth = 0.4, tone, seed = 1, children, style}) => {
  const [px, py] = useParallax(x, y, depth);
  if (show <= 0) return null;
  const {k, settle} = landing(show);
  const dx = from[0] * (1 - k);
  const dy = from[1] * (1 - k);
  const lift = 1 - k;
  return (
    <div
      style={{
        position: 'absolute',
        left: x - w / 2 + dx + px,
        top: y - h / 2 + dy + py,
        width: w,
        height: h,
        transform: `rotate(${rotate + settle}deg) scale(${1 + 0.04 * lift})`,
        filter: `drop-shadow(0 ${6 + 26 * lift}px ${8 + 24 * lift}px rgba(0,0,0,${0.55 - 0.15 * lift}))`,
        opacity: Math.min(1, show * 3),
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `url(${staticFile('paper/paper.jpg')})`,
          backgroundSize: '512px 512px',
          backgroundColor: tone ?? INK.ivory,
          backgroundBlendMode: tone ? 'multiply' : 'normal',
          clipPath: torn ? tornPolygon(seed, torn) : undefined,
          ...style,
        }}
      >
        {children}
      </div>
    </div>
  );
};

// Archival photographic print on paper, toned to the palette.
export const Print: React.FC<{
  src: string;
  x: number;
  y: number;
  w: number;
  h: number;
  rotate?: number;
  show: number;
  from?: [number, number];
  focus?: string;
  border?: number;
  depth?: number;
  dim?: number;
  children?: React.ReactNode;
}> = ({src, x, y, w, h, rotate = 0, show, from, focus = '50% 30%', border = 22, depth = 0.6, dim = 0, children}) => (
  <Paper x={x} y={y} w={w} h={h} rotate={rotate} show={show} from={from} depth={depth} tone="#efe7d6">
    <div style={{position: 'absolute', left: border, top: border, right: border, bottom: border, overflow: 'hidden', background: INK.charcoal}}>
      <Img
        src={staticFile(src)}
        style={{width: '100%', height: '100%', objectFit: 'cover', objectPosition: focus, filter: `grayscale(1) sepia(0.28) contrast(1.06) brightness(${1 - dim * 0.75})`}}
      />
    </div>
    {children}
  </Paper>
);

// Push pin: brass needle, painted head, real contact shadow; drops in.
export const Pin: React.FC<{x: number; y: number; show: number; color?: string}> = ({x, y, show, color = INK.red}) => {
  if (show <= 0) return null;
  const k = Easing.out(Easing.quad)(Math.min(1, show));
  const drop = (1 - k) * 60;
  const s = 1 + (1 - k) * 0.5;
  return (
    <svg style={{position: 'absolute', left: x - 40, top: y - 70, overflow: 'visible'}} width={80} height={80}>
      <ellipse cx={46 + drop * 0.4} cy={74} rx={14 * (0.6 + 0.4 * k)} ry={6 * (0.6 + 0.4 * k)} fill="rgba(0,0,0,0.45)" />
      <g transform={`translate(40 ${70 - drop}) scale(${s})`}>
        <line x1={0} y1={0} x2={0} y2={-8} stroke="#b9b2a2" strokeWidth={3} />
        <ellipse cx={0} cy={-10} rx={13} ry={5} fill={color} />
        <rect x={-7} y={-34} width={14} height={24} rx={5} fill={color} />
        <ellipse cx={0} cy={-36} rx={16} ry={7} fill={color} />
        <ellipse cx={-5} cy={-38} rx={5} ry={2.4} fill="rgba(255,255,255,0.45)" />
        <rect x={-5} y={-31} width={3} height={18} rx={1.5} fill="rgba(255,255,255,0.25)" />
      </g>
    </svg>
  );
};

// Red cotton string between two pin heads, drawn out and sagging naturally.
// `cut` > 0 snaps it in the middle and lets both halves fall.
export const StringLine: React.FC<{a: [number, number]; b: [number, number]; progress: number; sag?: number; cut?: number; color?: string}> = ({
  a,
  b,
  progress,
  sag = 0.06,
  cut = 0,
  color = INK.red,
}) => {
  if (progress <= 0) return null;
  const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
  const pt = (s: number, drop = 0): [number, number] => {
    const x = a[0] + (b[0] - a[0]) * s;
    const y = a[1] + (b[1] - a[1]) * s + Math.sin(s * Math.PI) * len * sag + drop;
    return [x, y];
  };
  const minX = Math.min(a[0], b[0]) - 200;
  const minY = Math.min(a[1], b[1]) - 200;
  const toPath = (pts: [number, number][]) => 'M' + pts.map(([x, y]) => `${x - minX},${y - minY}`).join('L');
  let d: string;
  if (cut <= 0) {
    const n = 40;
    d = toPath(Array.from({length: n + 1}, (_, i) => pt((i / n) * progress)));
  } else {
    const fall = Easing.in(Easing.quad)(Math.min(1, cut)) * len * 0.35;
    const left = Array.from({length: 21}, (_, i) => {
      const s = (i / 20) * 0.5;
      return pt(s, (s / 0.5) ** 2 * fall);
    });
    const right = Array.from({length: 21}, (_, i) => {
      const s = 0.5 + (i / 20) * 0.5;
      return pt(s, ((1 - s) / 0.5) ** 2 * fall);
    });
    d = toPath(left) + ' ' + toPath(right);
  }
  return (
    <svg
      style={{position: 'absolute', left: minX, top: minY, overflow: 'visible', pointerEvents: 'none'}}
      width={Math.abs(b[0] - a[0]) + 400}
      height={Math.abs(b[1] - a[1]) + 400 + len * 0.4}
    >
      <path d={d} fill="none" stroke="rgba(0,0,0,0.35)" strokeWidth={4} transform="translate(5 8)" />
      <path d={d} fill="none" stroke={color} strokeWidth={4} strokeLinecap="round" />
    </svg>
  );
};

// Typed label: text appears letter by letter like a typewriter.
export const Typed: React.FC<{text: string; progress: number; size?: number; color?: string; style?: React.CSSProperties}> = ({
  text,
  progress,
  size = 44,
  color = INK.ink,
  style,
}) => {
  const n = Math.round(text.length * Math.max(0, Math.min(1, progress)));
  return (
    <div style={{fontFamily: TYPE, fontSize: size, color, whiteSpace: 'pre', lineHeight: 1.25, ...style}}>
      {text.slice(0, n)}
      <span style={{opacity: 0}}>{text.slice(n)}</span>
    </div>
  );
};

// Rubber date stamp, slammed onto paper.
export const Stamp: React.FC<{text: string; x: number; y: number; show: number; rotate?: number; size?: number; color?: string}> = ({
  text,
  x,
  y,
  show,
  rotate = -8,
  size = 70,
  color = INK.red,
}) => {
  if (show <= 0) return null;
  const k = Math.min(1, show);
  const s = 1.6 - 0.6 * Easing.out(Easing.cubic)(k);
  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        transform: `translate(-50%, -50%) rotate(${rotate}deg) scale(${s})`,
        opacity: Math.min(1, k * 2) * 0.82,
        border: `6px solid ${color}`,
        borderRadius: 10,
        padding: '6px 22px',
        fontFamily: TYPE,
        fontSize: size,
        color,
        letterSpacing: 6,
        mixBlendMode: 'multiply',
        whiteSpace: 'nowrap',
      }}
    >
      {text}
    </div>
  );
};

// Handwritten note with an ink underline that draws itself.
export const Note: React.FC<{text: string; x: number; y: number; progress: number; size?: number; color?: string; rotate?: number}> = ({
  text,
  x,
  y,
  progress,
  size = 80,
  color = INK.red,
  rotate = -4,
}) => {
  if (progress <= 0) return null;
  const w = text.length * size * 0.42;
  return (
    <div style={{position: 'absolute', left: x, top: y, transform: `rotate(${rotate}deg)`, fontFamily: HAND, fontSize: size, color, fontWeight: 600, whiteSpace: 'nowrap'}}>
      <div style={{clipPath: `inset(-20% ${100 - Math.min(1, progress * 1.3) * 100}% -20% -5%)`}}>{text}</div>
      <svg width={w + 20} height={30} style={{position: 'absolute', left: 0, top: size * 1.05}}>
        <path d={`M4,14 Q${w / 2},${24} ${w},10`} fill="none" stroke={color} strokeWidth={5} strokeLinecap="round" pathLength={1} strokeDasharray={`${ramp(progress, 0.6, 1)} 1`} />
      </svg>
    </div>
  );
};

// Hand-drawn red pencil cross over something.
export const InkCross: React.FC<{x: number; y: number; w: number; h: number; progress: number}> = ({x, y, w, h, progress}) => {
  if (progress <= 0) return null;
  const p1 = Math.min(1, progress * 2);
  const p2 = Math.max(0, progress * 2 - 1);
  return (
    <svg style={{position: 'absolute', left: x - w / 2, top: y - h / 2, overflow: 'visible'}} width={w} height={h}>
      <path d={`M${w * 0.08},${h * 0.1} Q${w * 0.55},${h * 0.48} ${w * 0.92},${h * 0.9}`} fill="none" stroke={INK.red} strokeWidth={16} strokeLinecap="round" pathLength={1} strokeDasharray={`${p1} 1`} opacity={0.88} />
      <path d={`M${w * 0.9},${h * 0.08} Q${w * 0.45},${h * 0.52} ${w * 0.1},${h * 0.92}`} fill="none" stroke={INK.red} strokeWidth={16} strokeLinecap="round" pathLength={1} strokeDasharray={`${p2} 1`} opacity={0.88} />
    </svg>
  );
};

// ----- Ink map on paper -----
type LandTopo = Topology<{land: GeometryCollection}>;
const LAND = feature(land50 as unknown as LandTopo, (land50 as unknown as LandTopo).objects.land);

export const useMapProjection = (w: number, h: number, bounds: [[number, number], [number, number]]) =>
  useMemo(
    () =>
      geoMercator().fitExtent(
        [
          [40, 40],
          [w - 40, h - 40],
        ],
        {type: 'LineString', coordinates: bounds} as unknown as GeoJSON.LineString,
      ),
    [w, h, bounds[0][0], bounds[0][1], bounds[1][0], bounds[1][1]],
  );

export const InkMap: React.FC<{
  w: number;
  h: number;
  projection: GeoProjection;
  borders?: FeatureCollection;
  children?: React.ReactNode;
}> = ({w, h, projection, borders, children}) => {
  const path = geoPath(projection);
  const land = useMemo(() => path(LAND) ?? '', [projection]);
  const grid = useMemo(() => path(geoGraticule10()) ?? '', [projection]);
  const bord = useMemo(() => (borders ? path(borders) ?? '' : ''), [projection, borders]);
  return (
    <svg width={w} height={h} style={{position: 'absolute', inset: 0}}>
      <defs>
        <clipPath id="mapclip">
          <rect width={w} height={h} />
        </clipPath>
      </defs>
      <g clipPath="url(#mapclip)">
        <rect width={w} height={h} fill="rgba(98,99,74,0.10)" />
        <path d={grid} fill="none" stroke="rgba(41,40,36,0.18)" strokeWidth={1.4} />
        <path d={land} fill="rgba(213,196,161,0.65)" stroke={INK.ink} strokeWidth={2.2} />
        {bord && <path d={bord} fill="none" stroke="rgba(41,40,36,0.55)" strokeWidth={1.6} strokeDasharray="7 5" />}
        {children}
      </g>
    </svg>
  );
};

// Ink route drawn on the map, cut to `progress` of its length.
export const InkRoute: React.FC<{pts: [number, number][]; progress: number; color?: string; dashed?: boolean; width?: number}> = ({
  pts,
  progress,
  color = INK.ink,
  dashed = true,
  width = 5,
}) => {
  if (progress <= 0 || pts.length < 2) return null;
  const seg = pts.slice(1).map((p, i) => Math.hypot(p[0] - pts[i][0], p[1] - pts[i][1]));
  const total = seg.reduce((x, y) => x + y, 0);
  let left = total * Math.min(1, progress);
  const out: [number, number][] = [pts[0]];
  for (let i = 0; i < seg.length && left > 0; i++) {
    const k = Math.min(1, left / seg[i]);
    out.push([pts[i][0] + (pts[i + 1][0] - pts[i][0]) * k, pts[i][1] + (pts[i + 1][1] - pts[i][1]) * k]);
    left -= seg[i];
  }
  return (
    <path
      d={'M' + out.map((p) => p.join(',')).join('L')}
      fill="none"
      stroke={color}
      strokeWidth={width}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeDasharray={dashed ? `${width * 3} ${width * 2.2}` : undefined}
    />
  );
};

// Military-style ink arrow (red), drawn progressively.
export const InkArrow: React.FC<{a: [number, number]; b: [number, number]; progress: number; width?: number}> = ({a, b, progress, width = 26}) => {
  if (progress <= 0) return null;
  const x = a[0] + (b[0] - a[0]) * progress;
  const y = a[1] + (b[1] - a[1]) * progress;
  const ang = Math.atan2(b[1] - a[1], b[0] - a[0]);
  const nx = -Math.sin(ang);
  const ny = Math.cos(ang);
  const body = `${a[0] + nx * width * 0.25},${a[1] + ny * width * 0.25} ${x + nx * width * 0.5},${y + ny * width * 0.5} ${x - nx * width * 0.5},${y - ny * width * 0.5} ${a[0] - nx * width * 0.25},${a[1] - ny * width * 0.25}`;
  const head = `${x + Math.cos(ang) * width * 1.4},${y + Math.sin(ang) * width * 1.4} ${x + nx * width},${y + ny * width} ${x - nx * width},${y - ny * width}`;
  return (
    <g opacity={0.9}>
      <polygon points={body} fill={INK.red} />
      <polygon points={head} fill={INK.red} />
    </g>
  );
};

// Warm desk light from the top left plus gentle falloff; `spot` isolates a point.
export const Lighting: React.FC<{spot?: {x: number; y: number; r: number; amount: number}}> = ({spot}) => (
  <>
    <div style={{position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 30% 25%, rgba(255,226,180,0.10) 0%, rgba(0,0,0,0) 55%)', mixBlendMode: 'screen'}} />
    <div style={{position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 45%, rgba(10,8,6,0.62) 100%)'}} />
    {spot && spot.amount > 0 && (
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `radial-gradient(circle at ${spot.x}px ${spot.y}px, rgba(0,0,0,0) ${spot.r * 0.7}px, rgba(8,6,5,${0.88 * spot.amount}) ${spot.r * 1.35}px)`,
        }}
      />
    )}
  </>
);
