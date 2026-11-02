#!/usr/bin/env python3
"""
Narrate a script in the channel owner's own cloned voice (Chatterbox, MIT).

Same contract as tts.py: writes narration.wav plus timing.json, so everything
downstream -- animation timeline, captions, chapters -- re-derives unchanged.

    python video/clone_voice.py --script script/x.json \
        --reference assets/voice/reference.wav \
        --out-wav build/narration.wav --out-timing build/timing.json
"""
import json, os, argparse, time, wave, array

LEAD_IN = 0.55
GAP_WITHIN_SHOT = 0.18

def write_wav(path, samples, sr):
    with wave.open(path, "wb") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(sr)
        w.writeframes(samples.tobytes())

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--script", required=True)
    ap.add_argument("--reference", required=True, help="your clean voice sample (wav/flac)")
    ap.add_argument("--out-wav", required=True)
    ap.add_argument("--out-timing", required=True)
    ap.add_argument("--exaggeration", type=float, default=0.4,
                    help="0.3-0.5 reads calm/documentary; higher is more theatrical")
    ap.add_argument("--cfg-weight", type=float, default=0.5,
                    help="lower tracks the reference more closely")
    ap.add_argument("--device", default="cpu")
    a = ap.parse_args()

    if not os.path.exists(a.reference):
        raise SystemExit(f"voice reference not found: {a.reference}\n"
                         f"See assets/voice/README.md for what to record.")

    import numpy as np, torch
    from chatterbox.tts import ChatterboxTTS

    print(f"loading chatterbox on {a.device} (first run downloads weights)...")
    model = ChatterboxTTS.from_pretrained(device=a.device)
    SR = model.sr
    print(f"  model ready, sample rate {SR}")

    script = json.load(open(a.script))
    fps = script.get("fps", 30)
    track = array.array("h", [0] * int(LEAD_IN * SR))
    timing = {"fps": fps, "sampleRate": SR, "engine": "chatterbox",
              "reference": os.path.basename(a.reference), "shots": []}

    n_lines = sum(1 for sh in script["shots"] for l in sh["lines"] if l.get("t", "").strip())
    done = 0
    t_start = time.time()

    for si, shot in enumerate(script["shots"]):
        rec = {"id": shot["id"], "type": shot["type"], "act": shot.get("act", ""),
               "start": len(track) / SR, "lines": []}
        for li, line in enumerate(shot["lines"]):
            l0 = len(track) / SR
            text = line.get("t", "").strip()
            if not text:
                track.extend([0] * int(float(line.get("silent", 1.0)) * SR))
            else:
                wav = model.generate(text, audio_prompt_path=a.reference,
                                     exaggeration=a.exaggeration, cfg_weight=a.cfg_weight)
                au = wav.squeeze(0).cpu().numpy()
                track.extend(array.array("h", (np.clip(au, -1, 1) * 32767).astype("<i2").tobytes()))
                done += 1
                if done % 5 == 0 or done == n_lines:
                    el = time.time() - t_start
                    print(f"  {done}/{n_lines} lines  {el/60:.1f}m elapsed  "
                          f"eta {(el/done)*(n_lines-done)/60:.1f}m", flush=True)
            l1 = len(track) / SR
            rec["lines"].append({"i": li, "text": text, "cue": line.get("cue", ""),
                                 "start": l0, "end": l1, "dur": l1 - l0,
                                 "silent": not bool(text)})
            if li < len(shot["lines"]) - 1:
                track.extend([0] * int(GAP_WITHIN_SHOT * SR))
        pad = float(shot.get("padAfter", 0.0))
        if pad:
            track.extend([0] * int(pad * SR))
        rec["end"] = len(track) / SR
        rec["dur"] = rec["end"] - rec["start"]
        timing["shots"].append(rec)
        print(f"  [{si+1}/{len(script['shots'])}] {shot['id']:<22} "
              f"{rec['dur']:6.2f}s -> {rec['end']:7.2f}s", flush=True)

    total = len(track) / SR
    timing["duration"] = total
    timing["frames"] = int(round(total * fps))
    os.makedirs(os.path.dirname(a.out_wav) or ".", exist_ok=True)
    write_wav(a.out_wav, track, SR)
    json.dump(timing, open(a.out_timing, "w"), indent=1)

    words = sum(len(l["text"].split()) for s in timing["shots"] for l in s["lines"])
    speech = sum(l["dur"] for s in timing["shots"] for l in s["lines"] if not l["silent"])
    m, sec = divmod(total, 60)
    print(f"\nnarration: {int(m)}m {sec:04.1f}s  ({timing['frames']} frames @ {fps}fps)")
    print(f"pace: {words/speech*60:.0f} wpm")
    print(f"wav    -> {a.out_wav}\ntiming -> {a.out_timing}")

if __name__ == "__main__":
    main()
