import {Composition} from 'remotion';
import {AinJalut} from './shorts/ain-jalut/AinJalut';
import {FPS, TOTAL_SECONDS} from './shorts/ain-jalut/timeline';

export const Root: React.FC = () => (
  <Composition
    id="AinJalut"
    component={AinJalut}
    width={1080}
    height={1920}
    fps={FPS}
    durationInFrames={Math.round(TOTAL_SECONDS * FPS)}
  />
);
