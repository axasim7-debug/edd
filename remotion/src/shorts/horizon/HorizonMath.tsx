// Short #5, version "math" — 3Blue1Brown-style physics animation on black.
// Everything drawn is computed: light paths are Schwarzschild null geodesics
// (tools/geodesics.py), the funnel is Flamm's paraboloid z = 2√(rs(r − rs)),
// the light cones and signals use ingoing Eddington–Finkelstein coordinates
// (outgoing light: dt/dr = (r + rs)/(r − rs)). One scene per sentence group,
// smooth easing, strokes that draw themselves. No captions.
import {AbsoluteFill, Audio, Easing, interpolate, staticFile, useVideoConfig} from 'remotion';
import {loadFont} from '@remotion/fonts';
import {useSeconds} from '../../lib/map';
import {KUFI} from '../../lib/arabic';
import {SfxTrack, type Cue} from '../../lib/sfx';
import {DURATION} from './scene';
import geo from './data/geodesics.json';

loadFont({family: 'STIX Two Text', url: staticFile('fonts/STIXTwoText.ttf'), weight: '400 700'});
loadFont({family: 'STIX Two Text', url: staticFile('fonts/STIXTwoText-Italic.ttf'), weight: '400 700', style: 'italic'});

export {DURATION};
export const MATH = "'STIX Two Text', serif";
export const C = {
  bg: '#0B0C0F',
  grid: 'rgba(88,196,221,0.10)',
  blue: '#58C4DD',
  yellow: '#F7D96F',
  red: '#FC6255',
  white: '#ECECEC',
  grey: '#8A8A8A',
  hole: '#000',
};
type Pt = [number, number];
const G = geo as unknown as {incoming: Pt[][]; inside: Pt[][]; outside: {pts: Pt[]; fate: string}[]};

const smooth = Easing.bezier(0.45, 0, 0.25, 1);
export const k = (t: number, a: number, b: number) => interpolate(t, [a, b], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: smooth});
// 1 inside [a, b] with soft edges.
export const on = (t: number, a: number, b: number, f = 0.35) => Math.min(k(t, a - f, a + f * 0.2), 1 - k(t, b - f * 0.2, b + f));

// ---------- primitives ----------
const polyD = (pts: Pt[], s: number, ox: number, oy: number) => 'M' + pts.map(([x, y]) => `${ox + x * s},${oy + y * s}`).join('L');

const Path: React.FC<{pts: Pt[]; s: number; ox: number; oy: number; color: string; w?: number; p: number; opacity?: number; dash?: string}> = ({pts, s, ox, oy, color, w = 4, p, opacity = 1, dash}) =>
  p <= 0 ? null : (
    <path d={polyD(pts, s, ox, oy)} fill="none" stroke={color} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={dash ?? `${p} 1`} opacity={opacity} />
  );

// Arrowhead at a fraction p along a polyline.
const headAt = (pts: Pt[], p: number, s: number, ox: number, oy: number) => {
  const seg = pts.slice(1).map((q, i) => Math.hypot(q[0] - pts[i][0], q[1] - pts[i][1]));
  const total = seg.reduce((a, b) => a + b, 0);
  let left = total * Math.min(0.999, p);
  for (let i = 0; i < seg.length; i++) {
    if (left <= seg[i]) {
      const f = left / seg[i];
      const x = pts[i][0] + (pts[i + 1][0] - pts[i][0]) * f;
      const y = pts[i][1] + (pts[i + 1][1] - pts[i][1]) * f;
      return {x: ox + x * s, y: oy + y * s, a: Math.atan2(pts[i + 1][1] - pts[i][1], pts[i + 1][0] - pts[i][0])};
    }
    left -= seg[i];
  }
  return null;
};
const Head: React.FC<{h: {x: number; y: number; a: number} | null; color: string; size?: number; opacity?: number}> = ({h, color, size = 18, opacity = 1}) =>
  h ? (
    <polygon
      points={`${h.x + Math.cos(h.a) * size},${h.y + Math.sin(h.a) * size} ${h.x + Math.cos(h.a + 2.6) * size * 0.8},${h.y + Math.sin(h.a + 2.6) * size * 0.8} ${h.x + Math.cos(h.a - 2.6) * size * 0.8},${h.y + Math.sin(h.a - 2.6) * size * 0.8}`}
      fill={color}
      opacity={opacity}
    />
  ) : null;

const Grid: React.FC<{opacity: number; step?: number; ox?: number; oy?: number}> = ({opacity, step = 90, ox = 540, oy = 900}) => {
  if (opacity <= 0) return null;
  const lines = [];
  for (let x = ((ox % step) + step) % step; x < 1080; x += step) lines.push(<line key={'x' + x} x1={x} y1={0} x2={x} y2={1920} />);
  for (let y = ((oy % step) + step) % step; y < 1920; y += step) lines.push(<line key={'y' + y} x1={0} y1={y} x2={1080} y2={y} />);
  return (
    <g stroke={C.grid} strokeWidth={2} opacity={opacity}>
      {lines}
    </g>
  );
};

// ---------- scene 1/7: top-down view of the hole ----------
// Units: rs. Screen centre of the hole (ox, oy), s px per rs.
const TopDown: React.FC<{t: number; o: number}> = ({t, o}) => {
  if (o <= 0) return null;
  // camera: close on the horizon for the hook, zoom out for "huge", back in later
  const s = interpolate(t, [0, 7.6, 8.6, 12.4, 34.4, 35.2], [330, 300, 70, 62, 62, 300], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: smooth});
  const ox = 540;
  const oy = interpolate(t, [0, 7.6, 8.6, 34.4, 35.2], [1150, 1120, 900, 900, 1120], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: smooth});
  // the astronaut: radial infall straight up, crossing r = 1 on "عديت" (3.1 s)
  const r = t < 34 ? interpolate(t, [0, 3.1, 7.6], [1.75, 1.0, 0.82], {extrapolateRight: 'clamp', easing: Easing.inOut(Easing.quad)}) : 0.82;
  const ax = ox;
  const ay = oy - r * s;
  const inc = (a: number, b: number) => (t > a ? k(t, a, b) : 0);
  const gas = on(t, 10.3, 12.9);
  return (
    <g opacity={o}>
      {/* hot gas far out (illustration) */}
      {gas > 0 && (
        <g opacity={gas}>
          <circle cx={ox} cy={oy} r={7 * s} fill="none" stroke={C.red} strokeOpacity={0.35} strokeWidth={2.4 * s} strokeDasharray="2 10" />
          <circle cx={ox} cy={oy} r={5.8 * s} fill="none" stroke={C.red} strokeWidth={3} strokeDasharray="10 12" opacity={0.7} />
          <circle cx={ox} cy={oy} r={8.2 * s} fill="none" stroke={C.red} strokeWidth={3} strokeDasharray="10 12" opacity={0.7} />
        </g>
      )}
      <circle cx={ox} cy={oy} r={s} fill={C.hole} />
      <circle cx={ox} cy={oy} r={s} fill="none" stroke={C.white} strokeWidth={4} pathLength={1} strokeDasharray={`${k(t, -1, 0.01)} 1`} />
      <circle cx={ox} cy={oy} r={5} fill={C.red} opacity={0.8} />
      {/* light from far away still reaches you (4.0–5.8 and again 34.5–37.7) */}
      {G.incoming.map((pts, i) => {
        const p = Math.max(inc(4.0 + i * 0.08, 5.6 + i * 0.08) * (1 - k(t, 7.4, 7.8)), inc(35.2 + i * 0.06, 37.0 + i * 0.06) * (1 - k(t, 44.3, 44.7)));
        return (
          <g key={i}>
            <Path pts={pts} s={s} ox={ox} oy={oy} color={C.yellow} w={4} p={p} />
            {p > 0.05 && p < 0.999 && <Head h={headAt(pts, p, s, ox, oy)} color={C.yellow} />}
          </g>
        );
      })}
      {/* what you send from inside: every path ends at the centre (6.1–7.6, 37.9–41.7) */}
      {G.inside.map((pts, i) => {
        const p = Math.max(inc(6.14 + i * 0.05, 7.4 + i * 0.05) * (1 - k(t, 7.5, 7.8)), inc(38.0 + i * 0.08, 40.2 + i * 0.08) * (1 - k(t, 44.3, 44.7)));
        return (
          <g key={i}>
            <Path pts={pts} s={s} ox={ox} oy={oy} color={C.red} w={4} p={p} />
            {p > 0.05 && p < 0.97 && <Head h={headAt(pts, p, s, ox, oy)} color={C.red} size={15} />}
          </g>
        );
      })}
      {/* the astronaut */}
      <circle cx={ax} cy={ay} r={14} fill={C.blue} stroke="#fff" strokeWidth={3} />
    </g>
  );
};

// ---------- scene 2/7: Flamm's paraboloid ----------
const Funnel: React.FC<{t: number; o: number}> = ({t, o}) => {
  if (o <= 0) return null;
  const az = (t - 12.74) * 0.12 + 0.4; // slow turn
  const el = interpolate(t, [12.74, 24.38], [0.42, 0.55]);
  const S = interpolate(t, [12.74, 19.4, 20.6, 24.4], [150, 150, 260, 280], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: smooth});
  const cy0 = interpolate(t, [12.74, 19.4, 20.6], [760, 760, 520], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: smooth});
  const proj = (r: number, phi: number): Pt => {
    const x = r * Math.cos(phi + az);
    const y = r * Math.sin(phi + az);
    const z = 2 * Math.sqrt(Math.max(0, r - 1));
    return [540 + x * S, cy0 + (y * Math.sin(el) + (6 - z) * Math.cos(el) * 0.62) * S * 0.9];
  };
  const draw = k(t, 12.74, 14.6);
  const rings = [1.0, 1.15, 1.4, 1.8, 2.4, 3.2, 4.2];
  const ringD = (r: number) => 'M' + Array.from({length: 97}, (_, i) => proj(r, (i / 96) * Math.PI * 2).join(',')).join('L');
  const spokes = Array.from({length: 24}, (_, i) => (i / 24) * Math.PI * 2);
  // the astronaut slides down the front of the funnel and through the throat at 18.9 s
  const front = Math.PI * 0.92 - az; // the left flank, where the slope reads clearly
  const rr = interpolate(t, [13.4, 18.9], [4.0, 1.0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.in(Easing.quad)});
  // after the throat it drifts a little way into the dark opening
  const below = interpolate(t, [18.9, 21.2], [0, 0.22], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.quad)});
  const [fx, dy0] = proj(rr, front);
  const throatY = cy0 + 6 * Math.cos(el) * 0.62 * S * 0.9;
  const dx = fx + (540 - fx) * below;
  const dy = dy0 + (throatY - dy0) * below;
  return (
    <g opacity={o}>
      <g fill="none" stroke={C.blue} strokeWidth={2.4} opacity={0.75}>
        {rings.slice(1).map((r) => (
          <path key={r} d={ringD(r)} pathLength={1} strokeDasharray={`${draw} 1`} />
        ))}
        {spokes.map((ph) => (
          <path key={ph} d={'M' + rings.map((r) => proj(r, ph).join(',')).join('L')} pathLength={1} strokeDasharray={`${draw} 1`} opacity={0.7} />
        ))}
      </g>
      {/* the horizon: the funnel's throat — a place, not a surface */}
      <ellipse cx={540} cy={throatY} rx={S} ry={S * Math.sin(el) * 0.9} fill={C.hole} opacity={0.95 * k(t, 13.5, 14.5)} />
      <path d={ringD(1.0)} fill="none" stroke={C.yellow} strokeWidth={5} pathLength={1} strokeDasharray={`${k(t, 13.6, 15.2)} 1`} />
      <circle cx={dx} cy={dy} r={11 + 4 * (S / 280)} fill={C.blue} stroke="#fff" strokeWidth={3} opacity={k(t, 13.2, 13.6)} />
      {/* tiny gap below the throat (20.4–23.3) */}
      {t > 20.3 && t < 24.6 && (
        <g stroke={C.red} strokeWidth={3} opacity={k(t, 20.4, 20.9) * (1 - k(t, 24.0, 24.5))}>
          <line x1={dx + 40} y1={dy0} x2={dx + 40} y2={dy} />
          <line x1={dx + 28} y1={dy0} x2={dx + 52} y2={dy0} />
          <line x1={dx + 28} y1={dy} x2={dx + 52} y2={dy} />
        </g>
      )}
    </g>
  );
};

// ---------- scene 3/7: the field equations ----------
const Equation: React.FC<{t: number; o: number}> = ({t, o}) => {
  if (o <= 0) return null;
  const parts: [string, boolean][] = [
    ['G', true], ['μν', true], [' + Λg', true], ['μν', true], [' = ', false], ['8πG', true], ['/', false], ['c', true], ['⁴', false], [' T', true], ['μν', true],
  ];
  return (
    <g opacity={o}>
      <foreignObject x={0} y={760} width={1080} height={260}>
        <div style={{display: 'flex', justifyContent: 'center', alignItems: 'baseline', fontFamily: MATH, fontSize: 92, color: C.white, whiteSpace: 'pre'}}>
          {parts.map(([s, it], i) => {
            const sub = s === 'μν';
            const p = k(t, 24.45 + i * 0.07, 24.75 + i * 0.07);
            return (
              <span key={i} style={{fontStyle: it ? 'italic' : 'normal', fontSize: sub ? 52 : 92, verticalAlign: sub ? '-0.35em' : undefined, opacity: p, color: s === 'c' ? C.yellow : C.white, display: 'inline-block', transform: `translateY(${(1 - p) * 20}px)`}}>
                {s}
              </span>
            );
          })}
        </div>
      </foreignObject>
      <line x1={540 - 380 * k(t, 25.1, 25.9)} y1={1010} x2={540 + 380 * k(t, 25.1, 25.9)} y2={1010} stroke={C.grey} strokeWidth={2} />
      <text x={540} y={1080} textAnchor="middle" fontFamily={MATH} fontSize={40} fill={C.grey} opacity={k(t, 25.3, 25.9)}>
        Einstein, 1915
      </text>
    </g>
  );
};

// ---------- scene 4/7: flashes outside vs inside ----------
const Fans: React.FC<{t: number; o: number}> = ({t, o}) => {
  if (o <= 0) return null;
  const s = 150;
  const ox = 540;
  const oy = 1050;
  const outsideP = k(t, 26.6, 28.6);
  const insideP = k(t, 28.6, 30.2);
  return (
    <g opacity={o}>
      <circle cx={ox} cy={oy} r={s} fill={C.hole} />
      <circle cx={ox} cy={oy} r={s} fill="none" stroke={C.white} strokeWidth={4} />
      <g opacity={1 - k(t, 28.4, 28.9) * 0.75}>
        {G.outside.map((o2, i) => (
          <Path key={i} pts={o2.pts} s={s} ox={ox} oy={oy} color={o2.fate === 'escape' ? C.yellow : C.red} w={3.5} p={outsideP} />
        ))}
        <circle cx={ox} cy={oy - 2.5 * s} r={11} fill={C.yellow} opacity={k(t, 26.5, 26.8)} />
      </g>
      {G.inside.map((pts, i) => (
        <g key={i}>
          <Path pts={pts} s={s} ox={ox} oy={oy} color={C.red} w={4} p={insideP} />
          {insideP > 0.05 && insideP < 0.97 && <Head h={headAt(pts, insideP, s, ox, oy)} color={C.red} size={14} />}
        </g>
      ))}
      <circle cx={ox} cy={oy - 0.82 * s} r={12} fill={C.blue} stroke="#fff" strokeWidth={3} opacity={k(t, 28.4, 28.8)} />
    </g>
  );
};

// ---------- scenes 5–7: Eddington–Finkelstein spacetime diagram ----------
// x: r (rs units) to the right; y: time upward. Origin r = 0 at (ex, ey).
const EF: React.FC<{t: number; o: number}> = ({t, o}) => {
  if (o <= 0) return null;
  const s = 250;
  const ex = 120;
  const ey = 1380;
  const X = (r: number) => ex + r * s;
  const Y = (tt: number) => ey - tt * s;
  const axes = k(t, 30.5, 31.3);
  // cones: ingoing edge (-1, 1), outgoing edge (r − 1, r + 1)
  const cones = [3.2, 2.4, 1.7, 1.0, 0.55];
  const cone = (r: number, t0: number, i: number, highlight = false) => {
    const p = k(t, 31.2 + i * 0.45, 31.8 + i * 0.45);
    if (p <= 0) return null;
    const L = 0.55 * p;
    const n1 = [-1, 1].map((v) => v / Math.SQRT2);
    const len2 = Math.hypot(r - 1, r + 1);
    const n2 = [(r - 1) / len2, (r + 1) / len2];
    const ax = X(r);
    const ay = Y(t0);
    const p1 = [ax + n1[0] * L * s, ay - n1[1] * L * s];
    const p2 = [ax + n2[0] * L * s, ay - n2[1] * L * s];
    const inside = r < 1;
    const col = highlight ? C.yellow : inside ? C.red : C.yellow;
    return (
      <g key={r}>
        <polygon points={`${ax},${ay} ${p1[0]},${p1[1]} ${p2[0]},${p2[1]}`} fill={col} fillOpacity={0.22} stroke={col} strokeWidth={3} />
        <circle cx={ax} cy={ay} r={6} fill={C.white} />
      </g>
    );
  };
  // outgoing light from (r0, t0): t = t0 + (r − r0) + 2 ln|(r − 1)/(r0 − 1)|
  const ray = (r0: number, t0: number, rEnd: number) => {
    const pts: Pt[] = [];
    const n = 60;
    for (let i = 0; i <= n; i++) {
      const r = r0 + ((rEnd - r0) * i) / n;
      pts.push([X(r), Y(t0 + (r - r0) + 2 * Math.log(Math.abs((r - 1) / (r0 - 1))))]);
    }
    return pts;
  };
  // infalling astronaut: a smooth worldline from r = 3 to r = 0 (illustrative)
  const wl: Pt[] = Array.from({length: 61}, (_, i) => {
    const q = i / 60;
    const r = 3 * Math.pow(1 - q, 0.75);
    return [X(r), Y(0.2 + 2.6 * q)];
  });
  const wlP = k(t, 44.7, 46.6);
  const sigA = k(t, 45.4, 47.0); // sent before crossing — arrives
  const sigB = k(t, 47.5, 49.4); // sent after crossing — turns inward
  const showCones = 1 - k(t, 44.4, 44.9) * 0.7;
  const qn = k(t, 54.3, 55.2);
  const toD = (pts: Pt[]) => 'M' + pts.map((p) => p.join(',')).join('L');
  const before = ray(1.6, 0.2 + 2.6 * (1 - Math.pow(1.6 / 3, 4 / 3)), 3.3);
  const after = ray(0.75, 0.2 + 2.6 * (1 - Math.pow(0.75 / 3, 4 / 3)), 0.02);
  return (
    <g opacity={o}>
      {/* axes */}
      <g stroke={C.grey} strokeWidth={3} opacity={axes}>
        <line x1={ex} y1={ey} x2={ex + 3.7 * s * axes} y2={ey} />
        <line x1={ex} y1={ey} x2={ex} y2={ey - 3.6 * s * axes} />
      </g>
      <text x={ex + 3.75 * s} y={ey + 12} fontFamily={MATH} fontStyle="italic" fontSize={48} fill={C.grey} opacity={axes}>
        r
      </text>
      <text x={ex - 18} y={ey - 3.65 * s} fontFamily={MATH} fontStyle="italic" fontSize={48} fill={C.grey} opacity={axes} textAnchor="end">
        t
      </text>
      {/* singularity and horizon */}
      <line x1={ex} y1={ey} x2={ex} y2={ey - 3.6 * s * axes} stroke={C.red} strokeWidth={6} strokeDasharray="14 10" opacity={axes} />
      <line x1={X(1)} y1={ey} x2={X(1)} y2={ey - 3.6 * s * axes} stroke={C.white} strokeWidth={4} strokeDasharray="18 12" opacity={axes} />
      <g opacity={showCones}>{cones.map((r, i) => cone(r, 0.6 + (3.2 - r) * 0.55, i, false))}</g>
      {/* worldlines */}
      <line x1={X(3)} y1={ey} x2={X(3)} y2={Y(3.4) * 1 + (ey - Y(3.4)) * (1 - k(t, 44.7, 45.6))} stroke={C.grey} strokeWidth={4} opacity={k(t, 44.7, 45.0)} />
      <path d={toD(wl)} fill="none" stroke={C.blue} strokeWidth={6} pathLength={1} strokeDasharray={`${wlP} 1`} />
      <path d={toD(before)} fill="none" stroke={C.yellow} strokeWidth={4} pathLength={1} strokeDasharray={`${sigA} 1`} />
      <path d={toD(after)} fill="none" stroke={C.red} strokeWidth={4} pathLength={1} strokeDasharray={`${sigB} 1`} />
      {/* the question: how fast to get out from the horizon? */}
      {qn > 0 && (
        <g opacity={qn}>
          {cone(1.0, 2.6, -100, true)}
          <foreignObject x={0} y={300} width={1080} height={200}>
            <div style={{textAlign: 'center', fontFamily: MATH, fontSize: 110, color: C.white}}>
              <span style={{fontStyle: 'italic'}}>v</span> = <span style={{color: C.yellow}}>?</span> × <span style={{fontStyle: 'italic', color: C.yellow}}>c</span>
            </div>
          </foreignObject>
        </g>
      )}
      {/* "nothing goes faster than light" (49.6–51.8) */}
      {t > 49.4 && t < 52.2 && (
        <foreignObject x={0} y={300} width={1080} height={200} opacity={on(t, 49.64, 51.8)}>
          <div style={{textAlign: 'center', fontFamily: MATH, fontSize: 104, color: C.white}}>
            <span style={{fontStyle: 'italic'}}>v</span> ≤ <span style={{fontStyle: 'italic', color: C.yellow}}>c</span>
          </div>
        </foreignObject>
      )}
    </g>
  );
};

// Frame-0 hook line; gone before the first sentence ends.
const Hook: React.FC<{t: number}> = ({t}) => {
  const o = 1 - k(t, 3.0, 3.5);
  if (o <= 0) return null;
  return (
    <div style={{position: 'absolute', left: 60, right: 60, top: 300, textAlign: 'center', direction: 'rtl', opacity: o, fontFamily: KUFI, fontWeight: 800, fontSize: 82, color: C.white}}>
      عدّيت… ومحسّتش؟
    </div>
  );
};

const SFX: Cue[] = [
  [7.02, 'impact', 0.25],
  [29.74, 'impact', 0.3],
  [40.32, 'impact', 0.25],
];

// Scene opacities (sentence boundaries from words.json).
export const mathScenes = (t: number) => ({
  top: Math.max(on(t, -1, 12.74), on(t, 34.46, 44.6)),
  funnel: on(t, 12.74, 24.38),
  eq: on(t, 24.38, 26.48),
  fans: on(t, 26.48, 30.4),
  ef: Math.max(on(t, 30.4, 34.46), on(t, 44.6, DURATION + 1)),
});

export const MathLayer: React.FC<{t: number}> = ({t}) => {
  const o = mathScenes(t);
  return (
    <svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
      <Grid opacity={0.9} />
      <TopDown t={t} o={o.top} />
      <Funnel t={t} o={o.funnel} />
      <Equation t={t} o={o.eq} />
      <Fans t={t} o={o.fans} />
      <EF t={t} o={o.ef} />
    </svg>
  );
};

export const HorizonMath: React.FC = () => {
  const t = useSeconds();
  const {fps} = useVideoConfig();
  return (
    <AbsoluteFill style={{background: C.bg}}>
      <MathLayer t={t} />
      <Hook t={t} />
      <Audio src={staticFile('horizon/vo.wav')} />
      <Audio src={staticFile('horizon/drone.wav')} volume={(f) => 0.3 * (1 - interpolate(f / fps, [23.1, 23.4, 24.2, 24.6], [0, 1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}) * 0.85)} />
      <SfxTrack cues={SFX} />
    </AbsoluteFill>
  );
};
