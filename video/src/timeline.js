// Binds timing.json to scene renderers and exposes a deterministic seek().
import { C, W, H } from './lib/theme.js';
import { clamp, tw, E, hexA } from './lib/anim.js';
import { grain, vignette, text } from './lib/draw.js';
import { F } from './lib/theme.js';
import SCENES from './scenes/index.js';
import { cameraFor, applyCam, SHOT_CAMERA, IDENT } from './lib/camera.js';

const XF = 0.42;   // cross-fade / push duration between shots, seconds

/** Per-shot authoring state. Scenes get local time + per-line tween helpers. */
function shotState(shot, tAbs) {
  const t = tAbs - shot.start;
  const L = shot.lines;
  const s = {
    id: shot.id, type: shot.type, act: shot.act,
    t, dur: shot.dur, n: L.length, lines: L,
    /** local start time of line i (clamped to range) */
    ls: i => (L[Math.max(0, Math.min(L.length - 1, i))].start - shot.start),
    le: i => (L[Math.max(0, Math.min(L.length - 1, i))].end - shot.start),
    /** 0..1 progress through line i's own duration */
    on: i => {
      const l = L[Math.max(0, Math.min(L.length - 1, i))];
      return clamp((tAbs - l.start) / Math.max(0.001, l.dur));
    },
    /** tween anchored to line i's start, offset by delay */
    tw: (i, delay = 0, dur = 0.6, ease = E.outCubic) =>
      tw(t, (L[Math.max(0, Math.min(L.length - 1, i))].start - shot.start) + delay, dur, ease),
    /** true once line i has begun */
    said: i => tAbs >= L[Math.max(0, Math.min(L.length - 1, i))].start,
    /** index of the line currently being spoken */
    get active() {
      let a = 0;
      for (let i = 0; i < L.length; i++) if (tAbs >= L[i].start) a = i;
      return a;
    },
  };
  return s;
}

export function makeTimeline(timing, assets) {
  const shots = timing.shots;
  const fps = timing.fps;

  function draw(g, tAbs, frame) {
    // paper base
    g.fillStyle = C.bg; g.fillRect(0, 0, W, H);

    const idx = shots.findIndex(s => tAbs < s.end);
    const i = idx === -1 ? shots.length - 1 : idx;
    const cur = shots[i], prev = shots[i - 1];

    const ctx = { frame, t: tAbs, assets, fps };

    // outgoing shot cross-fades under the incoming one
    const into = cur ? (tAbs - cur.start) : 0;
    if (prev && into < XF) {
      const k = E.inOutQuad(clamp(into / XF));
      g.save();
      g.globalAlpha = 1 - k;
      g.translate(-W * 0.035 * k, 0);
      renderShot(g, prev, tAbs, ctx);
      g.restore();
      g.save();
      g.globalAlpha = k;
      g.translate(W * 0.045 * (1 - k), 0);
      renderShot(g, cur, tAbs, ctx);
      g.restore();
    } else if (cur) {
      renderShot(g, cur, tAbs, ctx);
    }

    vignette(g, 0.16);
    grain(g, 0.019, frame);
  }

  function renderShot(g, shot, tAbs, ctx) {
    const fn = SCENES[shot.type];
    const s = shotState(shot, tAbs);
    const spec = SHOT_CAMERA[shot.id];
    const cam = spec && spec.kind === 'hold'
      ? IDENT
      : cameraFor(shot.id, (tAbs - shot.start) / Math.max(0.001, shot.dur), spec);
    g.save();
    applyCam(g, cam);
    try {
      if (fn) fn(g, s, { ...ctx, cam });
      else placeholder(g, s);
    } catch (err) {
      g.restore(); g.save();
      text(g, 'SCENE ERROR: ' + shot.type, 140, 120, { size: 34, fam: F.mono, fill: C.red });
      text(g, String(err && err.message || err), 140, 170, { size: 22, fam: F.mono, fill: C.inkSoft });
      if (ctx.strict) throw err;
    }
    g.restore();
  }

  function placeholder(g, s) {
    text(g, s.type, W / 2, H / 2, { size: 60, fam: F.display, fill: C.rule, align: 'center', caps: true });
  }

  return { draw, fps, duration: timing.duration, frames: timing.frames, shots };
}
