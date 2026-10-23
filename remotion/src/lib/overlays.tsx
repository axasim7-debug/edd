import {Easing, interpolate, staticFile} from 'remotion';
import type {Feature} from 'geojson';
import {geoPath} from 'd3-geo';
import {COLORS, project, ramp, useProjection, type LonLat} from './map';

const FONT = 'Inter Display, Inter, sans-serif';
const MONO = 'JetBrains Mono, monospace';

// Country outline that draws itself, then fills with a hatch.
export const Country: React.FC<{
  f: Feature;
  draw: number;
  fill: number;
  color?: string;
  hatch?: 'red' | 'white';
  opacity?: number;
}> = ({f, draw, fill, color = COLORS.white, hatch = 'white', opacity = 1}) => {
  const p = useProjection();
  const d = geoPath(p)(f) ?? '';
  if (opacity <= 0 || (draw <= 0 && fill <= 0)) return null;
  return (
    <g opacity={opacity}>
      <path d={d} fill={`url(#hatch-${hatch})`} opacity={fill} />
      <path
        d={d}
        fill="none"
        stroke={color}
        strokeWidth={5}
        strokeLinejoin="round"
        pathLength={1}
        strokeDasharray={`${draw} 1`}
        filter="url(#glow)"
      />
    </g>
  );
};

export const Pin: React.FC<{
  at: LonLat;
  label?: string;
  sub?: string;
  color?: string;
  show: number;
  pulse?: number;
  side?: 'left' | 'right';
  size?: number;
}> = ({at, label, sub, color = COLORS.white, show, pulse = 0, side = 'right', size = 50}) => {
  const p = useProjection();
  if (show <= 0) return null;
  const [x, y] = project(p, at);
  const s = side === 'right' ? 1 : -1;
  const pop = interpolate(show, [0, 1], [0.4, 1], {easing: Easing.out(Easing.back(2))});
  const coords = sub ?? `${at[1].toFixed(4)}° N, ${Math.abs(at[0]).toFixed(4)}° ${at[0] < 0 ? 'W' : 'E'}`;
  return (
    <g opacity={show} transform={`translate(${x} ${y}) scale(${pop})`}>
      {pulse > 0 && pulse < 1 && <circle r={12 + pulse * 90} fill="none" stroke={color} strokeWidth={4} opacity={1 - pulse} />}
      <circle r={20} fill="none" stroke={color} strokeWidth={4} opacity={0.6} />
      <circle r={9} fill={color} filter="url(#glow)" />
      {label && (
        <>
          <line x1={s * 14} y1={-14} x2={s * 44} y2={-44} stroke={color} strokeWidth={3} />
          <line x1={s * 44} y1={-44} x2={s * (60 + label.length * size * 0.62)} y2={-44} stroke={color} strokeWidth={3} />
          <text
            x={s * 58}
            y={-58}
            fill={color}
            fontFamily={FONT}
            fontWeight={900}
            fontSize={size}
            textAnchor={side === 'right' ? 'start' : 'end'}
            style={{letterSpacing: 1}}
          >
            {label.toUpperCase()}
          </text>
          <text x={s * 58} y={-14} fill="rgba(255,255,255,0.7)" fontFamily={MONO} fontSize={21} textAnchor={side === 'right' ? 'start' : 'end'}>
            {coords}
          </text>
        </>
      )}
    </g>
  );
};

const curve = (a: [number, number], b: [number, number], bend: number) => {
  const mx = (a[0] + b[0]) / 2 - (b[1] - a[1]) * bend;
  const my = (a[1] + b[1]) / 2 + (b[0] - a[0]) * bend;
  return (t: number): [number, number] => [
    (1 - t) ** 2 * a[0] + 2 * (1 - t) * t * mx + t ** 2 * b[0],
    (1 - t) ** 2 * a[1] + 2 * (1 - t) * t * my + t ** 2 * b[1],
  ];
};

// Dashed glowing route (reference style) with a travelling head.
export const Route: React.FC<{
  path: LonLat[];
  progress: number;
  color?: string;
  bend?: number;
  width?: number;
  dashed?: boolean;
  head?: boolean;
  opacity?: number;
}> = ({path, progress, color = COLORS.white, bend = 0.15, width = 6, dashed = true, head = true, opacity = 1}) => {
  const p = useProjection();
  if (progress <= 0 || opacity <= 0) return null;
  const pts = path.map((ll) => project(p, ll));
  const legs = pts.slice(1).map((b, i) => curve(pts[i], b, bend));
  const samples: [number, number][] = [];
  const steps = 48;
  legs.forEach((leg, i) => {
    for (let k = i === 0 ? 0 : 1; k <= steps; k++) samples.push(leg(k / steps));
  });
  const n = Math.max(2, Math.round((samples.length - 1) * progress) + 1);
  const drawn = samples.slice(0, n);
  const d = 'M' + drawn.map((x) => x.join(',')).join('L');
  const tip = drawn[drawn.length - 1];
  return (
    <g opacity={opacity}>
      <path d={d} fill="none" stroke={color} strokeWidth={width + 8} opacity={0.18} strokeLinecap="round" />
      <path
        d={d}
        fill="none"
        stroke={color}
        strokeWidth={width}
        strokeDasharray={dashed ? `${width * 3} ${width * 2.4}` : undefined}
        strokeLinecap="round"
        filter="url(#glow)"
      />
      {head && progress < 1 && <circle cx={tip[0]} cy={tip[1]} r={width * 1.8} fill={color} filter="url(#glow)" />}
    </g>
  );
};

// Thick tapered military arrow.
export const Arrow: React.FC<{from: LonLat; to: LonLat; progress: number; color?: string; width?: number; bend?: number}> = ({
  from,
  to,
  progress,
  color = COLORS.red,
  width = 44,
  bend = 0.12,
}) => {
  const p = useProjection();
  if (progress <= 0) return null;
  const c = curve(project(p, from), project(p, to), bend);
  const steps = 40;
  const n = Math.max(2, Math.round(steps * progress));
  const pts = Array.from({length: n + 1}, (_, i) => c((i / steps) * 1));
  const left: string[] = [];
  const right: string[] = [];
  pts.forEach((pt, i) => {
    const q = pts[Math.min(i + 1, pts.length - 1)];
    const r = pts[Math.max(i - 1, 0)];
    const ang = Math.atan2(q[1] - r[1], q[0] - r[0]);
    const w = (width / 2) * (0.35 + 0.65 * (i / pts.length));
    left.push(`${pt[0] + Math.sin(ang) * w},${pt[1] - Math.cos(ang) * w}`);
    right.unshift(`${pt[0] - Math.sin(ang) * w},${pt[1] + Math.cos(ang) * w}`);
  });
  const tip = pts[pts.length - 1];
  const prev = pts[pts.length - 2];
  const ang = (Math.atan2(tip[1] - prev[1], tip[0] - prev[0]) * 180) / Math.PI;
  return (
    <g filter="url(#glow)">
      <polygon points={[...left, ...right].join(' ')} fill={color} opacity={0.85} />
      <polygon points={`0,${-width} ${width * 1.3},0 0,${width}`} fill={color} transform={`translate(${tip[0]} ${tip[1]}) rotate(${ang})`} />
    </g>
  );
};

// Pulses travelling along a straight line, e.g. intercepted radio traffic.
export const Signal: React.FC<{from: LonLat; to: LonLat; t: number; show: number; color?: string; speed?: number}> = ({
  from,
  to,
  t,
  show,
  color = COLORS.blue,
  speed = 1.4,
}) => {
  const p = useProjection();
  if (show <= 0) return null;
  const a = project(p, from);
  const b = project(p, to);
  return (
    <g opacity={show}>
      <line x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke={color} strokeWidth={3} strokeDasharray="4 14" opacity={0.6} />
      {[0, 0.33, 0.66].map((o) => {
        const k = (t * speed + o) % 1;
        return (
          <circle key={o} cx={a[0] + (b[0] - a[0]) * k} cy={a[1] + (b[1] - a[1]) * k} r={11} fill={color} filter="url(#glow)" opacity={Math.sin(k * Math.PI)} />
        );
      })}
    </g>
  );
};

// Archival photo card with optional leader line to a place on the map.
export const PhotoCard: React.FC<{
  src: string;
  x: number;
  y: number;
  w: number;
  h: number;
  show: number;
  rotate?: number;
  anchor?: LonLat;
  gray?: number;
  glow?: string;
  name?: string;
  cross?: number;
}> = ({src, x, y, w, h, show, rotate = 0, anchor, gray = 0, glow, name, cross = 0}) => {
  const p = useProjection();
  if (show <= 0) return null;
  const s = interpolate(show, [0, 1], [0.6, 1], {easing: Easing.out(Easing.back(1.8))});
  const a = anchor ? project(p, anchor) : null;
  const id = `g${Math.round(gray * 100)}`;
  const sat = 1 - gray;
  return (
    <g opacity={Math.min(1, show * 1.5)}>
      <defs>
        <filter id={id}>
          <feColorMatrix type="saturate" values={String(sat)} />
        </filter>
        <filter id="cardshadow" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="18" stdDeviation="22" floodColor="#000" floodOpacity="0.7" />
        </filter>
      </defs>
      {a && <line x1={a[0]} y1={a[1]} x2={x} y2={y + h / 2} stroke="rgba(255,255,255,0.8)" strokeWidth={3} strokeDasharray={`${show * 2000} 2000`} />}
      <g transform={`translate(${x} ${y}) rotate(${rotate}) scale(${s})`}>
        {glow && <rect x={-w / 2 - 20} y={-h / 2 - 20} width={w + 40} height={h + 40} rx={18} fill={glow} filter="url(#softglow)" opacity={0.9} />}
        <rect x={-w / 2 - 12} y={-h / 2 - 12} width={w + 24} height={h + 24 + (name ? 54 : 0)} rx={10} fill="#f4f1ea" filter="url(#cardshadow)" />
        <image href={staticFile(src)} x={-w / 2} y={-h / 2} width={w} height={h} preserveAspectRatio="xMidYMid slice" filter={`url(#${id})`} />
        {name && (
          <text x={0} y={h / 2 + 46} textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={34} fill="#1a1a1a">
            {name}
          </text>
        )}
        {cross > 0 && (
          <g stroke={COLORS.red} strokeWidth={18} strokeLinecap="round" filter="url(#glow)">
            <line x1={-w / 2 + 20} y1={-h / 2 + 20} x2={-w / 2 + 20 + (w - 40) * Math.min(1, cross * 2)} y2={-h / 2 + 20 + (h - 40) * Math.min(1, cross * 2)} />
            {cross > 0.5 && (
              <line x1={w / 2 - 20} y1={-h / 2 + 20} x2={w / 2 - 20 - (w - 40) * (cross * 2 - 1)} y2={-h / 2 + 20 + (h - 40) * (cross * 2 - 1)} />
            )}
          </g>
        )}
      </g>
    </g>
  );
};

// One or two words, large, centred. The only "text" on screen besides labels.
export const BigWord: React.FC<{text: string; show: number; y?: number; size?: number; color?: string}> = ({
  text,
  show,
  y = 520,
  size = 150,
  color = COLORS.white,
}) => {
  if (show <= 0) return null;
  const s = interpolate(show, [0, 1], [1.35, 1], {easing: Easing.out(Easing.cubic)});
  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        top: y,
        textAlign: 'center',
        fontFamily: FONT,
        fontWeight: 900,
        fontSize: size,
        letterSpacing: 2,
        color,
        opacity: show,
        transform: `scale(${s})`,
        textShadow: `0 0 40px ${color === COLORS.white ? 'rgba(0,0,0,0.9)' : color}, 0 8px 30px rgba(0,0,0,0.9)`,
      }}
    >
      {text}
    </div>
  );
};

// Rotor wiring diagram: 26 contacts on each side, wires drawn one by one.
export const Wiring: React.FC<{progress: number; show: number; x: number; y: number}> = ({progress, show, x, y}) => {
  if (show <= 0) return null;
  // Wiring of the historical Enigma I rotor I: EKMFLGDQVZNTOWYHXUSPAIBRCJ.
  const map = 'EKMFLGDQVZNTOWYHXUSPAIBRCJ';
  const gap = 34;
  const top = -12.5 * gap;
  return (
    <g opacity={show} transform={`translate(${x} ${y})`}>
      <rect x={-300} y={top - 60} width={600} height={26 * gap + 90} rx={24} fill="rgba(7,17,27,0.82)" stroke="rgba(63,180,255,0.5)" strokeWidth={3} />
      {Array.from({length: 26}, (_, i) => {
        const j = map.charCodeAt(i) - 65;
        const k = Math.max(0, Math.min(1, progress * 26 - i));
        const y1 = top + i * gap;
        const y2 = top + j * gap;
        const xm = -200 + 400 * k;
        const ym = y1 + (y2 - y1) * k;
        return (
          <g key={i}>
            <text x={-250} y={y1 + 9} fill="rgba(255,255,255,0.75)" fontFamily={MONO} fontSize={24} textAnchor="middle">
              {String.fromCharCode(65 + i)}
            </text>
            <text x={250} y={y1 + 9} fill="rgba(255,255,255,0.75)" fontFamily={MONO} fontSize={24} textAnchor="middle">
              {String.fromCharCode(65 + i)}
            </text>
            <circle cx={-200} cy={y1} r={6} fill={COLORS.blue} />
            <circle cx={200} cy={y1} r={6} fill={COLORS.blue} />
            {k > 0 && <line x1={-200} y1={y1} x2={xm} y2={ym} stroke={k < 1 ? COLORS.gold : COLORS.blue} strokeWidth={3} filter="url(#glow)" />}
          </g>
        );
      })}
    </g>
  );
};

export const Flash: React.FC<{t: number; at: number; color?: string; strength?: number}> = ({t, at, color = '#fff', strength = 0.7}) => {
  const o = interpolate(t, [at, at + 0.04, at + 0.35], [0, strength, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return o > 0 ? <div style={{position: 'absolute', inset: 0, background: color, opacity: o}} /> : null;
};

export const Vignette: React.FC = () => (
  <div style={{position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 45%, transparent 50%, rgba(0,0,0,0.7) 100%)'}} />
);

// Film grain keeps big flat areas from looking dead; deterministic per frame.
export const Grain: React.FC<{frame: number}> = ({frame}) => (
  <svg width="100%" height="100%" style={{position: 'absolute', inset: 0, opacity: 0.08, mixBlendMode: 'overlay'}}>
    <filter id="grain">
      <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed={frame % 30} />
    </filter>
    <rect width="100%" height="100%" filter="url(#grain)" />
  </svg>
);

export const shake = (t: number, at: number, dur = 0.5, amp = 24): [number, number] => {
  const k = t - at;
  if (k < 0 || k > dur) return [0, 0];
  const f = (1 - k / dur) * amp;
  return [Math.sin(k * 90) * f, Math.cos(k * 70) * f];
};

export const pulseAt = (t: number, at: number, dur = 0.9) => (t >= at && t < at + dur ? (t - at) / dur : 0);

export {ramp};
