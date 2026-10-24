// Short #3 — "The Bridge of Death" (Chernobyl). Paper-map style (A-Paper).
// Geography: Natural Earth (region) + OpenStreetMap (Pripyat, the plant, the
// railway bridge) — no hand-drawn shapes. Every cue time comes from words.json.
import {AbsoluteFill, Audio, staticFile} from 'remotion';
import {geoArea, geoPath} from 'd3-geo';
import type {Feature, FeatureCollection} from 'geojson';
import {WorldMap, cameraAt, project, ramp, useProjection, useSeconds, window_, type CamKey, type LonLat} from '../../lib/map';
import {PhotoCard, Pin, pulseAt} from '../../lib/overlays';
import {INK, Lighting, Note, Paper, SERIF, Stamp, TYPE, Typed} from '../../lib/paper';
import {SfxTrack, typing, type Cue} from '../../lib/sfx';
import osm from './data/pripyat_osm.json';
import neRivers from './data/ne_rivers.json';
import neLakes from './data/ne_lakes.json';
import walk from './data/walk.json';

export const DURATION = 39.8;

const P = {
  bridge: [30.06948, 51.39493],
  reactor: [30.09909, 51.38955],
  pripyat: [30.0577, 51.4055],
  kyiv: [30.5234, 50.4501],
  chernobyl: [30.2219, 51.2763],
} satisfies Record<string, LonLat>;

// Distance bridge → Reactor 4 from the real coordinates (haversine), ~2.1 km.
const KM = (() => {
  const r = Math.PI / 180;
  const [a, b] = [P.bridge, P.reactor];
  const h = Math.sin(((b[1] - a[1]) * r) / 2) ** 2 + Math.cos(a[1] * r) * Math.cos(b[1] * r) * Math.sin(((b[0] - a[0]) * r) / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
})();

const CAMERA: CamKey[] = [
  {t: 0, c: [30.0843, 51.3922], z: 1_350_000},
  {t: 4.4, c: [30.0843, 51.3922], z: 1_520_000},
  {t: 5.4, c: [30.3, 50.95], z: 14_000},
  {t: 7.7, c: [30.3, 50.95], z: 15_500},
  {t: 8.5, c: [30.0991, 51.3896], z: 2_500_000},
  {t: 9.5, c: [30.0991, 51.3896], z: 2_750_000},
  {t: 10.3, c: [30.0785, 51.3975], z: 1_000_000},
  {t: 13.4, c: [30.0785, 51.3975], z: 1_080_000},
  {t: 14.2, c: [30.0695, 51.3949], z: 1_600_000},
  {t: 25.0, c: [30.0695, 51.3949], z: 1_800_000},
  {t: 25.9, c: [30.0695, 51.3949], z: 2_400_000},
  {t: 30.9, c: [30.0695, 51.3949], z: 2_600_000},
  {t: 31.8, c: [30.0991, 51.3896], z: 1_700_000},
  {t: 33.6, c: [30.0991, 51.3896], z: 1_800_000},
  {t: 34.4, c: [30.0695, 51.3949], z: 2_200_000},
  {t: 36.4, c: [30.0695, 51.3949], z: 2_300_000},
  {t: 37.6, c: [30.0785, 51.3975], z: 750_000},
  {t: DURATION, c: [30.0785, 51.3975], z: 700_000},
];

// ---------- map layers ----------
const OSM = osm as unknown as FeatureCollection;
const byLayer = (l: string) => ({type: 'FeatureCollection', features: OSM.features.filter((f) => f.properties?.layer === l)}) as FeatureCollection;
const LOCAL = {
  wood: byLayer('wood'),
  water: byLayer('water'),
  industrial: byLayer('industrial'),
  road: byLayer('road'),
  rail: byLayer('rail'),
  building: byLayer('building'),
};
// Natural Earth polygons can arrive with the opposite winding; flip any that would fill the globe.
const LAKES = {
  type: 'FeatureCollection',
  features: (neLakes as unknown as FeatureCollection).features.map((f) => {
    if (geoArea(f) <= 2 * Math.PI) return f;
    const g = f.geometry as GeoJSON.Polygon | GeoJSON.MultiPolygon;
    const rev = (rings: number[][][]) => rings.map((r) => [...r].reverse());
    const geometry = g.type === 'Polygon' ? {...g, coordinates: rev(g.coordinates)} : {...g, coordinates: g.coordinates.map(rev)};
    return {...f, geometry} as Feature;
  }),
} as FeatureCollection;
const RIVERS = neRivers as unknown as FeatureCollection;

const Regional: React.FC<{opacity: number}> = ({opacity}) => {
  const p = useProjection();
  const path = geoPath(p);
  if (opacity <= 0) return null;
  return (
    <g opacity={opacity}>
      <path d={path(LAKES) ?? ''} fill="rgba(119,115,108,0.35)" stroke={INK.ink} strokeWidth={1.6} />
      <path d={path(RIVERS) ?? ''} fill="none" stroke="rgba(41,40,36,0.6)" strokeWidth={2.4} />
    </g>
  );
};

const Local: React.FC<{opacity: number}> = ({opacity}) => {
  const p = useProjection();
  const path = geoPath(p);
  if (opacity <= 0) return null;
  const rail = path(LOCAL.rail) ?? '';
  return (
    <g opacity={opacity}>
      <path d={path(LOCAL.wood) ?? ''} fill="rgba(98,99,74,0.13)" stroke="none" />
      <path d={path(LOCAL.water) ?? ''} fill="rgba(119,115,108,0.38)" stroke={INK.ink} strokeWidth={1.4} />
      <path d={path(LOCAL.industrial) ?? ''} fill="url(#hatch-white)" stroke="rgba(41,40,36,0.45)" strokeWidth={1.4} />
      <path d={path(LOCAL.road) ?? ''} fill="none" stroke="rgba(41,40,36,0.55)" strokeWidth={3} strokeLinecap="round" />
      {/* railway: classic black line with ivory ties */}
      <path d={rail} fill="none" stroke={INK.ink} strokeWidth={6} />
      <path d={rail} fill="none" stroke="#E8DDC5" strokeWidth={3} strokeDasharray="10 10" />
      <path d={path(LOCAL.building) ?? ''} fill="rgba(41,40,36,0.5)" stroke="rgba(41,40,36,0.7)" strokeWidth={0.8} />
    </g>
  );
};

// Real path along Tsentralnyi Avenue from the town centre to the bridge.
const Walk: React.FC<{progress: number}> = ({progress}) => {
  const p = useProjection();
  if (progress <= 0) return null;
  const pts = (walk as [number, number][]).map((c) => project(p, c));
  const n = Math.max(2, Math.round(pts.length * progress));
  const d = 'M' + pts.slice(0, n).map((x) => x.join(',')).join('L');
  return <path d={d} fill="none" stroke={INK.red} strokeWidth={7} strokeLinecap="round" strokeDasharray="16 12" />;
};

// Sight line bridge → Reactor 4 with the measured distance.
const SightLine: React.FC<{progress: number}> = ({progress}) => {
  const p = useProjection();
  if (progress <= 0) return null;
  const a = project(p, P.bridge);
  const b = project(p, P.reactor);
  const x = a[0] + (b[0] - a[0]) * progress;
  const y = a[1] + (b[1] - a[1]) * progress;
  const mx = (a[0] + b[0]) / 2;
  const my = (a[1] + b[1]) / 2;
  return (
    <g>
      <line x1={a[0]} y1={a[1]} x2={x} y2={y} stroke={INK.ink} strokeWidth={3} strokeDasharray="6 8" />
      {progress >= 1 && (
        <g transform={`translate(${mx} ${my + 46})`}>
          <rect x={-78} y={-30} width={156} height={48} fill="#E8DDC5" stroke="rgba(41,40,36,0.35)" filter="url(#labelshadow)" />
          <text y={6} textAnchor="middle" fontFamily={TYPE} fontSize={30} fill={INK.ink}>
            {`${KM.toFixed(1)} KM`}
          </text>
        </g>
      )}
    </g>
  );
};

// Ink ring around a place (hand-drawn style).
const Ring: React.FC<{at: LonLat; r: number; progress: number; color?: string}> = ({at, r, progress, color = INK.red}) => {
  const p = useProjection();
  if (progress <= 0) return null;
  const [x, y] = project(p, at);
  return (
    <ellipse cx={x} cy={y} rx={r} ry={r * 0.82} fill="none" stroke={color} strokeWidth={6} pathLength={1} strokeDasharray={`${progress} 1`} transform={`rotate(-12 ${x} ${y})`} strokeLinecap="round" />
  );
};

// Simple ink bicycle sketch (illustrative: no route is implied).
const Bicycle: React.FC<{at: LonLat; show: number}> = ({at, show}) => {
  const p = useProjection();
  if (show <= 0) return null;
  const [x, y] = project(p, at);
  return (
    <g transform={`translate(${x - 150} ${y + 70}) scale(${0.9 + 0.1 * show})`} opacity={show} stroke={INK.ink} strokeWidth={4} fill="none" strokeLinecap="round" strokeLinejoin="round">
      <circle cx={0} cy={40} r={30} />
      <circle cx={100} cy={40} r={30} />
      <polyline points="0,40 35,0 80,0 100,40 50,40 35,0" />
      <line x1={80} y1={0} x2={74} y2={-16} />
      <line x1={66} y1={-16} x2={86} y2={-16} />
      <line x1={35} y1={0} x2={30} y2={-12} />
      <line x1={22} y1={-12} x2={40} y2={-12} />
    </g>
  );
};

// ---------- paper overlays (screen space) ----------
const Headline: React.FC<{t: number}> = ({t}) => {
  const show = window_(t, -1, 4.5);
  if (show <= 0) return null;
  return (
    <Paper x={540} y={300} w={940} h={170} rotate={-1.2} show={show} from={[0, 0]} depth={0}>
      <div style={{position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: SERIF, fontWeight: 900, fontSize: 72, color: INK.ink, letterSpacing: 1, whiteSpace: 'nowrap'}}>
        THE BRIDGE OF DEATH?
      </div>
    </Paper>
  );
};

const QuoteCard: React.FC<{t: number}> = ({t}) => {
  const show = window_(t, 13.6, 25.3, 0.3);
  if (show <= 0) return null;
  const quote = '"It has been reported that\nnone of them survived."';
  return (
    <Paper x={540} y={575} w={900} h={300} rotate={-1.5} show={ramp(t, 13.6, 14.0) * (1 - ramp(t, 25.0, 25.3))} from={[0, -80]} depth={0}>
      <div style={{position: 'absolute', left: 50, top: 36}}>
        <Typed text={quote} progress={ramp(t, 15.9, 17.6, (x) => x)} size={46} />
        <div style={{marginTop: 16, fontFamily: TYPE, fontSize: 26, color: INK.gray, opacity: ramp(t, 14.0, 14.5)}}>— closing caption, HBO's Chernobyl (2019)</div>
      </div>
      <Stamp text="NO EVIDENCE" x={600} y={250} show={ramp(t, 24.1, 24.3)} rotate={-10} size={58} />
    </Paper>
  );
};

const NameCard: React.FC<{t: number}> = ({t}) => {
  const show = ramp(t, 18.8, 19.2) * (1 - ramp(t, 25.0, 25.3));
  if (show <= 0) return null;
  return (
    <Paper x={600} y={820} w={720} h={150} rotate={1.5} show={show} from={[120, 0]} depth={0}>
      <div style={{position: 'absolute', left: 40, top: 24}}>
        <Typed text="ADAM HIGGINBOTHAM" progress={ramp(t, 19.2, 20.2, (x) => x)} size={44} />
        <div style={{fontFamily: TYPE, fontSize: 28, color: INK.walnut, marginTop: 8, opacity: ramp(t, 20.0, 20.5)}}>Midnight in Chernobyl (2019)</div>
      </div>
    </Paper>
  );
};

const DateCard: React.FC<{t: number}> = ({t}) => {
  const show = window_(t, 5.1, 8.1, 0.3);
  if (show <= 0) return null;
  return (
    <Paper x={540} y={560} w={620} h={120} rotate={-1} show={show} from={[0, -60]} depth={0}>
      <div style={{position: 'absolute', left: 44, top: 30}}>
        <Typed text="26 APRIL 1986 · 01:23" progress={ramp(t, 5.24, 6.6, (x) => x)} size={50} />
      </div>
    </Paper>
  );
};

const SFX: Cue[] = [
  [2.98, 'stamp', 0.6],
  [4.8, 'air', 0.25], ...typing(5.24, 21, 16, 0.3),
  [7.9, 'paper2', 0.35], [8.16, 'impact', 0.35],
  [9.9, 'air', 0.2], [10.4, 'string', 0.2],
  [13.6, 'paper1', 0.35], ...typing(15.9, 48, 28, 0.22),
  [18.8, 'paper2', 0.32], ...typing(19.2, 17, 17, 0.25),
  [24.1, 'impact', 0.45], [24.12, 'stamp', 0.6],
  [25.4, 'string', 0.15], [28.36, 'paper1', 0.32],
  [31.48, 'paper2', 0.32],
  [34.2, 'string', 0.2],
  [36.9, 'air', 0.2],
];

export const Chernobyl: React.FC = () => {
  const t = useSeconds();
  const cam = cameraAt(CAMERA, t);
  const local = ramp(cam.z, 120_000, 400_000, (x) => x);
  const regional = 1 - ramp(cam.z, 200_000, 600_000, (x) => x);

  return (
    <AbsoluteFill style={{backgroundColor: '#E8DDC5', backgroundImage: `url(${staticFile('paper/paper.jpg')})`, backgroundSize: '512px 512px'}}>
      <WorldMap cam={cam} theme="paper">
        <Regional opacity={regional} />
        <Local opacity={local} />

        {/* hook: bridge, reactor and the distance between them */}
        <Ring at={P.bridge} r={70} progress={(t < 4.6 ? 1 : 0) * (1 - ramp(t, 4.3, 4.6)) + ramp(t, 34.2, 34.9) * (1 - ramp(t, 36.6, 37.0))} />
        <SightLine progress={window_(t, -1, 4.5) * ramp(t, -1, 0.01) + ramp(t, 12.1, 12.8) * (1 - ramp(t, 13.4, 13.6))} />

        <Walk progress={ramp(t, 10.3, 11.5, (x) => x) * (1 - ramp(t, 13.4, 13.6))} />
        <Bicycle at={P.bridge} show={window_(t, 25.9, 28.2, 0.3)} />

        {/* places */}
        <Pin at={P.bridge} label="Bridge of Death" show={window_(t, -1, 4.5) + window_(t, 10.8, 31.4) + window_(t, 34.0, 37.4)} color="#A43B32" />
        <Pin at={P.reactor} label="Reactor 4" show={window_(t, -1, 4.5) + window_(t, 8.0, 13.6) + window_(t, 31.6, 33.8)} color="#A43B32" pulse={pulseAt(t, 8.16)} />
        <Pin at={P.pripyat} label="Pripyat" side={t < 9 ? "left" : undefined} show={window_(t, 5.3, 7.9) + window_(t, 9.7, 13.6)} />
        <Pin at={P.kyiv} label="Kyiv" show={window_(t, 5.5, 7.9)} />
        <Pin at={P.chernobyl} label="Chernobyl" side="right" show={window_(t, 5.8, 7.9)} />
        <Pin at={P.pripyat} label="Pripyat" show={window_(t, 37.6, DURATION + 1)} />
        <Pin at={P.reactor} label="Reactor 4" show={window_(t, 37.8, DURATION + 1)} color="#A43B32" />
        <Pin at={P.bridge} label="Bridge" show={window_(t, 37.9, DURATION + 1)} />

        {/* evidence cards */}
        <PhotoCard src="chernobyl/art/reactor.jpg" slot="center" size="portraitL" rotate={-2} show={window_(t, 7.9, 9.9)} anchor={P.reactor} name="REACTOR 4 · 1986" />
        <PhotoCard src="chernobyl/art/bridgeview.jpg" slot="center" size="landscape" rotate={2} show={window_(t, 28.36, 31.3)} name="THE SITE TODAY" />
        <PhotoCard src="chernobyl/art/medal.jpg" slot="center" size="portrait" rotate={-2} show={window_(t, 31.48, 33.9)} name="LIQUIDATORS' MEDAL" />
      </WorldMap>

      <Lighting />
      <Headline t={t} />
      <Stamp text="NO PROOF" x={760} y={430} show={window_(t, 2.98, 4.5, 0.05) * ramp(t, 2.98, 3.15)} rotate={-8} size={64} />
      <DateCard t={t} />
      <QuoteCard t={t} />
      <NameCard t={t} />
      {t > 25.9 && t < 28.4 && <Note text="a boy, 1986" x={150} y={560} progress={ramp(t, 26.0, 27.2)} size={74} color={INK.ink} />}
      {t > 29.4 && t < 31.3 && <Note text="alive and well" x={180} y={1330} progress={ramp(t, 29.6, 30.6)} size={70} />}
      {t > 34.6 && t < 37.0 && <Note text="a legend" x={560} y={760} progress={ramp(t, 35.6, 36.4)} size={92} />}

      <Audio src={staticFile('chernobyl/vo.wav')} />
      <SfxTrack cues={SFX} />
    </AbsoluteFill>
  );
};
