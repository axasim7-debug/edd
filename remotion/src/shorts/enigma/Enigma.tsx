import {AbsoluteFill, Audio, staticFile, useCurrentFrame} from 'remotion';
import type {Feature, FeatureCollection} from 'geojson';
import {COLORS, WorldMap, cameraAt, project, ramp, useProjection, useSeconds, window_, type CamKey, type LonLat} from '../../lib/map';
import {Arrow, BigWord, Country, Flash, Grain, PhotoCard, Pin, Route, Signal, Vignette, Wiring, pulseAt, shake} from '../../lib/overlays';
import europe1938 from './data/europe_1938.json';

// Layout rule: big word on top, photo cards in the band below it, and every
// map focus point in the lower band (see LAYOUT in lib/map.tsx).
// Every time below comes from the voiceover word timestamps (words.json).
export const DURATION = 74.2;

const BORDERS = europe1938 as unknown as FeatureCollection;
const POLAND = BORDERS.features.find((f) => f.properties?.name === 'Poland') as Feature;

const P = {
  london: [-0.1276, 51.5072],
  paris: [2.3522, 48.8566],
  warsaw: [21.0122, 52.2297],
  pyry: [21.027, 52.134],
  berlin: [13.405, 52.52],
  chernivtsi: [25.94, 48.29],
  bucharest: [26.1025, 44.4268],
  bletchley: [-0.7407, 51.9977],
  bydgoszcz: [18.0084, 53.1235],
} satisfies Record<string, LonLat>;

const CAMERA: CamKey[] = [
  // Hook: Bletchley Park
  {t: 0, c: [-0.74, 52.0], z: 7000},
  {t: 3.9, c: [-0.74, 52.0], z: 8200},
  // Poland
  {t: 4.8, c: [19.4, 52.0], z: 3300},
  {t: 9.4, c: [19.4, 52.0], z: 3700},
  // Germany, then the whole continent
  {t: 10.2, c: [14.5, 52.0], z: 3600},
  {t: 12.2, c: [14.5, 52.0], z: 3900},
  {t: 13.5, c: [12, 49], z: 900},
  {t: 14.7, c: [12, 49], z: 820},
  // Warsaw
  {t: 15.7, c: [21.01, 52.23], z: 9000},
  {t: 21.8, c: [21.01, 52.23], z: 10500},
  // Berlin ⇄ Warsaw
  {t: 22.8, c: [17.2, 52.4], z: 2700},
  {t: 31.0, c: [17.2, 52.4], z: 3000},
  // Pyry forest
  {t: 32.3, c: [21.02, 52.17], z: 14000},
  {t: 35.0, c: [21.02, 52.17], z: 16000},
  // London · Paris · Warsaw
  {t: 36.0, c: [10.4, 51.0], z: 2150},
  {t: 43.2, c: [10.4, 51.0], z: 2300},
  {t: 44.0, c: [-0.13, 51.5], z: 9000},
  {t: 45.1, c: [-0.13, 51.5], z: 9800},
  // Invasion
  {t: 46.0, c: [19.3, 52.0], z: 3300},
  {t: 47.9, c: [19.3, 52.0], z: 3600},
  // Escape
  {t: 48.9, c: [14.2, 48.6], z: 1700},
  {t: 52.5, c: [14.2, 48.6], z: 1780},
  // Bletchley
  {t: 53.6, c: [-0.74, 52.0], z: 9000},
  {t: 63.6, c: [-0.74, 52.0], z: 10500},
  // Home
  {t: 64.8, c: [9.0, 52.6], z: 2300},
  {t: 68.8, c: [9.0, 52.6], z: 2450},
  // Poland, end
  {t: 70.2, c: [19.4, 52.0], z: 3300},
  {t: DURATION, c: [19.4, 52.0], z: 3700},
];

const PyryRing: React.FC<{t: number}> = ({t}) => {
  const p = useProjection();
  const show = window_(t, 33.2, 35.4);
  if (show <= 0) return null;
  const [x, y] = project(p, P.pyry);
  return <circle cx={x} cy={y} r={70 + 50 * ramp(t, 33.2, 34.4)} fill="rgba(255,201,74,0.10)" stroke={COLORS.gold} strokeWidth={3} strokeDasharray="10 10" opacity={show} />;
};

export const Enigma: React.FC = () => {
  const t = useSeconds();
  const frame = useCurrentFrame();
  const cam = cameraAt(CAMERA, t);
  const [sx, sy] = [shake(t, 2.6, 0.3, 10), shake(t, 18.3, 0.35, 12), shake(t, 46.7, 0.6, 22)].reduce(
    (a, b) => [a[0] + b[0], a[1] + b[1]],
    [0, 0],
  );

  const polandWhite = window_(t, 4.6, 31.2) * (1 - window_(t, 45.6, 49.0));
  const polandGold = window_(t, 69.8, DURATION + 1, 0.6);

  return (
    <AbsoluteFill style={{background: COLORS.ocean}}>
      <AbsoluteFill style={{transform: `translate(${sx}px, ${sy}px)`}}>
        <WorldMap cam={cam} borders={BORDERS}>
          {/* ---------- map layer: outlines, routes, arrows ---------- */}
          <Country f={POLAND} draw={ramp(t, 4.6, 6.0)} fill={0.9} color={COLORS.white} hatch="white" opacity={polandWhite} />
          <Country f={POLAND} draw={ramp(t, 46.5, 47.2)} fill={1} color={COLORS.red} hatch="red" opacity={window_(t, 46.5, 48.8)} />
          <Country f={POLAND} draw={ramp(t, 69.8, 71.2)} fill={0.6} color={COLORS.gold} hatch="white" opacity={polandGold} />

          <Signal from={P.berlin} to={P.warsaw} t={t} show={window_(t, 23.0, 26.2)} color={COLORS.blue} />
          <Signal from={P.berlin} to={P.warsaw} t={t} show={window_(t, 26.2, 31.2)} color={COLORS.red} speed={0.5} />
          <PyryRing t={t} />

          <Route path={[P.london, P.warsaw]} progress={ramp(t, 36.0, 37.4)} color={COLORS.blue} bend={-0.12} opacity={1 - ramp(t, 38.0, 38.5)} />
          <Route path={[P.paris, P.warsaw]} progress={ramp(t, 36.5, 37.8)} color={COLORS.white} bend={0.1} opacity={1 - ramp(t, 38.0, 38.5)} />
          <Route path={[P.warsaw, P.london]} progress={ramp(t, 38.5, 42.6, (x) => x)} color={COLORS.gold} bend={0.12} opacity={1 - ramp(t, 43.3, 43.8)} />
          <Route path={[P.warsaw, P.paris]} progress={ramp(t, 38.5, 42.6, (x) => x)} color={COLORS.gold} bend={-0.1} opacity={1 - ramp(t, 43.3, 43.8)} />

          {t > 46.5 && t < 48.9 && (
            <>
              <Arrow from={[15.2, 54.2]} to={[18.4, 53.1]} progress={ramp(t, 46.66, 47.6)} />
              <Arrow from={[20.6, 54.6]} to={[20.9, 52.75]} progress={ramp(t, 46.8, 47.7)} />
              <Arrow from={[16.2, 50.6]} to={[19.4, 51.5]} progress={ramp(t, 46.9, 47.8)} />
              <Arrow from={[19.9, 48.9]} to={[20.8, 50.4]} progress={ramp(t, 47.0, 47.9)} />
            </>
          )}

          <Route path={[P.warsaw, P.chernivtsi, P.bucharest, P.paris]} progress={ramp(t, 48.6, 51.8, (x) => x)} bend={0.08} opacity={1 - ramp(t, 52.6, 53.2)} />
          <Route path={[P.bletchley, P.bydgoszcz]} progress={ramp(t, 64.6, 66.4)} bend={-0.08} opacity={1 - ramp(t, 68.6, 69.6)} />

          {/* ---------- pins (lower band) ---------- */}
          <Pin at={P.bletchley} label="Bletchley Park" show={window_(t, -1, 4.4)} />
          <Pin at={P.warsaw} label="Warsaw" show={window_(t, 4.9, 9.6) + window_(t, 15.4, 22.0)} />
          <Pin at={P.berlin} label="Berlin" show={window_(t, 10.0, 12.6)} />
          <Pin at={P.berlin} label="Berlin" side="left" coords={false} color={t > 26.0 ? COLORS.red : COLORS.white} pulse={pulseAt(t, 26.0)} show={window_(t, 22.6, 31.4)} />
          <Pin at={P.warsaw} label="Warsaw" side="right" coords={false} show={window_(t, 22.6, 31.4)} />
          <Pin at={P.pyry} label="Pyry Forest" sub="Secret meeting · July 1939" color={COLORS.gold} pulse={pulseAt(t, 33.4)} show={window_(t, 33.3, 35.5)} />
          <Pin at={P.london} label="London" coords={false} show={window_(t, 35.9, 43.5)} />
          <Pin at={P.paris} label="Paris" coords={false} show={window_(t, 36.4, 43.5)} />
          <Pin at={P.warsaw} label="Warsaw" coords={false} show={window_(t, 35.9, 43.5)} />
          <Pin at={P.london} label="London" color={COLORS.blue} pulse={pulseAt(t, 44.0)} show={window_(t, 43.8, 45.3)} />
          <Pin at={P.warsaw} label="Warsaw" coords={false} show={window_(t, 48.4, 52.9)} />
          <Pin at={P.bucharest} label="Romania" coords={false} show={window_(t, 49.5, 52.9)} />
          <Pin at={P.paris} label="France" coords={false} show={window_(t, 50.5, 52.9)} />
          <Pin at={P.bletchley} label="Bletchley Park" color={t > 59.5 && t < 61.0 ? COLORS.gold : COLORS.white} pulse={pulseAt(t, 59.6)} show={window_(t, 53.4, 63.8)} />
          <Pin at={P.bydgoszcz} label="Home" sub="Bydgoszcz, Poland" show={window_(t, 66.0, 69.5)} />

          {/* ---------- cards (card band) ---------- */}
          <PhotoCard src="enigma/art/turing.jpg" slot="center" size="portraitL" rotate={-3} show={window_(t, -1, 4.4)} anchor={P.bletchley} name="ALAN TURING" cross={ramp(t, 2.55, 3.1)} />

          <PhotoCard src="enigma/art/rejewski.jpg" slot="trioL" size="small" rotate={-5} show={window_(t, 4.76, 9.6)} name="REJEWSKI" />
          <PhotoCard src="enigma/art/zygalski.jpg" slot="trioC" size="small" rotate={1} show={window_(t, 5.1, 9.6)} name="ZYGALSKI" />
          <PhotoCard src="enigma/art/rozycki.jpg" slot="trioR" size="small" rotate={5} show={window_(t, 5.45, 9.6)} name="RÓŻYCKI" />

          <PhotoCard src="enigma/art/enigma.jpg" slot="center" size="landscape" rotate={-2} show={window_(t, 9.72, 14.7)} anchor={t < 12.4 ? P.berlin : undefined} />

          <PhotoCard src="enigma/art/rejewski.jpg" slot="left" size="portrait" rotate={-4} show={window_(t, 16.85, 22.0)} anchor={P.warsaw} name="MARIAN REJEWSKI" />
          <PhotoCard src="enigma/art/enigma.jpg" slot="right" size="half" rotate={4} show={window_(t, 17.6, 18.95)} cross={ramp(t, 18.3, 18.7)} />

          <PhotoCard src="enigma/art/enigma.jpg" slot="center" size="landscape" rotate={2} show={window_(t, 25.9, 29.8)} />

          <PhotoCard src="enigma/art/enigma.jpg" slot="center" size="landscape" rotate={-2} show={window_(t, 41.7, 43.6)} glow={COLORS.gold} />

          <PhotoCard src="enigma/art/invasion.jpg" slot="center" size="landscape" rotate={-2} show={window_(t, 46.9, 48.7)} />

          <PhotoCard src="enigma/art/turing.jpg" slot="left" size="portrait" rotate={-4} show={window_(t, 53.9, 63.6)} anchor={P.bletchley} name="ALAN TURING" glow={t > 59.5 ? COLORS.gold : undefined} />
          <PhotoCard src="enigma/art/bletchley.jpg" slot="right" size="half" rotate={3} show={window_(t, 53.3, 56.1)} />
          <PhotoCard src="enigma/art/bombe.jpg" slot="right" size="half" rotate={3} show={window_(t, 56.1, 59.3)} />
          <PhotoCard src="enigma/art/rejewski.jpg" slot="right" size="portrait" rotate={4} show={window_(t, 61.1, 63.6)} name="REJEWSKI" cross={ramp(t, 62.8, 63.3)} />

          <PhotoCard src="enigma/art/rejewski.jpg" slot="center" size="portraitL" rotate={-2} show={window_(t, 65.5, DURATION + 1)} gray={1 - ramp(t, 70.3, 72.4)} anchor={t < 69.4 ? P.bydgoszcz : undefined} name="MARIAN REJEWSKI" glow={t > 70.3 ? COLORS.gold : undefined} />
        </WorldMap>
      </AbsoluteFill>

      {/* Rotor wiring, rebuilt "on paper" — takes the right card slot */}
      <svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
        <Wiring x={780} y={680} scale={0.48} show={window_(t, 19.0, 22.0)} progress={ramp(t, 19.0, 21.3, (x) => x)} />
      </svg>

      <Vignette />
      <AbsoluteFill style={{background: '#000', opacity: 0.5 * window_(t, 68.6, 70.4, 0.4)}} />

      {/* ---------- word band: one word at a time ---------- */}
      <BigWord text="NOT" show={window_(t, 2.6, 4.3, 0.08)} color={COLORS.red} size={140} />
      <BigWord text="7 YEARS EARLY" show={window_(t, 6.44, 8.0, 0.1)} />
      <BigWord text="1932" show={window_(t, 8.1, 9.6, 0.08)} size={140} />
      <BigWord text="UNBREAKABLE?" show={window_(t, 13.4, 14.7, 0.1)} />
      <BigWord text="+2 ROTORS" show={window_(t, 26.0, 29.8, 0.1)} color={COLORS.red} />
      <BigWord text="JULY 1939" show={window_(t, 31.8, 35.4, 0.1)} color={COLORS.gold} />
      <BigWord text="5 WEEKS LATER" show={window_(t, 45.46, 48.7, 0.1)} />
      <BigWord text="SILENT." show={window_(t, 68.8, 69.8, 0.1)} />

      <Flash t={t} at={2.6} color={COLORS.red} strength={0.25} />
      <Flash t={t} at={18.3} strength={0.5} />
      <Flash t={t} at={46.66} color={COLORS.red} strength={0.35} />

      <Grain frame={frame} />

      <Audio src={staticFile('enigma/vo.wav')} />
    </AbsoluteFill>
  );
};
