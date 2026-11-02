# Working notes for this repo

A pipeline for producing Vox-style animated explainer videos for a **faceless
YouTube channel**. Read this before starting a new video.

> The semiconductor/"Chokepoint" video in `script/` is **abandoned** — kept only
> as a worked reference for the pipeline. Do not resume it unless asked.

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
| Watching video / YouTube transcripts | **Impossible** — no video capability; YouTube blocks this datacenter IP. Ask for written notes, not links. |
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
