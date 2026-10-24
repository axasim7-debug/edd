// Version C — paper investigation board. One board, one virtual camera; the
// story is told by evidence arriving, pins, string and an ink map.
import {AbsoluteFill, Audio, staticFile} from 'remotion';
import {geoMercator} from 'd3-geo';
import type {FeatureCollection} from 'geojson';
import {ramp, useSeconds, window_} from '../../lib/map';
import {Board, INK, InkArrow, InkCross, InkMap, InkRoute, Lighting, Note, Paper, Pin, Print, Stamp, StringLine, Typed, boardCamAt, type BoardKey} from '../../lib/paper';
import {SfxTrack, typing, type Cue} from '../../lib/sfx';
import {DURATION} from './Enigma';
import europe1938 from './data/europe_1938.json';

const BORDERS = europe1938 as unknown as FeatureCollection;
const A = (f: string) => `enigma/art/${f}.jpg`;
const BW = 2400;
const BH = 6400;

// ---- Map sheet geometry (board pixels) ----
const MAP = {x: 1200, y: 5300, w: 2200, h: 1500};
const MAP_LEFT = MAP.x - MAP.w / 2;
const MAP_TOP = MAP.y - MAP.h / 2;
const PROJ = geoMercator().fitExtent(
  [
    [40, 40],
    [MAP.w - 40, MAP.h - 40],
  ],
  {type: 'LineString', coordinates: [[-6, 42.6], [30, 57.6]]} as unknown as GeoJSON.LineString,
);
const local = (lon: number, lat: number) => PROJ([lon, lat]) as [number, number];
const onMap = (lon: number, lat: number): [number, number] => {
  const [x, y] = local(lon, lat);
  return [MAP_LEFT + x, MAP_TOP + y];
};
const G = {
  warsaw: [21.0122, 52.2297],
  london: [-0.1276, 51.5072],
  paris: [2.3522, 48.8566],
  chernivtsi: [25.94, 48.29],
  bucharest: [26.1025, 44.4268],
} as const;
const WARSAW = onMap(...G.warsaw);
const LONDON = onMap(...G.london);
const PARIS = onMap(...G.paris);
const POLAND_C = onMap(19.2, 52.0);

// ---- Evidence positions (board pixels) ----
const TURING = {x: 700, y: 820, pin: [700, 500] as [number, number]};
const MANSION = {x: 1720, y: 640, pin: [1720, 410] as [number, number]};
const BOMBE = {x: 1660, y: 1270, pin: [1660, 1050] as [number, number]};
const REJ = {x: 500, y: 2050, pin: [500, 1770] as [number, number]};
const ZYG = {x: 1200, y: 2010, pin: [1200, 1730] as [number, number]};
const ROZ = {x: 1900, y: 2060, pin: [1900, 1780] as [number, number]};
const ENIGMA = {x: 1450, y: 3150, pin: [1450, 2865] as [number, number]};
const WIRING = {x: 640, y: 3260};

const CAMERA: BoardKey[] = [
  {t: 0, x: 700, y: 840, z: 1.35},
  {t: 3.9, x: 720, y: 900, z: 1.1},
  {t: 4.7, x: 1200, y: 2160, z: 0.5},
  {t: 8.6, x: 1200, y: 2230, z: 0.53},
  {t: 9.7, x: 1450, y: 3150, z: 1.0},
  {t: 12.3, x: 1450, y: 3150, z: 1.08},
  {t: 13.4, x: 1200, y: 2700, z: 0.42},
  {t: 14.6, x: 1200, y: 2700, z: 0.42},
  {t: 15.5, x: 500, y: 2060, z: 1.2},
  {t: 17.7, x: 500, y: 2100, z: 1.3},
  {t: 18.6, x: 1040, y: 2980, z: 0.62},
  {t: 21.8, x: 1040, y: 3040, z: 0.66},
  {t: 22.5, x: 1200, y: 4060, z: 0.55},
  {t: 25.8, x: 1200, y: 4080, z: 0.6},
  {t: 30.2, x: 1240, y: 4140, z: 0.7},
  {t: 31.7, x: WARSAW[0], y: WARSAW[1] + 80, z: 1.1},
  {t: 35.3, x: WARSAW[0], y: WARSAW[1] + 80, z: 1.2},
  {t: 36.0, x: MAP.x, y: MAP.y, z: 0.46},
  {t: 45.2, x: MAP.x, y: MAP.y, z: 0.48},
  {t: 45.9, x: POLAND_C[0], y: POLAND_C[1] - 120, z: 0.85},
  {t: 48.3, x: POLAND_C[0], y: POLAND_C[1] - 120, z: 0.9},
  {t: 49.0, x: MAP.x, y: MAP.y, z: 0.46},
  {t: 52.8, x: MAP.x, y: MAP.y, z: 0.48},
  {t: 53.8, x: 1200, y: 1150, z: 0.45},
  {t: 59.3, x: 1200, y: 1150, z: 0.47},
  {t: 60.0, x: 700, y: 840, z: 1.0},
  {t: 60.9, x: 700, y: 840, z: 1.05},
  {t: 61.6, x: 1150, y: 1400, z: 0.45},
  {t: 63.8, x: 1150, y: 1400, z: 0.46},
  {t: 66.0, x: 1200, y: 2000, z: 0.38},
  {t: 68.6, x: 900, y: 2050, z: 0.6},
  {t: 70.2, x: 500, y: 2120, z: 1.2},
  {t: DURATION, x: 500, y: 2140, z: 1.32},
];

// Pencil wiring sheet for "rebuilds Enigma's secret wiring" (labelled reconstruction).
const WiringSheet: React.FC<{t: number; show: number}> = ({t, show}) => {
  const map = 'EKMFLGDQVZNTOWYHXUSPAIBRCJ'; // Enigma I, rotor I
  const p = ramp(t, 19.0, 21.4, (x) => x);
  return (
    <Paper x={WIRING.x} y={WIRING.y} w={720} h={900} rotate={-3} show={show} from={[-120, 40]} depth={0.5}
      style={{backgroundImage: `linear-gradient(rgba(98,99,74,0.18) 1px, transparent 1px), linear-gradient(90deg, rgba(98,99,74,0.18) 1px, transparent 1px), url(${staticFile('paper/paper.jpg')})`, backgroundSize: '30px 30px, 30px 30px, 512px 512px'}}>
      <svg width={720} height={900} style={{position: 'absolute', inset: 0}}>
        {Array.from({length: 26}, (_, i) => {
          const j = map.charCodeAt(i) - 65;
          const k = Math.max(0, Math.min(1, p * 26 - i));
          const y1 = 80 + i * 28;
          const y2 = 80 + j * 28;
          return (
            <g key={i}>
              <text x={150} y={y1 + 8} fontFamily="'Special Elite', monospace" fontSize={22} fill={INK.ink} textAnchor="end">{String.fromCharCode(65 + i)}</text>
              <text x={570} y={y1 + 8} fontFamily="'Special Elite', monospace" fontSize={22} fill={INK.ink}>{String.fromCharCode(65 + i)}</text>
              <circle cx={170} cy={y1} r={4} fill={INK.ink} />
              <circle cx={550} cy={y1} r={4} fill={INK.ink} />
              {k > 0 && <line x1={170} y1={y1} x2={170 + 380 * k} y2={y1 + (y2 - y1) * k} stroke={i === 4 ? INK.red : INK.ink} strokeWidth={i === 4 ? 3 : 1.8} opacity={0.85} />}
            </g>
          );
        })}
      </svg>
      <div style={{position: 'absolute', left: 40, bottom: 26}}>
        <Typed text="ROTOR I WIRING — RECONSTRUCTION" progress={ramp(t, 19.2, 20.6)} size={24} />
      </div>
    </Paper>
  );
};

const Label: React.FC<{text: string; x: number; y: number; t: number; at: number; w?: number; rotate?: number; size?: number}> = ({text, x, y, t, at, w, rotate = 0, size = 46}) => (
  <Paper x={x} y={y} w={w ?? text.length * size * 0.62 + 70} h={size + 46} rotate={rotate} show={ramp(t, at, at + 0.35)} from={[0, 30]} depth={0.5}>
    <div style={{position: 'absolute', left: 34, top: 20}}>
      <Typed text={text} progress={ramp(t, at + 0.2, at + 0.2 + text.length / 16, (x) => x)} size={size} />
    </div>
  </Paper>
);

export const EnigmaPaper: React.FC = () => {
  const t = useSeconds();
  const cam = boardCamAt(CAMERA, t);
  const pinsIn = (at: number) => ramp(t, at, at + 0.22);

  const cipher = 'QBLTW LDAHH YEOEF PTWYB LENDP';
  const plain = 'KEINE BESONDEREN EREIGNISSE';

  // Spotlight on Rejewski for "Silent." and the ending (screen space).
  const rs = {x: (REJ.x - cam.x) * cam.z + 540, y: (REJ.y - cam.y) * cam.z + 960};
  const spot = Math.max(ramp(t, 66.5, 68.8) * 0.9, ramp(t, 68.8, 69.4));

  return (
    <AbsoluteFill style={{background: INK.charcoal}}>
      <Board cam={cam} width={BW} height={BH}>
        {/* ---------- Map sheet (bottom of the board) ---------- */}
        <Paper x={MAP.x} y={MAP.y} w={MAP.w} h={MAP.h} show={window_(t, 31.2, DURATION + 1, 0.4)} from={[0, 160]} depth={0.2} tone="#e2d5b8">
          <InkMap w={MAP.w} h={MAP.h} projection={PROJ} borders={BORDERS}>
            {/* invasion arrows */}
            {[
              [[15.0, 54.3], [18.3, 53.1]],
              [[20.6, 54.7], [20.9, 52.8]],
              [[15.8, 50.6], [19.2, 51.5]],
              [[19.8, 48.8], [20.7, 50.3]],
            ].map(([a, b], i) => (
              <InkArrow key={i} a={local(a[0], a[1])} b={local(b[0], b[1])} progress={ramp(t, 46.66 + i * 0.12, 47.5 + i * 0.12)} width={22} />
            ))}
            {/* escape route in pencil */}
            <InkRoute pts={[local(...G.warsaw), local(...G.chernivtsi), local(...G.bucharest), local(16, 45.2), local(9, 45.6), local(...G.paris)]} progress={ramp(t, 48.9, 52.2, (x) => x)} />
          </InkMap>
          <div style={{position: 'absolute', left: 60, top: 40}}>
            <Typed text="EUROPE · 1939" progress={ramp(t, 31.6, 32.4)} size={40} color={INK.walnut} />
          </div>
        </Paper>
        <Pin x={WARSAW[0]} y={WARSAW[1]} show={pinsIn(32.0)} />
        <Label text="WARSAW" x={WARSAW[0] + 150} y={WARSAW[1] + 70} t={t} at={32.1} size={34} rotate={2} />
        <Note text="Pyry forest — 25 July 1939" x={WARSAW[0] - 330} y={WARSAW[1] + 150} progress={ramp(t, 33.3, 35.0)} size={52} />
        <Pin x={LONDON[0]} y={LONDON[1]} show={pinsIn(36.0)} color={INK.ink} />
        <Pin x={PARIS[0]} y={PARIS[1]} show={pinsIn(36.5)} color={INK.ink} />
        <Label text="LONDON" x={LONDON[0] - 20} y={LONDON[1] - 110} t={t} at={36.1} size={34} rotate={-2} />
        <Label text="PARIS" x={PARIS[0] + 20} y={PARIS[1] + 90} t={t} at={36.6} size={34} rotate={1} />
        <StringLine a={[WARSAW[0], WARSAW[1] - 36]} b={[LONDON[0], LONDON[1] - 36]} progress={ramp(t, 38.5, 40.0)} sag={0.04} />
        <StringLine a={[WARSAW[0], WARSAW[1] - 36]} b={[PARIS[0], PARIS[1] - 36]} progress={ramp(t, 39.0, 40.5)} sag={0.05} />
        <Print src={A('enigma')} x={onMap(19.5, 56.6)[0]} y={onMap(19.5, 56.6)[1] - 40} w={480} h={350} rotate={4} show={ramp(t, 41.7, 42.1)} from={[160, -60]} focus="50% 50%" border={16} />
        <Print src={A('invasion')} x={onMap(14.2, 56.6)[0]} y={onMap(14.2, 56.6)[1]} w={600} h={420} rotate={-3} show={ramp(t, 45.45, 45.85)} from={[-160, -40]} focus="50% 50%" />
        <Stamp text="1 SEPT 1939" x={onMap(24.6, 55.3)[0]} y={onMap(24.6, 55.3)[1]} show={ramp(t, 46.7, 46.9)} size={46} />

        {/* ---------- Telegram strips ---------- */}
        <Paper x={1200} y={3960} w={1760} h={150} rotate={-1} show={ramp(t, 21.9, 22.3)} from={[-300, 0]} depth={0.4}>
          <div style={{position: 'absolute', left: 40, top: 44}}>
            <Typed text={cipher} progress={ramp(t, 22.2, 23.2, (x) => x)} size={58} color={t > 26 ? INK.red : INK.ink} />
          </div>
        </Paper>
        <Paper x={1180} y={4160} w={1600} h={140} rotate={1} show={ramp(t, 22.9, 23.2)} from={[300, 0]} depth={0.4}>
          <div style={{position: 'absolute', left: 40, top: 40}}>
            <Typed text={plain} progress={ramp(t, 23.1, 25.3, (x) => x)} size={54} />
          </div>
        </Paper>
        <Note text="Dec 1938: five rotors" x={1180} y={4290} progress={ramp(t, 26.0, 27.6)} size={78} />

        {/* ---------- Enigma + wiring ---------- */}
        <WiringSheet t={t} show={window_(t, 18.9, DURATION + 1, 0.3)} />
        <Print src={A('enigma')} x={ENIGMA.x} y={ENIGMA.y} w={820} h={600} rotate={2} show={ramp(t, 9.72, 10.1)} from={[200, 60]} focus="50% 50%" />
        <Pin x={ENIGMA.pin[0]} y={ENIGMA.pin[1]} show={pinsIn(10.0)} color={INK.ink} />
        <Label text="ENIGMA · GERMANY" x={ENIGMA.x + 60} y={ENIGMA.y + 370} t={t} at={10.2} rotate={-1} />

        {/* ---------- The three Poles ---------- */}
        <Print src={A('rejewski')} x={REJ.x} y={REJ.y} w={470} h={590} rotate={-2} show={window_(t, 4.76, DURATION + 1, 0.35)} from={[-140, 60]} />
        <Print src={A('zygalski')} x={ZYG.x} y={ZYG.y} w={470} h={590} rotate={1} show={ramp(t, 5.1, 5.45)} from={[0, 120]} />
        <Print src={A('rozycki')} x={ROZ.x} y={ROZ.y} w={470} h={590} rotate={3} show={ramp(t, 5.45, 5.8)} from={[140, 60]} />
        <Pin x={REJ.pin[0]} y={REJ.pin[1]} show={pinsIn(5.0)} />
        <Pin x={ZYG.pin[0]} y={ZYG.pin[1]} show={pinsIn(5.35)} />
        <Pin x={ROZ.pin[0]} y={ROZ.pin[1]} show={pinsIn(5.7)} />
        <Label text="REJEWSKI" x={REJ.x} y={REJ.y + 360} t={t} at={5.0} rotate={-1} />
        <Label text="ZYGALSKI" x={ZYG.x} y={ZYG.y + 360} t={t} at={5.35} rotate={1} />
        <Label text="RÓŻYCKI" x={ROZ.x} y={ROZ.y + 360} t={t} at={5.7} rotate={-1} />
        <Label text="POLISH CIPHER BUREAU · WARSAW" x={1150} y={2580} t={t} at={6.3} size={40} rotate={-1} />
        <Stamp text="1932" x={1950} y={2560} show={ramp(t, 8.12, 8.3)} size={84} />
        {t > 70.2 && <Label text="MARIAN REJEWSKI  1905–1980" x={REJ.x + 120} y={REJ.y + 380} t={t} at={70.3} size={40} rotate={-1} />}

        {/* ---------- Bletchley cluster ---------- */}
        <Print src={A('bletchley')} x={MANSION.x} y={MANSION.y} w={720} h={520} rotate={2} show={ramp(t, 53.2, 53.6)} from={[200, -40]} focus="45% 50%" />
        <Pin x={MANSION.pin[0]} y={MANSION.pin[1]} show={pinsIn(53.5)} color={INK.ink} />
        <Label text="BLETCHLEY PARK" x={MANSION.x} y={MANSION.y + 330} t={t} at={53.7} rotate={-1} />
        <Print src={A('bombe')} x={BOMBE.x} y={BOMBE.y} w={640} h={470} rotate={-2} show={ramp(t, 55.5, 55.9)} from={[200, 60]} focus="50% 50%" />
        <Pin x={BOMBE.pin[0]} y={BOMBE.pin[1]} show={pinsIn(55.8)} color={INK.ink} />

        {/* ---------- Turing (top of the board) ---------- */}
        <Print src={A('turing')} x={TURING.x} y={TURING.y} w={560} h={700} rotate={-3} show={window_(t, -1, DURATION + 1)} />
        <Pin x={TURING.pin[0]} y={TURING.pin[1]} show={1} color={INK.ink} />
        <Label text="A. TURING" x={TURING.x + 30} y={TURING.y + 420} t={t} at={-1} rotate={2} />
        <InkCross x={TURING.x} y={TURING.y} w={500} h={640} progress={ramp(t, 2.55, 3.15) * (1 - ramp(t, 52.8, 53.2))} />

        {/* ---------- Strings: real relationships only ---------- */}
        <div style={{position: 'absolute', left: 0, top: 0, opacity: 1 - ramp(t, 66.0, 68.4)}}>
          <StringLine a={REJ.pin} b={ENIGMA.pin} progress={ramp(t, 17.8, 18.5)} sag={0.05} />
        <StringLine a={REJ.pin} b={BOMBE.pin} progress={ramp(t, 54.4, 55.6)} sag={0.04} />
          <StringLine a={REJ.pin} b={MANSION.pin} progress={ramp(t, 61.2, 61.9)} sag={0.03} cut={ramp(t, 62.8, 63.6)} />
        </div>
      </Board>

      <Lighting spot={{x: rs.x, y: rs.y - 20, r: 300 * cam.z + 120, amount: spot * (1 - 0.35 * ramp(t, 70.2, 72.5))}} />

      <Audio src={staticFile('enigma/vo.wav')} />
      <SfxTrack cues={SFX} />
    </AbsoluteFill>
  );
};

const SFX: Cue[] = [
  [2.55, 'impact', 0.4], [2.6, 'string', 0.2],
  [3.9, 'air', 0.18],
  [4.76, 'paper1', 0.3], [5.0, 'pin', 0.4], [5.1, 'paper2', 0.3], [5.35, 'pin', 0.4], [5.45, 'paper1', 0.3], [5.7, 'pin', 0.4],
  ...typing(5.2, 8, 16, 0.2), ...typing(6.5, 14, 16, 0.22),
  [8.12, 'stamp', 0.5],
  [9.72, 'paper2', 0.32], [10.0, 'pin', 0.4], ...typing(10.4, 10, 16, 0.2),
  [12.5, 'air', 0.18], [14.8, 'air', 0.18],
  [17.8, 'string', 0.35], [18.3, 'impact', 0.45],
  [18.9, 'paper2', 0.3], ...typing(19.2, 12, 10, 0.15),
  [21.9, 'paper1', 0.32], ...typing(22.2, 16, 16, 0.25), [22.9, 'paper2', 0.3], ...typing(23.1, 27, 12.3, 0.28),
  [31.2, 'paper2', 0.35], [32.0, 'pin', 0.45], ...typing(32.2, 6, 16, 0.2),
  [36.0, 'pin', 0.4], [36.5, 'pin', 0.4], [38.5, 'string', 0.35], [39.0, 'string', 0.3],
  [41.7, 'paper1', 0.32],
  [45.45, 'paper2', 0.32], [46.66, 'impact', 0.55], [46.7, 'stamp', 0.45],
  [48.9, 'air', 0.15],
  [53.2, 'paper1', 0.3], [53.5, 'pin', 0.4], ...typing(53.9, 14, 16, 0.2),
  [54.4, 'string', 0.35], [55.5, 'paper2', 0.3], [55.8, 'pin', 0.4],
  [61.2, 'string', 0.3], [62.8, 'impact', 0.4],
  [70.3, 'paper1', 0.3], ...typing(70.5, 26, 16, 0.25),
];
