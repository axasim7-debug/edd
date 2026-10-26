// The diagram timeline (camera + ink layers), shared by the paper and the
// cinematic versions. Every time comes from words.json.
import {ramp, window_} from '../../lib/map';
import type {BoardKey} from '../../lib/paper';
import {Astronaut, Cross, Envelope, Flash, Gap, Gas, Hole, Pulses, R, Ray, Stars, Wall, type Theme} from './diagram';

export const DURATION = 61.7;

export const CAMERA: BoardKey[] = [
  {t: 0, x: 0, y: -205, z: 2.6},
  {t: 4.2, x: 0, y: -215, z: 2.3},
  {t: 5.8, x: 0, y: -225, z: 2.2},
  {t: 7.7, x: 0, y: -215, z: 2.4},
  {t: 8.7, x: 0, y: 0, z: 0.5},
  {t: 12.6, x: 0, y: 0, z: 0.47},
  {t: 13.5, x: 0, y: -60, z: 1},
  {t: 19.4, x: 0, y: -60, z: 1.05},
  {t: 20.4, x: 0, y: -192, z: 3},
  {t: 25.9, x: 0, y: -192, z: 3.2},
  {t: 26.9, x: 30, y: -160, z: 1.7},
  {t: 30.2, x: 30, y: -160, z: 1.8},
  {t: 31.1, x: 0, y: -290, z: 1.35},
  {t: 34.3, x: 0, y: -290, z: 1.4},
  {t: 35.2, x: 0, y: -400, z: 1},
  {t: 37.6, x: 0, y: -400, z: 1.05},
  {t: 38.4, x: 0, y: -200, z: 2.4},
  {t: 41.7, x: 0, y: -200, z: 2.5},
  {t: 42.6, x: 0, y: -300, z: 0.8},
  {t: 44.4, x: 0, y: -300, z: 0.85},
  {t: 45.2, x: 0, y: -170, z: 1.7},
  {t: 51.6, x: 0, y: -170, z: 1.8},
  {t: 52.4, x: 30, y: -160, z: 1.7},
  {t: 54.0, x: 30, y: -160, z: 1.75},
  {t: 55.0, x: 0, y: -40, z: 1},
  {t: 60.4, x: 0, y: 0, z: 7},
  {t: DURATION, x: 0, y: 0, z: 7.5},
];

export const AST = {x: 0, out: -262, in: -186};

export const Scene: React.FC<{t: number; th: Theme}> = ({t, th}) => {
  // The astronaut drifts in and crosses the horizon on "عديت" (3.1 s).
  const astY = t < 3.4 ? AST.out + (AST.in - AST.out) * ramp(t, 0, 3.4, (k) => k) : AST.in;
  const astShow = (1 - ramp(t, 54.4, 55.0)) * (1 - window_(t, 30.5, 34.4, 0.3));
  const inBounds = (a: number, b: number) => window_(t, a, b, 0.3);
  return (
    <>
        <Stars show={1} />
        <Gas show={inBounds(10.46, 12.9)} />
        <Wall show={inBounds(15.8, 19.4)} />
        <Hole key_={inBounds(13.0, 15.5) + inBounds(47.5, 51.6)} draw={t > 12.7 && t < 14.5 ? ramp(t, 12.74, 14.2, (k) => k) : 1} />
        <Cross x={0} y={-R - 16} s={60} progress={ramp(t, 16.4, 16.9) * (1 - ramp(t, 19.2, 19.4))} />

        {/* hook: light still arrives from outside; going back is impossible */}
        {[[-150, -430], [150, -440], [-20, -480]].map(([x, y], i) => (
          <Ray key={i} a={[x, y]} b={[AST.x + x * 0.08, AST.in - 45]} progress={ramp(t, 4.4 + i * 0.15, 5.3 + i * 0.15, (k) => k) * (1 - ramp(t, 7.6, 7.9))} width={3} />
        ))}
        <Ray a={[18, AST.in - 40]} b={[60, -320]} progress={ramp(t, 6.14, 6.9, (k) => k) * (1 - ramp(t, 7.6, 7.9))} dashed color={th.key} />
        <Cross x={42} y={-285} s={34} progress={ramp(t, 7.02, 7.3) * (1 - ramp(t, 7.6, 7.9))} />

        <Gap x={60} y0={-R} y1={AST.in} show={inBounds(20.4, 25.9)} />

        {/* light sent outward from inside turns back (25.94–30.4, again 51.8–54.1) */}
        <Ray a={[14, AST.in - 30]} c={[90, -228]} b={[150, -70]} progress={ramp(t, 28.0, 29.74, (k) => k) * (1 - ramp(t, 30.2, 30.5)) + ramp(t, 52.2, 53.3, (k) => k) * (1 - ramp(t, 54.0, 54.3))} color={th.key} width={4} />

        {/* river model: light spreads from four points; inside the horizon all of it falls in */}
        {[2.4, 1.6, 1.0, 0.72].map((k, i) => (
          <Flash key={k} r={R * k} size={80 * ramp(t, 30.7 + i * 0.8, 31.5 + i * 0.8)} show={inBounds(30.6 + i * 0.8, 34.3)} />
        ))}

        {/* the outside world still shines in */}
        {[[-300, -720], [260, -690], [-40, -780]].map(([x, y], i) => (
          <Ray key={i} a={[x, y]} b={[AST.x + x * 0.06, AST.in - 48]} progress={ramp(t, 36.6 + i * 0.2, 37.5 + i * 0.2, (k) => k) * (1 - ramp(t, 37.9, 38.2))} width={3} />
        ))}

        {/* a message cannot get out */}
        <Envelope x={34} y={t < 38.4 ? AST.in : AST.in - 8 - 0 * ramp(t, 38.6, 39.6)} s={1.1} show={inBounds(38.5, 41.7)} />
        <Ray a={[34, AST.in - 22]} b={[34, -R + 3]} progress={ramp(t, 38.9, 39.6, (k) => k) * (1 - ramp(t, 41.5, 41.7))} dashed head={false} />
        <Cross x={34} y={AST.in - 6} s={30} progress={ramp(t, 40.32, 40.6) * (1 - ramp(t, 41.5, 41.7))} />

        <Pulses y={-170} t={t} from={45.32} show={inBounds(45.2, 51.7)} every={0.75} c={45} />

        <Astronaut x={AST.x} y={t > 44.9 && t < 51.8 ? -170 : astY} s={1.25} rot={34 + t * 7} show={astShow} />
    </>
  );
};
