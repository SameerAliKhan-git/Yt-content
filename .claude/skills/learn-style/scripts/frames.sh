#!/usr/bin/env bash
# Pull frames for measurement:
#   shots/      one frame per detected shot
#   hook/       12 fps for the first N seconds (default 5)
#   trans/      12 fps for a window around every cut
#   frames.csv  every detected cut timestamp
#   contact_sheet.png
#
#   frames.sh <dir-with-source.mp4> [scene_threshold] [hook_seconds]
set -euo pipefail
DIR="${1:?dir}"; TH="${2:-0.30}"; HOOK="${3:-5}"
SRC="$DIR/source.mp4"; [ -f "$SRC" ] || { echo "no $SRC"; exit 1; }
mkdir -p "$DIR"/{shots,hook,trans}

DUR=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$SRC")
echo "duration ${DUR}s  scene threshold $TH"

# --- cut list -----------------------------------------------------------
ffmpeg -hide_banner -i "$SRC" -filter:v "select='gt(scene,$TH)',showinfo" \
       -f null - 2>&1 | grep -oE "pts_time:[0-9.]+" | cut -d: -f2 | sort -n -u > "$DIR/cuts.txt"
N=$(wc -l < "$DIR/cuts.txt")
echo "$N cuts"

# --- one frame per shot -------------------------------------------------
i=0; prev=0
{ cat "$DIR/cuts.txt"; echo "$DUR"; } | while read -r t; do
  mid=$(python3 -c "print(max(0,min($DUR-0.05, $prev + min(0.4,($t-$prev)*0.35))))")
  i=$((i+1))
  ffmpeg -hide_banner -loglevel error -y -ss "$mid" -i "$SRC" -frames:v 1 \
         -q:v 3 "$DIR/shots/$(printf '%04d' $i).jpg"
  prev=$t
done

# --- 12 fps over the hook ----------------------------------------------
ffmpeg -hide_banner -loglevel error -y -t "$HOOK" -i "$SRC" \
       -vf "fps=12" -q:v 4 "$DIR/hook/%04d.jpg"

# --- 12 fps around each cut (±0.5s) -------------------------------------
k=0
while read -r t; do
  k=$((k+1))
  a=$(python3 -c "print(max(0,$t-0.5))")
  ffmpeg -hide_banner -loglevel error -y -ss "$a" -t 1.0 -i "$SRC" \
         -vf "fps=12" -q:v 4 "$DIR/trans/cut$(printf '%03d' $k)_%03d.jpg" 2>/dev/null || true
done < "$DIR/cuts.txt"

# --- contact sheet ------------------------------------------------------
COUNT=$(ls "$DIR/shots" | wc -l)
COLS=6; ROWS=$(( (COUNT + COLS - 1) / COLS ))
ls "$DIR"/shots/*.jpg | sed "s|^|file '|;s|$|'|" > "$DIR/sheet.txt"
ffmpeg -hide_banner -loglevel error -y -f concat -safe 0 -r 1 -i "$DIR/sheet.txt" \
       -frames:v 1 -vf "scale=360:-2,tile=${COLS}x${ROWS}:margin=8:padding=6:color=0x222222" \
       "$DIR/contact_sheet.png"
echo "shots=$COUNT  hook=$(ls "$DIR/hook" | wc -l) frames  trans=$(ls "$DIR/trans" | wc -l) frames"
echo "sheet -> $DIR/contact_sheet.png"
