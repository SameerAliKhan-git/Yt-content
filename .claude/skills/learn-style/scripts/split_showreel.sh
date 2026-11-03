#!/usr/bin/env bash
# Split a showreel into its chapters and measure each clip separately.
#
# A showreel is NOT one style -- it is N different studio pieces. Measuring the
# whole file averages them into mush, so each chapter becomes its own reference.
#
#   split_showreel.sh <video.mp4> <chapters.json> <outdir>
set -euo pipefail
SRC="${1:?video}"; CH="${2:?chapters.json}"; OUT="${3:?outdir}"
[ -f "$SRC" ] || { echo "no such file: $SRC"; exit 1; }
mkdir -p "$OUT"

python3 - "$SRC" "$CH" "$OUT" <<'PY'
import json, os, subprocess, sys
src, chp, out = sys.argv[1:4]
d = json.load(open(chp))
clips = d["clips"]
def secs(t):
    p = [float(x) for x in t.split(":")]
    return p[0]*60 + p[1] if len(p) == 2 else p[0]*3600 + p[1]*60 + p[2]
total = float(subprocess.run(["ffprobe","-v","error","-show_entries","format=duration",
                              "-of","csv=p=0",src],capture_output=True,text=True).stdout.strip())
made = []
for i, c in enumerate(clips):
    a = secs(c["t"])
    b = secs(clips[i+1]["t"]) if i+1 < len(clips) else total
    if b - a < 2:            # skip stingers
        continue
    slug = "".join(ch if ch.isalnum() else "_" for ch in c["name"]).strip("_").lower()
    dst_dir = os.path.join(out, f"{c['i']:02d}_{slug}")
    os.makedirs(dst_dir, exist_ok=True)
    dst = os.path.join(dst_dir, "source.mp4")
    if not os.path.exists(dst):
        subprocess.run(["ffmpeg","-hide_banner","-loglevel","error","-y",
                        "-ss",f"{a:.2f}","-to",f"{b:.2f}","-i",src,
                        "-c:v","libx264","-crf","18","-preset","veryfast",
                        "-c:a","aac", dst], check=True)
    made.append((dst_dir, c["name"], b-a))
    print(f"  {c['i']:02d} {c['name']:<26} {a:7.1f}-{b:7.1f}s  ({b-a:5.1f}s)")
print(f"\n{len(made)} clips -> {out}")
PY
