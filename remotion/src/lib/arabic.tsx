// Arabic text for Arabic-language voiceovers: right-to-left reveals (letter
// slicing would break Arabic joining, so text is wiped in from the right).
import {Easing, staticFile} from 'remotion';
import {loadFont} from '@remotion/fonts';
import {ramp} from './map';
import {INK} from './paper';

loadFont({family: 'Amiri', url: staticFile('fonts/Amiri-Regular.ttf'), weight: '400'});
loadFont({family: 'Amiri', url: staticFile('fonts/Amiri-Bold.ttf'), weight: '700'});
loadFont({family: 'Aref Ruqaa', url: staticFile('fonts/ArefRuqaa-Regular.ttf'), weight: '400'});
loadFont({family: 'Aref Ruqaa', url: staticFile('fonts/ArefRuqaa-Bold.ttf'), weight: '700'});
loadFont({family: 'Cairo', url: staticFile('fonts/Cairo.ttf'), weight: '200 1000'});

export const NASKH = "'Amiri', serif"; // typed cards, labels
export const RUQAA = "'Aref Ruqaa', 'Amiri', serif"; // handwriting
export const KUFI = "'Cairo', sans-serif"; // captions, headlines (dark style)

// Card text that writes itself from right to left.
export const ArTyped: React.FC<{text: string; progress: number; size?: number; color?: string; weight?: number; style?: React.CSSProperties}> = ({
  text,
  progress,
  size = 50,
  color = INK.ink,
  weight = 700,
  style,
}) => {
  const p = Math.max(0, Math.min(1, progress));
  return (
    <div
      style={{
        direction: 'rtl',
        fontFamily: NASKH,
        fontWeight: weight,
        fontSize: size,
        color,
        lineHeight: 1.35,
        whiteSpace: 'pre',
        clipPath: `inset(-20% -5% -20% ${100 - p * 105}%)`,
        ...style,
      }}
    >
      {text}
    </div>
  );
};

// Handwritten note (Ruqaa) with an ink underline, written right to left.
// (x, y) is the note's right edge.
export const ArNote: React.FC<{text: string; x: number; y: number; progress: number; size?: number; color?: string; rotate?: number}> = ({
  text,
  x,
  y,
  progress,
  size = 76,
  color = INK.red,
  rotate = -3,
}) => {
  if (progress <= 0) return null;
  const w = text.length * size * 0.42;
  return (
    <div style={{position: 'absolute', right: 1080 - x, top: y, transform: `rotate(${rotate}deg)`, transformOrigin: '100% 50%', direction: 'rtl', fontFamily: RUQAA, fontWeight: 700, fontSize: size, color, whiteSpace: 'nowrap'}}>
      <div style={{clipPath: `inset(-30% -5% -30% ${100 - Math.min(1, progress * 1.3) * 105}%)`}}>{text}</div>
      <svg width={w + 20} height={30} style={{position: 'absolute', right: 0, top: size * 1.25}}>
        <path d={`M${w + 10},12 Q${w / 2},${24} 6,10`} fill="none" stroke={color} strokeWidth={5} strokeLinecap="round" pathLength={1} strokeDasharray={`${ramp(progress, 0.6, 1)} 1`} />
      </svg>
    </div>
  );
};

// Rubber stamp with Arabic lettering.
export const ArStamp: React.FC<{text: string; x: number; y: number; show: number; rotate?: number; size?: number; color?: string; font?: string}> = ({
  text,
  x,
  y,
  show,
  rotate = -8,
  size = 70,
  color = INK.red,
  font = NASKH,
}) => {
  if (show <= 0) return null;
  const k = Math.min(1, show);
  const s = 1.6 - 0.6 * Easing.out(Easing.cubic)(k);
  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        transform: `translate(-50%, -50%) rotate(${rotate}deg) scale(${s})`,
        opacity: Math.min(1, k * 2) * 0.85,
        border: `6px solid ${color}`,
        borderRadius: 10,
        padding: '0 26px',
        fontFamily: font,
        fontWeight: 700,
        fontSize: size,
        lineHeight: 1.5,
        color,
        direction: 'rtl',
        mixBlendMode: 'multiply',
        whiteSpace: 'nowrap',
      }}
    >
      {text}
    </div>
  );
};
