import {Config} from '@remotion/cli/config';

Config.setVideoImageFormat('jpeg');
Config.setJpegQuality(92);
// AUDIO_ONLY=1 renders just the soundtrack (e.g. to remix SFX without re-rendering frames).
if (!process.env.AUDIO_ONLY) {
  Config.setCodec('h264');
  Config.setCrf(18);
}
// Cloud container: use the preinstalled Chromium instead of downloading one.
if (process.env.REMOTION_CHROME) {
  Config.setBrowserExecutable(process.env.REMOTION_CHROME);
}
