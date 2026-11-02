#!/usr/bin/env python3
"""Build an SRT from the measured narration timings.

Long lines are split into readable cues, with each cue's timing apportioned by
word count inside its line. That keeps captions in sync without needing
word-level alignment.
"""
import json, sys, re

MAX_CHARS = 42      # per caption line
MAX_LINES = 2

def ts(s):
    h, r = divmod(s, 3600); m, sec = divmod(r, 60)
    return f"{int(h):02d}:{int(m):02d}:{sec:06.3f}".replace(".", ",")

def greedy_lines(text, width=MAX_CHARS):
    """Break text into display lines of at most `width` characters."""
    out, cur = [], ""
    for w in text.split():
        t = (cur + " " + w).strip()
        if len(t) > width and cur:
            out.append(cur); cur = w
        else:
            cur = t
    if cur: out.append(cur)
    return out

def build_cues(text):
    """Group display lines into cues of at most MAX_LINES lines each."""
    lines = greedy_lines(text)
    return ["\n".join(lines[i:i + MAX_LINES]) for i in range(0, len(lines), MAX_LINES)]

def main(timing_p, out_p):
    tm = json.load(open(timing_p))
    n, parts = 0, []
    for sh in tm["shots"]:
        for ln in sh["lines"]:
            if ln["silent"] or not ln["text"].strip():
                continue
            cues = build_cues(ln["text"].strip())
            total_w = sum(len(c.split()) for c in cues) or 1
            t = ln["start"]
            for c in cues:
                dur = ln["dur"] * (len(c.split()) / total_w)
                n += 1
                parts.append(f"{n}\n{ts(t)} --> {ts(t + dur)}\n{c}\n")
                t += dur
    open(out_p, "w").write("\n".join(parts))
    print(f"wrote {out_p} ({n} cues)")

if __name__ == "__main__":
    main(*sys.argv[1:3])
