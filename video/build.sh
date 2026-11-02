#!/usr/bin/env bash
# Renders the film in parallel chunks, concatenates, and produces both the
# narrated cut and the silent plate. Frame timing comes from build/timing.json,
# so both outputs share identical timing.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BUILD="$ROOT/build"
OUT="$ROOT/out"
WORKERS="${WORKERS:-4}"
CRF="${CRF:-18}"
QUALITY="${QUALITY:-94}"

mkdir -p "$BUILD/chunks" "$OUT"

FRAMES=$(python3 -c "import json;print(json.load(open('$BUILD/timing.json'))['frames'])")
FPS=$(python3 -c "import json;print(json.load(open('$BUILD/timing.json'))['fps'])")
echo "=== rendering $FRAMES frames @ ${FPS}fps across $WORKERS workers ==="

PER=$(( (FRAMES + WORKERS - 1) / WORKERS ))
pids=(); chunks=()
for ((i=0;i<WORKERS;i++)); do
  FROM=$(( i * PER ))
  TO=$(( FROM + PER - 1 ))
  (( TO >= FRAMES )) && TO=$(( FRAMES - 1 ))
  (( FROM > TO )) && continue
  CH="$BUILD/chunks/chunk_$(printf '%02d' $i).mp4"
  chunks+=("$CH")
  echo "  worker $i: frames $FROM..$TO"
  node "$ROOT/video/render.js" --from "$FROM" --to "$TO" --out "$CH" \
       --crf "$CRF" --quality "$QUALITY" > "$BUILD/chunks/w$i.log" 2>&1 &
  pids+=($!)
done

fail=0
for p in "${pids[@]}"; do wait "$p" || fail=1; done
if (( fail )); then echo "!! a worker failed; logs in $BUILD/chunks/"; tail -n 20 "$BUILD"/chunks/w*.log; exit 1; fi
echo "=== all workers done ==="
grep -h "^chunk" "$BUILD"/chunks/w*.log || true

# concatenate the chunks losslessly
: > "$BUILD/chunks/list.txt"
for c in "${chunks[@]}"; do echo "file '$c'" >> "$BUILD/chunks/list.txt"; done
ffmpeg -hide_banner -loglevel error -y -f concat -safe 0 -i "$BUILD/chunks/list.txt" \
  -c copy -movflags +faststart "$OUT/chokepoint_clean.mp4"
echo "clean plate -> $OUT/chokepoint_clean.mp4"

# narrated cut: same video, normalised narration
ffmpeg -hide_banner -loglevel error -y \
  -i "$OUT/chokepoint_clean.mp4" -i "$BUILD/narration.wav" \
  -map 0:v -map 1:a \
  -c:v copy \
  -af "loudnorm=I=-14:TP=-1.5:LRA=11,aresample=48000" \
  -c:a aac -b:a 192k -ac 2 \
  -shortest -movflags +faststart "$OUT/chokepoint_narrated.mp4"
echo "narrated   -> $OUT/chokepoint_narrated.mp4"

for f in "$OUT/chokepoint_clean.mp4" "$OUT/chokepoint_narrated.mp4"; do
  d=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$f")
  s=$(du -h "$f" | cut -f1)
  python3 -c "
m,sec=divmod(float('$d'),60); print(f'  {\"$f\".split(\"/\")[-1]:<28} {int(m)}m {sec:04.1f}s   $s')"
done
