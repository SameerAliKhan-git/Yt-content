import { C, F, W, H, SAFE } from '../lib/theme.js';
import { clamp, lerp, tw, E, hexA, hash01, count, commas } from '../lib/anim.js';
import { text, headline, roundRect, panel, arrow, drawFeature, featureBounds, makeProj,
         source, barsH, wafer, pin, circleHL } from '../lib/draw.js';
import { segA, segP, slate, cards, machine } from './_util.js';

const ACT3 = 'ACT III — THE SECOND CHOKEPOINT';

// ------------------------------------------------------- THE FOUNDRY BET ----
export function foundry_split(g, s, ctx) {
  slate(g, s, ACT3);

  // L0: having the machine isn't enough
  const a0 = segA(s, 0, 0, 0.4);
  if (a0 > 0) {
    g.save(); g.globalAlpha = a0;
    machine(g, W / 2 - 60, H / 2 + 20, 0.62, { prog: 1, alpha: a0 * 0.5 });
    text(g, '?', W / 2 + 430, H / 2 + 60, { size: 240, fam: F.stat, fill: C.red, align: 'center', alpha: s.tw(0, 0.4, 0.7) });
    headline(g, 'HAVING IT IS NOT\nUSING IT', SAFE.x, 216, { size: 62, maxW: 900, reveal: s.tw(0, 0.05, 0.8) });
    g.restore();
  }

  // L1: push to Taiwan
  const a1 = segA(s, 1, 1, 0.42);
  if (a1 > 0 && ctx.assets.geo) {
    const p = segP(s, 1, 1);
    g.save(); g.globalAlpha = a1;
    const scale = lerp(760, 17000, E.inOutCubic(clamp(p * 1.2)));
    const proj = makeProj({ scale, cx: lerp(100, 120.9, clamp(p * 1.3)), cy: lerp(30, 23.7, clamp(p * 1.3)), oy: H / 2 + 40 });
    drawFeature(g, ctx.assets.geo.land, proj, { fill: hexA(C.ink, 0.12) });
    const tw_ = ctx.assets.geo.byName['Taiwan'];
    if (tw_) drawFeature(g, tw_, proj, { fill: hexA(C.red, 0.3), stroke: C.red, width: 4 });
    if (p > 0.55) {
      const [tx, ty] = proj(120.9, 23.9);
      circleHL(g, tx, ty, 210, 300, { color: C.red, width: 7, prog: clamp((p - 0.55) * 3) });
      text(g, 'TAIWAN', tx + 260, ty, {
        size: 52, fam: F.display, fill: C.ink, caps: true, track: 2, base: 'middle', alpha: clamp((p - 0.7) * 4),
      });
    }
    g.restore();
  }

  // L2: integrated model
  const a2 = segA(s, 2, 2, 0.4);
  if (a2 > 0) {
    const p = segP(s, 2, 2);
    g.save(); g.globalAlpha = a2;
    headline(g, 'BEFORE: ONE ROOF', SAFE.x, 216, { size: 64, maxW: 1000, reveal: s.tw(2, 0.05, 0.8) });
    const bx = W / 2 - 330, by = H / 2 - 150;
    panel(g, bx, by, 660, 340, { fill: C.white, r: 12, shadow: 0.1, alpha: clamp(p * 2) });
    g.strokeStyle = C.ink; g.lineWidth = 4; roundRect(g, bx, by, 660, 340, 12); g.stroke();
    ['DESIGN', 'MANUFACTURE'].forEach((k, i) => {
      const q = clamp((p * 1.6 - i * 0.2) * 3);
      if (q <= 0) return;
      g.globalAlpha = a2 * q;
      g.fillStyle = hexA(i ? C.teal : C.yellow, 0.2);
      roundRect(g, bx + 40, by + 50 + i * 140, 580, 110, 8); g.fill();
      text(g, k, bx + 330, by + 118 + i * 140, {
        size: 44, fam: F.display, fill: C.ink, align: 'center', caps: true, track: 1.6,
      });
    });
    g.globalAlpha = a2;
    text(g, 'SAME COMPANY', W / 2, by + 380, {
      size: 26, fam: F.label, weight: 700, fill: C.inkSoft, align: 'center', caps: true, track: 3,
    });
    g.restore();
  }

  // L3: the 1987 split
  const a3 = segA(s, 3, 3, 0.42);
  if (a3 > 0) {
    const p = segP(s, 3, 3);
    g.save(); g.globalAlpha = a3;
    headline(g, '1987: THE SPLIT', SAFE.x, 216, { size: 64, maxW: 1000, reveal: s.tw(3, 0.05, 0.8) });
    const spread = E.outCubic(clamp(p * 1.4)) * 330;
    [['FABLESS DESIGNERS', C.yellow, -1], ['PURE-PLAY FOUNDRY', C.teal, 1]].forEach(([k, col, dir], i) => {
      const x = W / 2 + dir * spread - 300, y = H / 2 - 110;
      g.save(); g.globalAlpha = a3 * clamp(p * 2);
      panel(g, x, y, 600, 240, { fill: C.white, r: 12, shadow: 0.1 });
      g.fillStyle = col; roundRect(g, x, y, 600, 10, 4); g.fill();
      text(g, k, x + 300, y + 110, {
        size: 38, fam: F.display, fill: C.ink, align: 'center', caps: true, track: 1.4,
      });
      text(g, i ? 'builds, never designs' : 'designs, never builds', x + 300, y + 160, {
        size: 26, fam: F.body, fill: C.inkSoft, align: 'center',
      });
      g.restore();
    });
    if (p > 0.6) {
      arrow(g, W / 2 - 40, H / 2 + 10, W / 2 + 40, H / 2 + 10, { color: C.ink, width: 4, head: 14, prog: clamp((p - 0.6) * 3) });
    }
    g.globalAlpha = a3 * clamp((p - 0.72) * 4);
    text(g, 'NEVER COMPETE WITH YOUR OWN CUSTOMERS', W / 2, H - 170, {
      size: 34, fam: F.display, fill: C.red, align: 'center', caps: true, track: 2,
    });
    g.restore();
  }
}

// ------------------------------------------------------------ MARKET SHARE ----
export function market_share(g, s) {
  slate(g, s, ACT3);

  // L0: fabless bloom around the foundry
  const a0 = segA(s, 0, 0, 0.4);
  if (a0 > 0) {
    const p = segP(s, 0, 0);
    g.save(); g.globalAlpha = a0;
    headline(g, 'DESIGNERS WITHOUT FACTORIES', SAFE.x, 216, { size: 60, maxW: 1200, reveal: s.tw(0, 0.05, 0.9) });
    const cx = W / 2, cy = H / 2 + 70;
    g.fillStyle = C.teal; g.beginPath(); g.arc(cx, cy, 108, 0, 7); g.fill();
    text(g, 'TSMC', cx, cy + 12, { size: 38, fam: F.display, fill: C.white, align: 'center', track: 1 });
    const names = ['APPLE', 'NVIDIA', 'QUALCOMM', 'AMD', 'BROADCOM', 'MEDIATEK'];
    names.forEach((n, i) => {
      const q = E.outBack(clamp((p * 1.5 - i * 0.11) * 3));
      if (q <= 0) return;
      const a = -Math.PI / 2 + (i / names.length) * Math.PI * 2;
      const r = 290 * clamp(q);
      const x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r * 0.78;
      g.save(); g.globalAlpha = a0 * clamp(q * 1.4);
      g.strokeStyle = hexA(C.inkSoft, 0.5); g.lineWidth = 2;
      g.beginPath(); g.moveTo(cx, cy); g.lineTo(x, y); g.stroke();
      g.fillStyle = C.white; roundRect(g, x - 92, y - 26, 184, 52, 6); g.fill();
      g.strokeStyle = C.yellow; g.lineWidth = 3; roundRect(g, x - 92, y - 26, 184, 52, 6); g.stroke();
      text(g, n, x, y + 8, { size: 23, fam: F.label, weight: 700, fill: C.ink, align: 'center', caps: true, track: 1.4 });
      g.restore();
    });
    g.restore();
  }

  // L1: the 70% bar
  const a1 = segA(s, 1, 1, 0.42);
  if (a1 > 0) {
    const p = segP(s, 1, 1);
    g.save(); g.globalAlpha = a1;
    headline(g, 'SHARE OF CONTRACT CHIPMAKING', SAFE.x, 216, { size: 56, maxW: 1200, reveal: s.tw(1, 0.05, 0.9) });
    g.restore();
    barsH(g, [
      { k: 'TSMC', v: 69.9, c: C.red },
      { k: 'SAMSUNG', v: 7.2, c: C.teal },
      { k: 'EVERYONE ELSE', v: 22.9, c: C.inkSoft },
    ], SAFE.x + 330, 400, {
      w: 1000, barH: 84, gap: 40, max: 75, prog: clamp(p * 1.5),
      valueFmt: v => v.toFixed(1) + '%',
    });
    g.save(); g.globalAlpha = a1 * clamp((p - 0.6) * 3);
    text(g, '2025, BY FOUNDRY REVENUE', SAFE.x + 330, H - 190, {
      size: 25, fam: F.label, weight: 600, fill: C.inkSoft, caps: true, track: 2,
    });
    g.restore();
    source(g, 'TrendForce-based reporting, 2025; other trackers measure a broader market and give lower figures', { alpha: a1 });
  }

  // L2: leading edge -> one option
  const a2 = segA(s, 2, 2, 0.42);
  if (a2 > 0) {
    const p = segP(s, 2, 2);
    g.save(); g.globalAlpha = a2;
    headline(g, 'AT THE LEADING EDGE:\nONE REAL OPTION', SAFE.x, 216, { size: 60, maxW: 1000, reveal: s.tw(2, 0.05, 0.9) });
    const cols = [['TSMC', C.red, 1], ['SAMSUNG', C.teal, 0.42], ['INTEL', C.blue, 0.3]];
    const bw = 300, gap = 50;
    const total = cols.length * bw + (cols.length - 1) * gap;
    cols.forEach(([k, col, h], i) => {
      const q = clamp((p * 1.5 - i * 0.14) * 3);
      if (q <= 0) return;
      const x = W / 2 - total / 2 + i * (bw + gap);
      const bh = 330 * h * E.outQuart(clamp(q));
      const fade = i === 0 ? 1 : lerp(1, 0.26, clamp((p - 0.5) * 2.4));
      g.save(); g.globalAlpha = a2 * clamp(q * 1.4) * fade;
      g.fillStyle = col; roundRect(g, x, H / 2 + 230 - bh, bw, bh, 6); g.fill();
      text(g, k, x + bw / 2, H / 2 + 282, {
        size: 28, fam: F.display, fill: C.ink, align: 'center', caps: true, track: 1.6,
      });
      if (i === 1) text(g, 'yield struggles', x + bw / 2, H / 2 + 318, { size: 22, fam: F.body, fill: C.inkSoft, align: 'center' });
      if (i === 2) text(g, 'years behind', x + bw / 2, H / 2 + 318, { size: 22, fam: F.body, fill: C.inkSoft, align: 'center' });
      g.restore();
    });
    g.restore();
  }
}

// ------------------------------------------------------------------ YIELD ----
export function yield_wafer(g, s, ctx) {
  slate(g, s, ACT3);

  // L0: the word
  const a0 = segA(s, 0, 0, 0.38);
  if (a0 > 0) {
    g.save(); g.globalAlpha = a0;
    headline(g, 'YIELD', W / 2, H / 2 + 40, { size: 190, align: 'center', reveal: s.tw(0, 0.1, 0.7), track: 6 });
    text(g, 'THE BORING REASON NOBODY CATCHES UP', W / 2, H / 2 + 120, {
      size: 30, fam: F.label, weight: 700, fill: C.inkSoft, align: 'center', caps: true, track: 4,
      alpha: s.tw(0, 0.5, 0.7),
    });
    g.restore();
  }

  // L1: two wafers, 80 vs 50
  const a1 = segA(s, 1, 1, 0.42);
  if (a1 > 0) {
    const p = segP(s, 1, 1);
    g.save(); g.globalAlpha = a1;
    headline(g, 'SAME MACHINES. DIFFERENT OUTCOME.', SAFE.x, 212, { size: 54, maxW: 1300, reveal: s.tw(1, 0.05, 0.9) });
    const y = H / 2 + 70;
    [[W / 2 - 420, 0.08, 'RIVAL A', 80, C.teal, 7],
     [W / 2 + 420, 0.34, 'RIVAL B', 50, C.red, 19]].forEach(([cx, dr, lab, good, col, seed], i) => {
      const q = clamp((p * 1.4 - i * 0.16) * 3);
      if (q <= 0) return;
      g.save(); g.globalAlpha = a1 * clamp(q * 1.3);
      wafer(g, cx, y, 200, { defectRate: dr, seed, prog: clamp(q * 1.3), showDefects: clamp((q - 0.4) * 3), cols: 13 });
      text(g, lab, cx, y + 260, {
        size: 27, fam: F.label, weight: 700, fill: C.inkSoft, align: 'center', caps: true, track: 2.4,
      });
      text(g, String(Math.round(good * clamp(q * 1.3))), cx, y + 330, {
        size: 76, fam: F.stat, fill: col, align: 'center',
      });
      text(g, 'GOOD CHIPS PER WAFER', cx, y + 364, {
        size: 21, fam: F.label, weight: 600, fill: C.inkSoft, align: 'center', caps: true, track: 1.6,
      });
      g.restore();
    });
    g.globalAlpha = a1 * clamp((p - 0.7) * 4);
    text(g, 'YOU LOSE.', W / 2, 330, {
      size: 54, fam: F.display, fill: C.red, align: 'center', caps: true, track: 3,
    });
    g.restore();
  }

  // L2: the flywheel
  const a2 = segA(s, 2, 2, 0.42);
  if (a2 > 0) {
    const p = segP(s, 2, 2);
    g.save(); g.globalAlpha = a2;
    headline(g, 'A FLYWHEEL', SAFE.x, 216, { size: 68, maxW: 900, reveal: s.tw(2, 0.05, 0.8) });
    const cx = W / 2, cy = H / 2 + 70, r = 210;
    const spin = s.t * clamp(p * 1.4) * 2.0;
    g.save();
    g.translate(cx, cy);
    g.strokeStyle = hexA(C.rule, 0.9); g.lineWidth = 22;
    g.beginPath(); g.arc(0, 0, r, 0, 7); g.stroke();
    g.rotate(spin);
    g.strokeStyle = C.teal; g.lineWidth = 22; g.lineCap = 'round';
    for (let i = 0; i < 3; i++) {
      g.beginPath(); g.arc(0, 0, r, i * 2.09, i * 2.09 + 1.5); g.stroke();
    }
    g.restore();
    [['VOLUME', -1], ['LEARNING', 1]].forEach(([k, dir], i) => {
      const q = clamp((p * 1.5 - i * 0.2) * 3);
      if (q <= 0) return;
      g.globalAlpha = a2 * q;
      text(g, k, cx + dir * 330, cy + (i ? 40 : -40), {
        size: 44, fam: F.display, fill: C.ink, align: 'center', caps: true, track: 1.6,
      });
    });
    g.globalAlpha = a2 * clamp((p - 0.55) * 3);
    text(g, 'VOLUME BUYS LEARNING. LEARNING BUYS VOLUME.', W / 2, H - 150, {
      size: 34, fam: F.display, fill: C.ink, align: 'center', caps: true, track: 1.8,
    });
    g.restore();
  }

  // L3: the Taiwan cluster
  const a3 = segA(s, 3, 3, 0.42);
  if (a3 > 0 && ctx.assets.geo) {
    const p = segP(s, 3, 3);
    g.save(); g.globalAlpha = a3;
    const tw_ = ctx.assets.geo.byName['Taiwan'];
    const proj = makeProj({ scale: 27000, cx: 120.95, cy: 23.75, ox: W / 2 + 380, oy: H / 2 + 40 });
    if (tw_) drawFeature(g, tw_, proj, { fill: hexA(C.ink, 0.12), stroke: C.ink, width: 3 });
    // fab cluster pins along the west coast corridor
    const fabs = [[120.98, 24.78, 'HSINCHU'], [120.65, 24.18, 'TAICHUNG'], [120.28, 23.12, 'TAINAN'], [121.0, 24.95, '']];
    fabs.forEach(([lon, lat, nm], i) => {
      const [x, y] = proj(lon, lat);
      const q = clamp((p * 1.5 - i * 0.14) * 4);
      if (q <= 0) return;
      pin(g, x, y, { color: C.red, r: 12, prog: q, label: nm || null, labelSize: 24, pulseP: ((s.t * 0.7 + i * 0.3) % 1) });
    });
    headline(g, 'FORTY YEARS,\nONE COASTLINE', SAFE.x, 300, { size: 72, maxW: 760, reveal: s.tw(3, 0.1, 1.0) });
    text(g, 'the leading edge of the world economy,\nclustered within a few dozen miles', SAFE.x, 520, {
      size: 29, fam: F.body, fill: C.inkSoft, alpha: clamp((p - 0.4) * 3),
    });
    g.restore();
  }
}
