import {Composition} from 'remotion';
import {Enigma, DURATION} from './shorts/enigma/Enigma';

export const Root: React.FC = () => (
  <Composition id="Enigma" component={Enigma} width={1080} height={1920} fps={30} durationInFrames={Math.round(DURATION * 30)} />
);
