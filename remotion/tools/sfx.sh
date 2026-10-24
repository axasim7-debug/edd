#!/usr/bin/env bash
# Tactile SFX library, fully synthesised with ffmpeg (no third-party audio,
# no licensing questions). Usage: tools/sfx.sh public/sfx
set -euo pipefail
out="${1:-public/sfx}"
mkdir -p "$out"
gen() { ffmpeg -v error -y "$@"; }
# Paper sliding over paper: band-passed pink noise, soft attack, two variants.
gen -f lavfi -i "anoisesrc=d=0.45:c=pink:a=0.9:s=11" -af "highpass=f=900,lowpass=f=6500,afade=t=in:d=0.08,afade=t=out:st=0.12:d=0.33:curve=exp,volume=0.9" -ar 48000 -ac 2 "$out/paper1.wav"
gen -f lavfi -i "anoisesrc=d=0.6:c=pink:a=0.9:s=23" -af "highpass=f=600,lowpass=f=5000,afade=t=in:d=0.15,afade=t=out:st=0.2:d=0.4:curve=exp,volume=0.8" -ar 48000 -ac 2 "$out/paper2.wav"
# Paper landing on a surface: short dull tap.
gen -f lavfi -i "anoisesrc=d=0.12:c=brown:a=1:s=5" -af "lowpass=f=1800,afade=t=out:d=0.12:curve=exp,volume=1.6" -ar 48000 -ac 2 "$out/tap.wav"
# Metal pin pushed into cork: click + tiny metallic ring.
gen -f lavfi -i "anoisesrc=d=0.03:c=white:a=1:s=9" -f lavfi -i "sine=f=3400:d=0.18" -filter_complex "[0]highpass=f=2500,volume=0.8[a];[1]afade=t=out:d=0.18:curve=exp,volume=0.18[b];[a][b]amix=inputs=2:normalize=0" -ar 48000 -ac 2 "$out/pin.wav"
# Typewriter key: sharp transient + body thump.
gen -f lavfi -i "anoisesrc=d=0.025:c=white:a=1:s=3" -f lavfi -i "sine=f=180:d=0.06" -filter_complex "[0]highpass=f=1800,volume=0.9[a];[1]afade=t=out:d=0.06,volume=0.5[b];[a][b]amix=inputs=2:normalize=0" -ar 48000 -ac 2 "$out/key.wav"
# Rotor ratchet: three quick mechanical clicks.
gen -f lavfi -i "anoisesrc=d=0.02:c=white:a=1:s=7" -af "highpass=f=1200,volume=0.8,apad=pad_dur=0.06,aloop=loop=2:size=3840" -ar 48000 -ac 2 "$out/ratchet.wav"
# Rubber stamp: thud with a papery slap.
gen -f lavfi -i "sine=f=95:d=0.25" -f lavfi -i "anoisesrc=d=0.08:c=pink:a=1:s=13" -filter_complex "[0]afade=t=out:d=0.25:curve=exp,volume=1.2[a];[1]lowpass=f=3000,afade=t=out:d=0.08,volume=0.8[b];[a][b]amix=inputs=2:normalize=0" -ar 48000 -ac 2 "$out/stamp.wav"
# Low impact for real revelations only.
gen -f lavfi -i "sine=f=46:d=1.6" -f lavfi -i "anoisesrc=d=0.2:c=brown:a=0.8:s=17" -filter_complex "[0]afade=t=out:st=0.04:d=1.5:curve=exp,volume=1.8[a];[1]lowpass=f=900,afade=t=out:d=0.2,volume=0.7[b];[a][b]amix=inputs=2:normalize=0" -ar 48000 -ac 2 "$out/impact.wav"
# String pulled taut / drawn: soft rising friction.
gen -f lavfi -i "anoisesrc=d=0.5:c=pink:a=0.7:s=29" -af "bandpass=f=2200:w=1400,afade=t=in:d=0.35:curve=exp,afade=t=out:st=0.35:d=0.15,volume=0.7" -ar 48000 -ac 2 "$out/string.wav"
# Subtle air move for camera travel.
gen -f lavfi -i "anoisesrc=d=0.8:c=pink:a=0.6:s=31" -af "highpass=f=300,lowpass=f=3500,afade=t=in:d=0.4:curve=exp,afade=t=out:st=0.4:d=0.4:curve=exp,volume=0.6" -ar 48000 -ac 2 "$out/air.wav"
# Heavy door / panel closing.
gen -f lavfi -i "sine=f=70:d=0.9" -f lavfi -i "anoisesrc=d=0.3:c=brown:a=1:s=41" -filter_complex "[0]afade=t=out:d=0.9:curve=exp,volume=1.4[a];[1]lowpass=f=1200,afade=t=out:d=0.3,volume=1[b];[a][b]amix=inputs=2:normalize=0" -ar 48000 -ac 2 "$out/door.wav"
ls "$out"
# Soft pen on paper: gentle band-passed noise with slow stroke modulation.
# Replaces typewriter keys (the owner found them harsh and loud).
gen -f lavfi -i "anoisesrc=d=1.3:c=pink:a=0.6:s=53" -af "bandpass=f=3200:w=2600,tremolo=f=7:d=0.55,afade=t=in:d=0.25,afade=t=out:st=0.8:d=0.5,lowpass=f=6000,volume=0.55" -ar 48000 -ac 2 "$out/ink.wav"
