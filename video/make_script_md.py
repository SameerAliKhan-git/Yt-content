#!/usr/bin/env python3
"""Generate the timecoded shooting script from the measured narration timings."""
import json, sys

def tc(s):
    m, sec = divmod(s, 60)
    return f"{int(m):02d}:{sec:05.2f}"

def main(script_p, timing_p, out_p):
    sc = json.load(open(script_p))
    tm = json.load(open(timing_p))
    by = {s["id"]: s for s in tm["shots"]}

    L = []
    total = tm["duration"]
    words = sum(len(l["t"].split()) for s in sc["shots"] for l in s["lines"] if l.get("t"))
    speech = sum(l["dur"] for s in tm["shots"] for l in s["lines"] if not l["silent"])

    L.append(f"# {sc['title']}\n")
    L.append("**Timecoded narration script + shot list**\n")
    L.append(f"- Runtime: **{tc(total)}** ({total:.1f}s) · {tm['frames']} frames @ {tm['fps']}fps")
    L.append(f"- Narration: {words} words · {words/(speech/60):.0f} wpm average")
    L.append(f"- {len(tm['shots'])} shots · {sum(1 for s in tm['shots'] for l in s['lines'] if not l['silent'])} narration lines")
    L.append("")
    L.append("> Timecodes come from the measured scratch narration. If you record your own "
             "voiceover, match each line to roughly the marked duration and the animation "
             "will stay in sync. The silent plate `chokepoint_clean.mp4` has identical timing.\n")
    L.append("---\n")

    act = None
    for sh in sc["shots"]:
        t = by[sh["id"]]
        if sh.get("act") and sh["act"] != act:
            act = sh["act"]
            L.append(f"\n## {act}\n")
        L.append(f"### `{sh['id']}` — {sh['type']}")
        L.append(f"`{tc(t['start'])} → {tc(t['end'])}`  ·  {t['dur']:.1f}s\n")
        L.append("| in | dur | narration | on screen |")
        L.append("|---|---|---|---|")
        for ln, tl in zip(sh["lines"], t["lines"]):
            txt = (ln.get("t") or "").replace("|", "\\|")
            cue = (ln.get("cue") or "").replace("|", "\\|")
            if not txt:
                txt = f"_(silent hold — {tl['dur']:.1f}s)_"
            L.append(f"| `{tc(tl['start'])}` | {tl['dur']:.1f}s | {txt} | {cue} |")
        L.append("")

    open(out_p, "w").write("\n".join(L))
    print(f"wrote {out_p}  ({total:.1f}s, {words} words)")

if __name__ == "__main__":
    main(*sys.argv[1:4])
