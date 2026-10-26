import {Composition} from 'remotion';
import {Enigma, DURATION} from './shorts/enigma/Enigma';
import {EnigmaDoc} from './shorts/enigma/EnigmaDoc';
import {EnigmaPaper} from './shorts/enigma/EnigmaPaper';
import {Chernobyl, DURATION as CHERNOBYL_DURATION} from './shorts/chernobyl/Chernobyl';
import {ChernobylCut, DURATION as CUT_DURATION} from './shorts/chernobyl/ChernobylCut';
import {HorizonCut} from './shorts/horizon/HorizonCut';
import {HorizonPaper, DURATION as HORIZON_DURATION} from './shorts/horizon/HorizonPaper';

export const Root: React.FC = () => (
  <>
    <Composition id="Enigma" component={Enigma} width={1080} height={1920} fps={30} durationInFrames={Math.round(DURATION * 30)} />
    <Composition id="EnigmaDoc" component={EnigmaDoc} width={1080} height={1920} fps={30} durationInFrames={Math.round(DURATION * 30)} />
    <Composition id="EnigmaPaper" component={EnigmaPaper} width={1080} height={1920} fps={30} durationInFrames={Math.round(DURATION * 30)} />
    <Composition id="EnigmaPaperMap" component={Enigma} defaultProps={{theme: 'paper' as const}} width={1080} height={1920} fps={30} durationInFrames={Math.round(DURATION * 30)} />
    <Composition id="Chernobyl" component={Chernobyl} width={1080} height={1920} fps={30} durationInFrames={Math.round(CHERNOBYL_DURATION * 30)} />
    <Composition id="ChernobylCut" component={ChernobylCut} width={1080} height={1920} fps={30} durationInFrames={Math.round(CUT_DURATION * 30)} />
    <Composition id="ChernobylCase" component={ChernobylCut} defaultProps={{framed: true}} width={1080} height={1920} fps={30} durationInFrames={Math.round(CUT_DURATION * 30)} />
    <Composition id="HorizonPaper" component={HorizonPaper} width={1080} height={1920} fps={30} durationInFrames={Math.round(HORIZON_DURATION * 30)} />
    <Composition id="HorizonCut" component={HorizonCut} width={1080} height={1920} fps={30} durationInFrames={Math.round(HORIZON_DURATION * 30)} />
  </>
);
