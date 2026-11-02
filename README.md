# The Chokepoint — Vox-style animated explainer

A complete, from-scratch 11:28 animated infographic explainer on the
semiconductor chokepoint: why one machine from one Dutch company, and one
island, sit underneath the entire digital economy.

Everything here is generated from source — there is no editing-suite project
file, no stock footage and no external render service. The video is drawn frame
by frame with Canvas 2D and encoded with ffmpeg.

---

## What you get

| File | What it is |
|---|---|
| `out/chokepoint_narrated.mp4` | The finished cut with a TTS scratch narration. Watchable immediately. |
| `out/chokepoint_clean.mp4` | **Identical animation, no audio.** Drop your own voiceover straight onto it. |
| `script/script_timecoded.md` | Every line with in-point, duration and the on-screen action. |
| `script/FACTCHECK.md` | Every number, its source, and how defensible it is. Read this before publishing. |
| `publish/youtube_metadata.md` | Titles, description, tags, chapters, pinned comment, upload settings. |
| `publish/chokepoint.srt` | Captions (171 cues), timed from the real narration. |
| `assets/thumbnail/` | Two thumbnail variants, 1280×720, legibility-checked at feed size. |

### About the narration

The scratch track is Piper TTS, deliberately paced to **159 wpm** — a realistic
documentary read, not the voice's natural 266 wpm. That matters: the animation
timeline is built *from the measured audio*, so when you record your own
voiceover at a normal pace, the visuals already line up.

**An AI voice measurably hurts retention on explainer content.** Treat the
narrated cut as a timing reference and record it yourself.

---

## How the pipeline works

The core idea: **audio first, then everything else is derived from it.**

```
script/script.json                 narration + per-shot visual direction
        │
        ▼  video/tts.py            synthesise each line, measure its true length
build/narration.wav
build/timing.json                  ← the single source of truth for timing
        │
        ▼  video/render.js         Canvas 2D, one deterministic frame at a time
        │                          4 parallel workers → JPEG → ffmpeg
build/chunks/*.mp4
        │
        ▼  video/build.sh          concat, then mux + loudness-normalise
out/chokepoint_clean.mp4
out/chokepoint_narrated.mp4
```

Because the timeline comes from measured audio, the narrated cut and the silent
plate are frame-identical, and the SRT and the chapter marks can't drift.

### Determinism

Every frame is a pure function of its frame number. No `requestAnimationFrame`,
no CSS transitions, no `Math.random()` — randomness comes from a hash of the
element index, and film grain is a cached noise tile offset by frame. That is
what makes it safe to render four frame ranges in parallel and concatenate them.

---

## Rebuilding

```bash
# 1. narration + timing  (needs piper: pip install piper-tts, plus a voice model)
python3 video/tts.py \
  --script script/script.json \
  --voice /path/to/en_US-ryan-high.onnx \
  --out-wav build/narration.wav \
  --out-timing build/timing.json \
  --length-scale 1.29          # tuned to ~160 wpm for this voice

# 2. derived documents
python3 video/make_script_md.py script/script.json build/timing.json script/script_timecoded.md
python3 video/make_srt.py       build/timing.json publish/chokepoint.srt

# 3. the film  (~28 min on 4 cores)
WORKERS=4 bash video/build.sh

# 4. thumbnails
node video/thumb.js
```

### Iterating on the visuals without a full render

```bash
node video/render.js --probe                      # one still per shot
node video/render.js --probe --frames 8713,11461  # specific frames
node video/render.js --from 0 --to 300 --out /tmp/preview.mp4
```

`--probe` also prints ms/frame, so you can see the cost of a change immediately.

---

## Layout

```
script/      script.json (source of truth), timecoded script, fact check
video/
  src/
    lib/     theme.js (palette + type), anim.js (easings, hashing), draw.js (charts, maps, text)
    scenes/  one module per act; 27 shot renderers
    timeline.js   binds timing.json to scenes, handles cross-fades
    index.html    render host
    thumb.html    thumbnail host
    data/    world-atlas 50m topology
  tts.py  render.js  thumb.js  build.sh  serve.js
assets/thumbnail/
publish/
build/       intermediates (narration, timing, chunks, probe stills)
out/         final videos
```

### Changing the script

Edit `script/script.json`, then re-run steps 1–3. Shot durations, cross-fades,
captions and chapters all recompute from the new audio automatically — you never
hand-tune a timecode.

### Changing the look

`video/src/lib/theme.js` holds the whole palette and type scale. The house style
is cream `#F7F3EC` / near-black `#15120E` with yellow, red and teal accents;
Anton for headlines, Archivo Black for big numbers, Barlow Condensed for labels,
Inter for body copy.

---

## Before you publish

1. **Read `script/FACTCHECK.md`.** Several figures are contested ranges, and the
   document says exactly which ones and how to defend them. The two riskiest are
   TSMC's market share (depends on market definition) and the blockade cost
   estimates (modelled scenarios, not forecasts). Both are hedged on screen.
2. Record your own voiceover against `chokepoint_clean.mp4`.
3. Upload `publish/chokepoint.srt` rather than relying on auto-captions — the
   technical vocabulary gets mangled.
4. A/B the two thumbnails.

## Licensing notes

- Fonts: Anton, Archivo Black, Barlow Condensed, Inter, Roboto Mono — all SIL Open Font License.
- Map data: Natural Earth via `world-atlas` (public domain).
- All artwork is generated by the code in this repo. No third-party footage or imagery.
