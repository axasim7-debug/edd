// Short #3, re-edit after feedback ("first 3 seconds are cold"): fast cinematic
// cut — full-bleed archival photos, a cut every 1.5–2.5 s, punch-ins on key
// words, kinetic captions synced to words.json, real OSM inserts for the bridge.
// `framed` adds the "case file" frame (claim bar + status) for version 2.
import {AbsoluteFill, Audio, Easing, Img, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {geoPath} from 'd3-geo';
import type {FeatureCollection} from 'geojson';
import {WorldMap, cameraAt, project, ramp, useProjection, useSeconds, type CamKey, type LonLat} from '../../lib/map';
import {Grain} from '../../lib/overlays';
import {SfxTrack, type Cue} from '../../lib/sfx';
import osm from './data/pripyat_osm.json';
import walk from './data/walk.json';
import words from './words.json';

export const DURATION = 39.9;
const FONT = 'Inter Display, Inter, sans-serif';
const SERIF = "'Playfair Display', Georgia, serif";
const RED = '#C9483C';
const IVORY = '#F2EBDD';

const P = {bridge: [30.06948, 51.39493], reactor: [30.09909, 51.38955]} satisfies Record<string, LonLat>;
const A = (f: string) => `chernobyl/art/${f}.jpg`;

// ---------- shots (hard cuts on word timings) ----------
type Shot =
  | {from: number; kind: 'photo'; src: string; z0: number; z1: number; fx?: number; fy?: number; dx?: number; dy?: number}
  | {from: number; kind: 'map'; cam: CamKey[]; layer: 'ring' | 'walk' | 'bike' | 'legend'}
  | {from: number; kind: 'endcard'};

const SHOTS: Shot[] = [
  {from: 0, kind: 'photo', src: A('heli2'), z0: 1.18, z1: 1.32, fx: 50, fy: 45},
  {from: 1.7, kind: 'map', layer: 'ring', cam: [{t: 1.7, c: [30.0695, 51.3949], z: 2_600_000}, {t: 3.0, c: [30.0695, 51.3949], z: 3_300_000}]},
  {from: 2.98, kind: 'photo', src: A('b68'), z0: 1.08, z1: 1.2, fx: 50, fy: 60},
  {from: 4.6, kind: 'photo', src: A('spot'), z0: 1.6, z1: 2.3, fx: 47, fy: 46},
  {from: 7.85, kind: 'photo', src: A('reactor'), z0: 1.05, z1: 1.2, fx: 50, fy: 55},
  {from: 9.45, kind: 'photo', src: A('townsign'), z0: 1.1, z1: 1.22, fx: 50, fy: 40},
  {from: 10.9, kind: 'map', layer: 'walk', cam: [{t: 10.9, c: [30.0705, 51.3985], z: 1_500_000}, {t: 13.6, c: [30.0785, 51.3965], z: 1_250_000}]},
  {from: 13.6, kind: 'endcard'},
  {from: 18.65, kind: 'photo', src: A('note'), z0: 1.05, z1: 1.18, fx: 55, fy: 55},
  {from: 21.2, kind: 'photo', src: A('heli1'), z0: 1.1, z1: 1.2, fx: 50, fy: 45},
  {from: 23.4, kind: 'endcard'},
  {from: 25.3, kind: 'map', layer: 'bike', cam: [{t: 25.3, c: [30.0695, 51.3949], z: 3_000_000}, {t: 28.3, c: [30.0695, 51.3949], z: 3_600_000}]},
  {from: 28.3, kind: 'photo', src: A('ferris'), z0: 1.05, z1: 1.2, fx: 50, fy: 45},
  {from: 31.4, kind: 'photo', src: A('turbine'), z0: 1.08, z1: 1.18, fx: 50, fy: 50},
  {from: 32.9, kind: 'photo', src: A('medal'), z0: 1.0, z1: 1.1, fx: 50, fy: 40},
  {from: 34.1, kind: 'map', layer: 'legend', cam: [{t: 34.1, c: [30.0695, 51.3949], z: 2_200_000}, {t: 36.8, c: [30.0695, 51.3949], z: 2_700_000}]},
  {from: 36.85, kind: 'photo', src: A('reactor'), z0: 1.25, z1: 1.35, fx: 50, fy: 40},
  {from: 37.4, kind: 'photo', src: A('ferris'), z0: 1.25, z1: 1.35, fx: 50, fy: 40},
  {from: 37.9, kind: 'photo', src: A('note'), z0: 1.25, z1: 1.35, fx: 55, fy: 50},
  {from: 38.4, kind: 'photo', src: A('heli2'), z0: 1.2, z1: 1.4, fx: 50, fy: 45},
];

// Punch-ins on the words that carry the story.
const PUNCH = [2.0, 3.24, 8.76, 12.22, 16.9, 24.12, 26.34, 29.6, 33.0, 35.88];
const punch = (t: number) => PUNCH.reduce((acc, p) => acc + (t >= p && t < p + 0.35 ? 0.07 * (1 - (t - p) / 0.35) : 0), 0);

// ---------- map inserts (dark ink, real OSM geometry) ----------
const OSM = osm as unknown as FeatureCollection;
const layerOf = (l: string) => ({type: 'FeatureCollection', features: OSM.features.filter((f) => f.properties?.layer === l)}) as FeatureCollection;
const L = {water: layerOf('water'), road: layerOf('road'), rail: layerOf('rail'), building: layerOf('building'), wood: layerOf('wood'), industrial: layerOf('industrial')};

const DarkLocal: React.FC = () => {
  const path = geoPath(useProjection());
  const rail = path(L.rail) ?? '';
  return (
    <g>
      <path d={path(L.wood) ?? ''} fill="rgba(98,99,74,0.18)" />
      <path d={path(L.water) ?? ''} fill="rgba(70,80,86,0.55)" stroke="rgba(232,221,197,0.35)" strokeWidth={1.4} />
      <path d={path(L.industrial) ?? ''} fill="rgba(232,221,197,0.05)" stroke="rgba(232,221,197,0.3)" strokeWidth={1.2} />
      <path d={path(L.road) ?? ''} fill="none" stroke="rgba(232,221,197,0.35)" strokeWidth={3} />
      <path d={rail} fill="none" stroke="rgba(232,221,197,0.75)" strokeWidth={5} />
      <path d={rail} fill="none" stroke="#151615" strokeWidth={2.4} strokeDasharray="9 9" />
      <path d={path(L.building) ?? ''} fill="rgba(232,221,197,0.28)" />
    </g>
  );
};

const MapLayer: React.FC<{t: number; layer: 'ring' | 'walk' | 'bike' | 'legend'; from: number}> = ({t, layer, from}) => {
  const p = useProjection();
  const b = project(p, P.bridge);
  const r = project(p, P.reactor);
  const k = t - from;
  const ring = (rad: number, prog: number) => (
    <ellipse cx={b[0]} cy={b[1]} rx={rad} ry={rad * 0.8} fill="none" stroke={RED} strokeWidth={8} pathLength={1} strokeDasharray={`${prog} 1`} strokeLinecap="round" transform={`rotate(-14 ${b[0]} ${b[1]})`} />
  );
  const label = (text: string, struck = 0) => (
    <g transform={`translate(${b[0]} ${b[1] - 120})`}>
      <text textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={54} fill={IVORY} stroke="#000" strokeWidth={8} paintOrder="stroke">
        {text}
      </text>
      {struck > 0 && <line x1={-230} y1={-16} x2={-230 + 460 * struck} y2={-22} stroke={RED} strokeWidth={10} strokeLinecap="round" />}
    </g>
  );
  if (layer === 'ring') return <g>{ring(110, Math.min(1, k / 0.25))}{label('THIS BRIDGE')}</g>;
  if (layer === 'legend')
    return (
      <g>
        {ring(110, 1)}
        {label('BRIDGE OF DEATH', ramp(t, 35.6, 36.0))}
      </g>
    );
  if (layer === 'bike')
    return (
      <g>
        {ring(110, 1)}
        <g transform={`translate(${b[0] - 70} ${b[1] + 150}) scale(1.4)`} stroke={IVORY} strokeWidth={4} fill="none" strokeLinecap="round" opacity={ramp(t, 26.2, 26.6)}>
          <circle cx={0} cy={40} r={30} />
          <circle cx={100} cy={40} r={30} />
          <polyline points="0,40 35,0 80,0 100,40 50,40 35,0" />
          <line x1={80} y1={0} x2={74} y2={-16} />
          <line x1={35} y1={0} x2={30} y2={-12} />
        </g>
      </g>
    );
  // walk: the real avenue from the town centre to the bridge, then the sight line
  const pts = (walk as [number, number][]).map((c) => project(p, c));
  const n = Math.max(2, Math.round(pts.length * ramp(t, 10.95, 11.9, (x) => x)));
  const sight = ramp(t, 12.0, 12.6);
  return (
    <g>
      <path d={'M' + pts.slice(0, n).map((x) => x.join(',')).join('L')} fill="none" stroke={RED} strokeWidth={9} strokeDasharray="18 12" strokeLinecap="round" />
      {sight > 0 && <line x1={b[0]} y1={b[1]} x2={b[0] + (r[0] - b[0]) * sight} y2={b[1] + (r[1] - b[1]) * sight} stroke={IVORY} strokeWidth={4} strokeDasharray="8 10" />}
      <circle cx={r[0]} cy={r[1]} r={18 + 10 * Math.abs(Math.sin(t * 6))} fill="none" stroke={RED} strokeWidth={6} opacity={sight} />
      {sight >= 1 && (
        <text x={(b[0] + r[0]) / 2} y={(b[1] + r[1]) / 2 + 70} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={48} fill={IVORY} stroke="#000" strokeWidth={8} paintOrder="stroke">
          2.1 KM
        </text>
      )}
    </g>
  );
};

// ---------- shot renderer ----------
const ShotView: React.FC<{shot: Shot; t: number; until: number}> = ({shot, t, until}) => {
  const k = Math.min(1, Math.max(0, (t - shot.from) / Math.max(0.5, until - shot.from)));
  const pz = 1 + punch(t);
  if (shot.kind === 'photo') {
    const z = (shot.z0 + (shot.z1 - shot.z0) * Easing.out(Easing.quad)(k)) * pz;
    return (
      <AbsoluteFill style={{background: '#0b0b0b', overflow: 'hidden'}}>
        <Img
          src={staticFile(shot.src)}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: `${shot.fx ?? 50}% ${shot.fy ?? 50}%`,
            transform: `scale(${z})`,
            transformOrigin: `${shot.fx ?? 50}% ${shot.fy ?? 50}%`,
            filter: 'grayscale(1) sepia(0.18) contrast(1.15) brightness(0.92)',
          }}
        />
      </AbsoluteFill>
    );
  }
  if (shot.kind === 'map') {
    const cam = cameraAt(shot.cam, t);
    return (
      <AbsoluteFill style={{background: '#121413', transform: `scale(${pz})`}}>
        {/* Map focus sits above the caption band. */}
        <WorldMap cam={cam} theme="dark" focusY={880}>
          <DarkLocal />
          <MapLayer t={t} layer={shot.layer} from={shot.from} />
        </WorldMap>
      </AbsoluteFill>
    );
  }
  // The series' closing caption, reconstructed as white-on-black end card text.
  const line1 = 'It has been reported that';
  const line2 = 'none of them survived.';
  const first = shot.from < 20;
  const reveal = first ? ramp(t, 15.9, 17.5, (x) => x) : 1;
  const all = line1 + ' ' + line2;
  const n = Math.round(all.length * reveal);
  const shown = all.slice(0, n);
  const stamp = first ? 0 : ramp(t, 24.1, 24.25);
  return (
    <AbsoluteFill style={{background: '#050505', justifyContent: 'center', alignItems: 'center', transform: `scale(${pz})`}}>
      <div style={{fontFamily: SERIF, fontSize: 68, color: '#EDE6D8', textAlign: 'center', lineHeight: 1.35, width: 960, marginTop: -260}}>
        {shown.length <= line1.length ? shown : (
          <>
            {line1}
            <br />
            {shown.slice(line1.length + 1)}
          </>
        )}
      </div>
      <div style={{position: 'absolute', top: 1070, fontFamily: FONT, fontSize: 30, letterSpacing: 6, color: 'rgba(237,230,216,0.55)'}}>HBO · CHERNOBYL · 2019</div>
      {stamp > 0 && (
        <div
          style={{
            position: 'absolute',
            top: 860,
            transform: `rotate(-9deg) scale(${1.8 - 0.8 * Easing.out(Easing.cubic)(stamp)})`,
            border: `10px solid ${RED}`,
            color: RED,
            fontFamily: FONT,
            fontWeight: 900,
            fontSize: 110,
            padding: '6px 30px',
            letterSpacing: 4,
            opacity: stamp,
          }}
        >
          NO EVIDENCE
        </div>
      )}
    </AbsoluteFill>
  );
};

// ---------- kinetic captions ----------
type W = {w: string; s: number; e: number};
const WORDS = words as W[];
const KEY = /^(hbo|everyone|bridge|died|proof|1986|reactor|burning|glow|chilling|none|survived|decade|evidence|boy|alive|real|legend|changed|death)/i;
const CHUNKS: {text: W[]; s: number}[] = (() => {
  const out: {text: W[]; s: number}[] = [];
  let cur: W[] = [];
  WORDS.forEach((w, i) => {
    cur.push(w);
    const end = /[.,!?]$/.test(w.w) || cur.length >= 3 || (WORDS[i + 1] && WORDS[i + 1].s - w.e > 0.35);
    if (end) {
      out.push({text: cur, s: cur[0].s});
      cur = [];
    }
  });
  if (cur.length) out.push({text: cur, s: cur[0].s});
  return out;
})();

const Captions: React.FC<{t: number; y: number; hidden: boolean}> = ({t, y, hidden}) => {
  if (hidden) return null;
  const i = CHUNKS.findIndex((c, j) => t >= c.s - 0.05 && (j === CHUNKS.length - 1 || t < CHUNKS[j + 1].s - 0.05));
  if (i < 0) return null;
  const c = CHUNKS[i];
  const last = c.text[c.text.length - 1];
  if (t > last.e + 0.6) return null;
  const pop = interpolate(t - c.s, [0, 0.1], [0.8, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.back(2.5))});
  return (
    <div style={{position: 'absolute', left: 60, right: 60, top: y, textAlign: 'center', transform: `scale(${pop})`}}>
      {c.text.map((w, j) => {
        const active = t >= w.s - 0.03;
        const key = KEY.test(w.w.replace(/[^a-z0-9]/gi, ''));
        return (
          <span
            key={j}
            style={{
              fontFamily: FONT,
              fontWeight: 900,
              fontSize: 96,
              lineHeight: 1.05,
              textTransform: 'uppercase',
              color: key ? RED : IVORY,
              opacity: active ? 1 : 0.35,
              WebkitTextStroke: '12px #000',
              paintOrder: 'stroke fill',
              textShadow: '0 10px 30px rgba(0,0,0,0.85)',
              marginRight: 22,
              display: 'inline-block',
            }}
          >
            {w.w.replace(/^-/, '')}
          </span>
        );
      })}
    </div>
  );
};

// ---------- case-file frame (version 2) ----------
const STATUS: [number, string, string][] = [
  [0, 'UNVERIFIED', '#B9A27A'],
  [24.1, 'NO EVIDENCE', RED],
  [35.88, 'LEGEND', RED],
];
const CaseFrame: React.FC<{t: number}> = ({t}) => {
  const [, label, color] = [...STATUS].reverse().find(([s]) => t >= s) ?? STATUS[0];
  const changed = [...STATUS].reverse().find(([s]) => t >= s)?.[0] ?? 0;
  const pop = changed > 0 ? interpolate(t - changed, [0, 0.15], [1.25, 1], {extrapolateRight: 'clamp'}) : 1;
  return (
    <>
      <div style={{position: 'absolute', left: 50, right: 50, top: 200, padding: '22px 30px', background: '#E8DDC5', boxShadow: '0 20px 60px rgba(0,0,0,0.6)'}}>
        <div style={{fontFamily: FONT, fontWeight: 800, fontSize: 26, letterSpacing: 6, color: '#77736C'}}>THE CLAIM · HBO, 2019</div>
        <div style={{fontFamily: SERIF, fontWeight: 900, fontSize: 50, color: '#171817', marginTop: 6, lineHeight: 1.1}}>Everyone on this bridge died.</div>
        <div
          style={{
            position: 'absolute',
            right: 26,
            top: 18,
            transform: `scale(${pop}) rotate(-4deg)`,
            border: `5px solid ${color}`,
            color,
            fontFamily: FONT,
            fontWeight: 900,
            fontSize: 30,
            padding: '4px 14px',
            letterSpacing: 3,
          }}
        >
          {label}
        </div>
      </div>
    </>
  );
};

const SFX: Cue[] = [
  [0, 'impact', 0.35],
  [2.0, 'impact', 0.3],
  [4.6, 'air', 0.18], [7.85, 'air', 0.15], [8.76, 'impact', 0.28],
  [10.9, 'air', 0.15], [13.6, 'air', 0.2],
  [24.1, 'impact', 0.5], [24.12, 'stamp', 0.4],
  [25.3, 'air', 0.15], [34.1, 'air', 0.15], [35.88, 'impact', 0.45],
  [36.85, 'air', 0.15],
];

export const ChernobylCut: React.FC<{framed?: boolean}> = ({framed = false}) => {
  const t = useSeconds();
  const frame = useCurrentFrame();
  const i = SHOTS.findIndex((s, j) => t >= s.from && (j === SHOTS.length - 1 || t < SHOTS[j + 1].from));
  const shot = SHOTS[Math.max(0, i)];
  const until = SHOTS[i + 1]?.from ?? DURATION;
  const endcard = shot.kind === 'endcard';
  // A 2-frame flash on the hardest cuts.
  const flash = [2.0, 24.1, 35.88].some((f) => t >= f && t < f + 0.07);

  const media = <ShotView shot={shot} t={t} until={until} />;
  return (
    <AbsoluteFill style={{background: '#0b0b0b'}}>
      {framed ? (
        <>
          <AbsoluteFill style={{filter: 'blur(40px) brightness(0.35)', transform: 'scale(1.2)'}}>{media}</AbsoluteFill>
          <div style={{position: 'absolute', left: 50, right: 50, top: 420, height: 820, overflow: 'hidden', borderRadius: 14, boxShadow: '0 30px 90px rgba(0,0,0,0.75)', outline: '2px solid rgba(232,221,197,0.25)'}}>
            <div style={{position: 'absolute', left: -50, top: shot.kind === 'map' ? -470 : -420, width: 1080, height: 1920}}>{media}</div>
          </div>
          <CaseFrame t={t} />
        </>
      ) : (
        media
      )}
      {!framed && <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 45%, rgba(0,0,0,0.6) 100%)'}} />}
      <Captions t={t} y={framed ? 1280 : 1170} hidden={endcard} />
      {flash && <AbsoluteFill style={{background: '#fff', opacity: 0.55}} />}
      <Grain frame={frame} />
      <Audio src={staticFile('chernobyl/vo.wav')} />
      <SfxTrack cues={SFX} />
    </AbsoluteFill>
  );
};
