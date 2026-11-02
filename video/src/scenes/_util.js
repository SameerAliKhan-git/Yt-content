// Shared scene helpers.
import { C, F, W, H, SAFE } from '../lib/theme.js';
import { clamp, lerp, tw, E, hexA, hash01, commas } from '../lib/anim.js';
import { text, measure, roundRect, panel, kicker, headline, stat, source } from '../lib/draw.js';

/** Alpha for a sub-visual that lives from line `from` to line `to` inclusive. */
export function segA(s, from, to = from, fade = 0.38) {
  const a = s.ls(from), b = s.le(to);
  const inA = tw(s.t, a - fade * 0.75, fade, E.outCubic);
  const outA = 1 - tw(s.t, b, fade, E.inOutQuad);
  return clamp(Math.min(inA, outA));
}

/** True-ish window helper: progress across lines `from`..`to`. */
export function segP(s, from, to = from) {
  return clamp((s.t - s.ls(from)) / Math.max(0.001, s.le(to) - s.ls(from)));
}

/** Act slate in the top-left — persistent orientation for the viewer. */
export function slate(g, s, label, { alpha = 1 } = {}) {
  if (!label) return;
  kicker(g, label, SAFE.x, 128, { fill: C.red, size: 24, alpha: alpha * 0.95, ruleW: 46 });
}

/** Big centred statement type on cream — the Vox "beat" card. */
export function beat(g, str, { prog = 1, size = 104, fill = C.ink, y = H / 2, maxW = 1480, alpha = 1 } = {}) {
  g.save(); g.globalAlpha *= alpha;
  const lines = String(str).toUpperCase().split('\n');
  const h = lines.length * size * 1.04;
  lines.forEach((ln, i) => headline(g, ln, W / 2, y - h / 2 + size * 0.84 + i * size * 1.04, {
    size, align: 'center', maxW, reveal: clamp(prog * 1.25 - i * 0.18), fill,
  }));
  g.restore();
}

/** Row of stat cards. items: [{v, k, c?}] */
export function cards(g, items, { y = H / 2 - 110, prog = 1, cw = 380, ch = 240, gap = 34, vSize = 92 } = {}) {
  const total = items.length * cw + (items.length - 1) * gap;
  let x = W / 2 - total / 2;
  items.forEach((d, i) => {
    const p = E.outBack(clamp((prog - i * 0.14) * 1.9));
    if (p <= 0) { x += cw + gap; return; }
    g.save();
    g.globalAlpha = clamp(p * 1.6);
    const sc = lerp(0.9, 1, clamp(p));
    g.translate(x + cw / 2, y + ch / 2); g.scale(sc, sc); g.translate(-cw / 2, -ch / 2);
    panel(g, 0, 0, cw, ch, { fill: C.white, r: 10, shadow: 0.09 });
    g.fillStyle = d.c || C.red; roundRect(g, 0, 0, cw, 9, 3); g.fill();
    text(g, d.v, cw / 2, ch * 0.56, { size: vSize, fam: F.stat, fill: C.ink, align: 'center' });
    text(g, d.k, cw / 2, ch * 0.78, {
      size: 25, fam: F.label, weight: 600, fill: C.inkSoft, align: 'center', caps: true, track: 2,
    });
    g.restore();
    x += cw + gap;
  });
}

/** The machine, drawn as a schematic silhouette. Reused in several shots. */
export function machine(g, cx, cy, sc, { prog = 1, alpha = 1, glow = 0, detail = 1 } = {}) {
  if (alpha <= 0) return;
  g.save(); g.globalAlpha *= alpha;
  g.translate(cx, cy); g.scale(sc, sc);
  const p = clamp(prog);

  // modules of the scanner, drawn back-to-front
  const mods = [
    [-330, -60, 150, 190, C.ink,   0.00], // source vessel
    [-180, -120, 180, 250, C.darkAlt, 0.08], // illuminator
    [  10, -150, 210, 280, C.ink,   0.16], // projection optics
    [ 230, -70, 170, 200, C.darkAlt, 0.24], // wafer stage
    [-360,  130, 760,  52, C.ink,   0.32], // base frame
  ];
  mods.forEach(([x, y, w, h, col, d], i) => {
    const q = E.outCubic(clamp((p - d) * 2.4));
    if (q <= 0) return;
    g.save(); g.globalAlpha *= q;
    g.translate(0, (1 - q) * 48);
    g.fillStyle = col; roundRect(g, x, y, w, h, 8); g.fill();
    g.restore();
  });

  if (detail > 0 && p > 0.4) {
    const q = clamp((p - 0.4) * 2.2) * detail;
    g.save(); g.globalAlpha *= q;
    // vacuum pipes
    g.strokeStyle = hexA(C.inkSoft, 0.85); g.lineWidth = 7; g.lineCap = 'round';
    g.beginPath(); g.moveTo(-255, 10); g.lineTo(-180, 10); g.stroke();
    g.beginPath(); g.moveTo(0, -20); g.lineTo(10, -20); g.stroke();
    g.beginPath(); g.moveTo(220, 20); g.lineTo(230, 20); g.stroke();
    // beam path
    if (glow > 0) {
      g.globalAlpha *= glow;
      g.strokeStyle = C.yellow; g.lineWidth = 5;
      g.setLineDash([16, 12]);
      g.beginPath();
      g.moveTo(-255, 0); g.lineTo(-90, 0); g.lineTo(-90, -70);
      g.lineTo(115, -70); g.lineTo(115, 40); g.lineTo(315, 40);
      g.stroke(); g.setLineDash([]);
      g.beginPath(); g.arc(-255, 0, 13, 0, 7); g.fillStyle = C.yellow; g.fill();
    }
    g.restore();
  }
  g.restore();
}

/** Horizontal scale bar with a label. */
export function scaleBar(g, x, y, w, label, { prog = 1, color = C.ink, alpha = 1 } = {}) {
  const p = clamp(prog); if (p <= 0 || alpha <= 0) return;
  g.save(); g.globalAlpha *= alpha;
  g.strokeStyle = color; g.lineWidth = 3;
  g.beginPath(); g.moveTo(x, y); g.lineTo(x + w * p, y); g.stroke();
  [[x, 1], [x + w, p > 0.98 ? 1 : 0]].forEach(([tx, a]) => {
    if (!a) return;
    g.beginPath(); g.moveTo(tx, y - 11); g.lineTo(tx, y + 11); g.stroke();
  });
  if (p > 0.6) text(g, label, x + w / 2, y + 36, {
    size: 24, fam: F.label, weight: 600, fill: color, align: 'center', caps: true, track: 1.8,
    alpha: clamp(p * 2.5 - 1.5),
  });
  g.restore();
}

/** Animated integer readout, right-aligned monospace. */
export function readout(g, value, label, x, y, { size = 56, color = C.ink, alpha = 1, suffix = '' } = {}) {
  if (alpha <= 0) return;
  text(g, commas(value) + suffix, x, y, { size, fam: F.mono, weight: 500, fill: color, align: 'right', alpha });
  text(g, label, x, y + 30, {
    size: 22, fam: F.label, weight: 600, fill: C.inkSoft, align: 'right', caps: true, track: 1.6, alpha,
  });
}

/** Dark full-frame backdrop for the "physics" shots. */
export function darkStage(g, { alpha = 1 } = {}) {
  if (alpha <= 0) return;
  g.save(); g.globalAlpha *= alpha;
  g.fillStyle = C.dark; g.fillRect(0, 0, W, H);
  g.restore();
}

export { source };
