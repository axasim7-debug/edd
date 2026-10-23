import {AbsoluteFill, Easing, interpolate} from 'remotion';
import {COLORS, ramp} from './map';
import type {Line} from '../shorts/ain-jalut/timeline';

const FONT = 'Inter Display, Inter, sans-serif';

// Shorts-style captions: 2–4 words at a time, timed by character count.
export const Captions: React.FC<{lines: Line[]; t: number}> = ({lines, t}) => {
  const l = lines.find((x) => t >= x.start && t < x.end);
  if (!l) return null;
  const words = l.text.split(' ');
  const chunks: string[][] = [];
  for (const w of words) {
    const cur = chunks[chunks.length - 1];
    if (!cur || cur.length >= 3 || /[.…:!?,”]$/.test(cur[cur.length - 1])) chunks.push([w]);
    else cur.push(w);
  }
  const weights = chunks.map((c) => c.join(' ').length + 4);
  const total = weights.reduce((a, b) => a + b, 0);
  const dur = l.end - l.start;
  let acc = l.start;
  let idx = chunks.length - 1;
  let chunkStart = l.start;
  for (let i = 0; i < chunks.length; i++) {
    const d = (weights[i] / total) * dur;
    if (t < acc + d) {
      idx = i;
      chunkStart = acc;
      break;
    }
    acc += d;
  }
  const pop = interpolate(t - chunkStart, [0, 0.12], [0.82, 1], {
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.back(2)),
  });
  const hl = new Set(l.highlight ?? []);
  return (
    <div
      style={{
        position: 'absolute',
        left: 60,
        right: 60,
        top: 1290,
        textAlign: 'center',
        transform: `scale(${pop})`,
        fontFamily: FONT,
        fontWeight: 900,
        fontSize: 92,
        lineHeight: 1.05,
        textTransform: 'uppercase',
        color: COLORS.text,
        WebkitTextStroke: '3px rgba(0,0,0,0.85)',
        textShadow: '0 8px 24px rgba(0,0,0,0.9)',
      }}
    >
      {chunks[idx].map((w, i) => (
        <span key={i} style={{color: hl.has(w) ? COLORS.gold : COLORS.text}}>
          {w}{' '}
        </span>
      ))}
    </div>
  );
};

// Big claim text in the top third (the frame-one hook text).
export const Headline: React.FC<{
  t: number;
  from: number;
  to: number;
  children: React.ReactNode;
  top?: number;
  size?: number;
}> = ({t, from, to, children, top = 300, size = 104}) => {
  if (t < from || t > to) return null;
  // A headline that starts at 0 is the frame-one hook: show it fully formed.
  const inK = from === 0 ? 1 : ramp(t, from, from + 0.15, Easing.out(Easing.back(2.2)));
  const out = 1 - ramp(t, to - 0.2, to);
  return (
    <div
      style={{
        position: 'absolute',
        left: 50,
        right: 50,
        top,
        textAlign: 'center',
        fontFamily: FONT,
        fontWeight: 900,
        fontSize: size,
        lineHeight: 1.02,
        color: COLORS.text,
        opacity: out,
        transform: `scale(${0.7 + 0.3 * inK})`,
        textShadow: '0 0 30px rgba(0,0,0,0.9), 0 6px 0 rgba(0,0,0,0.6)',
      }}
    >
      {children}
    </div>
  );
};

export const Red: React.FC<{children: React.ReactNode}> = ({children}) => (
  <span style={{color: COLORS.red, textShadow: `0 0 28px ${COLORS.red}`}}>{children}</span>
);

// Paper card (letter / place card) that drops onto the map.
export const Card: React.FC<{
  t: number;
  from: number;
  to: number;
  title: string;
  body: string;
  rotate?: number;
  top?: number;
}> = ({t, from, to, title, body, rotate = -4, top = 520}) => {
  if (t < from || t > to) return null;
  const k = ramp(t, from, from + 0.35, Easing.out(Easing.back(1.6)));
  const out = 1 - ramp(t, to - 0.25, to);
  return (
    <div
      style={{
        position: 'absolute',
        left: 140,
        right: 140,
        top,
        padding: '48px 56px',
        background: 'linear-gradient(160deg, #efe2c2, #d8c39a)',
        borderRadius: 12,
        boxShadow: '0 30px 80px rgba(0,0,0,0.7)',
        transform: `translateY(${(1 - k) * -500}px) rotate(${rotate * k}deg)`,
        opacity: out,
        color: '#2b1d0e',
        fontFamily: 'FreeSerif, serif',
      }}
    >
      <div style={{fontSize: 40, letterSpacing: 6, textTransform: 'uppercase', opacity: 0.7}}>{title}</div>
      <div style={{fontSize: 68, fontWeight: 700, lineHeight: 1.1, marginTop: 16}}>{body}</div>
    </div>
  );
};

export const Flash: React.FC<{t: number; at: number; color?: string}> = ({t, at, color = '#fff'}) => {
  const o = interpolate(t, [at, at + 0.05, at + 0.35], [0, 0.75, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return o > 0 ? <AbsoluteFill style={{background: color, opacity: o}} /> : null;
};

export const Vignette: React.FC = () => (
  <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 45%, transparent 45%, rgba(0,0,0,0.75) 100%)'}} />
);

// Thin progress bar at the top: keeps viewers aware the story is moving.
export const Progress: React.FC<{t: number; total: number}> = ({t, total}) => (
  <div style={{position: 'absolute', top: 0, left: 0, height: 10, width: `${(t / total) * 100}%`, background: COLORS.red, boxShadow: `0 0 18px ${COLORS.red}`}} />
);

// Deterministic shake offset that decays after `at`.
export const shake = (t: number, at: number, dur = 0.5, amp = 26) => {
  const k = t - at;
  if (k < 0 || k > dur) return [0, 0];
  const f = (1 - k / dur) * amp;
  return [Math.sin(k * 90) * f, Math.cos(k * 70) * f];
};
