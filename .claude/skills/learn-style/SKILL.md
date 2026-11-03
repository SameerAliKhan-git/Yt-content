---
name: learn-style
description: >-
  Learn a video editing style from reference videos and design images, and
  write it out as a measured, reusable skill called my-style. Use when the user
  supplies reference links or video files and wants their own style codified in
  numbers (cuts per 10s, shot length, caption placement, transition frames,
  zooms, wpm, hex palette). Also use to update an existing my-style with new
  references.
---

# learn-style

Turn reference videos into **numbers**, then write those numbers into a
`my-style` skill as rules the editor can follow.

**Measure, do not impersonate.** The output describes *technique* — pacing,
placement, rhythm. It never carries another creator's words, logos, footage,
colours or fonts across.

---

## Hard rules

### Rule 1 — When a download is blocked, STOP and ask for the file

`scripts/fetch.sh` exits 2 when the platform blocks it. When that happens:

- **Do** tell the user which URL failed and why (login-gated, private, or
  bot-blocked — common from datacenter IPs).
- **Do** ask them to download it themselves and supply the file.
- **Do not** substitute a different video, work from the thumbnail, or reason
  about a video you have not actually measured.
- **Do not** ask for browser cookies. Sending a logged-in session through a
  datacenter IP puts their account at risk.

### Rule 2 — When a value cannot be measured, ask; never guess

| Ask the user, always | Why |
|---|---|
| **Fonts** (family + weight) | not derivable from pixels |
| **Brand colours** (hex) | the measured palette is the *reference's*, not theirs |
| **Logo** (file + clear-space rule) | must be supplied, never recreated |

If the user supplies none of these, write the rules with `TODO(ask user)` in
place of the value. **Do not fill them with the reference's values** — that is
how a style guide quietly becomes a copy of someone else's brand.

### Rule 3 — Copy technique only

- **Do** carry across: cut rhythm, shot length distribution, caption band and
  safe-area, transition duration in frames, camera-move frequency, wpm.
- **Do not** carry across: their script or caption wording, their logo, their
  footage, their exact brand hex values, their font licences.
- When quoting a reference in a notes file, quote **at most one short line**,
  and only to illustrate a *timing* point.

### Rule 4 — Separate measured from judged from asked

Every number in the output is tagged:

- `measured` — came from pixels or timings
- `judged` — Claude read the frames and formed a view (say so)
- `asked` — the user supplied it

Never present a judged value as measured. The edge-energy caption heuristic is
**judged**, not OCR.

### Rule 5 — Merging into an existing my-style

When `.claude/skills/my-style/SKILL.md` already exists:

1. Read it first.
2. Recompute across **all** references, old and new.
3. Write the merged result.
4. **List what changed** — every value that moved, with old → new, and the
   reference that moved it.

Never silently overwrite a value the user previously confirmed. If a new
reference contradicts a confirmed value, surface the conflict and ask.

---

## Procedure

### Step 1 — Fetch

```bash
bash scripts/fetch.sh "<url-or-path>" "work/<ref-name>"
```

Exit 2 → apply Rule 1. Local files are copied straight in and always work.

### Step 2 — Frames

```bash
bash scripts/frames.sh "work/<ref-name>" 0.30 5
```

Produces, per reference:

| | |
|---|---|
| `shots/` | one frame per detected shot |
| `hook/` | **12 fps** over the first 5s — the hook is where style is densest |
| `trans/` | **12 fps** across ±0.5s of **every** cut |
| `cuts.txt` | every cut timestamp |
| `contact_sheet.png` | the whole film at a glance |

Lower the threshold (0.20) for soft-cut or heavily graded footage; raise it
(0.40) when a shaky handheld shot is producing false cuts.

### Step 3 — Transcribe

```bash
python scripts/transcribe.py "work/<ref-name>" --model base.en
```

Word-level timings. Pace means nothing without them. An empty VAD result
retries once without VAD — zero segments after that means the video genuinely
has no speech (music-only), **not** that transcription failed.

### Step 4 — Measure

```bash
python scripts/measure.py "work/<ref-name>"
```

Writes `measures.json`:

| Field | How |
|---|---|
| `cuts_per_10s_mean` + `timeline` | measured — the timeline shows whether pace builds or decays |
| `shot_len_*` (median/mean/min/max/p90) | measured — **median matters more than mean**; one long hold skews the mean |
| `palette` | measured — k-means over shot frames, with share-of-frame |
| `caption_placement` | **judged** — edge-energy band profile, not OCR. Confirm by reading frames |
| `transitions` | measured — frames involved per cut; ≤1 frame at 12fps = hard cut |
| `camera` | measured, coarse — share of hook frames showing scale drift |
| `pace` | measured — wpm, pause count, median pause |

### Step 5 — Look at the frames

Open `contact_sheet.png` and the `hook/` frames. Numbers do not catch
everything. Record as `judged`: caption style, text layout, where the eye is
led, whether cuts land on beats.

### Step 6 — Ask for brand

Apply Rule 2. Ask for fonts, colours and logo before writing anything.

### Step 7 — Write my-style

Write `.claude/skills/my-style/SKILL.md` as **"do X when Y"** rules, each
carrying its number and its tag. Then one notes file per reference in
`.claude/skills/my-style/references/<ref-name>.md` from `templates/NOTES.md`.

Merging → Rule 5.

---

## Showreels are not one style

A compilation (e.g. a studio's "20 best explainer videos") is **N different
films by different teams for different clients**. Measuring the whole file
averages them into a meaningless middle.

**Do** split it by its chapter list first, then measure each clip as its own
reference and collate:

```bash
bash scripts/split_showreel.sh reel.mp4 references/<chapters>.json work/
bash scripts/run_all.sh work/ 0.30 5
```

`run_all.sh` writes `collated.json`: the median, min and max of each metric
across references. **Report the spread, not just the median** — if shot length
ranges 0.8s to 4.2s across the set, that is the finding, and averaging it hides
the thing worth knowing.

**Do not** adopt a showreel's palette. Those are twenty different client brands.

## Writing good rules

A rule must be **executable without rewatching the reference**.

✅ `Cut every 1.4s median in the first 10s; stretch to 2.4s after the hook.
   (measured: cuts_per_10s 6.2 → 3.1)`

❌ `Cut fast at the start.`

✅ `Place captions in the lower third, peak at 72% from top, inside a 10% safe
   area. (judged from edge profile — confirm)`

❌ `Captions go near the bottom.`

Each rule states its **number**, its **tag**, and the **condition** it applies under.
