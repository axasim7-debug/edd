// Documentary-style building blocks (version B): archival photo panels,
// an animated Enigma machine, a teleprinter tape and closing doors.
import {AbsoluteFill, Img, interpolate, staticFile, Easing} from 'remotion';
import {COLORS, ramp} from './map';

const FONT = 'Inter Display, Inter, sans-serif';
const MONO = 'JetBrains Mono, monospace';

// Blurred, darkened copy of the current photo fills the frame behind the panel.
export const Backdrop: React.FC<{src?: string; show: number}> = ({src, show}) =>
  src && show > 0 ? (
    <AbsoluteFill style={{opacity: show}}>
      <Img
        src={staticFile(src)}
        style={{width: '100%', height: '100%', objectFit: 'cover', filter: 'blur(46px) brightness(0.32) saturate(0.6)', transform: 'scale(1.25)'}}
      />
    </AbsoluteFill>
  ) : null;

// Large framed photo with a slow Ken Burns push. `t0` is when it appears.
export const Panel: React.FC<{
  src: string;
  t: number;
  t0: number;
  show: number;
  w?: number;
  h?: number;
  y?: number;
  x?: number;
  gray?: number;
  tint?: string;
  glow?: string;
  glitch?: number;
  zoomFrom?: number;
  zoomTo?: number;
  focus?: string;
  rotate?: number;
}> = ({src, t, t0, show, w = 820, h = 1020, y = 860, x = 540, gray = 0, tint, glow, glitch = 0, zoomFrom = 1.04, zoomTo = 1.16, focus = '50% 35%', rotate = 0}) => {
  if (show <= 0) return null;
  const k = Math.max(0, t - t0);
  const zoom = zoomFrom + (zoomTo - zoomFrom) * Math.min(1, k / 6);
  const enter = interpolate(show, [0, 1], [0.94, 1], {easing: Easing.out(Easing.cubic)});
  const img = (extra: React.CSSProperties = {}) => (
    <Img
      src={staticFile(src)}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        objectPosition: focus,
        transform: `scale(${zoom})`,
        filter: `grayscale(${gray}) contrast(1.08)`,
        ...extra,
      }}
    />
  );
  // Deterministic horizontal slice offsets for the glitch.
  const slices = glitch > 0 ? [0.12, 0.31, 0.47, 0.66, 0.83] : [];
  return (
    <div
      style={{
        position: 'absolute',
        left: x - w / 2,
        top: y - h / 2,
        width: w,
        height: h,
        opacity: show,
        transform: `scale(${enter}) rotate(${rotate}deg)`,
        borderRadius: 18,
        overflow: 'hidden',
        boxShadow: '0 40px 120px rgba(0,0,0,0.8)',
        outline: glow ? `6px solid ${glow}` : '2px solid rgba(232,221,197,0.18)',
      }}
    >
      {img()}
      {glitch > 0 && (
        <>
          {img({mixBlendMode: 'screen', opacity: 0.7 * glitch, transform: `scale(${zoom}) translateX(${18 * glitch}px)`, filter: 'grayscale(1) sepia(1) hue-rotate(-50deg) saturate(6)'})}
          {img({mixBlendMode: 'screen', opacity: 0.6 * glitch, transform: `scale(${zoom}) translateX(${-18 * glitch}px)`, filter: 'grayscale(1) sepia(1) hue-rotate(150deg) saturate(6)'})}
          {slices.map((s, i) => (
            <div
              key={s}
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                top: `${s * 100}%`,
                height: 26 + i * 6,
                background: i % 2 ? 'rgba(164,59,50,0.55)' : 'rgba(232,221,197,0.25)',
                transform: `translateX(${(i % 2 ? 1 : -1) * 60 * glitch}px)`,
                mixBlendMode: 'overlay',
              }}
            />
          ))}
        </>
      )}
      {tint && <div style={{position: 'absolute', inset: 0, background: tint, mixBlendMode: 'multiply'}} />}
      <div style={{position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0) 60%, rgba(0,0,0,0.55) 100%)'}} />
    </div>
  );
};

// Small name tag under a panel — the only text on screen in version B.
export const NameTag: React.FC<{text: string; show: number; y: number; x?: number; color?: string}> = ({text, show, y, x = 540, color = COLORS.white}) =>
  show > 0 ? (
    <div
      style={{
        position: 'absolute',
        left: x - 480,
        width: 960,
        whiteSpace: 'nowrap',
        top: y,
        textAlign: 'center',
        opacity: show,
        transform: `translateY(${(1 - show) * 20}px)`,
        fontFamily: FONT,
        fontWeight: 800,
        fontSize: Math.min(40, 900 / (text.length * 0.9)),
        letterSpacing: 6,
        color,
        textShadow: '0 4px 20px rgba(0,0,0,0.9)',
      }}
    >
      {text}
    </div>
  ) : null;

const ROWS = ['QWERTZUIO', 'ASDFGHJK', 'PYXCVBNML'];

// Animated Enigma: rotor windows on top, lampboard below.
// `rotors` 3..5 (fractional = the extra rotors sliding in), `spin` letters/second,
// `lit` the letter whose lamp is on.
export const EnigmaMachine: React.FC<{
  t: number;
  show: number;
  rotors: number;
  spin: number;
  lit: string | null;
  danger?: number;
  y?: number;
  scale?: number;
}> = ({t, show, rotors, spin, lit, danger = 0, y = 900, scale = 1}) => {
  if (show <= 0) return null;
  const n = Math.ceil(rotors);
  const rw = 118;
  const gap = 26;
  const total = n * rw + (n - 1) * gap;
  const lampR = 38;
  return (
    <svg width={1080} height={1920} style={{position: 'absolute', inset: 0, opacity: show}}>
      <defs>
        <linearGradient id="body" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1d1f22" />
          <stop offset="100%" stopColor="#0c0d0f" />
        </linearGradient>
        <linearGradient id="drum" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#3b3326" />
          <stop offset="50%" stopColor="#d8cfb8" />
          <stop offset="100%" stopColor="#3b3326" />
        </linearGradient>
      </defs>
      <g transform={`translate(540 ${y}) scale(${scale * interpolate(show, [0, 1], [0.92, 1])})`}>
        <rect x={-470} y={-430} width={940} height={860} rx={36} fill="url(#body)" stroke={danger > 0 ? `rgba(164,59,50,${0.3 + 0.6 * danger})` : 'rgba(232,221,197,0.12)'} strokeWidth={4} />
        {/* rotor windows */}
        {Array.from({length: n}, (_, i) => {
          const extra = i >= 3 ? Math.min(1, rotors - i) : 1;
          const x = -total / 2 + i * (rw + gap);
          const pos = t * spin * (1 + i * 0.37) + i * 7;
          const base = Math.floor(pos);
          const frac = pos - base;
          return (
            <g key={i} transform={`translate(${x} ${-370 + (1 - extra) * -80})`} opacity={extra}>
              <rect width={rw} height={300} rx={14} fill="url(#drum)" stroke={i >= 3 ? COLORS.red : '#000'} strokeWidth={i >= 3 ? 5 : 3} />
              <clipPath id={`rc${i}`}>
                <rect width={rw} height={300} rx={14} />
              </clipPath>
              <g clipPath={`url(#rc${i})`}>
                {[-2, -1, 0, 1, 2].map((d) => {
                  const letter = String.fromCharCode(65 + (((base + d) % 26) + 26) % 26);
                  const yy = 150 + (d - frac) * 92;
                  return (
                    <text key={d} x={rw / 2} y={yy + 24} textAnchor="middle" fontFamily={MONO} fontWeight={700} fontSize={64} fill={d === 0 ? '#111' : 'rgba(17,17,17,0.45)'}>
                      {letter}
                    </text>
                  );
                })}
              </g>
              <rect x={-6} y={118} width={rw + 12} height={64} rx={8} fill="none" stroke={COLORS.gold} strokeWidth={4} />
            </g>
          );
        })}
        {/* lampboard */}
        {ROWS.map((row, r) =>
          row.split('').map((ch, i) => {
            const cx = (i - (row.length - 1) / 2) * (lampR * 2 + 16);
            const cy = 40 + r * (lampR * 2 + 22);
            const on = lit === ch;
            return (
              <g key={ch} transform={`translate(${cx} ${cy})`}>
                <circle r={lampR} fill={on ? '#E8DDC5' : '#26282c'} stroke={on ? '#AD9163' : 'rgba(232,221,197,0.2)'} strokeWidth={3} />
                <text y={14} textAnchor="middle" fontFamily={MONO} fontWeight={700} fontSize={36} fill={on ? '#171817' : 'rgba(232,221,197,0.6)'}>
                  {ch}
                </text>
              </g>
            );
          }),
        )}
      </g>
    </svg>
  );
};

// Pseudo-random lamp sequence for "the machine is encrypting".
export const busyLamp = (t: number, rate = 5) => {
  const letters = 'QWERTZUIOASDFGHJKPYXCVBNML';
  const i = Math.floor(t * rate);
  return (i * 2654435761) % 7 === 0 ? null : letters[(i * 7919) % 26];
};

// Teleprinter strip: ciphertext on top; a decode sweep reveals plaintext below.
export const Tape: React.FC<{t: number; show: number; decode: number; red?: number}> = ({t, show, decode, red = 0}) => {
  if (show <= 0) return null;
  const cipher = 'QBLTW LDAHH YEOEF PTWYB LENDP MKOXL DFAMU DWIJD XRJZY DFRIO RMEUM DXVCI';
  const plain = 'KEINE BESONDEREN EREIGNISSE';
  const offset = (t * 160) % 900;
  const strip = (y: number, content: string, color: string, shift: number) => (
    <div style={{position: 'absolute', left: 0, right: 0, top: y, height: 130, background: '#E8DDC5', boxShadow: '0 20px 60px rgba(0,0,0,0.7)', overflow: 'hidden'}}>
      <div style={{position: 'absolute', top: 30, left: -shift, whiteSpace: 'nowrap', fontFamily: MONO, fontWeight: 700, fontSize: 64, color, letterSpacing: 8}}>
        {content}
      </div>
    </div>
  );
  const shown = plain.slice(0, Math.round(plain.length * decode));
  return (
    <AbsoluteFill style={{opacity: show}}>
      {strip(700, cipher + ' ' + cipher, red > 0 ? COLORS.red : '#292824', offset)}
      <div style={{position: 'absolute', left: 0, right: 0, top: 900, height: 130, background: '#171817', border: `3px solid ${COLORS.gold}`, overflow: 'hidden', opacity: 1 - red}}>
        <div style={{position: 'absolute', top: 30, left: 40, whiteSpace: 'nowrap', fontFamily: MONO, fontWeight: 700, fontSize: 56, color: COLORS.gold, letterSpacing: 4}}>
          {shown}
          <span style={{opacity: Math.floor(t * 4) % 2 ? 1 : 0}}>▌</span>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// Two doors slide shut over the frame region.
export const Doors: React.FC<{close: number; y: number; h: number}> = ({close, y, h}) => {
  if (close <= 0) return null;
  const k = Easing.inOut(Easing.cubic)(Math.min(1, close));
  const door = (side: 'l' | 'r') => (
    <div
      style={{
        position: 'absolute',
        top: y,
        height: h,
        width: 540,
        [side === 'l' ? 'left' : 'right']: -540 + 540 * k,
        background: 'repeating-linear-gradient(90deg, #121417 0 26px, #181b1f 26px 52px)',
        borderRight: side === 'l' ? `6px solid ${COLORS.red}` : undefined,
        borderLeft: side === 'r' ? `6px solid ${COLORS.red}` : undefined,
        boxShadow: '0 0 60px rgba(0,0,0,0.9)',
      }}
    />
  );
  return (
    <>
      {door('l')}
      {door('r')}
    </>
  );
};

// Fade helper for scenes.
export const scene = (t: number, a: number, b: number, fade = 0.2) => Math.min(ramp(t, a - fade / 2, a + fade / 2), 1 - ramp(t, b - fade / 2, b + fade / 2));
