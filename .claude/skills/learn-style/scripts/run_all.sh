#!/usr/bin/env bash
# Measure every clip under a directory of references, then collate.
#   run_all.sh <dir-of-reference-dirs> [scene_threshold] [hook_seconds]
set -euo pipefail
ROOT="${1:?dir}"; TH="${2:-0.30}"; HOOK="${3:-5}"
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PY="${PY:-python3}"

for d in "$ROOT"/*/; do
  [ -f "$d/source.mp4" ] || continue
  echo "=== $(basename "$d") ==="
  bash "$HERE/frames.sh"   "$d" "$TH" "$HOOK" >/dev/null
  "$PY" "$HERE/transcribe.py" "$d" 2>/dev/null || echo "  (no speech)"
  "$PY" "$HERE/measure.py"    "$d" >/dev/null
  "$PY" - "$d" <<'INNER'
import json,sys,os
m=json.load(open(os.path.join(sys.argv[1],"measures.json")))
s,p,t,c=m["shots"],m.get("pace",{}),m.get("transitions",{}),m.get("camera",{})
print(f"  {s.get('cuts',0):>3} cuts | {s.get('cuts_per_10s_mean',0):>4}/10s | "
      f"median shot {s.get('shot_len_median_s',0):>4}s | "
      f"trans {t.get('transition_frames_median','-')}f | "
      f"hard {t.get('hard_cut_share','-')} | "
      f"{p.get('wpm','-')} wpm | {c.get('reads_as','-')}")
INNER
done

echo; echo "=== collating ==="
"$PY" - "$ROOT" <<'INNER'
import json,sys,os,glob,statistics as st
rows=[]
for f in sorted(glob.glob(os.path.join(sys.argv[1],"*","measures.json"))):
    m=json.load(open(f)); m["_name"]=os.path.basename(os.path.dirname(f)); rows.append(m)
if not rows: sys.exit("nothing measured")
def col(path,default=None):
    out=[]
    for r in rows:
        v=r
        for k in path.split("."):
            v=(v or {}).get(k) if isinstance(v,dict) else None
        if isinstance(v,(int,float)): out.append(v)
    return out
summary={"references":len(rows)}
for label,path in [("cuts_per_10s","shots.cuts_per_10s_mean"),
                   ("shot_len_median_s","shots.shot_len_median_s"),
                   ("transition_frames","transitions.transition_frames_median"),
                   ("hard_cut_share","transitions.hard_cut_share"),
                   ("wpm","pace.wpm")]:
    v=col(path)
    if v:
        summary[label]={"median":round(st.median(v),2),"min":round(min(v),2),
                        "max":round(max(v),2),"n":len(v)}
out=os.path.join(sys.argv[1],"collated.json")
json.dump({"summary":summary,"per_reference":[
    {"name":r["_name"],"cuts_per_10s":r["shots"].get("cuts_per_10s_mean"),
     "shot_len_median_s":r["shots"].get("shot_len_median_s"),
     "wpm":r.get("pace",{}).get("wpm"),
     "palette":[p["hex"] for p in r.get("palette",[])[:4]]} for r in rows]},
    open(out,"w"),indent=1)
print(json.dumps(summary,indent=1)); print("->",out)
INNER
