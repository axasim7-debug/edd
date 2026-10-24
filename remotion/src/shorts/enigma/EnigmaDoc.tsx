// Version B — documentary style. The map appears only where the story moves
// between places; the rest is archival photos and an animated Enigma.
import {AbsoluteFill, Audio, staticFile, useCurrentFrame} from 'remotion';
import type {Feature, FeatureCollection} from 'geojson';
import {COLORS, WorldMap, cameraAt, ramp, useSeconds, window_, type CamKey, type LonLat} from '../../lib/map';
import {Arrow, Country, Flash, Grain, Pin, Route, Vignette, Wiring, shake} from '../../lib/overlays';
import {Backdrop, Doors, EnigmaMachine, NameTag, Panel, Tape, busyLamp, scene} from '../../lib/doc';
import europe1938 from './data/europe_1938.json';
import {DURATION} from './Enigma';

const BORDERS = europe1938 as unknown as FeatureCollection;
const POLAND = BORDERS.features.find((f) => f.properties?.name === 'Poland') as Feature;

const P = {
  london: [-0.1276, 51.5072],
  paris: [2.3522, 48.8566],
  warsaw: [21.0122, 52.2297],
  pyry: [21.027, 52.134],
  chernivtsi: [25.94, 48.29],
  bucharest: [26.1025, 44.4268],
} satisfies Record<string, LonLat>;

const A = (f: string) => `enigma/art/${f}.jpg`;

// Map camera, only used inside the map scenes.
const CAMERA: CamKey[] = [
  {t: 31.6, c: [20.4, 52.3], z: 6000},
  {t: 35.0, c: [21.02, 52.17], z: 15000},
  {t: 36.0, c: [10.4, 51.0], z: 2150},
  {t: 45.2, c: [10.4, 51.0], z: 2350},
  {t: 46.0, c: [19.3, 52.0], z: 3300},
  {t: 48.3, c: [19.3, 52.0], z: 3600},
  {t: 48.9, c: [14.2, 48.6], z: 1700},
  {t: 53.0, c: [14.2, 48.6], z: 1800},
];

const NAME = 'REJEWSKI';

export const EnigmaDoc: React.FC = () => {
  const t = useSeconds();
  const frame = useCurrentFrame();
  const [sx, sy] = [shake(t, 2.6, 0.3, 10), shake(t, 18.3, 0.35, 12), shake(t, 46.7, 0.6, 22)].reduce(
    (a, b) => [a[0] + b[0], a[1] + b[1]],
    [0, 0],
  );

  // Scene windows (seconds from the voiceover word timings).
  const s = {
    turing: scene(t, -1, 4.5),
    trio: scene(t, 4.55, 9.65),
    machine1: scene(t, 9.65, 14.75),
    rejewski: scene(t, 14.75, 18.9),
    wiring: scene(t, 18.9, 22.0),
    tape: scene(t, 22.0, 25.9),
    machine2: scene(t, 25.9, 31.6),
    map: scene(t, 31.6, 45.4) + scene(t, 48.6, 53.0),
    invasion: scene(t, 45.4, 48.6),
    bletchley: scene(t, 53.0, 55.5),
    bombe: scene(t, 55.5, 59.45),
    turing2: scene(t, 59.45, 61.0),
    kept: scene(t, 61.0, 64.0),
    clerk: scene(t, 64.0, 68.7),
    end: scene(t, 69.4, DURATION + 1, 0.6),
  };

  const backdrop =
    t < 4.5 ? A('turing') : t < 9.65 ? A('zygalski') : t < 14.75 ? undefined : t < 18.9 ? A('rejewski') : t < 31.6 ? undefined : t < 45.4 ? undefined : t < 48.6 ? A('invasion') : t < 53 ? undefined : t < 55.5 ? A('bletchley') : t < 59.45 ? A('bombe') : t < 61 ? A('turing') : t < 68.7 ? A('rejewski') : A('rejewski');

  const litName = Math.max(0, Math.min(NAME.length, Math.floor((t - 69.9) / 0.38) + 1));
  const endLamp = t >= 69.9 && litName > 0 && (t - 69.9) % 0.38 < 0.3 ? NAME[litName - 1] : null;

  return (
    <AbsoluteFill style={{background: '#06090d'}}>
      <Backdrop src={backdrop} show={1 - s.map} />

      <AbsoluteFill style={{transform: `translate(${sx}px, ${sy}px)`}}>
        {/* Hook: the Hollywood version, glitching apart on "NOT" */}
        <Panel src={A('turing')} t={t} t0={0} show={s.turing} glitch={window_(t, 2.55, 3.5, 0.1)} gray={1} />
        <NameTag text="ALAN TURING" show={s.turing} y={1400} />

        {/* Three Polish mathematicians */}
        <Panel src={A('rejewski')} t={t} t0={4.76} show={Math.min(s.trio, ramp(t, 4.76, 5.1))} x={192} w={330} h={760} y={780} gray={1} rotate={-1} />
        <Panel src={A('zygalski')} t={t} t0={5.1} show={Math.min(s.trio, ramp(t, 5.1, 5.45))} x={540} w={330} h={760} y={780} gray={1} />
        <Panel src={A('rozycki')} t={t} t0={5.45} show={Math.min(s.trio, ramp(t, 5.45, 5.8))} x={888} w={330} h={760} y={780} gray={1} rotate={1} />
        <NameTag text="REJEWSKI · ZYGALSKI · RÓŻYCKI" show={Math.min(s.trio, ramp(t, 5.8, 6.3))} y={1210} />

        {/* Enigma: billions of settings */}
        <EnigmaMachine t={t} show={s.machine1} rotors={3} spin={t < 10.5 ? 2 : t < 12.0 ? 22 : 6} lit={busyLamp(t, t < 12 ? 4 : 9)} />

        {/* Rejewski */}
        <Panel src={A('rejewski')} t={t} t0={14.75} show={s.rejewski} gray={1} zoomFrom={1.05} zoomTo={1.25} />
        <NameTag text="MARIAN REJEWSKI · 1932" show={Math.min(s.rejewski, ramp(t, 16.85, 17.3))} y={1400} />

        {/* Pure maths: the wiring rebuilt */}
        <svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
          <defs>
            <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="7" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <Wiring x={540} y={880} scale={0.98} show={s.wiring} progress={ramp(t, 19.0, 21.6, (x) => x)} />
        </svg>

        {/* Poland reads the traffic */}
        <Tape t={t} show={s.tape} decode={ramp(t, 23.0, 25.2, (x) => x)} />

        {/* Germany makes it harder: two more rotors */}
        <EnigmaMachine t={t} show={s.machine2} rotors={3 + 2 * ramp(t, 26.0, 27.0)} spin={8} lit={busyLamp(t, 7)} danger={ramp(t, 26.0, 27.0) * (0.6 + 0.4 * Math.sin(t * 6))} />
      </AbsoluteFill>

      {/* Map scenes: the forest, the hand-over, the escape */}
      {s.map > 0 && (
        <AbsoluteFill style={{opacity: s.map}}>
          <WorldMap cam={cameraAt(CAMERA, t)} borders={BORDERS}>
            <Country f={POLAND} draw={ramp(t, 31.8, 33.0)} fill={0.8} color={COLORS.white} hatch="white" opacity={window_(t, 31.6, 35.6)} />
            <Pin at={P.warsaw} label="Warsaw" show={window_(t, 31.9, 35.4)} />
            <Pin at={P.pyry} label="Pyry Forest" color={COLORS.gold} pulse={t > 33.4 && t < 34.3 ? (t - 33.4) / 0.9 : 0} show={window_(t, 33.3, 35.5)} />
            <Route path={[P.london, P.warsaw]} progress={ramp(t, 36.0, 37.4)} color={COLORS.blue} bend={-0.12} opacity={1 - ramp(t, 38.0, 38.5)} />
            <Route path={[P.paris, P.warsaw]} progress={ramp(t, 36.5, 37.8)} color={COLORS.white} bend={0.1} opacity={1 - ramp(t, 38.0, 38.5)} />
            <Route path={[P.warsaw, P.london]} progress={ramp(t, 38.5, 42.6, (x) => x)} color={COLORS.gold} bend={0.12} />
            <Route path={[P.warsaw, P.paris]} progress={ramp(t, 38.5, 42.6, (x) => x)} color={COLORS.gold} bend={-0.1} />
            <Pin at={P.london} label="London" pulse={t > 44 && t < 44.9 ? (t - 44) / 0.9 : 0} show={window_(t, 35.9, 45.4)} />
            <Pin at={P.paris} label="Paris" show={window_(t, 36.4, 45.4)} />
            <Pin at={P.warsaw} label="Warsaw" show={window_(t, 35.9, 45.4)} />
            <Route path={[P.warsaw, P.chernivtsi, P.bucharest, P.paris]} progress={ramp(t, 48.8, 52.0, (x) => x)} bend={0.08} />
            <Pin at={P.warsaw} label="Warsaw" show={window_(t, 48.7, 53.0)} />
            <Pin at={P.bucharest} label="Romania" show={window_(t, 49.6, 53.0)} />
            <Pin at={P.paris} label="France" show={window_(t, 50.5, 53.0)} />
          </WorldMap>
          {/* Copies of Enigma handed over */}
          <Panel src={A('enigma')} t={t} t0={41.7} show={window_(t, 41.7, 45.2)} w={640} h={430} y={640} glow={COLORS.gold} zoomFrom={1} zoomTo={1.06} focus="50% 50%" />
        </AbsoluteFill>
      )}

      <AbsoluteFill style={{transform: `translate(${sx}px, ${sy}px)`}}>
        {/* Invasion: red map + photo */}
        {s.invasion > 0 && (
          <AbsoluteFill style={{opacity: s.invasion}}>
            <WorldMap cam={cameraAt(CAMERA, t)} borders={BORDERS}>
              <Country f={POLAND} draw={ramp(t, 46.5, 47.2)} fill={1} color={COLORS.red} hatch="red" />
              <Arrow from={[15.2, 54.2]} to={[18.4, 53.1]} progress={ramp(t, 46.66, 47.6)} />
              <Arrow from={[20.6, 54.6]} to={[20.9, 52.75]} progress={ramp(t, 46.8, 47.7)} />
              <Arrow from={[16.2, 50.6]} to={[19.4, 51.5]} progress={ramp(t, 46.9, 47.8)} />
              <Arrow from={[19.9, 48.9]} to={[20.8, 50.4]} progress={ramp(t, 47.0, 47.9)} />
            </WorldMap>
            <Panel src={A('invasion')} t={t} t0={45.4} show={ramp(t, 45.45, 45.8)} w={900} h={600} y={600} gray={1} tint="rgba(255,60,60,0.35)" zoomFrom={1.02} zoomTo={1.15} focus="50% 50%" />
          </AbsoluteFill>
        )}

        {/* Bletchley Park, the Bombe, Turing */}
        <Panel src={A('bletchley')} t={t} t0={53.0} show={s.bletchley} w={900} h={1100} focus="40% 50%" zoomFrom={1.15} zoomTo={1.3} />
        <NameTag text="BLETCHLEY PARK" show={s.bletchley} y={1450} />
        <Panel src={A('bombe')} t={t} t0={55.5} show={s.bombe} w={900} h={1100} focus="50% 50%" zoomFrom={1.1} zoomTo={1.3} />
        <Panel src={A('turing')} t={t} t0={59.45} show={s.turing2} gray={1} glow={COLORS.gold} />

        {/* Rejewski kept out */}
        <Panel src={A('rejewski')} t={t} t0={61.0} show={s.kept} gray={1} />
        <Doors close={ramp(t, 62.6, 63.4)} y={350} h={1020} />

        {/* Office clerk, silent */}
        <Panel src={A('rejewski')} t={t} t0={64.0} show={s.clerk} gray={1} tint={`rgba(0,0,0,${0.15 + 0.5 * ramp(t, 66, 68.6)})`} zoomFrom={1.0} zoomTo={1.12} />

        {/* End: the lamps spell his name, his photo returns */}
        {s.end > 0 && (
          <>
            <Panel src={A('rejewski')} t={t} t0={69.4} show={s.end} w={560} h={700} y={600} gray={1 - ramp(t, 71.0, 73.4)} glow={t > 71 ? COLORS.gold : undefined} />
            <EnigmaMachine t={t} show={s.end} rotors={3} spin={1} lit={endLamp} y={1290} scale={0.62} />
            <NameTag text={NAME.slice(0, litName)} show={litName > 0 ? 1 : 0} y={995} color={COLORS.gold} />
          </>
        )}
      </AbsoluteFill>

      <Vignette />
      <Flash t={t} at={2.6} color={COLORS.red} strength={0.3} />
      <Flash t={t} at={18.3} strength={0.6} />
      <Flash t={t} at={46.66} color={COLORS.red} strength={0.35} />
      <Grain frame={frame} />

      <Audio src={staticFile('enigma/vo.wav')} />
    </AbsoluteFill>
  );
};
