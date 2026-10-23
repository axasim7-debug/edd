#!/usr/bin/env bash
# Two-pass loudness normalisation to YouTube level (-14 LUFS), video stream copied.
# Usage: tools/master.sh out/enigma.mp4 out/enigma-final.mp4
set -euo pipefail
in="$1"; out="$2"
m=$(ffmpeg -nostats -i "$in" -af loudnorm=I=-14:TP=-1.5:LRA=7:print_format=json -f null - 2>&1 | sed -n '/^{/,/^}/p' |
  python3 -c "import json,sys;d=json.load(sys.stdin);print(f\"measured_I={d['input_i']}:measured_TP={d['input_tp']}:measured_LRA={d['input_lra']}:measured_thresh={d['input_thresh']}:offset={d['target_offset']}\")")
ffmpeg -v error -y -i "$in" -c:v copy -af "loudnorm=I=-14:TP=-1.5:LRA=7:$m:linear=true" -c:a aac -b:a 256k -ar 48000 "$out"
