# Remotion stack

The 27 canvas scenes in `../video/src` are imported directly by
`src/CanvasScene.tsx`, so the visual language has **one** source of truth and
Remotion supplies composition, live preview and encoding on top of it.

```bash
npm install
npx remotion studio                       # live preview, scrub the timeline
npx remotion compositions                 # list all compositions
npx remotion render Minute01 out.mp4 --concurrency=4
npx remotion render Chokepoint out.mp4    # the whole film
```

`public/data/narration.wav` and `countries-50m.json` are gitignored for size —
regenerate them with `video/tts.py` and the fetch step in the root README.

## Compositions

| id | what |
|---|---|
| `Chokepoint` | the full film with narration |
| `ChokepointSilent` | identical picture, no audio |
| `Minute01` … `Minute12` | one-minute approval segments |

Segments use an `offset` prop that shifts which part of the timeline is drawn
and trims the narration by the same amount, so picture and sound stay locked
without re-cutting anything.

## Licences

- **Remotion** is free for individuals and teams of up to 3 people, including
  commercial and monetised work. Companies above that threshold need a paid
  licence. See `.claude/skills/remotion-license/`. A separate "Automators"
  tier applies to organisations selling video automation — not to a creator
  rendering their own videos.
- **GSAP** ships under its standard no-charge licence.
- **Three.js** is MIT.

`@remotion/three` is not installed: it requires React 19 and this project is on
React 18. Three.js can still be driven directly from a canvas component.

## Note on GSAP and determinism

Remotion is frame-based; GSAP is time-based. Anything animated with GSAP must be
driven from a **paused** timeline seeked to `frame / fps`, never left to play on
its own clock, or renders stop being reproducible. `interpolate()` and `spring()`
from Remotion are the safer default; reach for GSAP when you need its easing
curves or complex sequencing.
