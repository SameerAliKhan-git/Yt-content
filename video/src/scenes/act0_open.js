import { C, F, W, H, SAFE } from '../lib/theme.js';
import { clamp, lerp, tw, E, hexA, hash01, count, commas } from '../lib/anim.js';
import { text, headline, roundRect, panel, arrow, drawFeature, makeProj, source, measure } from '../lib/draw.js';
import { segA, segP, machine, scaleBar, readout, darkStage, cards } from './_util.js';
import { euvScanner, callout } from '../assets/registry.js';

// ---------------------------------------------------------- COLD OPEN ----
export function coldopen_machine(g, s, ctx) {
  darkStage(g);
  const white = '#F3EFE7';

  // --- L0: the machine + scale -------------------------------------------
  const aM = segA(s, 0, 2, 0.5);
  if (aM > 0) {
    // the real machine: LPP source -> illuminator -> reticle -> 6-mirror
    // projection optics -> wafer stage, assembling as the line is spoken
    euvScanner(g, W / 2, H / 2 + 70, 0.90, {
      build: s.tw(0, 0.2, 3.2, E.outCubic),
      beam: s.tw(1, 0.3, 1.4),
      labels: s.tw(0, 1.6, 1.2),
      dark: true, t: s.t,
    });
    g.save(); g.globalAlpha = aM;
    scaleBar(g, W / 2 - 540, H / 2 + 420, 1080, 'ABOUT THE LENGTH OF A BUS',
      { prog: s.tw(0, 1.9, 1.1), color: hexA(white, 0.72) });
    g.restore();
  }

  // --- L1: parts / suppliers / countries ---------------------------------
  const a1 = segA(s, 1, 1, 0.4);
  if (a1 > 0) {
    const p = s.tw(1, 0.35, 1.9, E.outExpo);
    const items = [
      [count(s.t, s.ls(1) + 0.35, 1.9, 100000), 'PARTS'],
      [count(s.t, s.ls(1) + 0.55, 1.9, 5000), 'SUPPLIERS'],
      [count(s.t, s.ls(1) + 0.75, 1.9, 29), 'COUNTRIES'],
    ];
    g.save(); g.globalAlpha = a1 * clamp(p * 1.2);
    g.strokeStyle = hexA(white, 0.14); g.lineWidth = 2;
    g.beginPath(); g.moveTo(SAFE.x, 252); g.lineTo(W - SAFE.x, 252); g.stroke();
    g.restore();
    items.forEach(([v, k], i) => {
      readout(g, v, k, SAFE.x + 400 + i * 470, 206, {
        size: 64, color: i === 0 ? C.yellow : white, alpha: a1 * clamp(p * 1.4 - i * 0.1),
        suffix: i === 1 ? '+' : '',
      });
    });
  }

  // --- L2: crates + install time -----------------------------------------
  const a2 = segA(s, 2, 2, 0.4);
  if (a2 > 0) {
    const p = s.tw(2, 0.25, 1.8, E.outQuart);
    g.save(); g.globalAlpha = a2;
    const N = 50, cols = 25, cw = 42, chh = 26;
    const ox = W / 2 - (cols * cw) / 2, oy = H - 230;
    for (let i = 0; i < N; i++) {
      if (i / N > p) break;
      const r = Math.floor(i / cols), c = i % cols;
      g.fillStyle = hexA(C.yellow, 0.22 + 0.5 * hash01(i, 11));
      roundRect(g, ox + c * cw, oy - r * (chh + 5), cw - 5, chh, 2); g.fill();
    }
    text(g, '250 CRATES  ·  MONTHS TO INSTALL', W / 2, H - 140, {
      size: 30, fam: F.label, weight: 700, fill: white, align: 'center',
      caps: true, track: 3, alpha: a2 * clamp(p * 2 - 1),
    });
    g.restore();
  }

  // --- L3: one company --------------------------------------------------
  const a3 = segA(s, 3, 3, 0.42);
  if (a3 > 0) {
    const p = s.tw(3, 0.2, 1.5, E.outCubic);
    g.save(); g.globalAlpha = a3;
    const n = 6, bw = 190, bh = 120, gap = 26;
    const ox = W / 2 - (n * bw + (n - 1) * gap) / 2;
    for (let i = 0; i < n; i++) {
      const on = i === 2;
      const dim = on ? 1 : 1 - clamp((p - 0.25) * 2);
      const x = ox + i * (bw + gap), y = H / 2 - bh / 2;
      g.globalAlpha = a3 * (on ? 1 : lerp(0.14, 0.75, dim));
      g.fillStyle = on ? C.yellow : hexA(white, 0.3);
      roundRect(g, x, y, bw, bh, 8); g.fill();
      if (on && p > 0.55) {
        g.globalAlpha = a3 * clamp((p - 0.55) * 3);
        text(g, 'ASML', x + bw / 2, y + bh / 2 + 10, {
          size: 34, fam: F.display, fill: C.dark, align: 'center', track: 1,
        });
      }
    }
    g.globalAlpha = a3 * clamp((p - 0.6) * 3);
    text(g, 'ONE SUPPLIER ON EARTH', W / 2, H / 2 + 150, {
      size: 34, fam: F.label, weight: 700, fill: white, align: 'center', caps: true, track: 4,
    });
    g.restore();
  }

  // --- L4: the world goes dark ------------------------------------------
  const a4 = segA(s, 4, 4, 0.42);
  if (a4 > 0 && ctx.assets.geo) {
    const p = s.tw(4, 0.15, 2.6, E.inOutQuad);
    const proj = makeProj({ scale: 620, cx: 10, cy: 24, oy: H / 2 + 40 });
    g.save(); g.globalAlpha = a4;
    drawFeature(g, ctx.assets.geo.land, proj, { fill: hexA(white, 0.14) });
    const order = ['United States of America', 'China', 'Germany', 'Japan', 'South Korea', 'India', 'Brazil'];
    order.forEach((nm, i) => {
      const f = ctx.assets.geo.byName[nm]; if (!f) return;
      const q = clamp((p - i * 0.11) * 5);
      drawFeature(g, f, proj, { fill: hexA(white, 0.5 * (1 - q)), stroke: hexA(C.red, 0.5 * q), width: 2 });
    });
    text(g, 'NOT AMERICA.   NOT CHINA.   NOWHERE.', W / 2, H - 170, {
      size: 36, fam: F.label, weight: 700, fill: C.red, align: 'center', caps: true, track: 3.5,
      alpha: a4 * clamp((p - 0.5) * 3),
    });
    g.restore();
  }

  // --- L5: the pipeline narrows -----------------------------------------
  const a5 = segA(s, 5, 5, 0.45);
  if (a5 > 0) {
    const p = s.tw(5, 0.2, 2.4, E.inOutCubic);
    g.save(); g.globalAlpha = a5;
    const cy = H / 2, nx = W * 0.62;
    const N = 26;
    for (let i = 0; i < N; i++) {
      const y0 = cy - 300 + (i / (N - 1)) * 600;
      const y1 = lerp(y0, cy + (i - (N - 1) / 2) * 1.6, p);
      g.strokeStyle = hexA(i % 4 === 0 ? C.yellow : white, 0.3 + 0.3 * hash01(i, 5));
      g.lineWidth = 2.5;
      g.beginPath(); g.moveTo(SAFE.x - 60, y0);
      g.bezierCurveTo(W * 0.4, y0, W * 0.5, y1, nx, y1); g.stroke();
    }
    g.strokeStyle = C.red; g.lineWidth = 4;
    const nh = lerp(600, 26, p);
    g.beginPath(); g.moveTo(nx, cy - nh / 2); g.lineTo(nx, cy + nh / 2); g.stroke();
    g.globalAlpha = a5 * clamp((p - 0.55) * 3);
    text(g, 'THE NARROWEST BOTTLENECK', nx + 50, cy - 16, {
      size: 40, fam: F.display, fill: white, track: 1,
    });
    text(g, 'IN THE GLOBAL ECONOMY', nx + 50, cy + 32, {
      size: 40, fam: F.display, fill: C.red, track: 1,
    });
    g.restore();
  }
}

// --------------------------------------------------------- TITLE CARD ----
export function title_card(g, s) {
  g.fillStyle = C.ink; g.fillRect(0, 0, W, H);
  const p = tw(s.t, 0.05, 0.7, E.outQuint);
  const bar = tw(s.t, 0.0, 0.55, E.outExpo);
  g.save();
  g.fillStyle = C.red;
  g.fillRect(W / 2 - 1400 * bar / 2, H / 2 - 150, 1400 * bar, 8);
  const sc = lerp(1.08, 1, p);
  g.translate(W / 2, H / 2); g.scale(sc, sc); g.translate(-W / 2, -H / 2);
  headline(g, 'THE CHOKEPOINT', W / 2, H / 2 + 54, {
    size: 168, align: 'center', fill: C.bg, reveal: p, maxW: 1700, track: 3,
  });
  g.restore();
  text(g, 'HOW ONE MACHINE CONTROLS THE MODERN WORLD', W / 2, H / 2 + 150, {
    size: 32, fam: F.label, weight: 600, fill: hexA(C.bg, 0.72), align: 'center',
    caps: true, track: 6, alpha: tw(s.t, 0.55, 0.6),
  });
}
