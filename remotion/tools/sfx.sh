#!/usr/bin/env bash
# Synthesises the sound bed (no third-party audio, no licensing issues).
set -euo pipefail
out="${1:-public/enigma/sfx}"; dur="${2:-75}"
mkdir -p "$out"
# Low cinematic drone: detuned sines + filtered noise, slow swell.
ffmpeg -v error -y -f lavfi -i "sine=f=55:d=$dur" -f lavfi -i "sine=f=82.4:d=$dur" -f lavfi -i "sine=f=110.6:d=$dur" -f lavfi -i "anoisesrc=d=$dur:c=brown:a=0.4" \
  -filter_complex "[0]volume=0.5[a];[1]volume=0.3[b];[2]volume=0.12,tremolo=f=0.15:d=0.6[c];[3]lowpass=f=300,volume=0.35[d];[a][b][c][d]amix=inputs=4:normalize=0,lowpass=f=900,volume=1.6" -ar 48000 -ac 2 "$out/drone.wav"
# Whoosh: band-passed noise sweeping up then down.
ffmpeg -v error -y -f lavfi -i "anoisesrc=d=0.9:c=pink:a=0.9" \
  -af "highpass=f=400,lowpass=f=5000,afade=t=in:d=0.45:curve=exp,afade=t=out:st=0.45:d=0.45:curve=exp,volume=1.4" -ar 48000 -ac 2 "$out/whoosh.wav"
# Hit: sub boom with a noise transient and a long tail.
ffmpeg -v error -y -f lavfi -i "sine=f=48:d=1.8" -f lavfi -i "anoisesrc=d=0.25:c=white:a=0.8" \
  -filter_complex "[0]afade=t=out:st=0.05:d=1.7:curve=exp,volume=2.2[a];[1]lowpass=f=2500,afade=t=out:d=0.25,volume=0.6[b];[a][b]amix=inputs=2:normalize=0,aecho=0.6:0.5:120:0.3" -ar 48000 -ac 2 "$out/hit.wav"
ls -la "$out"
