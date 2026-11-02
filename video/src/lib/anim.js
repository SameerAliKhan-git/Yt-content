// Deterministic animation maths. Nothing here may read a clock.

export const clamp = (v, a = 0, b = 1) => v < a ? a : v > b ? b : v;
export const lerp  = (a, b, t) => a + (b - a) * t;
export const inv   = (v, a, b) => b === a ? 0 : clamp((v - a) / (b - a));
export const mix   = (a, b, t) => a.map((v, i) => lerp(v, b[i], t));

// ---- easings -------------------------------------------------------------
export const E = {
  linear: t => t,
  inQuad:  t => t * t,
  outQuad: t => 1 - (1 - t) ** 2,
  inOutQuad: t => t < .5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2,
  outCubic: t => 1 - (1 - t) ** 3,
  inOutCubic: t => t < .5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2,
  outQuart: t => 1 - (1 - t) ** 4,
  outQuint: t => 1 - (1 - t) ** 5,
  outExpo: t => t >= 1 ? 1 : 1 - 2 ** (-10 * t),
  inOutExpo: t => t === 0 ? 0 : t === 1 ? 1 : t < .5
      ? 2 ** (20 * t - 10) / 2 : (2 - 2 ** (-20 * t + 10)) / 2,
  outBack: t => 1 + 2.70158 * (t - 1) ** 3 + 1.70158 * (t - 1) ** 2,
  outElastic: t => t === 0 ? 0 : t === 1 ? 1
      : 2 ** (-10 * t) * Math.sin((t * 10 - .75) * (2 * Math.PI / 3)) + 1,
  outBounce: t => {
    const n = 7.5625, d = 2.75;
    if (t < 1 / d) return n * t * t;
    if (t < 2 / d) return n * (t -= 1.5 / d) * t + .75;
    if (t < 2.5 / d) return n * (t -= 2.25 / d) * t + .9375;
    return n * (t -= 2.625 / d) * t + .984375;
  },
};

/** Progress of a tween starting at `start` lasting `dur`, at local time t. */
export const tw = (t, start, dur, ease = E.outCubic) =>
  ease(clamp(dur <= 0 ? (t >= start ? 1 : 0) : (t - start) / dur));

/** Progress that rises then falls — for things that appear and leave. */
export const pulse = (t, start, rise, hold, fall, ease = E.outCubic) => {
  if (t < start) return 0;
  if (t < start + rise) return ease(clamp((t - start) / rise));
  if (t < start + rise + hold) return 1;
  return 1 - ease(clamp((t - start - rise - hold) / fall));
};

/** i-th item of a staggered group. */
export const stag = (t, start, step, dur, i, ease = E.outCubic) =>
  tw(t, start + i * step, dur, ease);

// ---- deterministic randomness -------------------------------------------
export function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let x = Math.imul(a ^ (a >>> 15), 1 | a);
    x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x;
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}
/** Stable pseudo-random in [0,1) for an integer key — no state. */
export const hash01 = (i, salt = 0) => {
  let x = Math.imul(i ^ (salt * 0x9E3779B1), 0x85EBCA6B);
  x ^= x >>> 13; x = Math.imul(x, 0xC2B2AE35); x ^= x >>> 16;
  return (x >>> 0) / 4294967296;
};

// ---- formatting ----------------------------------------------------------
export const commas = n =>
  Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');

export const fmtMoney = n => {
  if (n >= 1e12) return '$' + (n / 1e12).toFixed(n < 1e13 ? 1 : 0) + 'T';
  if (n >= 1e9)  return '$' + (n / 1e9).toFixed(0) + 'B';
  if (n >= 1e6)  return '$' + (n / 1e6).toFixed(0) + 'M';
  return '$' + commas(n);
};

/** Counts up to `to`, easing out, during a tween. */
export const count = (t, start, dur, to, from = 0, ease = E.outExpo) =>
  lerp(from, to, tw(t, start, dur, ease));

// ---- colour --------------------------------------------------------------
export function hexA(hex, a) {
  const h = hex.replace('#', '');
  const n = parseInt(h.length === 3 ? h.split('').map(c => c + c).join('') : h, 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}
