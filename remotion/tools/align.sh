#!/usr/bin/env bash
# Prints speech segments (start/end in seconds) of a voiceover so the
# `start`/`end` values in timeline.ts can be matched to the recording.
# Usage: tools/align.sh public/ain-jalut/vo.wav [noise_dB] [min_silence_s]
set -euo pipefail
in="$1"; noise="${2:--35dB}"; min="${3:-0.35}"
ffmpeg -hide_banner -nostats -i "$in" -af "silencedetect=noise=${noise}:d=${min}" -f null - 2>&1 |
  awk -v total="$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$in")" '
    /silence_start/ {s=$NF; if (s > prev + 0.05) printf "segment %2d  %6.2f -> %6.2f\n", ++n, prev, s}
    /silence_end/   {split($0, a, "silence_end: "); split(a[2], b, " "); prev=b[1]}
    END {if (total > prev + 0.05) printf "segment %2d  %6.2f -> %6.2f\n", ++n, prev, total}
  ' prev=0
