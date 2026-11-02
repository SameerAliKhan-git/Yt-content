# Recording your voice reference

One recording, reused for every video. Spend 20 minutes getting it right — the
clone can only be as good as this sample.

## What to record

- **Length:** 3–5 minutes of clean speech. More is better; under 2 minutes gets noticeably worse.
- **Delivery:** the voice you want *in the videos* — measured, documentary, slightly
  slower than conversation. Do **not** read brightly or like an advert. The clone
  copies your delivery, not just your timbre.
- **One take, one mic position.** Don't move closer or further between sentences.

## Technical

| | |
|---|---|
| Format | **WAV** or FLAC — never MP3 |
| Sample rate | 24 kHz minimum, 44.1/48 kHz ideal |
| Channels | mono |
| Processing | **none** — no noise reduction, no compression, no EQ, no reverb |

The last row matters most. Noise reduction leaves artefacts the model learns as
part of your voice. Record clean rather than cleaning up afterwards.

## Room

- Soft furnishings kill echo — record in a room with a rug, curtains, a sofa. A
  wardrobe full of clothes is genuinely excellent. Avoid kitchens and bathrooms.
- Kill fans, AC, fridges, laptops with spinning fans. Put the phone on airplane mode.
- Mic about a hand's width from your mouth, slightly off-axis so plosives
  ("p", "b") don't thump.
- A phone's voice-memo app in a quiet, soft room beats a good mic in an echoey one.

## Free tools to record with

- **Audacity** (free, open source) — set the project rate to 48000, record mono,
  export as WAV 16-bit PCM. Do not apply any effects.
- **Your phone's voice recorder** — fine if it saves WAV/lossless. Check the
  setting; many default to compressed m4a.

## Where to put it

Save as `assets/voice/reference.wav`. Two or three takes is fine
(`reference_01.wav`, …) — more clean material helps.

---

## Read this aloud

Written for this channel: documentary cadence, and loaded with the numbers,
place names and technical terms these scripts actually contain. Read it at the
pace you want narration to sit at. Pause naturally at the full stops.

> There is a building in the Netherlands that makes a machine. Only one company
> on Earth knows how to build it, and without it, the most advanced computer
> chips in the world do not get made.
>
> In nineteen seventy-one, the features on a chip were ten thousand nanometres
> across. Today the leading edge is three nanometres — and that name is mostly
> marketing, because the real structures are only a few dozen atoms wide.
>
> The machine is assembled from roughly one hundred thousand parts, sourced from
> more than five thousand suppliers across twenty-nine countries. It ships in two
> hundred and fifty crates. It costs over three hundred and fifty million euros.
>
> Taiwan, South Korea, Japan, the Netherlands, Germany, the United States, China.
> Hsinchu, Veldhoven, Dresden, Kumamoto, Phoenix Arizona. The Strait of Hormuz,
> the Suez Canal, the South China Sea.
>
> By the end of twenty twenty-one, the shortage had cost the car industry two
> hundred and ten billion dollars in lost revenue, and about seven point seven
> million vehicles that were simply never built.
>
> So what actually happens if the island stops? The estimates carry enormous
> uncertainty, and anyone who tells you otherwise is selling something. Rhodium
> Group put over two trillion dollars of annual economic activity at risk.
> Bloomberg Economics modelled a year-long blockade and got roughly five percent
> off global output.
>
> None of this happened because of a conspiracy, or a failure. It happened
> because of specialisation. Every step made chips cheaper and better, faster
> than almost anything humans have ever built.
>
> The fragility was not the price of getting it wrong. It was the price of
> getting it relentlessly right.
>
> We built the most sophisticated supply chain in history, and we optimised it
> until there was almost no slack left anywhere in it.

That is roughly three and a half minutes read at documentary pace. If you have
time, also record thirty seconds of **silence** in the same room — it gives a
noise profile that helps verify the recording is clean.
