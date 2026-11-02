#!/usr/bin/env bash
# Render one time range as an approval chunk.
#   bash video/segment.sh 0 60 minute01
# Renders seconds [start,end) with narration, into out/segments/.
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
START="${1:-0}"; END="${2:-60}"; NAME="${3:-segment}"
WORKERS="${WORKERS:-3}"; CRF="${CRF:-18}"
SEG="$ROOT/out/segments"; TMP="$ROOT/build/seg_$NAME"
mkdir -p "$SEG" "$TMP"

FPS=$(python3 -c "import json;print(json.load(open('$ROOT/build/timing.json'))['fps'])")
F0=$(python3 -c "print(int($START*$FPS))")
F1=$(python3 -c "print(int($END*$FPS)-1)")
N=$((F1-F0+1))
echo "=== $NAME: ${START}s..${END}s  (frames $F0..$F1, $N frames) across $WORKERS workers ==="

PER=$(( (N + WORKERS - 1) / WORKERS )); pids=(); chunks=()
for ((i=0;i<WORKERS;i++)); do
  a=$(( F0 + i*PER )); b=$(( a + PER - 1 )); (( b > F1 )) && b=$F1
  (( a > F1 )) && continue
  CH="$TMP/c$(printf '%02d' $i).mp4"; chunks+=("$CH")
  node "$ROOT/video/render.js" --from "$a" --to "$b" --out "$CH" --crf "$CRF" > "$TMP/w$i.log" 2>&1 &
  pids+=($!)
done
fail=0; for p in "${pids[@]}"; do wait "$p" || fail=1; done
(( fail )) && { echo "worker failed:"; tail -n 15 "$TMP"/w*.log; exit 1; }

: > "$TMP/list.txt"; for c in "${chunks[@]}"; do echo "file '$c'" >> "$TMP/list.txt"; done
ffmpeg -hide_banner -loglevel error -y -f concat -safe 0 -i "$TMP/list.txt" -c copy "$TMP/video.mp4"

# matching slice of narration
ffmpeg -hide_banner -loglevel error -y -ss "$START" -to "$END" -i "$ROOT/build/narration.wav" \
  -af "loudnorm=I=-14:TP=-1.5:LRA=11,aresample=48000" -c:a aac -b:a 192k -ac 2 "$TMP/audio.m4a"
ffmpeg -hide_banner -loglevel error -y -i "$TMP/video.mp4" -i "$TMP/audio.m4a" \
  -map 0:v -map 1:a -c:v copy -c:a copy -shortest -movflags +faststart "$SEG/${NAME}.mp4"

d=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$SEG/${NAME}.mp4")
echo "-> $SEG/${NAME}.mp4  ($(python3 -c "print(f'{float('$d'):.1f}s')"), $(du -h "$SEG/${NAME}.mp4" | cut -f1))"
