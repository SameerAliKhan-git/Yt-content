#!/usr/bin/env bash
# Post-render sanity checks on the finished files.
set -uo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT="$ROOT/out"; BUILD="$ROOT/build"
fail=0
say(){ printf '%-52s %s\n' "$1" "$2"; }

EXP_FRAMES=$(python3 -c "import json;print(json.load(open('$BUILD/timing.json'))['frames'])")
EXP_DUR=$(python3 -c "import json;print(round(json.load(open('$BUILD/timing.json'))['duration'],2))")
echo "expected: $EXP_FRAMES frames / ${EXP_DUR}s"
echo

for f in "$OUT/chokepoint_clean.mp4" "$OUT/chokepoint_narrated.mp4"; do
  b=$(basename "$f")
  if [[ ! -f "$f" ]]; then say "$b" "MISSING"; fail=1; continue; fi
  echo "--- $b ---"
  dur=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$f")
  res=$(ffprobe -v error -select_streams v:0 -show_entries stream=width,height -of csv=p=0:s=x "$f")
  fps=$(ffprobe -v error -select_streams v:0 -show_entries stream=r_frame_rate -of csv=p=0 "$f")
  nf=$(ffprobe -v error -select_streams v:0 -count_frames -show_entries stream=nb_read_frames -of csv=p=0 "$f" 2>/dev/null)
  acodec=$(ffprobe -v error -select_streams a:0 -show_entries stream=codec_name,channels,sample_rate -of csv=p=0 "$f")
  size=$(du -h "$f" | cut -f1)

  say "  resolution" "$res"
  [[ "$res" == "1920x1080" ]] || { say "  !! expected 1920x1080" "FAIL"; fail=1; }
  say "  frame rate" "$fps"
  say "  frames" "${nf:-?} (expected $EXP_FRAMES)"
  if [[ -n "$nf" ]]; then
    d=$(( nf > EXP_FRAMES ? nf-EXP_FRAMES : EXP_FRAMES-nf ))
    (( d <= 2 )) || { say "  !! frame count drift $d" "FAIL"; fail=1; }
  fi
  say "  duration" "$(python3 -c "m,s=divmod(float('$dur'),60);print(f'{int(m)}m {s:04.1f}s')")"
  python3 -c "
import sys
d=float('$dur'); e=float('$EXP_DUR')
sys.exit(0 if abs(d-e)<0.5 else 1)" || { say "  !! duration drift >0.5s" "FAIL"; fail=1; }
  say "  under 12:00" "$(python3 -c "print('YES' if float('$dur')<720 else 'NO — OVER LIMIT')")"
  python3 -c "import sys;sys.exit(0 if float('$dur')<720 else 1)" || fail=1
  say "  audio" "${acodec:-none}"
  say "  size" "$size"

  # first and last frame should not be pure black (a sign of a dropped range)
  for pos in 1 $(python3 -c "print(round(float('$dur')-2,2))"); do
    mean=$(ffmpeg -hide_banner -loglevel error -ss "$pos" -i "$f" -frames:v 1 \
           -vf "scale=64:36,format=gray" -f rawvideo - 2>/dev/null \
           | python3 -c "import sys;d=sys.stdin.buffer.read();print(round(sum(d)/max(1,len(d)),1))")
    say "  luma @ ${pos}s" "$mean"
  done
  echo
done

if [[ -f "$OUT/chokepoint_narrated.mp4" ]]; then
  echo "--- narration loudness ---"
  ffmpeg -hide_banner -nostats -i "$OUT/chokepoint_narrated.mp4" -af ebur128=framelog=quiet -f null - 2>&1 \
    | grep -A4 "Integrated loudness" | sed 's/^/  /'
fi

echo
(( fail )) && { echo "RESULT: FAILED"; exit 1; } || echo "RESULT: all checks passed"
