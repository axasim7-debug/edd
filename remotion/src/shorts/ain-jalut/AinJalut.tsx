import {AbsoluteFill, Audio, getStaticFiles, interpolate, staticFile} from 'remotion';
import {City, COLORS, Region, Route, WorldMap, cameraAt, ramp, useProjection, project, useSeconds} from '../../lib/map';
import {Captions, Card, Flash, Headline, Progress, Red, Vignette, shake} from '../../lib/overlays';
import {CAMERA, EMPIRE, LINES, PLACES as P, SYRIA, TOTAL_SECONDS} from './timeline';

const VOICEOVER = 'ain-jalut/vo.wav';
const hasVoiceover = () => getStaticFiles().some((f) => f.name === VOICEOVER);

// Battle-scale coordinates around Ain Jalut (stylised).
const B = {
  south: [35.12, 32.28],
  front: [35.33, 32.5],
  north: [35.6, 32.74],
  hillW: [35.08, 32.62],
  hillE: [35.62, 32.38],
} as const;

const Hills: React.FC<{opacity: number}> = ({opacity}) => {
  const p = useProjection();
  const hill = (c: readonly [number, number], label: string) => {
    const [x, y] = project(p, c);
    return (
      <g key={label}>
        <ellipse cx={x} cy={y} rx={150} ry={90} fill="rgba(120,140,110,0.25)" stroke="rgba(180,200,160,0.5)" strokeWidth={3} />
        <ellipse cx={x} cy={y} rx={90} ry={52} fill="none" stroke="rgba(180,200,160,0.4)" strokeWidth={3} />
        <text x={x} y={y + 12} fill="rgba(220,235,210,0.8)" fontFamily="JetBrains Mono, monospace" fontSize={30} textAnchor="middle">{label}</text>
      </g>
    );
  };
  return <g opacity={opacity}>{[hill(B.hillW, 'HILLS'), hill(B.hillE, 'HILLS')]}</g>;
};

export const AinJalut: React.FC = () => {
  const t = useSeconds();
  const cam = cameraAt(CAMERA, t);
  const [sx, sy] = [shake(t, 19.6), shake(t, 44.9, 0.8, 34)].reduce((a, b) => [a[0] + b[0], a[1] + b[1]], [0, 0]);

  const syriaIn = ramp(t, 10.5, 11.6);
  const syriaOut = 1 - ramp(t, 47.5, 49.5);
  const syriaShrink = 1 - 0.55 * ramp(t, 31, 33.5);
  const empireOpacity = 1 - 0.5 * ramp(t, 35, 36) + 0.5 * ramp(t, 44.5, 45.5);
  const pulse = (at: number) => (t >= at && t < at + 0.8 ? (t - at) / 0.8 : 0);
  const battle = t >= 34.6 && t < 45;
  const dark = Math.max(
    interpolate(t, [24, 24.3, 25.8, 26], [0, 0.7, 0.7, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}),
    0.75 * ramp(t, 57, 59.5),
  );

  return (
    <AbsoluteFill style={{background: COLORS.ocean}}>
      <AbsoluteFill style={{transform: `translate(${sx}px, ${sy}px) scale(1.04)`}}>
        <WorldMap cam={cam}>
          <g opacity={empireOpacity}>
            <Region coords={EMPIRE} />
            {t >= 10.5 && <Region coords={SYRIA} reveal={syriaIn * syriaShrink} opacity={syriaOut} />}
          </g>

          {/* 0–3: the threat aimed at Egypt */}
          {t < 7.2 && <Route from={P.baghdad} to={P.cairo} progress={ramp(t, 0, 1.2)} color={COLORS.red} arrow bend={-0.15} width={12} />}
          {t < 3.3 && <City at={P.cairo} label="Egypt" color={COLORS.gold} pulse={(t * 1.2) % 1} side="left" />}

          {/* 3–7: the open loop — someone 4,000 miles away */}
          {t >= 3.2 && t < 7.2 && (
            <>
              <Route from={P.ainJalut} to={P.diaoyu} progress={ramp(t, 3.4, 6)} bend={0.12} />
              <City at={P.ainJalut} label="Ain Jalut" />
              <City at={P.diaoyu} label="???" color={COLORS.red} side="left" opacity={ramp(t, 5.6, 6)} pulse={pulse(5.8)} />
            </>
          )}

          {/* 7–13: Baghdad, Aleppo, Damascus fall */}
          {t >= 7.2 && t < 18.6 && (
            <>
              <City at={P.baghdad} label="Baghdad" side="left" color={t >= 7.9 ? COLORS.red : COLORS.text} pulse={pulse(7.9)} />
              <City at={P.aleppo} label="Aleppo" color={t >= 10.6 ? COLORS.red : COLORS.text} pulse={pulse(10.6)} opacity={ramp(t, 9.8, 10.2)} side="left" />
              <City at={P.damascus} label="Damascus" color={t >= 11.8 ? COLORS.red : COLORS.text} pulse={pulse(11.8)} opacity={ramp(t, 11, 11.4)} side="left" />
            </>
          )}
          {t >= 13 && t < 26 && (
            <>
              <Route from={P.damascus} to={P.cairo} progress={ramp(t, 13.2, 14.5)} color={COLORS.red} arrow bend={0.1} width={10} />
              <City at={P.cairo} label="Cairo" color={COLORS.gold} pulse={pulse(13.4)} side="left" />
            </>
          )}

          {/* 26–35: Möngke dies, Hulagu leaves, Kitbuqa stays */}
          {t >= 26 && t < 35 && (
            <>
              <City at={P.diaoyu} label="Möngke Khan †" color={COLORS.red} side="left" pulse={pulse(27.6)} opacity={ramp(t, 27.2, 27.6)} />
              <Route from={P.damascus} to={P.tabriz} progress={ramp(t, 29.6, 31.6)} color={COLORS.red} arrow bend={0.25} width={12} />
              <City at={P.damascus} label="Kitbuqa" color={COLORS.red} opacity={ramp(t, 32.4, 32.8)} pulse={pulse(32.6)} side="left" />
            </>
          )}

          {/* 35–44: the feigned retreat and the trap */}
          {battle && (
            <>
              <Hills opacity={ramp(t, 35, 35.6)} />
              <Route from={B.south} to={B.front} progress={ramp(t, 37, 38.5)} color={COLORS.blue} arrow bend={0.05} width={18} />
              {t >= 38.5 && <Route from={B.front} to={B.south} progress={ramp(t, 38.6, 40.2)} color={COLORS.blue} arrow bend={-0.1} width={14} />}
              <Route from={B.north} to={B.front} progress={ramp(t, 39.6, 41.4)} color={COLORS.red} arrow bend={0.05} width={18} />
              <Route from={B.hillW} to={B.front} progress={ramp(t, 41.6, 42.8)} color={COLORS.blue} arrow bend={0.2} width={18} />
              <Route from={B.hillE} to={B.front} progress={ramp(t, 41.6, 42.8)} color={COLORS.blue} arrow bend={-0.2} width={18} />
            </>
          )}

          {/* 44–60: victory, then the road home that never ends */}
          {t >= 45 && t < 51 && <City at={P.ainJalut} label="Ain Jalut" color={COLORS.blue} pulse={pulse(45)} />}
          {t >= 51 && (
            <>
              <Route from={P.ainJalut} to={P.cairo} progress={0.62 * ramp(t, 52, 56, (x) => x)} color={COLORS.gold} arrow bend={0.12} width={12} />
              <City at={P.cairo} label="Cairo" color={COLORS.gold} side="left" />
            </>
          )}
        </WorldMap>
      </AbsoluteFill>

      <Vignette />
      {dark > 0 && <AbsoluteFill style={{background: '#000', opacity: dark}} />}

      <Headline t={t} from={0} to={3.1}>
        THE MONGOLS <br /> VS <Red>SLAVES</Red>
      </Headline>
      <Headline t={t} from={5.2} to={7.2}>
        <Red>4,000</Red> MILES
      </Headline>
      <Headline t={t} from={7.4} to={10.2} size={140}>1258</Headline>
      <Card t={t} from={14.6} to={18} title="From Hulagu Khan" body="Surrender… or end up like Baghdad." />
      <Card t={t} from={19.4} to={24} title="Bab Zuwayla · Cairo" body="The envoys’ heads hung on the gate." rotate={3} top={460} />
      <Headline t={t} from={24} to={26} top={760} size={130}>
        NO GOING <Red>BACK</Red>
      </Headline>
      <Headline t={t} from={33} to={35} size={96}>
        A <Red>FRACTION</Red> <br /> OF THE ARMY
      </Headline>
      <Headline t={t} from={35.2} to={37.5} size={110}>SEPT 3, 1260</Headline>
      <Headline t={t} from={41.8} to={44} size={150}>
        <Red>TRAP</Red>
      </Headline>
      <Headline t={t} from={44.8} to={47.5} size={150}>
        “WA <br /> ISLAMAH!”
      </Headline>
      <Headline t={t} from={53} to={56} size={110}>
        50 DAYS <br /> LATER
      </Headline>

      {t >= 60 && (
        <AbsoluteFill style={{background: '#000', justifyContent: 'center', alignItems: 'center', flexDirection: 'column'}}>
          <div style={{fontFamily: 'Inter Display, Inter, sans-serif', fontWeight: 900, fontSize: 190, color: COLORS.red, textShadow: `0 0 50px ${COLORS.red}`, transform: `scale(${1.25 - 0.25 * ramp(t, 60, 60.4)})`}}>
            BAYBARS
          </div>
          <div style={{fontFamily: 'Inter Display, Inter, sans-serif', fontWeight: 800, fontSize: 64, color: COLORS.text, marginTop: 30, letterSpacing: 4, opacity: ramp(t, 61.2, 61.6)}}>
            THE NEXT SULTAN
          </div>
        </AbsoluteFill>
      )}

      <Flash t={t} at={7.9} />
      <Flash t={t} at={19.6} color={COLORS.red} />
      <Flash t={t} at={27.6} />
      <Flash t={t} at={44.9} />
      <Flash t={t} at={60} color={COLORS.red} />

      {t < 60 && <Captions lines={LINES} t={t} />}
      <Progress t={t} total={TOTAL_SECONDS} />
      {hasVoiceover() && <Audio src={staticFile(VOICEOVER)} />}
    </AbsoluteFill>
  );
};
