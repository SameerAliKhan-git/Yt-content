# Tools

Third-party tools used alongside the pipeline. Each is gitignored and fetched
with `tools/setup.sh` — they are other people's repos, not ours to vendor.

---

## Null Motion

```sh
bash tools/setup.sh nullmotion
cd tools/nullmotion && npm start     # http://127.0.0.1:4343
```

MIT · Node 22+ · **zero dependencies** · <https://github.com/blixvip/NullMotion>

### What it actually is

**A study and breakdown viewer, not a motion-graphics generator.** It plays a
finished motion-graphics ad full width, with a rough black-and-white
"HyperFrames" draft of each section underneath, running in sync frame for
frame, and exports the whole breakdown as one MP4.

It will **not** animate our explainers. Nothing in this repo's render path
depends on it.

### Why it is still worth having

1. **A working reference for the paused-GSAP pattern.** `public/drafts.mjs:240`
   builds `gsap.timeline({ paused: true })` and drives it from an external
   clock — exactly the determinism rule this project requires (see CLAUDE.md:
   *"GSAP must be driven from a paused timeline seeked to `frame/fps`"*). It is
   254 readable lines; the cheapest correct example of the pattern we need if
   GSAP ever enters the render path.

2. **Previz / storyboarding.** The HyperFrames idea — describe a section as one
   or two *beats* (`text`, `logo`, `phone`, `window`, `chart`, `list`, `cards`…)
   and get a rough flat scene — is a good way to block out a script's shots
   before committing to a full render. That matches house rule 4: look at
   something cheap before paying for a long render.

3. **Deconstructing reference films.** `scripts/plan-sections.mjs` uses FFmpeg
   scene detection to split a film into 3–8 sections at real cuts. Useful for
   analysing pacing in a reference video — **note that Claude cannot watch
   video, so this is a tool for the channel owner, not for Claude.**

### Requirements and limits

| | |
|---|---|
| Playback | any modern browser |
| **MP4 export** | **Chrome or Edge only** — needs WebCodecs + `requestVideoFrameCallback` |
| Importing your own references | FFmpeg + ffprobe, and Python 3 for the importer |

The repo ships ~36 MB of showcase media, which is why it is gitignored rather
than committed.

> Not to be confused with **Null Studio**, the authors' separate hosted paid
> product. This repo is the free local piece and the only part we use.
