#!/usr/bin/env python3
"""
Narration builder.

Synthesises every narration line with Piper, measures its true duration, and
emits build/timing.json -- the single source of truth the animation renderer
reads. Audio is laid out on an explicit grid (line audio + inter-line gap +
per-shot pad), so the silent plate and the narrated cut share identical timing.
"""
import json, os, sys, wave, argparse, array

SR = 22050                 # piper 'high' voices output 22.05kHz mono
GAP_WITHIN_SHOT = 0.18     # breath between lines inside a shot
LEAD_IN = 0.55             # silence before first word

def write_wav(path, samples, sr=SR):
    with wave.open(path, "wb") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(sr)
        w.writeframes(samples.tobytes())

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--script", required=True)
    ap.add_argument("--voice", required=True)
    ap.add_argument("--out-wav", required=True)
    ap.add_argument("--out-timing", required=True)
    ap.add_argument("--length-scale", type=float, default=1.0,
                    help="<1 faster, >1 slower")
    ap.add_argument("--dry-run", action="store_true",
                    help="estimate only, no synthesis")
    a = ap.parse_args()

    script = json.load(open(a.script))
    fps = script.get("fps", 30)

    from piper import PiperVoice, SynthesisConfig
    voice = PiperVoice.load(a.voice)
    syn = SynthesisConfig(length_scale=a.length_scale, normalize_audio=True)

    track = array.array("h")                  # full narration, int16 mono
    track.extend([0] * int(LEAD_IN * SR))

    timing = {"fps": fps, "sampleRate": SR, "shots": []}

    for si, shot in enumerate(script["shots"]):
        shot_start = len(track) / SR
        shot_rec = {"id": shot["id"], "type": shot["type"],
                    "act": shot.get("act", ""), "start": shot_start, "lines": []}

        real_lines = [l for l in shot["lines"]]
        for li, line in enumerate(real_lines):
            l_start = len(track) / SR
            text = line.get("t", "").strip()

            if not text:
                # deliberate silent hold (title / end cards)
                hold = float(line.get("silent", 1.0))
                track.extend([0] * int(hold * SR))
            else:
                chunks = list(voice.synthesize(text, syn_config=syn))
                for ch in chunks:
                    arr = array.array("h")
                    arr.frombytes(ch.audio_int16_bytes)
                    track.extend(arr)

            l_end = len(track) / SR
            shot_rec["lines"].append({
                "i": li, "text": text, "cue": line.get("cue", ""),
                "start": l_start, "end": l_end, "dur": l_end - l_start,
                "silent": not bool(text),
            })

            if li < len(real_lines) - 1:
                track.extend([0] * int(GAP_WITHIN_SHOT * SR))

        pad = float(shot.get("padAfter", 0.0))
        if pad:
            track.extend([0] * int(pad * SR))

        shot_rec["end"] = len(track) / SR
        shot_rec["dur"] = shot_rec["end"] - shot_rec["start"]
        timing["shots"].append(shot_rec)
        print(f"  [{si+1:2d}/{len(script['shots'])}] {shot['id']:<24} "
              f"{shot_rec['dur']:6.2f}s  -> {shot_rec['end']:7.2f}s", flush=True)

    total = len(track) / SR
    timing["duration"] = total
    timing["frames"] = int(round(total * fps))

    os.makedirs(os.path.dirname(a.out_wav), exist_ok=True)
    write_wav(a.out_wav, track)
    json.dump(timing, open(a.out_timing, "w"), indent=1)

    m, s = divmod(total, 60)
    print(f"\nnarration: {int(m)}m {s:04.1f}s  ({timing['frames']} frames @ {fps}fps)")
    print(f"wav    -> {a.out_wav}")
    print(f"timing -> {a.out_timing}")

if __name__ == "__main__":
    main()
