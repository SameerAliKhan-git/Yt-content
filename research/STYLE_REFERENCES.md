# Style reference library

The standing visual reference set for this channel: **motion-graphics and
styling only**.

Source compilation: *20 Best Explainer Videos in 2025* — Kasra Design
<https://youtu.be/8MjDZtMj3-I>

Each entry below is a separate film by a different team for a different client.
They are a **library to study**, not a single house style to average together.

| # | At | Reference | Source |
|---|---|---|---|
| 1 | 00:04 | Airbnb India | <https://vimeo.com/579660895> |
| 2 | 00:17 | Arrow Electronics | <https://vimeo.com/649123257> |
| 3 | 00:31 | Zaptec | <https://vimeo.com/931314474> |
| 4 | 00:43 | Hendrick's Amazonia | <https://vimeo.com/569777581> |
| 5 | 00:56 | Bellefaire | <https://vimeo.com/485517481> |
| 6 | 01:10 | Nansen | <https://vimeo.com/693182101> |
| 7 | 01:23 | Outside · Creative Block | <https://vimeo.com/1050710359> |
| 8 | 01:38 | Christianity Explored | <https://vimeo.com/513045562> |
| 9 | 01:52 | ServiceNow | <https://vimeo.com/838315006> |
| 10 | 02:05 | Dash 4 Cash | <https://vimeo.com/1023358247> |
| 11 | 02:17 | Wix AI Capabilities | <https://vimeo.com/1009776447> |
| 12 | 02:31 | Uiflow | <https://vimeo.com/673104482> |
| 13 | 02:44 | Amparo & Justice | <https://vimeo.com/218687129> |
| 14 | 02:59 | NSW Smart Places | <https://vimeo.com/553336319> |
| 15 | 03:13 | Netflix Shirley | <https://vimeo.com/928008050> |
| 16 | 03:27 | JRS USA | <https://vimeo.com/609046909> |
| 17 | 03:40 | Noom Yoyo | <https://vimeo.com/676117322> |
| 18 | 03:53 | Babylon Finance | <https://vimeo.com/646936260> |
| 19 | 04:07 | Discord Safety | <https://vimeo.com/892730567> |
| 20 | 04:22 | Motion Design School | <https://vimeo.com/340400881> |

## How these are used

**Technique only.** Pacing, shot length, transition duration, caption
placement, camera movement, how a hook is built. Measured with the
`learn-style` skill into `my-style`.

**Never carried across:** their footage, wording, logos, brand colours, fonts,
or client IP. These are commercial films for Airbnb, Netflix, Discord,
ServiceNow and others.

**Never averaged into one palette.** Twenty clients, twenty brands. Measure
each separately and report the spread.

## Status

Catalogued, not yet measured. Both platforms block automated download from this
container (YouTube 403 on media, Vimeo login-required), so measurement needs
the file supplied directly or the analysis run locally.

Once a file exists:

```bash
bash .claude/skills/learn-style/scripts/split_showreel.sh <reel.mp4> \
     .claude/skills/learn-style/references/kasra_20_chapters.json work/
bash .claude/skills/learn-style/scripts/run_all.sh work/
```
