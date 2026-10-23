import {geoMercator, geoPath, type GeoProjection} from 'd3-geo';
import {feature, mesh} from 'topojson-client';
import type {Topology, GeometryCollection} from 'topojson-specification';
import {createContext, useContext, useMemo} from 'react';
import {Easing, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import countries50 from 'world-atlas/countries-50m.json';

export const W = 1080;
export const H = 1920;

export const COLORS = {
  ocean: '#08121c',
  oceanGlow: '#10263a',
  land: '#1b2730',
  landEdge: '#33454f',
  border: 'rgba(160, 185, 200, 0.18)',
  red: '#ff2e3f',
  redSoft: 'rgba(255, 46, 63, 0.28)',
  blue: '#2ea8ff',
  gold: '#ffc23d',
  text: '#ffffff',
};

const topo = countries50 as unknown as Topology<{countries: GeometryCollection}>;
const LAND = feature(topo, topo.objects.countries);
const BORDERS = mesh(topo, topo.objects.countries, (a, b) => a !== b);

export type Cam = {c: [number, number]; z: number};

const ProjectionCtx = createContext<GeoProjection | null>(null);
export const useProjection = () => {
  const p = useContext(ProjectionCtx);
  if (!p) throw new Error('useProjection outside <WorldMap>');
  return p;
};

export const project = (p: GeoProjection, ll: readonly [number, number]) =>
  p([ll[0], ll[1]]) as [number, number];

// Interpolates zoom in log space so zooms feel uniform.
export const cameraAt = (keys: {t: number; c: [number, number]; z: number}[], t: number): Cam => {
  if (t <= keys[0].t) return keys[0];
  const last = keys[keys.length - 1];
  if (t >= last.t) return last;
  const i = keys.findIndex((k) => k.t > t) - 1;
  const a = keys[i];
  const b = keys[i + 1];
  const k = interpolate(t, [a.t, b.t], [0, 1], {easing: Easing.inOut(Easing.cubic)});
  return {
    c: [a.c[0] + (b.c[0] - a.c[0]) * k, a.c[1] + (b.c[1] - a.c[1]) * k],
    z: Math.exp(Math.log(a.z) + (Math.log(b.z) - Math.log(a.z)) * k),
  };
};

export const WorldMap: React.FC<{cam: Cam; children?: React.ReactNode}> = ({cam, children}) => {
  const projection = useMemo(
    () => geoMercator().center(cam.c).scale(cam.z).translate([W / 2, H / 2]),
    [cam.c[0], cam.c[1], cam.z],
  );
  const path = geoPath(projection);
  return (
    <ProjectionCtx.Provider value={projection}>
      <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
        <defs>
          <radialGradient id="ocean" cx="50%" cy="45%" r="75%">
            <stop offset="0%" stopColor={COLORS.oceanGlow} />
            <stop offset="100%" stopColor={COLORS.ocean} />
          </radialGradient>
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="8" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <pattern id="hatch" width="18" height="18" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <rect width="18" height="18" fill={COLORS.redSoft} />
            <line x1="0" y1="0" x2="0" y2="18" stroke="rgba(255,90,100,0.45)" strokeWidth="5" />
          </pattern>
        </defs>
        <rect width={W} height={H} fill="url(#ocean)" />
        <path d={path(LAND) ?? ''} fill={COLORS.land} stroke={COLORS.landEdge} strokeWidth={1.5} />
        <path d={path(BORDERS) ?? ''} fill="none" stroke={COLORS.border} strokeWidth={1.2} />
        {children}
      </svg>
    </ProjectionCtx.Provider>
  );
};

// Region drawn as a planar polygon of projected points (avoids spherical winding issues).
export const Region: React.FC<{coords: [number, number][]; opacity?: number; reveal?: number}> = ({
  coords,
  opacity = 1,
  reveal = 1,
}) => {
  const p = useProjection();
  const pts = coords.map((c) => project(p, c));
  const d = 'M' + pts.map((x) => x.join(',')).join('L') + 'Z';
  const cx = pts.reduce((s, x) => s + x[0], 0) / pts.length;
  const cy = pts.reduce((s, x) => s + x[1], 0) / pts.length;
  return (
    <g opacity={opacity} transform={`translate(${cx} ${cy}) scale(${reveal}) translate(${-cx} ${-cy})`}>
      <path d={d} fill="url(#hatch)" stroke={COLORS.red} strokeWidth={4} filter="url(#glow)" strokeLinejoin="round" />
    </g>
  );
};

export const City: React.FC<{
  at: readonly [number, number];
  label: string;
  color?: string;
  pulse?: number;
  opacity?: number;
  side?: 'left' | 'right';
}> = ({at, label, color = COLORS.text, pulse = 0, opacity = 1, side = 'right'}) => {
  const p = useProjection();
  const [x, y] = project(p, at);
  const dx = side === 'right' ? 34 : -34;
  return (
    <g opacity={opacity}>
      {pulse > 0 && <circle cx={x} cy={y} r={14 + pulse * 70} fill="none" stroke={color} strokeWidth={4} opacity={1 - pulse} />}
      <circle cx={x} cy={y} r={14} fill={COLORS.ocean} stroke={color} strokeWidth={6} filter="url(#glow)" />
      <line x1={x} y1={y} x2={x + dx} y2={y - 34} stroke={color} strokeWidth={4} />
      <text
        x={x + dx + (side === 'right' ? 8 : -8)}
        y={y - 42}
        fill={color}
        fontFamily="Inter Display, Inter, sans-serif"
        fontWeight={900}
        fontSize={54}
        textAnchor={side === 'right' ? 'start' : 'end'}
        style={{letterSpacing: 1, paintOrder: 'stroke'}}
        stroke="rgba(0,0,0,0.6)"
        strokeWidth={8}
      >
        {label.toUpperCase()}
      </text>
      <text
        x={x + dx + (side === 'right' ? 8 : -8)}
        y={y - 6}
        fill="rgba(255,255,255,0.65)"
        fontFamily="JetBrains Mono, monospace"
        fontSize={22}
        textAnchor={side === 'right' ? 'start' : 'end'}
      >
        {`Lat ${at[1].toFixed(2)}, Lon ${at[0].toFixed(2)}`}
      </text>
    </g>
  );
};

// Dashed glowing route that draws itself as `progress` goes 0 -> 1.
export const Route: React.FC<{
  from: readonly [number, number];
  to: readonly [number, number];
  progress: number;
  color?: string;
  bend?: number;
  arrow?: boolean;
  width?: number;
}> = ({from, to, progress, color = COLORS.text, bend = 0.2, arrow = false, width = 7}) => {
  const p = useProjection();
  const a = project(p, from);
  const b = project(p, to);
  const mx = (a[0] + b[0]) / 2 - (b[1] - a[1]) * bend;
  const my = (a[1] + b[1]) / 2 + (b[0] - a[0]) * bend;
  const pt = (t: number) => [
    (1 - t) ** 2 * a[0] + 2 * (1 - t) * t * mx + t ** 2 * b[0],
    (1 - t) ** 2 * a[1] + 2 * (1 - t) * t * my + t ** 2 * b[1],
  ];
  const steps = 60;
  const n = Math.max(1, Math.round(steps * progress));
  const pts = Array.from({length: n + 1}, (_, i) => pt((i / steps) * 1));
  const d = 'M' + pts.map((x) => x.join(',')).join('L');
  const tip = pts[pts.length - 1];
  const prev = pts[Math.max(0, pts.length - 2)];
  const ang = (Math.atan2(tip[1] - prev[1], tip[0] - prev[0]) * 180) / Math.PI;
  if (progress <= 0) return null;
  return (
    <g filter="url(#glow)">
      <path d={d} fill="none" stroke={color} strokeWidth={width} strokeDasharray={arrow ? undefined : '22 16'} strokeLinecap="round" />
      {arrow && (
        <polygon points="0,-26 44,0 0,26" fill={color} transform={`translate(${tip[0]} ${tip[1]}) rotate(${ang})`} />
      )}
    </g>
  );
};

// Local time helpers.
export const useSeconds = () => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  return f / fps;
};

export const ramp = (t: number, a: number, b: number, ease = Easing.out(Easing.cubic)) =>
  interpolate(t, [a, b], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: ease});
