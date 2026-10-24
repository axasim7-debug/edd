import {Composition} from 'remotion';
import {Enigma, DURATION} from './shorts/enigma/Enigma';
import {EnigmaDoc} from './shorts/enigma/EnigmaDoc';
import {EnigmaPaper} from './shorts/enigma/EnigmaPaper';

export const Root: React.FC = () => (
  <>
    <Composition id="Enigma" component={Enigma} width={1080} height={1920} fps={30} durationInFrames={Math.round(DURATION * 30)} />
    <Composition id="EnigmaDoc" component={EnigmaDoc} width={1080} height={1920} fps={30} durationInFrames={Math.round(DURATION * 30)} />
    <Composition id="EnigmaPaper" component={EnigmaPaper} width={1080} height={1920} fps={30} durationInFrames={Math.round(DURATION * 30)} />
    <Composition id="EnigmaPaperMap" component={Enigma} defaultProps={{theme: 'paper' as const}} width={1080} height={1920} fps={30} durationInFrames={Math.round(DURATION * 30)} />
  </>
);
