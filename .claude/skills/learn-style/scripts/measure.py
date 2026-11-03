#!/usr/bin/env python3
"""
Turn a reference into numbers.

Measures only what can honestly be measured from pixels and timings. Anything
that needs judgement (font family, caption wording, intent) is left out and
flagged for a human or for Claude reading the frames -- it is never guessed.

    python measure.py <dir> > <dir>/measures.json
"""
import argparse, json, os, glob, math, subprocess, sys
import numpy as np
from PIL import Image

# ------------------------------------------------------------------ shots --
def shot_stats(dirp, duration):
    cuts = []
    p = os.path.join(dirp, "cuts.txt")
    if os.path.exists(p):
        cuts = [float(x) for x in open(p).read().split() if x.strip()]
    bounds = [0.0] + cuts + [duration]
    lens = [b - a for a, b in zip(bounds, bounds[1:]) if b - a >= 0.25]
    if not lens:
        return {"cuts": 0, "note": "no cuts detected"}
    lens_s = sorted(lens)
    # cuts in each 10s window -- shows whether pace changes through the video
    per10 = []
    for w in range(0, int(math.ceil(duration / 10.0))):
        lo, hi = w * 10, (w + 1) * 10
        per10.append(sum(1 for c in cuts if lo <= c < hi))
    return {
        "cuts": len(cuts),
        "cuts_per_10s_mean": round(len(cuts) / (duration / 10.0), 2),
        "cuts_per_10s_timeline": per10,
        "shot_len_median_s": round(lens_s[len(lens_s) // 2], 2),
        "shot_len_mean_s": round(sum(lens) / len(lens), 2),
        "shot_len_min_s": round(lens_s[0], 2),
        "shot_len_max_s": round(lens_s[-1], 2),
        "shot_len_p90_s": round(lens_s[int(len(lens_s) * 0.9) - 1], 2),
    }

# ---------------------------------------------------------------- palette --
def palette(dirp, k=6, sample=40):
    files = sorted(glob.glob(os.path.join(dirp, "shots", "*.jpg")))
    if not files:
        return []
    step = max(1, len(files) // sample)
    px = []
    for f in files[::step]:
        im = Image.open(f).convert("RGB").resize((80, 45))
        px.append(np.asarray(im).reshape(-1, 3))
    if not px:
        return []
    X = np.concatenate(px).astype(np.float32)
    try:
        from sklearn.cluster import KMeans
        km = KMeans(n_clusters=min(k, len(X)), n_init=4, random_state=0).fit(X)
        centres, counts = km.cluster_centers_, np.bincount(km.labels_, minlength=k)
    except Exception:
        centres = X[np.random.RandomState(0).choice(len(X), k)]
        counts = np.ones(k)
    order = np.argsort(-counts)
    total = counts.sum() or 1
    return [{"hex": "#%02X%02X%02X" % tuple(int(v) for v in centres[i]),
             "share": round(float(counts[i]) / total, 3)} for i in order]

# ------------------------------------------------- caption band placement --
def caption_bands(dirp, bands=10):
    """
    No OCR here. Text is high-frequency detail, so we score each horizontal
    band by edge energy relative to the frame. The band with a persistent
    spike is where burned-in captions sit. Reports a profile, not a reading.
    """
    files = sorted(glob.glob(os.path.join(dirp, "shots", "*.jpg")))
    if not files:
        return {}
    acc = np.zeros(bands)
    n = 0
    for f in files[:: max(1, len(files) // 60)]:
        g = np.asarray(Image.open(f).convert("L"), dtype=np.float32)
        gy = np.abs(np.diff(g, axis=0)).mean(axis=1)          # row edge energy
        h = len(gy)
        for b in range(bands):
            acc[b] += gy[int(b * h / bands):int((b + 1) * h / bands)].mean()
        n += 1
    if not n:
        return {}
    prof = acc / n
    prof = (prof / (prof.max() or 1)).round(3)
    peak = int(np.argmax(prof))
    zone = ("upper third" if peak < bands / 3 else
            "middle third" if peak < 2 * bands / 3 else "lower third")
    return {"band_profile_top_to_bottom": prof.tolist(),
            "peak_band": peak, "peak_band_pct_from_top": round((peak + .5) / bands * 100),
            "likely_text_zone": zone,
            "method": "edge-energy heuristic, NOT OCR -- confirm by eye"}

# -------------------------------------------------------- transition length --
def transitions(dirp, fps=12):
    """
    How many frames a cut takes. A hard cut spikes for one frame; a dissolve
    or whip spreads the difference across several.
    """
    out = []
    groups = {}
    for f in sorted(glob.glob(os.path.join(dirp, "trans", "cut*_*.jpg"))):
        key = os.path.basename(f).split("_")[0]
        groups.setdefault(key, []).append(f)
    for key, files in sorted(groups.items()):
        files.sort()
        arrs = [np.asarray(Image.open(p).convert("L").resize((64, 36)), dtype=np.float32)
                for p in files]
        if len(arrs) < 3:
            continue
        d = np.array([np.abs(arrs[i + 1] - arrs[i]).mean() for i in range(len(arrs) - 1)])
        if d.max() <= 0:
            continue
        thr = d.max() * 0.35
        out.append(int((d > thr).sum()))          # frames involved in the change
    if not out:
        return {}
    o = sorted(out)
    hard = sum(1 for x in out if x <= 1)
    return {"sampled_cuts": len(out), "fps_sampled": fps,
            "transition_frames_median": o[len(o) // 2],
            "transition_frames_max": o[-1],
            "hard_cut_share": round(hard / len(out), 2),
            "note": f"<=1 frame at {fps}fps = hard cut; more = dissolve/whip/zoom"}

# ------------------------------------------------------------------ zooms --
def zooms(dirp):
    """
    Detect scale drift inside the hook by comparing a centre crop of frame N
    against frame N+1 at several scales. Crude but directional.
    """
    files = sorted(glob.glob(os.path.join(dirp, "hook", "*.jpg")))
    if len(files) < 6:
        return {}
    scales = [0.96, 0.98, 1.0, 1.02, 1.04]
    best = []
    prev = None
    for p in files:
        im = Image.open(p).convert("L").resize((160, 90))
        a = np.asarray(im, dtype=np.float32)
        if prev is not None:
            errs = []
            for s in scales:
                h, w = a.shape
                ch, cw = int(h / s), int(w / s)
                y0, x0 = (h - ch) // 2, (w - cw) // 2
                crop = np.asarray(Image.fromarray(a[y0:y0 + ch, x0:x0 + cw].astype(np.uint8))
                                  .resize((w, h)), dtype=np.float32)
                errs.append(np.abs(crop - prev).mean())
            best.append(scales[int(np.argmin(errs))])
        prev = a
    if not best:
        return {}
    moving = sum(1 for s in best if s != 1.0)
    return {"hook_frames_compared": len(best),
            "frames_with_scale_change": moving,
            "share_moving": round(moving / len(best), 2),
            "mean_scale_per_frame": round(float(np.mean(best)), 4),
            "reads_as": ("push/pull present" if moving / len(best) > 0.35 else "mostly locked off"),
            "method": "coarse scale-matching, directional only"}

# ------------------------------------------------------------------- pace --
def pace(dirp):
    p = os.path.join(dirp, "transcript.json")
    if not os.path.exists(p):
        return {}
    d = json.load(open(p))
    words = [w for s in d["segments"] for w in s["words"]]
    speech = sum(s["end"] - s["start"] for s in d["segments"])
    if not words or not speech:
        return {"words": 0, "note": "no speech detected"}
    gaps = []
    for i in range(len(words) - 1):
        g = words[i + 1]["start"] - words[i]["end"]
        if g > 0.25:
            gaps.append(round(g, 2))
    return {"words": len(words), "speech_s": round(speech, 1),
            "wpm": round(len(words) / speech * 60),
            "pauses_over_250ms": len(gaps),
            "median_pause_s": round(sorted(gaps)[len(gaps) // 2], 2) if gaps else 0}

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("dir")
    a = ap.parse_args()
    src = os.path.join(a.dir, "source.mp4")
    dur = float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration",
                                "-of", "csv=p=0", src], capture_output=True, text=True).stdout.strip() or 0)
    wh = subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0",
                         "-show_entries", "stream=width,height,r_frame_rate",
                         "-of", "csv=p=0", src], capture_output=True, text=True).stdout.strip()
    out = {
        "source": os.path.basename(a.dir),
        "duration_s": round(dur, 2),
        "video": wh,
        "shots": shot_stats(a.dir, dur),
        "palette": palette(a.dir),
        "caption_placement": caption_bands(a.dir),
        "transitions": transitions(a.dir),
        "camera": zooms(a.dir),
        "pace": pace(a.dir),
        "NOT_MEASURED": [
            "font family and weight -- not derivable from pixels; read frames, then ASK",
            "caption wording -- use the transcript; never copy their words",
            "brand colours -- palette above is THEIRS; ask the user for yours",
        ],
    }
    json.dump(out, open(os.path.join(a.dir, "measures.json"), "w"), indent=1)
    print(json.dumps(out, indent=1))

if __name__ == "__main__":
    main()
