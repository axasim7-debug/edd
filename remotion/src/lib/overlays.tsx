import {Easing, interpolate, staticFile} from 'remotion';
import type {Feature} from 'geojson';
import {geoPath} from 'd3-geo';
import {COLORS, LAYOUT, PAPER, project, ramp, useProjection, useTheme, type LonLat} from './map';

const TYPE = "'Special Elite', 'Courier Prime', monospace";

// Maps the dark-theme colours onto ink colours when drawing on paper.
const useInk = () => {
  const paper = useTheme() === 'paper';
  return (c: string) => {
    if (!paper) return c;
    if (c === COLORS.red) return PAPER.red;
    if (c === COLORS.gold) return '#7a5a2a';
    if (c === COLORS.blue) return '#4d4a44';
    return PAPER.ink;
  };
};

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
}> = ({f, draw, fill, color: rawColor = COLORS.white, hatch = 'white', opacity = 1}) => {
  const p = useProjection();
  const color = useInk()(rawColor);
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

// Place pin: dot + label + coordinates. The label flips side automatically so it
// never leaves the safe area.
export const Pin: React.FC<{
  at: LonLat;
  label?: string;
  sub?: string;
  coords?: boolean;
  color?: string;
  show: number;
  pulse?: number;
  size?: number;
  side?: 'left' | 'right';
}> = ({at, label, sub, coords = false, color: rawColor = COLORS.white, show, pulse = 0, size = 44, side}) => {
  const p = useProjection();
  const paper = useTheme() === 'paper';
  const color = useInk()(rawColor);
  if (show <= 0) return null;
  const [x, y] = project(p, at);
  const subText = sub ?? (coords ? `${at[1].toFixed(4)}° N, ${Math.abs(at[0]).toFixed(4)}° ${at[0] < 0 ? 'W' : 'E'}` : '');
  const width = label ? Math.max(label.length * size * 0.66, subText.length * 21 * 0.62) + 64 : 0;
  const fitsRight = x + width <= LAYOUT.safeRight;
  const fitsLeft = x - width >= LAYOUT.safeLeft;
  const s = side ? (side === 'right' ? 1 : -1) : fitsRight || !fitsLeft ? 1 : -1;
  // Last resort: slide the whole label back inside the safe area.
  const nudge = s === 1 ? Math.min(0, LAYOUT.safeRight - (x + width)) : Math.max(0, LAYOUT.safeLeft - (x - width));
  const pop = interpolate(show, [0, 1], [0.5, 1], {easing: Easing.out(Easing.back(2))});
  const anchor = s === 1 ? 'start' : 'end';
  return (
    <g opacity={show}>
      <g transform={`translate(${x} ${y}) scale(${pop})`}>
        {pulse > 0 && pulse < 1 && <circle r={12 + pulse * 90} fill="none" stroke={color} strokeWidth={4} opacity={1 - pulse} />}
        {paper ? (
          <>
            <circle r={15} fill="#E8DDC5" stroke={PAPER.ink} strokeWidth={4} />
            <circle r={6} fill={color === PAPER.ink ? PAPER.red : color} />
          </>
        ) : (
          <>
            <circle r={19} fill="none" stroke={color} strokeWidth={4} opacity={0.55} />
            <circle r={9} fill={color} filter="url(#glow)" />
          </>
        )}
      </g>
      {label && (
        <g transform={`translate(${x + nudge} ${y})`} opacity={ramp(show, 0.3, 1)}>
          {paper ? (
            <>
              <line x1={s * 12 - nudge} y1={-12} x2={s * 40} y2={-40} stroke={PAPER.ink} strokeWidth={2.5} />
              <g transform={`rotate(${s * -1.5})`}>
                <rect x={s === 1 ? 34 : -34 - (label.length * size * 0.62 + 36)} y={-40 - size - 14} width={label.length * size * 0.62 + 36} height={size + 26} fill="#E8DDC5" stroke="rgba(41,40,36,0.25)" strokeWidth={1.5} filter="url(#labelshadow)" />
                <text x={s * 52} y={-40 - 18} fill={color} fontFamily={TYPE} fontSize={size} textAnchor={anchor}>
                  {label.toUpperCase()}
                </text>
              </g>
            </>
          ) : (
            <>
              <polyline points={`${s * 14 - nudge},-14 ${s * 40},-40 ${s * (width - 10)},-40`} fill="none" stroke={color} strokeWidth={3} />
              <text x={s * 50} y={-54} fill={color} fontFamily={FONT} fontWeight={900} fontSize={size} textAnchor={anchor} style={{letterSpacing: 1}}>
                {label.toUpperCase()}
              </text>
            </>
          )}
          {subText && (
            <text x={s * 50} y={-12} fill="rgba(255,255,255,0.72)" fontFamily={MONO} fontSize={21} textAnchor={anchor}>
              {subText}
            </text>
          )}
        </g>
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
}> = ({path, progress, color: rawColor = COLORS.white, bend = 0.15, width = 6, dashed = true, head = true, opacity = 1}) => {
  const p = useProjection();
  const color = useInk()(rawColor);
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
  color: rawColor = COLORS.red,
  width = 44,
  bend = 0.12,
}) => {
  const p = useProjection();
  const color = useInk()(rawColor);
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
  color: rawColor = COLORS.blue,
  speed = 1.4,
}) => {
  const p = useProjection();
  const color = useInk()(rawColor);
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

// Card slots inside the card band — every photo lands in one of these.
export const SLOT = {
  center: {x: 540, y: LAYOUT.cardY},
  left: {x: 300, y: LAYOUT.cardY},
  right: {x: 780, y: LAYOUT.cardY},
  trioL: {x: 245, y: LAYOUT.cardY + 20},
  trioC: {x: 540, y: LAYOUT.cardY - 10},
  trioR: {x: 835, y: LAYOUT.cardY + 20},
} as const;
export const SIZE = {
  portrait: {w: 340, h: 430},
  portraitL: {w: 400, h: 500},
  small: {w: 240, h: 300},
  landscape: {w: 640, h: 420},
  half: {w: 400, h: 300},
} as const;

// Archival photo card with optional leader line to a place on the map.
export const PhotoCard: React.FC<{
  src: string;
  slot: keyof typeof SLOT;
  size: keyof typeof SIZE;
  show: number;
  rotate?: number;
  anchor?: LonLat;
  gray?: number;
  glow?: string;
  name?: string;
  cross?: number;
}> = ({src, slot, size, show, rotate = 0, anchor, gray = 0, glow, name, cross = 0}) => {
  const p = useProjection();
  const paper = useTheme() === 'paper';
  if (show <= 0) return null;
  const {x, y} = SLOT[slot];
  const {w, h} = SIZE[size];
  const s = interpolate(show, [0, 1], [0.85, 1], {easing: Easing.out(Easing.back(1.4))});
  const lift = (1 - show) * 60;
  const a = anchor ? project(p, anchor) : null;
  const id = `g${Math.round(gray * 100)}`;
  const bottom = y + h / 2 + 12 + (name ? 50 : 0);
  return (
    <g opacity={Math.min(1, show * 1.4)}>
      <defs>
        <filter id={id}>
          <feColorMatrix type="saturate" values={String(1 - gray)} />
          {paper && <feColorMatrix type="matrix" values="0.36 0.70 0.18 0 0  0.32 0.64 0.16 0 0  0.25 0.50 0.12 0 0  0 0 0 1 0" />}
        </filter>
        <filter id="cardshadow" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="18" stdDeviation="22" floodColor="#000" floodOpacity="0.75" />
        </filter>
      </defs>
      {a && a[1] > bottom + 40 && (
        <g opacity={ramp(show, 0.5, 1)}>
          <line x1={x} y1={bottom} x2={a[0]} y2={a[1] - 22} stroke="rgba(255,255,255,0.55)" strokeWidth={2.5} strokeDasharray="6 8" />
        </g>
      )}
      <g transform={`translate(${x} ${y + lift}) rotate(${rotate}) scale(${s})`}>
        {glow && <rect x={-w / 2 - 20} y={-h / 2 - 20} width={w + 40} height={h + 40 + (name ? 50 : 0)} rx={12} fill={glow} />}
        <rect x={-w / 2 - 12} y={-h / 2 - 12} width={w + 24} height={h + 24 + (name ? 50 : 0)} rx={8} fill="#E8DDC5" filter="url(#cardshadow)" />
        <image href={staticFile(src)} x={-w / 2} y={-h / 2} width={w} height={h} preserveAspectRatio="xMidYMid slice" filter={`url(#${id})`} />
        {name && (
          <text x={0} y={h / 2 + 42} textAnchor="middle" fontFamily={paper ? TYPE : FONT} fontWeight={paper ? 400 : 800} fontSize={Math.min(32, (w + 10) / (name.length * 0.62))} fill="#1a1a1a" style={{letterSpacing: 1}}>
            {name}
          </text>
        )}
        {cross > 0 && (
          <g stroke={COLORS.red} strokeWidth={16} strokeLinecap="round" filter="url(#glow)">
            <line x1={-w / 2 + 24} y1={-h / 2 + 24} x2={-w / 2 + 24 + (w - 48) * Math.min(1, cross * 2)} y2={-h / 2 + 24 + (h - 48) * Math.min(1, cross * 2)} />
            {cross > 0.5 && <line x1={w / 2 - 24} y1={-h / 2 + 24} x2={w / 2 - 24 - (w - 48) * (cross * 2 - 1)} y2={-h / 2 + 24 + (h - 48) * (cross * 2 - 1)} />}
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
  y = LAYOUT.wordY,
  size = 120,
  color = COLORS.white,
}) => {
  if (show <= 0) return null;
  const s = interpolate(show, [0, 1], [1.2, 1], {easing: Easing.out(Easing.cubic)});
  // Never wider than the safe area.
  const fs = Math.min(size, 900 / (text.length * 0.64));
  return (
    <div
      style={{
        position: 'absolute',
        left: 90,
        width: 900,
        top: y + (size - fs) / 2,
        textAlign: 'center',
        fontFamily: FONT,
        fontWeight: 900,
        fontSize: fs,
        lineHeight: 1,
        letterSpacing: 2,
        color,
        opacity: show,
        transform: `scale(${s})`,
        textShadow: '0 6px 24px rgba(0,0,0,0.85)',
      }}
    >
      {text}
    </div>
  );
};

// Rotor wiring diagram: 26 contacts on each side, wires drawn one by one.
export const Wiring: React.FC<{progress: number; show: number; x: number; y: number; scale?: number; paper?: boolean}> = ({progress, show, x, y, scale = 1, paper = false}) => {
  if (show <= 0) return null;
  // Wiring of the historical Enigma I rotor I: EKMFLGDQVZNTOWYHXUSPAIBRCJ.
  const map = 'EKMFLGDQVZNTOWYHXUSPAIBRCJ';
  const gap = 34;
  const top = -12.5 * gap;
  return (
    <g opacity={show} transform={`translate(${x} ${y}) scale(${scale})`}>
      <rect x={-300} y={top - 60} width={600} height={26 * gap + 90} rx={paper ? 4 : 24} fill={paper ? "#E8DDC5" : "rgba(7,17,27,0.82)"} stroke={paper ? "rgba(41,40,36,0.3)" : "rgba(63,180,255,0.5)"} strokeWidth={3} filter={paper ? "url(#labelshadow)" : undefined} />
      {Array.from({length: 26}, (_, i) => {
        const j = map.charCodeAt(i) - 65;
        const k = Math.max(0, Math.min(1, progress * 26 - i));
        const y1 = top + i * gap;
        const y2 = top + j * gap;
        const xm = -200 + 400 * k;
        const ym = y1 + (y2 - y1) * k;
        return (
          <g key={i}>
            <text x={-250} y={y1 + 9} fill={paper ? PAPER.ink : "rgba(255,255,255,0.75)"} fontFamily={paper ? TYPE : MONO} fontSize={24} textAnchor="middle">
              {String.fromCharCode(65 + i)}
            </text>
            <text x={250} y={y1 + 9} fill={paper ? PAPER.ink : "rgba(255,255,255,0.75)"} fontFamily={paper ? TYPE : MONO} fontSize={24} textAnchor="middle">
              {String.fromCharCode(65 + i)}
            </text>
            <circle cx={-200} cy={y1} r={6} fill={paper ? PAPER.ink : COLORS.blue} />
            <circle cx={200} cy={y1} r={6} fill={paper ? PAPER.ink : COLORS.blue} />
            {k > 0 && <line x1={-200} y1={y1} x2={xm} y2={ym} stroke={paper ? (k < 1 ? PAPER.red : PAPER.ink) : k < 1 ? COLORS.gold : COLORS.blue} strokeWidth={paper ? 2 : 3} filter="url(#glow)" />}
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
