import {Audio, Sequence, staticFile, useVideoConfig} from 'remotion';

export type SfxName = 'paper1' | 'paper2' | 'tap' | 'pin' | 'key' | 'ratchet' | 'stamp' | 'impact' | 'string' | 'air' | 'door';
export type Cue = [t: number, name: SfxName, volume?: number];

const LENGTH: Record<SfxName, number> = {
  paper1: 0.5, paper2: 0.7, tap: 0.2, pin: 0.25, key: 0.1, ratchet: 0.3, stamp: 0.3, impact: 1.7, string: 0.55, air: 0.85, door: 1.0,
};

// Places one-shot effects on exact seconds. Volumes are deliberately low:
// the narration always wins.
// Master gain kept low after review: effects must sit well under the voice.
export const SfxTrack: React.FC<{cues: Cue[]; gain?: number}> = ({cues, gain = 0.4}) => {
  const {fps} = useVideoConfig();
  return (
    <>
      {cues.map(([t, name, v = 0.5], i) => (
        <Sequence key={i} from={Math.max(0, Math.round(t * fps))} durationInFrames={Math.ceil(LENGTH[name] * fps) + 2} layout="none">
          <Audio src={staticFile(`sfx/${name}.wav`)} volume={v * gain} />
        </Sequence>
      ))}
    </>
  );
};

// A run of typewriter keys, e.g. while a label types itself.
export const typing = (from: number, chars: number, rate = 14, v = 0.35): Cue[] =>
  Array.from({length: chars}, (_, i) => [from + i / rate, 'key', v * (0.8 + 0.4 * ((i * 37) % 10) / 10)] as Cue);
