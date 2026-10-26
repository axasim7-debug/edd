// Short #5 — "Crossing the event horizon" (Arabic voiceover). Paper style:
// the map is replaced by an ink diagram of the black hole on paper; real prints
// (EHT image of M87*, Einstein, Schwarzschild) in the card band. Every cue time
// comes from words.json.
import {AbsoluteFill, Audio, staticFile} from 'remotion';
import {ramp, useSeconds, window_} from '../../lib/map';
import {boardCamAt, INK, Lighting, Paper, Print, TYPE} from '../../lib/paper';
import {ArNote, ArStamp, ArTyped, NASKH} from '../../lib/arabic';
import {SfxTrack, type Cue} from '../../lib/sfx';
import {Diagram, PAPER_THEME} from './diagram';
import {CAMERA, Scene} from './scene';

export {DURATION} from './scene';

const Headline: React.FC<{t: number}> = ({t}) => {
  const show = window_(t, -1, 4.0);
  if (show <= 0) return null;
  return (
    <Paper x={540} y={330} w={900} h={190} rotate={-1.2} show={show} from={[0, 0]} depth={0}>
      <div style={{position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
        <ArTyped text="عدّيت… ومحسّتش؟" progress={1} size={100} />
      </div>
    </Paper>
  );
};

const Label: React.FC<{t: number; a: number; b: number; ar: string; en: string; x?: number; y?: number; w?: number; rot?: number}> = ({t, a, b, ar, en, x = 540, y = 600, w = 640, rot = -1.2}) => {
  const show = window_(t, a, b, 0.3);
  if (show <= 0) return null;
  return (
    <Paper x={x} y={y} w={w} h={170} rotate={rot} show={show} from={[0, -60]} depth={0}>
      <div style={{position: 'absolute', left: 0, right: 0, top: 18, display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
        <ArTyped text={ar} progress={ramp(t, a + 0.15, a + 0.9, (k) => k)} size={64} />
        <div style={{fontFamily: TYPE, fontSize: 26, letterSpacing: 4, color: INK.gray, opacity: ramp(t, a + 0.6, a + 1.0)}}>{en}</div>
      </div>
    </Paper>
  );
};

const Caption: React.FC<{text: string; x: number; y: number; show: number; w?: number}> = ({text, x, y, show, w = 380}) =>
  show > 0 ? (
    <Paper x={x} y={y} w={w} h={74} rotate={1} show={show} from={[0, 40]} depth={0}>
      <div style={{position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: /[\u0600-\u06FF]/.test(text) ? NASKH : TYPE, fontSize: /[\u0600-\u06FF]/.test(text) ? 36 : 26, color: INK.ink, letterSpacing: 2}}>{text}</div>
    </Paper>
  ) : null;

const Question: React.FC<{t: number}> = ({t}) => {
  const show = ramp(t, 54.2, 54.6);
  if (show <= 0) return null;
  return (
    <Paper x={540} y={640} w={940} h={300} rotate={-1} show={show} from={[0, -80]} depth={0}>
      <div style={{position: 'absolute', left: 0, right: 0, top: 40, display: 'flex', justifyContent: 'center'}}>
        <ArTyped text={'عشان تخرج من هنا…\nكم ضعف سرعة الضوء؟'} progress={ramp(t, 54.5, 56.6, (k) => k)} size={78} style={{textAlign: 'center'}} />
      </div>
    </Paper>
  );
};

const SFX: Cue[] = [
  [0.0, 'paper2', 0.3], [1.0, 'ink', 0.2],
  [4.4, 'air', 0.18],
  [6.2, 'ink', 0.18], [7.02, 'impact', 0.4], [7.04, 'stamp', 0.55],
  [7.9, 'air', 0.22], [8.7, 'paper1', 0.32], [8.9, 'ink', 0.18],
  [12.8, 'air', 0.18], [13.4, 'paper2', 0.3], [13.6, 'ink', 0.2], [15.8, 'ink', 0.16], [16.4, 'ink', 0.2],
  [19.7, 'air', 0.18],
  [24.38, 'paper1', 0.32], [24.6, 'paper2', 0.3], [24.8, 'ink', 0.16],
  [26.2, 'air', 0.15], [28.2, 'ink', 0.16], [29.74, 'impact', 0.42],
  [30.5, 'air', 0.18], [30.8, 'ink', 0.14], [33.54, 'ink', 0.18],
  [34.6, 'air', 0.18], [36.7, 'ink', 0.14],
  [37.9, 'air', 0.15], [40.32, 'impact', 0.45], [40.34, 'stamp', 0.55],
  [42.0, 'air', 0.18], [42.6, 'ink', 0.18],
  [45.0, 'air', 0.15],
  [49.64, 'paper2', 0.3], [49.9, 'ink', 0.18],
  [52.0, 'air', 0.15],
  [54.2, 'paper1', 0.32], [54.5, 'ink', 0.2], [56.12, 'impact', 0.4], [57.9, 'ink', 0.2],
  [60.3, 'ink', 0.2],
];

export const HorizonPaper: React.FC = () => {
  const t = useSeconds();

  return (
    <AbsoluteFill style={{backgroundColor: '#E8DDC5', backgroundImage: `url(${staticFile('paper/paper.jpg')})`, backgroundSize: '512px 512px'}}>
      <Diagram cam={boardCamAt(CAMERA, t)} theme={PAPER_THEME}>
        <Scene t={t} th={PAPER_THEME} />
      </Diagram>

      <Lighting />
      <Headline t={t} />
      {t > 0.9 && t < 4.1 && <ArNote text="أفق الحدث" x={960} y={1050} progress={ramp(t, 1.0, 2.0)} size={66} color={INK.ink} rotate={-2} />}
      <ArStamp text="مفيش رجوع" x={540} y={700} show={window_(t, 7.02, 8.2, 0.05) * ramp(t, 7.02, 7.2)} rotate={-7} size={92} />

      {/* how big */}
      <Print src="horizon/art/m87.jpg" x={540} y={640} w={560} h={400} rotate={-1.5} show={window_(t, 8.7, 12.7, 0.3)} focus="50% 50%" />
      <Caption text="M87* · 6.5 BILLION SUNS" x={560} y={860} w={520} show={window_(t, 9.0, 12.7, 0.3)} />
      {t > 10.9 && t < 12.8 && <ArNote text="غاز ساخن" x={320} y={1400} progress={ramp(t, 11.1, 11.9)} size={60} color={INK.ink} rotate={2} />}

      <Label t={t} a={13.4} b={19.5} ar="أفق الحدث" en="EVENT HORIZON" />

      {/* general relativity */}
      <Print src="horizon/art/einstein.jpg" x={300} y={680} w={360} h={470} rotate={-2} show={window_(t, 24.38, 29.9, 0.3)} focus="50% 25%" />
      <Print src="horizon/art/schwarzschild.jpg" x={740} y={680} w={340} h={440} rotate={2} show={window_(t, 24.6, 29.9, 0.3)} from={[0, 60]} focus="50% 25%" />
      <Caption text="EINSTEIN · 1915" x={300} y={930} w={330} show={window_(t, 24.8, 29.9, 0.3)} />
      <Caption text="SCHWARZSCHILD · 1916" x={740} y={920} w={380} show={window_(t, 25.0, 29.9, 0.3)} />

      <Caption text="رسم توضيحي" x={540} y={560} w={300} show={window_(t, 30.6, 34.3, 0.3)} />

      <ArStamp text="مستحيل" x={540} y={680} show={window_(t, 40.32, 41.7, 0.05) * ramp(t, 40.32, 40.5)} rotate={-8} size={110} />
      {t > 42.4 && t < 44.5 && <ArNote text="النجوم لسه قدامك" x={930} y={600} progress={ramp(t, 42.6, 43.7)} size={70} color={INK.ink} />}

      <Label t={t} a={49.64} b={51.8} ar="لا شيء أسرع من الضوء" en="c = 299,792 KM/S" w={760} />

      <Question t={t} />
      {t > 57.8 && <ArNote text="c × كم؟" x={720} y={1240} progress={ramp(t, 57.9, 58.8)} size={130} color={INK.ivory} rotate={-4} />}
      {t > 60.2 && <ArNote text="اشترك" x={640} y={1500} progress={ramp(t, 60.3, 61.0)} size={80} color={INK.beige} rotate={-3} />}

      <Audio src={staticFile('horizon/vo.wav')} />
      <SfxTrack cues={SFX} />
    </AbsoluteFill>
  );
};
