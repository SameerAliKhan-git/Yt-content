#!/usr/bin/env python3
"""Word-level transcript. Pace is only meaningful with word timings."""
import argparse, json, os, subprocess, sys

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("dir"); ap.add_argument("--model", default="base.en")
    ap.add_argument("--compute", default="int8"); ap.add_argument("--no-vad", action="store_true")
    a = ap.parse_args()
    src = os.path.join(a.dir, "source.mp4")
    wav = os.path.join(a.dir, "audio.wav")
    if not os.path.exists(wav):
        subprocess.run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-i", src,
                        "-vn", "-ac", "1", "-ar", "16000", wav], check=True)
    from faster_whisper import WhisperModel
    m = WhisperModel(a.model, device="cpu", compute_type=a.compute)
    vad = not a.no_vad
    segs, info = m.transcribe(wav, word_timestamps=True, vad_filter=vad)
    segs = list(segs)
    if vad and not segs:
        # VAD is right to suppress hallucination on music, but can swallow
        # quiet speech. Retry once before declaring the video silent.
        segs, info = m.transcribe(wav, word_timestamps=True, vad_filter=False)
        segs = list(segs)
    out = {"language": info.language, "segments": [
        {"start": s.start, "end": s.end, "text": s.text.strip(),
         "words": [{"w": w.word.strip(), "start": w.start, "end": w.end} for w in (s.words or [])]}
        for s in segs]}
    json.dump(out, open(os.path.join(a.dir, "transcript.json"), "w"), indent=1)
    words = sum(len(s["words"]) for s in out["segments"])
    speech = sum(s["end"] - s["start"] for s in out["segments"])
    print(f"segments={len(out['segments'])} words={words} "
          f"wpm={(words/speech*60) if speech else 0:.0f}")

if __name__ == "__main__":
    main()
