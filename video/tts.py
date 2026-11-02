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
    ap.add_argument("--voice", default="", help="piper model path")
    ap.add_argument("--out-wav", required=True)
    ap.add_argument("--out-timing", required=True)
    ap.add_argument("--length-scale", type=float, default=1.0,
                    help="piper only: <1 faster, >1 slower")
    ap.add_argument("--engine", choices=["piper", "kokoro"], default="piper",
                    help="piper = fast scratch voice; kokoro = human-like (Apache-2.0)")
    ap.add_argument("--kokoro-voice", default="bm_george")
    ap.add_argument("--kokoro-model", default="/tmp/kokoro/kokoro-v1.0.onnx")
    ap.add_argument("--kokoro-voices", default="/tmp/kokoro/voices-v1.0.bin")
    ap.add_argument("--wpm", type=float, default=160.0,
                    help="kokoro only: target documentary pace")
    ap.add_argument("--dry-run", action="store_true",
                    help="estimate only, no synthesis")
    a = ap.parse_args()

    script = json.load(open(a.script))
    fps = script.get("fps", 30)

    # --- engine selection -------------------------------------------------
    # Both engines expose speak(text) -> int16 array at SR, so everything
    # downstream (and every derived timing) stays engine-agnostic.
    global SR
    if a.engine == "kokoro":
        import numpy as np
        from kokoro_onnx import Kokoro
        kk = Kokoro(a.kokoro_model, a.kokoro_voices)
        lang = "en-gb" if a.kokoro_voice.startswith("b") else "en-us"
        SR = 24000
        # Calibrate on THIS script's own prose, not a fixed sentence -- pace
        # depends on sentence length and punctuation, so a generic probe
        # mis-estimates (observed: 204 wpm probe vs 142 wpm actual).
        _lines = [l["t"].strip() for sh in script["shots"] for l in sh["lines"]
                  if l.get("t", "").strip()]
        _probe = " ".join(_lines[:: max(1, len(_lines) // 8)][:8]) or "calibration"
        pa, _ = kk.create(_probe, voice=a.kokoro_voice, speed=1.0, lang=lang)
        nat = len(_probe.split()) / (len(pa) / SR) * 60
        speed = max(0.5, min(1.5, a.wpm / nat))
        print(f"  kokoro voice={a.kokoro_voice}  natural {nat:.0f} wpm "
              f"-> speed {speed:.2f} for ~{a.wpm:.0f} wpm")

        def speak(text):
            au, _ = kk.create(text, voice=a.kokoro_voice, speed=speed, lang=lang)
            return array.array("h", (np.clip(au, -1, 1) * 32767).astype("<i2").tobytes())
    else:
        from piper import PiperVoice, SynthesisConfig
        voice = PiperVoice.load(a.voice)
        syn = SynthesisConfig(length_scale=a.length_scale, normalize_audio=True)

        def speak(text):
            out = array.array("h")
            for ch in voice.synthesize(text, syn_config=syn):
                out.frombytes(ch.audio_int16_bytes)
            return out

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
                track.extend(speak(text))

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
    write_wav(a.out_wav, track, SR)
    json.dump(timing, open(a.out_timing, "w"), indent=1)

    m, s = divmod(total, 60)
    print(f"\nnarration: {int(m)}m {s:04.1f}s  ({timing['frames']} frames @ {fps}fps)")
    print(f"wav    -> {a.out_wav}")
    print(f"timing -> {a.out_timing}")

if __name__ == "__main__":
    main()
