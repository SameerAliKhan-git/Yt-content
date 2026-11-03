# Working notes for this repo

A pipeline for producing Vox-style animated explainer videos for a **faceless
YouTube channel**. Read this before starting a new video.

## Channel niche

Explainers **only** in these lanes:

- **Tech** (how a technology actually works, who controls it, why it matters)
- **International relations**
- **Global affairs**
- **Geopolitics**
- Adjacent **trending topics** in the above

Turn down ideas outside these lanes rather than stretching the channel.

### What this niche demands

1. **Fact-check exposure is high.** Geopolitics and global-affairs audiences
   argue with numbers in the comments. `script/FACTCHECK.md` is the required
   pattern for every video: each figure sourced, confidence-rated, contested
   ranges hedged *on screen*, and an explicit record of claims cut for being
   unsourceable. Never quietly assert a contested figure.
2. **Model estimates are not forecasts.** Anything from a scenario model
   (war/blockade costs, GDP impacts, projections) must be labelled as modelled,
   with the method named, and competing estimates not presented as comparable
   when they measure different things.
3. **Shelf life is a design decision.** A news-pegged video dies in weeks; a
   mechanism-led one ("why this chokepoint exists") keeps earning for years.
   Prefer the durable framing and use the news hook in the cold open only.
4. **Maps and real geography carry these topics.** Natural Earth 10m plus real
   coordinates is the backbone — see the asset notes below.
5. **No contested-border guesswork.** Disputed territory is an editorial
   decision, not a default: state the convention used on screen when a map
   touches a live dispute.

> The semiconductor/"Chokepoint" video in `script/` is **abandoned** — kept only
> as a worked reference for the pipeline. Do not resume it unless asked.

---

## Hard constraints

### Free tools only

**Everything must be free.** No paid tools, no paid tiers, no subscriptions.
When a tool is needed, find the best freely-licensed alternative. Current stack
is already fully free — see `research/FREE_STACK.md` for the researched
alternatives and the licence traps.

**Check the licence of model *weights*, not just the code.** They differ, and
the difference decides whether a monetised video is legal:

| | code | weights | commercial |
|---|---|---|---|
| Chatterbox | MIT | MIT | ✅ |
| OpenVoice V2 | MIT | MIT | ✅ |
| F5-TTS | MIT | **cc-by-nc-4.0** | ❌ **trap — widely mis-recommended as MIT** |
| XTTS-v2 | MPL-2.0 | CPML | ❌ (and Coqui is defunct — no licence to buy) |
| Piper *(in use)* | GPL-3.0 | MIT | ✅ GPL covers the software, **not its output** |

### Narration: the owner's OWN cloned voice — decided

The owner wants **their own voice**, not a stock AI voice. This is settled; do
not substitute a synthetic voice except as a temporary scratch track.

```bash
/tmp/cbenv/bin/python video/clone_voice.py --script script/<name>.json \
  --reference assets/voice/reference.wav \
  --out-wav build/narration.wav --out-timing build/timing.json
```

- **Chatterbox** — MIT code *and* MIT weights, so monetisation is clean.
- Needs `assets/voice/reference.wav`: 3–5 min, documentary delivery, WAV/FLAC,
  mono, ≥24 kHz, **no noise reduction applied**. Full brief and a read-aloud
  script tuned to this niche are in `assets/voice/README.md`.
- Voice samples are **gitignored** — they are the owner's biometric voice data.
  Never commit them, never send them anywhere.
- CPU-only install: `pip install --index-url https://download.pytorch.org/whl/cpu
  torch torchaudio` **first**, then `pip install chatterbox-tts`. Installing
  chatterbox directly pulls a ~2.5 GB CUDA torch tree and stalls.
- `clone_voice.py` writes the same narration.wav + timing.json contract as
  `tts.py`, so the animation timeline, captions and chapters re-derive unchanged.

**Measured CPU speed (4 cores, no GPU): ~7.6x slower than realtime.**

| narration | compute |
|---|---|
| 1 min | ~8 min |
| 11.5 min | **~88 min** |

Workable, because narration is generated **once per script** — start it in the
background and build scenes while it runs. Model load adds ~40s. Chatterbox
pulls a CUDA torch build regardless of the CPU index (venv ~6.2 GB); it still
runs on CPU.

### Fallback only: synthetic voices

**Kokoro** (`--engine kokoro`), Apache-2.0, 54 voices, CPU faster than realtime.
Use **only** as a scratch track while waiting on the owner's recording, or to
time a draft. It is not the channel voice.

```bash
/tmp/ttsenv/bin/python video/tts.py --script script/<name>.json \
  --engine kokoro --kokoro-voice bm_george --wpm 160 \
  --out-wav build/narration.wav --out-timing build/timing.json
```

Weights: `kokoro-v1.0.onnx` + `voices-v1.0.bin` from the kokoro-onnx releases
(~350 MB, not committed). Install with `pip install kokoro-onnx soundfile` —
**use `kokoro-onnx`, not `kokoro`**, which pulls a spacy build that fails here.

Pace is calibrated per-script, not per-sentence: a generic probe mis-estimates
badly (204 wpm probe vs 142 wpm actual), so calibration samples the real script
and lands within ~1 wpm of target.

### Later: the owner's cloned voice

If the owner supplies a sample, **Chatterbox (MIT code + MIT weights, clones
from ~5s)** is the route. Its install stalled in this container (large torch
tree) — retry when needed. Needs a one-time clean recording from the channel owner in
`assets/voice/` — 2–5 min, documentary delivery, quiet room, WAV/FLAC ≥24 kHz,
no noise reduction applied.

Until that sample exists, **Kokoro is the voice** (Piper is only a fast scratch
option). **The timeline is built from measured narration either way**, so
swapping voices never breaks sync — re-run `video/tts.py` and re-derive.

### Monetisation: don't become the thing being demonetised

YouTube's "inauthentic content" rule (July 2025) targets **mass-produced,
templated content with no original value added** — not AI use as such. This
channel's defence is that every video has an original researched script, a
fact-check trail, original code-generated artwork and real human analysis.
The moment it becomes "same template, new topic", it walks into the policy.

---

## How a video gets made

The governing principle: **audio first, everything derived from it.**

```
script/<name>.json          narration lines + per-shot visual direction
      │
      ▼  video/tts.py       synthesise each line, measure its REAL duration
build/narration.wav
build/timing.json           ← single source of truth for all timing
      │
      ├─▶ video/make_script_md.py   timecoded shooting script
      ├─▶ video/make_srt.py         captions (can't drift)
      └─▶ renderer                  animation timeline is built FROM the audio
```

Because the timeline comes from measured audio, the narrated cut, the silent
plate, the SRT and the chapter marks are all locked together by construction.
**Never hand-tune a timecode** — change the script and re-derive.

### Two renderers, one scene library

`video/src/` holds the scenes. Both renderers import it, so there is one visual
source of truth.

| | speed | notes |
|---|---|---|
| `video/segment.sh` (own renderer) | **~3 min per video-minute** | faster, bigger files |
| `remotion/` (Remotion) | ~8.6 min per video-minute | Studio preview, better compression, per-minute compositions |

Verified frame-for-frame identical between the two. Pick per task; use Remotion
when you want to scrub a preview, the standalone when you want speed.

```bash
WORKERS=4 bash video/segment.sh 0 60 minute01        # own renderer, any range
cd remotion && npx remotion studio                   # live preview
cd remotion && npx remotion render Minute01 out.mp4 --concurrency=4
```

### Determinism is load-bearing

Every frame must be a pure function of its frame number — that is what makes
parallel rendering safe. So: no `Math.random()` (use `hash01(index, salt)`), no
wall-clock, no CSS transitions. **GSAP must be driven from a paused timeline
seeked to `frame/fps`**, never left running on its own clock. Remotion's
`interpolate()`/`spring()` are the safer default.

---

## The style target

From Remotion/Higgsfield's own definition, which matches this build:

> *"clean vector shapes, a locked palette, camera moves that feel drawn rather
> than filmed"*

- Palette and type live in `video/src/lib/theme.js` — cream `#F7F3EC`, near-black
  `#15120E`, accents yellow/red/teal. Anton headlines, Archivo Black numbers,
  Barlow Condensed labels, Inter body.
- `video/src/lib/camera.js` gives every shot an eased push/pull/drift with **no
  handheld noise** — that is the "drawn, not filmed" part. Early builds had no
  camera at all and looked static.

### Build assets before scenes

`video/src/assets/registry.js` holds **named elements defined once** and
referenced from any scene. Without this, each scene invents its own version of
the same object. Current entries: `euvScanner`, `dieFloorplan`, `finfetRow`.

**Realism rule from the user:** depict real devices/components/maps accurately —
no generic blobs, nothing that reads as AI slop. Draw to published layouts
(the EUV scanner follows the real optical column; the die follows published
SoC annotations), and cite it in the on-screen source line.

---

## Environment constraints (verified, not guesses)

| Thing | Status |
|---|---|
| Analysing a reference video | **Partly possible now** — `video/analyze_reference.py` splits a film at real scene cuts, builds a numbered contact sheet Claude can actually read, and transcribes with word-level timings. Claude still cannot *play* video; it reads extracted frames. |
| **Downloading from YouTube** | ❌ **Blocked from this container** — HTTP 429 + "Sign in to confirm you're not a bot" (datacenter IP). Metadata (title/duration) still resolves via yt-dlp. Analyse on a local machine and share the outputs, or drop the file in: **local files analyse fine**. Do not send account cookies through this IP. |
| Image/video/audio/3D generation | **Higgsfield MCP is connected** (`mcp__Higgsfield__*`) — but the account is on the **free plan with 0 credits**, so no generation will run until it is topped up. Check with `balance` before planning any generated asset, and never spend credits without explicit approval. |
| Wikimedia Commons | **429 rate-limited** on this shared IP. API worked briefly then throttled. `video/fetch_assets.py` retries with backoff and skips rather than substituting anything unlicensed. |
| Openverse search | Times out through the proxy. |
| npm, jsDelivr, Natural Earth, OSM tiles, NASA | ✅ all reachable |
| `git clone` of public repos | ✅ works (GitHub **raw/codeload are blocked** — clone instead) |
| GitHub push | ✅ working as of 2026-11-02 |

### Asset sources that work, with licences

Everything fetched gets recorded in `assets/manifest.json` with licence +
attribution, so credits generate themselves.

- **simple-icons** (CC0), **lucide** (ISC), **@mdi/svg** (Apache-2.0),
  **bootstrap-icons** (MIT) — via jsDelivr
- **Natural Earth** 10m/50m vectors — public domain
- **NASA** imagery — public domain
- **OpenStreetMap** tiles — ODbL, needs attribution

Real **photography** is the current gap (blocked on Wikimedia, and Higgsfield
generation needs credits).

### Higgsfield explainer presets

`get_explainer_presets` returns 22 styles. Closest to this channel's target:
**Editorial Motion Graphics**, **Paper collage**, **Poster Vector**,
**Isometric Flat Vector**, **Mixed Media**.

⚠️ **Every preset is 9:16.** They are built for Shorts/Reels, not 16:9
long-form. Do not assume a preset will serve a landscape explainer — use them
for Shorts repurposing, and keep the code pipeline for 16:9.

---

## Licences of the toolchain

- **Remotion** — free for individuals and teams up to 3 people, *including
  monetised commercial work*. Paid company licence above that headcount. The
  separate "Automators" tier ($100/mo min) targets organisations selling video
  automation, not a creator rendering their own videos.
- **GSAP** — standard no-charge licence.
- **Three.js** — MIT. `@remotion/three` is **not installed**: it needs React 19
  and this project is on React 18. Drive Three.js from a canvas instead.
- Fonts are all SIL OFL.

---

## Reference-video analysis

```bash
/tmp/vaenv/bin/python video/analyze_reference.py <URL-or-local-path> --out build/refs/<name>
```

Outputs `shots.json`, `contact_sheet.png`, `transcript.json` (word timings),
`transcript.txt`, `report.md` (shot count, median shot length, cuts/min, wpm).
Setup for both this container and a local Windows/Mac machine:
`docs_setup_video_analysis.md`.

Two traps already hit: **faster-whisper 1.2.1 breaks on PyAV ≥14** (pin
`av<14`), and the **VAD filter returns zero segments on music-only audio** —
which is correct, since Whisper otherwise hallucinates "Thank you so much for
watching!" over music. An empty VAD result now retries once without VAD.

## Third-party tools (`tools/`, gitignored — `bash tools/setup.sh`)

- **Null Motion** (MIT, Node 22+, zero deps) — a **study and breakdown viewer,
  not a motion-graphics generator.** It does not animate anything here and
  nothing in the render path depends on it. Worth keeping for two reasons: it
  is a working 254-line reference for the **paused-GSAP-timeline** pattern this
  project requires (`public/drafts.mjs:240`), and its HyperFrames "beats" idea
  is a cheap way to block out a script's shots before a full render. MP4 export
  needs Chrome/Edge (WebCodecs). See `tools/README.md`.

## Skills installed (58, in `.claude/skills/`)

`remotion-*` (13) · `threejs-*` (13) · `gsap-*` (8) · `yt-*` (11) ·
`linkedin-*` (12) · `social-media-manager`

Vendored licences/readmes in `.claude/skills/_vendor/`.

---

## House rules

1. **Fact-check anything with a number in it.** `script/FACTCHECK.md` is the
   model: every figure, its source, a confidence rating, and an explicit list of
   claims that were *cut* for being unsourceable. Contested figures get hedged
   on screen, not quietly asserted.
2. **Never commit video files** — GitHub's hard limit is 100 MB/file. `out/` and
   `build/` are gitignored. Deliver finished video with `SendUserFile`.
3. **Work a minute at a time** and get approval between segments.
4. Check a render with `--probe` stills and a contact sheet *before* committing
   to a long render. Several bugs (missing continents, a die visible for 0.6s,
   colliding labels) were only caught by looking at the frames.
