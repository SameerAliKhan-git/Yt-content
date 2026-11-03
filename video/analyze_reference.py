#!/usr/bin/env python3
"""
Reference-video analyser.

Downloads a video, splits it at real scene cuts, builds a contact sheet of
shots, and transcribes it with word-level timings. Used to study how a
reference film is paced and built.

    python video/analyze_reference.py URL --out build/refs/name

Outputs under <out>/:
    source.mp4          the download (deleted with --no-keep-video)
    shots.json          every detected cut, with timecodes and durations
    contact_sheet.png   one frame per shot, numbered
    transcript.json     segments + per-word timings
    transcript.txt      plain reading copy
    report.md           pacing summary: shot count, median shot length, wpm
"""
import argparse, json, os, subprocess, sys, shutil, math

def run(cmd, **kw):
    return subprocess.run(cmd, capture_output=True, text=True, **kw)

def tc(s):
    m, sec = divmod(float(s), 60)
    return f"{int(m):02d}:{sec:05.2f}"

# ----------------------------------------------------------------- download --
def download(url, out, ytdlp, keep_res=720, cookies=None):
    dst = os.path.join(out, "source.mp4")
    if os.path.exists(dst):
        print(f"  reusing {dst}")
        return dst
    print("  downloading ...")
    fmt = f"bv*[height<={keep_res}]+ba/b[height<={keep_res}]/b"
    cmd = [ytdlp, "-f", fmt, "--merge-output-format", "mp4", "--no-playlist"]
    if cookies:
        cmd += ["--cookies-from-browser", cookies]
    r = run(cmd + ["-o", dst, url])
    if not os.path.exists(dst):
        sys.exit("download failed:\n" + (r.stderr or r.stdout)[-1500:])
    return dst

# -------------------------------------------------------------- scene cuts --
def detect_shots(src, threshold):
    """FFmpeg scene detection -> list of cut timestamps."""
    print(f"  detecting shots (threshold {threshold}) ...")
    r = run(["ffmpeg", "-hide_banner", "-i", src,
             "-filter:v", f"select='gt(scene,{threshold})',showinfo",
             "-f", "null", "-"])
    cuts = []
    for line in (r.stderr or "").splitlines():
        if "pts_time:" in line:
            try:
                cuts.append(float(line.split("pts_time:")[1].split()[0]))
            except (ValueError, IndexError):
                pass
    return sorted(set(cuts))

def duration_of(src):
    r = run(["ffprobe", "-v", "error", "-show_entries", "format=duration",
             "-of", "csv=p=0", src])
    return float((r.stdout or "0").strip() or 0)

def build_shots(cuts, total):
    bounds = [0.0] + cuts + [total]
    shots = []
    for i in range(len(bounds) - 1):
        a, b = bounds[i], bounds[i + 1]
        if b - a < 0.25:          # ignore flicker-length false cuts
            continue
        shots.append({"i": len(shots) + 1, "start": a, "end": b, "dur": b - a})
    return shots

# ------------------------------------------------------------ contact sheet --
def contact_sheet(src, shots, out, cols=6, tile_w=400):
    print(f"  grabbing {len(shots)} shot frames ...")
    fdir = os.path.join(out, "frames")
    os.makedirs(fdir, exist_ok=True)
    got = []
    for s in shots:
        at = s["start"] + min(0.4, s["dur"] * 0.35)      # just past the cut
        p = os.path.join(fdir, f"shot_{s['i']:03d}.jpg")
        if not os.path.exists(p):
            run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y",
                 "-ss", f"{at:.3f}", "-i", src, "-frames:v", "1",
                 "-vf", f"scale={tile_w}:-2",
                 "-q:v", "3", p])
        if os.path.exists(p):
            got.append((s, p))
    if not got:
        return None
    rows = math.ceil(len(got) / cols)
    lst = os.path.join(out, "sheet_list.txt")
    with open(lst, "w") as f:
        for _, p in got:
            f.write(f"file '{os.path.abspath(p)}'\n")
    sheet = os.path.join(out, "contact_sheet.png")
    run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y",
         "-f", "concat", "-safe", "0", "-r", "1", "-i", lst,
         "-frames:v", "1",
         "-vf", f"scale={tile_w}:-2,tile={cols}x{rows}:margin=8:padding=6:color=0x222222",
         sheet])
    return sheet if os.path.exists(sheet) else None

# -------------------------------------------------------------- transcribe --
def transcribe(src, out, model_size, compute, vad=True):
    from faster_whisper import WhisperModel
    print(f"  transcribing with faster-whisper ({model_size}, {compute}) ...")
    wav = os.path.join(out, "audio.wav")
    if not os.path.exists(wav):
        run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y",
             "-i", src, "-vn", "-ac", "1", "-ar", "16000", wav])
    model = WhisperModel(model_size, device="cpu", compute_type=compute)
    segs, info = model.transcribe(wav, word_timestamps=True, vad_filter=vad)
    segs = list(segs)
    if vad and not segs:
        # VAD suppresses hallucination on music/silence, but can also swallow
        # quiet speech -- retry once before reporting an empty transcript.
        print("    no speech under VAD; retrying without it ...")
        segs, info = model.transcribe(wav, word_timestamps=True, vad_filter=False)
        segs = list(segs)
    data = {"language": info.language, "duration": info.duration, "segments": []}
    for s in segs:
        data["segments"].append({
            "start": s.start, "end": s.end, "text": s.text.strip(),
            "words": [{"w": w.word.strip(), "start": w.start,
                       "end": w.end, "p": round(w.probability, 3)}
                      for w in (s.words or [])],
        })
        print(f"    [{tc(s.start)}] {s.text.strip()[:70]}", flush=True)
    json.dump(data, open(os.path.join(out, "transcript.json"), "w"), indent=1)
    with open(os.path.join(out, "transcript.txt"), "w") as f:
        for s in data["segments"]:
            f.write(f"[{tc(s['start'])}] {s['text']}\n")
    return data

# ------------------------------------------------------------------ report --
def report(out, url, total, shots, tr):
    durs = sorted(s["dur"] for s in shots)
    med = durs[len(durs) // 2] if durs else 0
    words = sum(len(s.get("words") or []) for s in (tr or {}).get("segments", []))
    speech = sum(s["end"] - s["start"] for s in (tr or {}).get("segments", []))
    L = [f"# Reference analysis\n", f"- Source: {url}",
         f"- Duration: **{tc(total)}** ({total:.1f}s)",
         f"- Shots detected: **{len(shots)}**"]
    if shots:
        L += [f"- Median shot length: **{med:.2f}s**",
              f"- Shortest / longest: {durs[0]:.2f}s / {durs[-1]:.2f}s",
              f"- Average cuts per minute: **{len(shots)/(total/60):.1f}**"]
    if words and speech:
        L += [f"- Words: {words} · narration pace: **{words/speech*60:.0f} wpm**"]
    L += ["", "## Shot list", "", "| # | in | out | dur |", "|---|---|---|---|"]
    for s in shots:
        L.append(f"| {s['i']} | `{tc(s['start'])}` | `{tc(s['end'])}` | {s['dur']:.2f}s |")
    open(os.path.join(out, "report.md"), "w").write("\n".join(L))

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("url")
    ap.add_argument("--out", required=True)
    ap.add_argument("--threshold", type=float, default=0.30)
    ap.add_argument("--cols", type=int, default=6)
    ap.add_argument("--model", default="base.en")
    ap.add_argument("--compute", default="int8")
    ap.add_argument("--ytdlp", default="yt-dlp")
    ap.add_argument("--cookies-from-browser", default=None,
                    help="e.g. chrome -- needed for YouTube, which blocks datacenter IPs")
    ap.add_argument("--no-transcript", action="store_true")
    ap.add_argument("--no-vad", action="store_true", help="disable voice-activity filter")
    ap.add_argument("--no-keep-video", action="store_true")
    a = ap.parse_args()

    os.makedirs(a.out, exist_ok=True)
    src = download(a.url, a.out, a.ytdlp, cookies=a.cookies_from_browser)
    total = duration_of(src)
    print(f"  duration {tc(total)}")
    shots = build_shots(detect_shots(src, a.threshold), total)
    print(f"  {len(shots)} shots")
    sheet = contact_sheet(src, shots, a.out, cols=a.cols)
    json.dump(shots, open(os.path.join(a.out, "shots.json"), "w"), indent=1)
    tr = None if a.no_transcript else transcribe(src, a.out, a.model, a.compute, vad=not a.no_vad)
    report(a.out, a.url, total, shots, tr)
    if a.no_keep_video:
        os.remove(src)
    print(f"\n  contact sheet -> {sheet}")
    print(f"  report        -> {os.path.join(a.out,'report.md')}")

if __name__ == "__main__":
    main()
