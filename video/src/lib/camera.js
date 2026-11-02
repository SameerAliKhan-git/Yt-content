// "Camera moves that feel drawn rather than filmed."
//
// A filmed camera has weight, drift and noise. A drawn one is deliberate: it
// starts, eases, and settles, and it never wobbles. So every move here is a
// single eased interval with no overshoot and no handheld noise -- and the
// default is a slow push that the viewer should never consciously notice.
import { clamp, lerp, tw, E, hash01 } from './anim.js';
import { W, H } from './theme.js';

/** Identity camera. */
export const IDENT = { scale: 1, dx: 0, dy: 0, rot: 0 };

/**
 * Move kinds. Each returns a camera at local progress p (0..1).
 * `amt` scales the magnitude so one kind can be gentle or strong.
 */
const MOVES = {
  // slow, continuous push toward the centre of interest
  push: (p, amt, a) => ({ scale: lerp(1, 1 + 0.075 * amt, E.inOutCubic(p)),
                          dx: lerp(0, -a.x * 0.075 * amt, E.inOutCubic(p)),
                          dy: lerp(0, -a.y * 0.075 * amt, E.inOutCubic(p)), rot: 0 }),
  // start tight and reveal
  pull: (p, amt, a) => ({ scale: lerp(1 + 0.085 * amt, 1, E.outQuart(p)),
                          dx: lerp(-a.x * 0.085 * amt, 0, E.outQuart(p)),
                          dy: lerp(-a.y * 0.085 * amt, 0, E.outQuart(p)), rot: 0 }),
  // lateral drift, the Vox "map glide"
  driftX: (p, amt) => ({ scale: 1 + 0.03 * amt, dx: lerp(34 * amt, -34 * amt, E.inOutQuad(p)), dy: 0, rot: 0 }),
  driftY: (p, amt) => ({ scale: 1 + 0.03 * amt, dx: 0, dy: lerp(24 * amt, -24 * amt, E.inOutQuad(p)), rot: 0 }),
  // a decisive snap that settles -- used on hard statements
  settle: (p, amt) => ({ scale: lerp(1 + 0.11 * amt, 1, E.outQuint(p)), dx: 0, dy: 0, rot: 0 }),
  hold:   () => ({ ...IDENT }),
};

/**
 * Per-shot camera. `spec` may be {kind, amt, anchor:{x,y}} or omitted, in which
 * case a gentle push/pull is chosen deterministically from the shot id so the
 * film varies without anyone authoring it.
 */
export function cameraFor(shotId, p, spec) {
  const seed = [...String(shotId)].reduce((a, c) => a + c.charCodeAt(0), 0);
  const auto = hash01(seed, 5);
  const kind = spec?.kind ?? (auto < 0.52 ? 'push' : auto < 0.8 ? 'pull' : auto < 0.92 ? 'driftX' : 'driftY');
  const amt = spec?.amt ?? lerp(0.5, 1.0, hash01(seed, 9));
  const anchor = spec?.anchor ?? { x: (hash01(seed, 11) - 0.5) * W * 0.3,
                                   y: (hash01(seed, 13) - 0.5) * H * 0.25 };
  const fn = MOVES[kind] || MOVES.push;
  return fn(clamp(p), amt, anchor);
}

/** Apply a camera to the context. Always scales >1 so no edge is exposed. */
export function applyCam(g, cam) {
  const s = Math.max(1, cam.scale);
  g.translate(W / 2, H / 2);
  g.scale(s, s);
  if (cam.rot) g.rotate(cam.rot);
  g.translate(-W / 2 + cam.dx, -H / 2 + cam.dy);
}

/**
 * Depth offset for an element inside a camera move. depth 0 = glued to the
 * frame, 1 = full parallax. Scenes use this to separate foreground from
 * background without authoring layers by hand.
 */
export const par = (cam, depth = 1) => ({
  x: cam.dx * depth * 1.6,
  y: cam.dy * depth * 1.6,
});

/** Per-shot overrides, keyed by shot id. Hero beats get deliberate moves. */
export const SHOT_CAMERA = {
  cold_machine: { kind: 'push',   amt: 0.8,  anchor: { x: 0, y: 0 } },
  title:        { kind: 'settle', amt: 0.7 },
  chip_zoom:    { kind: 'hold' },            // the scene does its own zoom
  atoms:        { kind: 'push',   amt: 1.0 },
  source:       { kind: 'push',   amt: 0.6,  anchor: { x: -120, y: 40 } },
  zeiss:        { kind: 'pull',   amt: 0.9 },
  web:          { kind: 'driftX', amt: 0.8 },
  foundry:      { kind: 'hold' },            // scene zooms the map itself
  yield:        { kind: 'push',   amt: 0.5 },
  blockade:     { kind: 'push',   amt: 0.9,  anchor: { x: 0, y: 40 } },
  shortage:     { kind: 'driftY', amt: 0.6 },
  reshore:      { kind: 'pull',   amt: 0.7 },
  outro:        { kind: 'push',   amt: 1.0 },
  endcard:      { kind: 'settle', amt: 0.5 },
};
