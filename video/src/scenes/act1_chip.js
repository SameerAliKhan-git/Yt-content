import { C, F, W, H, SAFE } from '../lib/theme.js';
import { clamp, lerp, inv, tw, E, hexA, hash01, count, commas } from '../lib/anim.js';
import { text, headline, roundRect, panel, arrow, lineChart, axes, source, measure, circleHL, underline } from '../lib/draw.js';
import { segA, segP, slate, cards, readout } from './_util.js';
import { dieFloorplan, finfetRow } from '../assets/registry.js';

// ------------------------------------------------- PHONE -> TRANSISTOR ----
export function chip_zoom(g, s, ctx) {
  slate(g, s, 'ACT I — WHAT A CHIP IS');
  const cx = W / 2, cy = H / 2 + 52;

  // stage 1: the phone, with the die sitting inside it
  const pIn = s.tw(0, 0.2, 1.1, E.outCubic);
  const zoom = s.tw(1, 0.1, 2.4, E.inOutCubic);      // phone -> die
  const deep = s.tw(1, 6.0, 2.4, E.inOutCubic);      // die -> transistors (after a hold)

  // phone body recedes as we push into the die
  const aPhone = clamp(1 - zoom * 1.25);
  if (aPhone > 0) {
    g.save(); g.globalAlpha = aPhone;
    const sc = lerp(1, 3.4, zoom);
    const pw = 300 * sc, ph = 614 * sc;
    g.strokeStyle = C.ink; g.lineWidth = 7;
    roundRect(g, cx - pw / 2, cy - ph / 2, pw, ph, 42 * sc); g.stroke();
    g.strokeStyle = hexA(C.ink, 0.25); g.lineWidth = 3;
    roundRect(g, cx - pw / 2 + 11 * sc, cy - ph / 2 + 13 * sc, pw - 22 * sc, ph - 26 * sc, 34 * sc); g.stroke();
    g.restore();
  }

  // the die: a real SoC floorplan, not a blank square
  const dieSc = lerp(0.12, 1.0, zoom);
  const dw = 700 * dieSc, dh = 516 * dieSc;
  const aDie = clamp(zoom * 3) * clamp(1 - deep * 1.3);
  if (aDie > 0) {
    dieFloorplan(g, cx - dw / 2, cy - dh / 2, dw, dh, {
      prog: clamp(zoom * 1.6), labels: clamp(zoom * 2 - 0.8), alpha: aDie, t: s.t,
    });
    if (zoom > 0.75) {
      g.save(); g.globalAlpha = aDie * clamp((zoom - 0.75) * 4);
      text(g, 'ONE SoC DIE  ·  ABOUT A FINGERNAIL ACROSS', cx, cy + dh / 2 + 54, {
        size: 25, fam: F.label, weight: 700, fill: C.inkSoft, align: 'center', caps: true, track: 2.4,
      });
      g.restore();
    }
  }

  // and under it: the actual switches
  if (deep > 0) {
    const a = clamp(deep * 2);
    g.save(); g.globalAlpha = a;
    const rows = 4, rh = 150;
    for (let r = 0; r < rows; r++) {
      finfetRow(g, 180, cy - (rows * rh) / 2 + r * rh, W - 360, rh - 26, {
        prog: clamp(deep * 1.5 - r * 0.12), alpha: 1, n: 9,
      });
    }
    g.restore();
  }

  // the count
  const a1 = s.tw(1, 1.0, 0.8);
  if (a1 > 0) {
    const v = count(s.t, s.ls(1) + 1.0, 2.8, 15e9);
    const px = W - SAFE.x - 820, py = 142;
    g.save();
    panel(g, px, py, 820, 142, { fill: hexA(C.bg, 0.95), r: 8, shadow: 0.1, alpha: a1 });
    g.fillStyle = C.red; roundRect(g, px, py, 820, 8, 3); g.fill();
    text(g, commas(v), px + 30, py + 92, { size: 80, fam: F.stat, fill: C.ink, alpha: a1 });
    text(g, 'TRANSISTORS ON ONE PIECE OF SILICON', px + 30, py + 124, {
      size: 23, fam: F.label, weight: 600, fill: C.inkSoft, caps: true, track: 2.2, alpha: a1,
    });
    g.restore();
  }
  source(g, 'block layout after published SoC die annotations', { alpha: a1 * 0.8 });
}

// ------------------------------------------------------- THE SWITCH ----
export function transistor_switch(g, s) {
  slate(g, s, 'ACT I — WHAT A CHIP IS');

  // L0: one switch toggling
  const a0 = segA(s, 0, 0, 0.4);
  if (a0 > 0) {
    const p = s.tw(0, 0.2, 0.8);
    const cyc = Math.max(0, s.t - s.ls(0) - 1.0);
    const on = Math.floor(cyc / 0.72) % 2 === 0;
    g.save(); g.globalAlpha = a0;
    const cx = W / 2, cy = H / 2 - 20;
    // wire
    g.strokeStyle = C.ink; g.lineWidth = 9; g.lineCap = 'round';
    g.beginPath(); g.moveTo(cx - 330 * p, cy); g.lineTo(cx - 90, cy); g.stroke();
    g.beginPath(); g.moveTo(cx + 90, cy); g.lineTo(cx + 330 * p, cy); g.stroke();
    // gate
    g.strokeStyle = on ? C.teal : C.red; g.lineWidth = 11;
    g.beginPath();
    if (on) { g.moveTo(cx - 90, cy); g.lineTo(cx + 90, cy); }
    else { g.moveTo(cx - 90, cy); g.lineTo(cx + 76, cy - 74); }
    g.stroke();
    [-90, 90].forEach(dx => {
      g.beginPath(); g.arc(cx + dx, cy, 13, 0, 7);
      g.fillStyle = C.ink; g.fill();
    });
    // current pulses
    if (on) {
      for (let i = 0; i < 7; i++) {
        const u = ((cyc * 0.9 + i / 7) % 1);
        const x = lerp(cx - 330, cx + 330, u);
        g.beginPath(); g.arc(x, cy, 8, 0, 7);
        g.fillStyle = hexA(C.yellow, 0.95 * Math.sin(u * Math.PI)); g.fill();
      }
    }
    text(g, on ? 'ON  ·  1' : 'OFF  ·  0', cx, cy + 150, {
      size: 48, fam: F.stat, fill: on ? C.teal : C.red, align: 'center', alpha: clamp(p * 2 - 1),
    });
    text(g, 'A TRANSISTOR IS A SWITCH', cx, 250, {
      size: 44, fam: F.display, fill: C.ink, align: 'center', caps: true, track: 2, alpha: p,
    });
    g.restore();
  }

  // L1: switch -> logic -> everything
  const a1 = segA(s, 1, 1, 0.42);
  if (a1 > 0) {
    const p = segP(s, 1, 1);
    g.save(); g.globalAlpha = a1;
    const steps = ['1 SWITCH', 'LOGIC GATE', 'ARITHMETIC', 'MEMORY', 'EVERYTHING'];
    const bw = 280, gap = 42;
    const total = steps.length * bw + (steps.length - 1) * gap;
    let x = W / 2 - total / 2;
    steps.forEach((k, i) => {
      const q = E.outBack(clamp((p * 1.25 - i * 0.17) * 3));
      if (q > 0) {
        g.save(); g.globalAlpha = a1 * clamp(q * 1.5);
        const y = H / 2 - 60;
        g.translate(x + bw / 2, y + 60); g.scale(lerp(0.86, 1, clamp(q)), lerp(0.86, 1, clamp(q)));
        g.translate(-bw / 2, -60);
        const col = [C.teal, C.teal, C.yellow, C.yellow, C.red][i];
        g.fillStyle = hexA(col, 0.14); roundRect(g, 0, 0, bw, 120, 8); g.fill();
        g.strokeStyle = col; g.lineWidth = 3; roundRect(g, 0, 0, bw, 120, 8); g.stroke();
        text(g, k, bw / 2, 70, { size: 32, fam: F.display, fill: C.ink, align: 'center', caps: true, track: 1 });
        // stacked count
        text(g, ['1', '4', '~30', '~1M', '15,000,000,000'][i], bw / 2, 104, {
          size: 20, fam: F.mono, fill: C.inkSoft, align: 'center',
        });
        g.restore();
      }
      if (i < steps.length - 1) {
        arrow(g, x + bw + 8, H / 2, x + bw + gap - 8, H / 2, {
          color: C.inkSoft, width: 4, head: 12, prog: clamp((p * 1.25 - i * 0.17 - 0.08) * 4),
        });
      }
      x += bw + gap;
    });
    g.restore();
  }
}

// ---------------------------------------------------- SHRINKING NODES ----
export function node_timeline(g, s) {
  slate(g, s, 'ACT I — WHAT A CHIP IS');
  const pts = [[1971, 10000], [1980, 3000], [1990, 800], [2000, 180],
               [2008, 45], [2014, 14], [2018, 7], [2020, 5], [2023, 3]];
  const box = { x: SAFE.x + 110, y: 290, w: W - SAFE.x * 2 - 220, h: 500 };
  const yDom = [2, 20000], xDom = [1971, 2025];

  const aAx = s.tw(0, 0.25, 0.8);
  axes(g, box, {
    yTicks: [10, 100, 1000, 10000], xTicks: [1971, 1990, 2000, 2010, 2023],
    fmtY: v => v >= 1000 ? (v / 1000) + 'k' : String(v),
    fmtX: v => String(v), logY: true, xDom, yDom, alpha: aAx,
  });
  text(g, 'FEATURE SIZE (NM, LOG SCALE)', box.x - 86, box.y - 40, {
    size: 23, fam: F.label, weight: 600, fill: C.inkSoft, caps: true, track: 2, alpha: aAx,
  });

  headline(g, 'MAKE THE SWITCHES SMALLER', SAFE.x, 212, {
    size: 66, maxW: 1200, reveal: s.tw(0, 0.1, 1.0), fill: C.ink,
  });

  const lp = s.tw(1, 0.1, 3.4, E.inOutQuad);
  const { px, py } = lineChart(g, pts, box, {
    logY: true, xDom, yDom, color: C.red, width: 7, prog: lp, dotR: 8, fillUnder: true,
  });

  // endpoint callouts
  [[0, '10,000 NM', '1971', C.inkSoft, -1], [pts.length - 1, '3 NM', '2023', C.red, 1]].forEach(([i, lab, yr, col, dir]) => {
    const q = i === 0 ? clamp(lp * 8) : clamp((lp - 0.93) * 14);
    if (q <= 0) return;
    const x = px(pts[i][0]), y = py(pts[i][1]);
    g.save(); g.globalAlpha = q;
    text(g, lab, x + dir * 24, y - (dir > 0 ? 26 : -40), {
      size: 40, fam: F.stat, fill: col, align: dir > 0 ? 'right' : 'left',
    });
    text(g, yr, x + dir * 24, y + (dir > 0 ? 4 : -10), {
      size: 24, fam: F.label, weight: 600, fill: C.inkSoft, align: dir > 0 ? 'right' : 'left', caps: true, track: 2,
    });
    g.restore();
  });

  // L2: the name is marketing
  const a2 = s.tw(2, 0.15, 0.8);
  if (a2 > 0) {
    panel(g, W / 2 - 520, H - 232, 1040, 128, { fill: C.white, r: 8, shadow: 0.1, alpha: a2 });
    text(g, '"3 NANOMETER" IS NOW A MARKETING NAME', W / 2, H - 182, {
      size: 32, fam: F.display, fill: C.ink, align: 'center', caps: true, track: 1.4, alpha: a2,
    });
    text(g, 'the real structures are a few dozen atoms wide', W / 2, H - 140, {
      size: 27, fam: F.body, fill: C.inkSoft, align: 'center', alpha: a2,
    });
  }
  source(g, 'Intel, TSMC & Samsung node roadmaps', { alpha: aAx * 0.85 });
}

// ------------------------------------------------------- ATOMIC SCALE ----
export function atom_scale(g, s) {
  slate(g, s, 'ACT I — WHAT A CHIP IS');
  const p = segP(s, 0, 0);
  const cx = W / 2, cy = H / 2 + 110;

  // lattice
  g.save();
  const step = 54, cols = 22, rows = 9;
  const ox = cx - (cols * step) / 2, oy = cy - (rows * step) / 2;
  for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) {
    const q = clamp((p * 1.4 - (i / cols) * 0.5 - hash01(i * 31 + j, 9) * 0.12) * 4);
    if (q <= 0) continue;
    const x = ox + i * step + (j % 2) * step / 2, y = oy + j * step;
    const br = 1 + 0.12 * Math.sin((s.t * 1.6) + i * 0.6 + j);
    g.globalAlpha = q * 0.9;
    g.beginPath(); g.arc(x, y, 13 * br, 0, 7);
    g.fillStyle = hexA(C.teal, 0.5); g.fill();
    g.strokeStyle = hexA(C.tealD, 0.8); g.lineWidth = 2; g.stroke();
  }
  g.restore();

  // the feature width bracket: ~30 atoms
  const ab = s.tw(0, 1.1, 1.2, E.outCubic);
  if (ab > 0) {
    const wpx = step * 10;
    g.save(); g.globalAlpha = ab;
    g.strokeStyle = C.red; g.lineWidth = 4;
    const by = oy - 54;
    g.beginPath();
    g.moveTo(cx - wpx / 2, by + 16); g.lineTo(cx - wpx / 2, by);
    g.lineTo(cx - wpx / 2 + wpx * ab, by);
    g.stroke();
    if (ab > 0.95) { g.beginPath(); g.moveTo(cx + wpx / 2, by); g.lineTo(cx + wpx / 2, by + 16); g.stroke(); }
    text(g, '≈ A FEW DOZEN ATOMS ACROSS', cx, by - 22, {
      size: 32, fam: F.display, fill: C.red, align: 'center', caps: true, track: 1.6, alpha: clamp(ab * 2 - 1),
    });
    g.restore();
  }

  // L0 statement
  const a0 = s.tw(0, 0.2, 0.9);
  headline(g, 'NOT MANUFACTURING.\nAPPLIED PHYSICS.', SAFE.x, 206, {
    size: 58, maxW: 980, reveal: a0,
  });

  // L1: "and the way you do it is with light" -> white flash out
  const a1 = s.tw(1, 0.25, 0.55, E.outQuad);
  if (a1 > 0) {
    g.save();
    text(g, 'TRILLIONS OF COMPONENTS A MONTH  ·  ALMOST NO MISTAKES ALLOWED', W / 2, H - 170, {
      size: 27, fam: F.label, weight: 600, fill: C.inkSoft, align: 'center', caps: true, track: 2.4, alpha: a1,
    });
    const fl = s.tw(1, 0.75, 0.5, E.inQuad);
    if (fl > 0) { g.globalAlpha = fl * 0.92; g.fillStyle = '#FFFFFF'; g.fillRect(0, 0, W, H); }
    g.restore();
  }
}
