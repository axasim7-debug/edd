import {Composition} from 'remotion';
import {Enigma, DURATION} from './shorts/enigma/Enigma';
import {EnigmaDoc} from './shorts/enigma/EnigmaDoc';
import {EnigmaPaper} from './shorts/enigma/EnigmaPaper';
import {Chernobyl, DURATION as CHERNOBYL_DURATION} from './shorts/chernobyl/Chernobyl';
import {ChernobylCut, DURATION as CUT_DURATION} from './shorts/chernobyl/ChernobylCut';
import {HorizonCut} from './shorts/horizon/HorizonCut';
import {HorizonDoc} from './shorts/horizon/HorizonDoc';
import {HorizonAnimatic} from './shorts/horizon/HorizonAnimatic';
import {HorizonMath} from './shorts/horizon/HorizonMath';
import {HorizonFlat} from './shorts/horizon/HorizonFlat';
import {HorizonCinema, HorizonHybrid} from './shorts/horizon/HorizonCinema';
import {HorizonViral} from './shorts/horizon/HorizonViral';
import {HorizonPro} from './shorts/horizon/HorizonPro';
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
    <Composition id="HorizonDoc" component={HorizonDoc} width={1080} height={1920} fps={30} durationInFrames={Math.round(HORIZON_DURATION * 30)} />
    <Composition id="HorizonAnimatic" component={HorizonAnimatic} width={1080} height={1920} fps={30} durationInFrames={Math.round(HORIZON_DURATION * 30)} />
    <Composition id="HorizonMath" component={HorizonMath} width={1080} height={1920} fps={30} durationInFrames={Math.round(HORIZON_DURATION * 30)} />
    <Composition id="HorizonFlat" component={HorizonFlat} width={1080} height={1920} fps={30} durationInFrames={Math.round(HORIZON_DURATION * 30)} />
    <Composition id="HorizonCinema" component={HorizonCinema} width={1080} height={1920} fps={30} durationInFrames={Math.round(HORIZON_DURATION * 30)} />
    <Composition id="HorizonHybrid" component={HorizonHybrid} width={1080} height={1920} fps={30} durationInFrames={Math.round(HORIZON_DURATION * 30)} />
    <Composition id="HorizonViral" component={HorizonViral} width={1080} height={1920} fps={30} durationInFrames={Math.round(HORIZON_DURATION * 30)} />
    <Composition id="HorizonPro" component={HorizonPro} width={1080} height={1920} fps={30} durationInFrames={Math.round(HORIZON_DURATION * 30)} />
  </>
);
