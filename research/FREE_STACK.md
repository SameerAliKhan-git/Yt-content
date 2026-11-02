# The free stack

Research for a faceless explainer channel in tech / IR / global affairs / geopolitics,
under a hard **free-tools-only** constraint.

Licences marked ✅ **verified** were read from the repository or the Hugging Face
API during this research, not taken from a blog. Everything else is secondhand
and marked as such — a lot of the "best free tools 2026" web content is affiliate
material and the rankings disagree with each other.

---

## 1. The thing that matters more than any tool

YouTube renamed its *repetitious content* rule to **"inauthentic content"** in
July 2025, and enforcement against faceless AI channels followed.

**Using AI is not what gets you demonetised.** Reporting consistently says the
target is *mass-produced, templated content with no original value added* —
channels recycling one template, one voice and stock visuals with only the topic
swapped. Original commentary, original analysis and original artwork remain
eligible.

**This is the single best argument for the pipeline in this repo.** Generic AI
video tools produce exactly the templated output being demonetised. What we
build instead is:

- an original researched script with a fact-check trail
- original artwork generated from code, not from a stock library or a prompt
- accurate schematics drawn to published layouts
- a human voice (see §2)

Keep it that way. The moment this becomes "same template, new topic", it walks
into the policy.

> ⚠️ All of the above is from secondary reporting. The numbers in circulation
> (e.g. "4.7 billion views wiped") trace to marketing blogs and are unverified.
> **Read YouTube's own Partner Programme and inauthentic-content policy pages
> before relying on any of it.**

Also note the baseline: monetisation requires meeting YPP thresholds, and
disclosure rules apply to realistic synthetic media — including a synthetic
voice. Declare it where YouTube asks.

---

## 2. Voice — cloning your own

Requirement: **the channel owner's own cloned voice, not a stock AI voice.**

### Licence check (✅ verified against Hugging Face API + repo LICENSE files)

| Model | Code | **Weights** | Clones? | Commercial |
|---|---|---|---|---|
| **Chatterbox** (Resemble AI) | MIT | **MIT** | yes, ~5s sample | ✅ **yes** |
| **OpenVoice V2** (MyShell) | MIT | **MIT** | yes | ✅ yes |
| F5-TTS | MIT | **cc-by-nc-4.0** | yes | ❌ **no** |
| XTTS-v2 (Coqui) | MPL-2.0 | CPML | yes | ❌ no |
| Kokoro-82M | — | Apache-2.0 | **no** | ✅ yes (fixed voices only) |
| Piper *(currently used)* | GPL-3.0 | **MIT** (voice models) | no | ✅ yes |

**The trap:** code licence ≠ weights licence. **F5-TTS is widely recommended as
"MIT" and its weights are non-commercial.** XTTS is the other trap — and Coqui
the company wound down, so there is nobody left to sell you a commercial licence.

**Piper is safe.** The GPL covers Piper's *software*, not its *output* — audio
you generate is yours, and the voice models are MIT. Nothing already shipped
needs changing.

### Recommendation: Chatterbox

MIT across the board, ~2.2M downloads, clones from a short sample, self-hostable.
Its "beats ElevenLabs 63.8% to 24.5%" claim is **the vendor's own blind study** —
treat as marketing until independently replicated. No independent head-to-head
benchmark of Chatterbox vs OpenVoice vs F5 was found.

**What you need to record** (one time, then reusable forever):

- 2–5 minutes of clean speech, more is better
- the *delivery you want in the videos* — measured documentary read, not chatty
- a quiet room, no music, no background noise, consistent distance from the mic
- read something neutral and varied; include numbers and place names, since those
  are what this niche's scripts are full of
- WAV or FLAC, mono, 24 kHz or higher, no compression, no noise reduction applied

Drop it in `assets/voice/` and the pipeline can use it.

---

## 3. What this repo already gives you, free

Don't buy what's already built:

| Need | Already free here |
|---|---|
| Animation / motion graphics | the 27-scene canvas library + camera system |
| Video framework | Remotion — **free for individuals and teams ≤3, incl. monetised work** |
| Animation library | GSAP — free |
| 3D | Three.js — MIT |
| Maps | Natural Earth 10m/50m — public domain |
| Icons / components | simple-icons (CC0), lucide (ISC), @mdi/svg (Apache), bootstrap-icons (MIT) |
| Fonts | Anton, Archivo Black, Barlow Condensed, Inter, Roboto Mono — SIL OFL |
| Encoding | ffmpeg |
| Captions | generated from measured narration — no paid captioning service |

That covers the entire production chain for 16:9 long-form at zero cost.

---

## 4. Gaps, and the free fills

### Photography & footage *(the real gap)*

| Source | Licence | Notes |
|---|---|---|
| **Wikimedia Commons** | CC / PD | best for real technical + historical imagery. ⚠️ currently **429 rate-limited** on this container's shared IP |
| **Pexels** | free commercial, no attribution | large, modern-looking |
| **Pixabay** | free commercial, no attribution | video + stills + music |
| **Mixkit** | free commercial, no attribution | more restrictive on redistribution |
| **Coverr** | free commercial, no attribution | no signup |
| **NASA / NOAA / USGS** | public domain | ✅ reachable, excellent for earth/space |
| **archive.org** | varies per item | archival footage — check each item |

⚠️ Two limits apply to all stock: you can't resell clips unaltered, and a
**recognisable person, logo, brand or building carries separate rights the stock
licence does not cover** — which matters for a geopolitics channel using footage
of leaders, flags and institutions.

### Music

- **YouTube Audio Library** — safest; cleared *for YouTube use specifically*. Built into Studio.
- **Pixabay Music** — commercial use, no attribution, but understand Content ID risk.
- **Free Music Archive** — per-track licences; the CC0 tracks are the clean ones.

"Copyright-free" is almost always a misnomer — "copyright-**safe** for YouTube" is
the accurate framing. Claims can still happen. Download from official sources,
not from "no copyright music" re-upload channels.

### Editing (if you ever cut outside the pipeline)

- **DaVinci Resolve** (free tier) — the consensus pick; colour, VFX and audio in one
- **Kdenlive** / **Shotcut** — open source, lighter, community support only

### Thumbnails

- **GIMP** / **Krita** — free, installable
- **Photopea** — browser Photoshop clone, free
- **Canva free tier** — fastest, but check asset licences per element

*(These are well-established tools; I did not independently verify current free-tier terms.)*

### Research, SEO & analytics

- **YouTube autocomplete** — free long-tail query discovery
- **Google Trends** — demand and seasonality, essential for trending-topic timing
- **YouTube Studio Analytics** — your own retention data; the most valuable signal you own
- **vidIQ / TubeBuddy free tiers** — basic only; the paid 20% is scoring and volume estimates
- **Google Search Console** — if the channel has a companion site

Free tiers change constantly — check current pricing pages before depending on one.

---

## 5. Honest limits of this research

- I **cannot watch video**, so no reference video, tool demo or competitor channel
  was visually assessed. YouTube also blocks transcript access from this IP.
- I have **no YouTube analytics API access**, so nothing here is backed by real
  view data — it is search plus judgement.
- Much of the "best free tools 2026" web corpus is affiliate content. Where
  sources disagreed, I verified against the primary repo or API and marked it ✅.
- Free-tier terms move. Licences of *model weights* move too. Re-check before
  depending on anything here commercially.

---

## Sources

Monetisation policy: [Medium analysis](https://mateostarcevicfilipovic.medium.com/youtube-quietly-demonetizes-faceless-ai-channels-since-july-2025-30b3d2daaf2e) ·
[OutlierKit](https://outlierkit.com/resources/youtube-ai-slop-crackdown-2026/) ·
[Miraflow](https://miraflow.ai/blog/youtube-monetization-ai-content-2026-allowed-demonetized) ·
[NoFaceTube](https://nofacetube.com/guides/youtube-inauthentic-content-policy/) ·
[ScaleLab](https://scalelab.com/en/why-youtube-is-cracking-down-on-ai-generated-content-in-2026)

TTS & cloning: [BentoML](https://www.bentoml.com/blog/exploring-the-world-of-open-source-text-to-speech-models) ·
[Eden AI](https://www.edenai.co/post/top-free-text-to-speech-tools-apis-and-open-source-models) ·
[LocalAIMaster](https://localaimaster.com/blog/best-local-tts-models) ·
[AI Stack Digest](https://aistackdigest.com/ai-comparisons/best-open-source-ai-voice-cloning-tools-2026/) ·
[OpenVoice model card](https://huggingface.co/myshell-ai/OpenVoiceV2)

Stock & music: [TechRadar](https://www.techradar.com/best/free-stock-videos) ·
[Barn Images](https://barnimages.com/blog/resources/free-stock-video-sites/) ·
[vidIQ on Audio Library](https://www.vidiq.com/blog/post/royalty-free-music-youtube-audio-library) ·
[Hello Thematic](https://hellothematic.com/best-free-youtube-music-websites/)

Editing & SEO: [Lilach Bullock](https://www.lilachbullock.com/free-video-editing-software-that-actually-works/) ·
[ToolRadar](https://toolradar.com/compare/kdenlive-vs-davinci-resolve) ·
[Limelight Digital](https://www.limelightdigital.co.uk/youtube-keyword-research-tools/) ·
[Konabayev](https://konabayev.com/blog/youtube-seo-tools/)
