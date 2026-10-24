import {geoGraticule10, geoMercator, geoPath, type GeoProjection} from 'd3-geo';
import {feature} from 'topojson-client';
import type {Topology, GeometryCollection} from 'topojson-specification';
import type {FeatureCollection} from 'geojson';
import {createContext, useContext, useMemo} from 'react';
import {Easing, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import land50 from 'world-atlas/land-50m.json';
import land10 from 'world-atlas/land-10m.json';

export const W = 1080;
export const H = 1920;

// Vertical Shorts layout (YouTube UI covers the top ~220px, the bottom ~420px
// and a ~130px column of buttons on the right).
export const LAYOUT = {
  safeLeft: 60,
  safeRight: 930,
  wordY: 250, // big word band: 250–400
  cardY: 700, // card band centre: 440–960
  focusY: 1200, // map focus band: 1000–1450
};

// Restrained archival palette (docs/paper-documentary-master-prompt.md §2.2).
export const COLORS = {
  ocean: '#121413',
  oceanLight: '#1a1c1a',
  land: '#22231f',
  landLight: '#2a2a25',
  coast: 'rgba(213, 196, 161, 0.5)',
  border: 'rgba(213, 196, 161, 0.16)',
  grid: 'rgba(213, 196, 161, 0.05)',
  red: '#A43B32',
  blue: '#77736C',
  gold: '#AD9163',
  white: '#E8DDC5',
};

type LandTopo = Topology<{land: GeometryCollection}>;
const LAND_50 = feature(land50 as unknown as LandTopo, (land50 as unknown as LandTopo).objects.land);
const LAND_10 = feature(land10 as unknown as LandTopo, (land10 as unknown as LandTopo).objects.land);
const GRATICULE = geoGraticule10();

export type LonLat = readonly [number, number];
export type Cam = {c: LonLat; z: number};
export type CamKey = {t: number; c: LonLat; z: number};

const ProjectionCtx = createContext<GeoProjection | null>(null);
export const useProjection = () => {
  const p = useContext(ProjectionCtx);
  if (!p) throw new Error('useProjection outside <WorldMap>');
  return p;
};
export const project = (p: GeoProjection, ll: LonLat) => p([ll[0], ll[1]]) as [number, number];

// Zoom is interpolated in log space so every zoom feels like the same speed.
export const cameraAt = (keys: CamKey[], t: number): Cam => {
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

export type Theme = 'dark' | 'paper';
const ThemeCtx = createContext<Theme>('dark');
export const useTheme = () => useContext(ThemeCtx);

// Ink-on-paper palette for the paper theme.
export const PAPER = {
  ink: '#292824',
  red: '#A43B32',
  brass: '#AD9163',
  land: 'rgba(236, 226, 204, 0.92)',
  water: 'rgba(119, 115, 108, 0.30)',
  grid: 'rgba(41, 40, 36, 0.16)',
  border: 'rgba(41, 40, 36, 0.5)',
};

export const WorldMap: React.FC<{cam: Cam; borders?: FeatureCollection; theme?: Theme; children?: React.ReactNode}> = ({
  cam,
  borders,
  theme = 'dark',
  children,
}) => {
  const paper = theme === 'paper';
  const projection = useMemo(
    () =>
      geoMercator()
        .center([cam.c[0], cam.c[1]])
        .scale(cam.z)
        .translate([W / 2, LAYOUT.focusY])
        .clipExtent([[-200, -200], [W + 200, H + 200]]),
    [cam.c[0], cam.c[1], cam.z],
  );
  const path = geoPath(projection);
  const landD = path(cam.z > 5000 ? LAND_10 : LAND_50) ?? '';
  return (
    <ThemeCtx.Provider value={theme}>
    <ProjectionCtx.Provider value={projection}>
      <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
        <defs>
          <radialGradient id="ocean" cx="50%" cy="40%" r="80%">
            <stop offset="0%" stopColor={COLORS.oceanLight} />
            <stop offset="100%" stopColor={COLORS.ocean} />
          </radialGradient>
          <linearGradient id="land" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={COLORS.landLight} />
            <stop offset="100%" stopColor={COLORS.land} />
          </linearGradient>
          <filter id="glow">
            <feMerge>
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="labelshadow" x="-20%" y="-40%" width="140%" height="200%">
            <feDropShadow dx="2" dy="6" stdDeviation="5" floodColor="#000" floodOpacity="0.35" />
          </filter>
          <filter id="softglow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="14" />
          </filter>
          <pattern id="hatch-red" width="16" height="16" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <rect width="16" height="16" fill={paper ? 'rgba(164,59,50,0.16)' : 'rgba(164,59,50,0.30)'} />
            <line x1="0" y1="0" x2="0" y2="16" stroke={paper ? 'rgba(164,59,50,0.6)' : 'rgba(164,59,50,0.55)'} strokeWidth={paper ? 3 : 4} />
          </pattern>
          <pattern id="hatch-white" width="16" height="16" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <rect width="16" height="16" fill={paper ? 'rgba(41,40,36,0.05)' : 'rgba(232,221,197,0.07)'} />
            <line x1="0" y1="0" x2="0" y2="16" stroke={paper ? 'rgba(41,40,36,0.28)' : 'rgba(232,221,197,0.22)'} strokeWidth={paper ? 2.5 : 4} />
          </pattern>
        </defs>
        {paper ? (
          <>
            <rect width={W} height={H} fill={PAPER.water} />
            <path d={path(GRATICULE) ?? ''} fill="none" stroke={PAPER.grid} strokeWidth={1.5} />
            <path d={landD} fill={PAPER.land} stroke={PAPER.ink} strokeWidth={2.2} strokeLinejoin="round" />
            {borders && <path d={path(borders) ?? ''} fill="none" stroke={PAPER.border} strokeWidth={1.6} strokeDasharray="7 5" />}
          </>
        ) : (
          <>
            <rect width={W} height={H} fill="url(#ocean)" />
            <path d={path(GRATICULE) ?? ''} fill="none" stroke={COLORS.grid} strokeWidth={1.5} />
            <path d={landD} fill="url(#land)" stroke={COLORS.coast} strokeWidth={1.6} />
            {borders && <path d={path(borders) ?? ''} fill="none" stroke={COLORS.border} strokeWidth={1.4} />}
          </>
        )}
        {children}
      </svg>
    </ProjectionCtx.Provider>
    </ThemeCtx.Provider>
  );
};

export const useSeconds = () => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  return f / fps;
};

export const ramp = (t: number, a: number, b: number, ease: (x: number) => number = Easing.out(Easing.cubic)) =>
  interpolate(t, [a, b], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: ease});

// 1 during [a, b], with short fades on both sides.
export const window_ = (t: number, a: number, b: number, fade = 0.25) =>
  Math.min(ramp(t, a, a + fade), 1 - ramp(t, b - fade, b));
