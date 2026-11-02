import { C, F, W, H, SAFE } from '../lib/theme.js';
import { clamp, lerp, tw, E, hexA, hash01, count, commas } from '../lib/anim.js';
import { text, headline, roundRect, panel, arrow, drawFeature, makeProj, source,
         barsH, pin, circleHL } from '../lib/draw.js';
import { segA, segP, slate, cards } from './_util.js';

const ACT5 = 'ACT V — THE RESPONSE';

// ----------------------------------------------------------- BUILD / BLOCK ----
export function chips_act(g, s, ctx) {
  slate(g, s, ACT5);

  // L0 + L1: the two strategies
  const a0 = segA(s, 0, 1, 0.42);
  if (a0 > 0) {
    const p = segP(s, 0, 0);
    const hi = s.said(1) ? s.tw(1, 0.1, 0.6) : 0;
    g.save(); g.globalAlpha = a0;
    [['BUILD IT\nELSEWHERE', C.teal, -1], ['STOP THE\nCOMPETITION', C.red, 1]].forEach(([k, col, dir], i) => {
      const q = clamp((p * 1.5 - i * 0.18) * 3);
      if (q <= 0) return;
      const bw = 660, bh = 420;
      const x = W / 2 + dir * (bw / 2 + 30) - bw / 2, y = H / 2 - bh / 2 + 30;
      const dim = i === 0 ? 1 : lerp(1, 0.32, hi);
      g.save(); g.globalAlpha = a0 * clamp(q * 1.4) * dim;
      panel(g, x, y, bw, bh, { fill: C.white, r: 14, shadow: 0.1 });
      g.fillStyle = col; roundRect(g, x, y, bw, 12, 4); g.fill();
      text(g, 'STRATEGY ' + (i + 1), x + bw / 2, y + 80, {
        size: 26, fam: F.label, weight: 700, fill: C.inkSoft, align: 'center', caps: true, track: 3,
      });
      k.split('\n').forEach((ln, j) => text(g, ln, x + bw / 2, y + 180 + j * 62, {
        size: 54, fam: F.display, fill: C.ink, align: 'center', caps: true, track: 1.4,
      }));
      g.restore();
    });
    g.restore();
  }

  // L2: the money breakdown
  const a2 = segA(s, 2, 2, 0.44);
  if (a2 > 0) {
    const p = segP(s, 2, 2);
    g.save(); g.globalAlpha = a2;
    headline(g, 'THE CHIPS AND SCIENCE ACT, 2022', SAFE.x, 212, { size: 54, maxW: 1300, reveal: s.tw(2, 0.05, 0.9) });
    const v = count(s.t, s.ls(2) + 0.6, 2.2, 52.7);
    text(g, '$' + v.toFixed(1) + 'B', W / 2, 460, { size: 200, fam: F.stat, fill: C.ink, align: 'center' });
    g.restore();
    const bp = clamp((p - 0.4) * 2.2);
    if (bp > 0) {
      barsH(g, [
        { k: 'MANUFACTURING INCENTIVES', v: 39, c: C.teal },
        { k: 'R&D AND WORKFORCE', v: 13.7, c: C.yellow },
      ], SAFE.x + 480, 580, { w: 900, barH: 72, gap: 34, max: 42, prog: bp, valueFmt: v => '$' + v.toFixed(1) + 'B' });
      g.save(); g.globalAlpha = a2 * clamp((bp - 0.5) * 3);
      text(g, 'PLUS TENS OF BILLIONS IN LENDING AUTHORITY', SAFE.x + 480, H - 160, {
        size: 26, fam: F.label, weight: 600, fill: C.inkSoft, caps: true, track: 2,
      });
      g.restore();
    }
    source(g, 'CHIPS and Science Act, 2022', { alpha: a2 });
  }

  // L3: everyone else does it too
  const a3 = segA(s, 3, 3, 0.44);
  if (a3 > 0 && ctx.assets.geo) {
    const p = segP(s, 3, 3);
    g.save(); g.globalAlpha = a3;
    const proj = makeProj({ scale: 560, cx: 20, cy: 26, oy: H / 2 + 90 });
    drawFeature(g, ctx.assets.geo.land, proj, { fill: hexA(C.ink, 0.1) });
    const progs = [
      ['United States of America', 'USA', -100, 40],
      ['Germany', 'EU', 10, 51],
      ['Japan', 'JAPAN', 138, 37],
      ['South Korea', 'KOREA', 127, 36],
      ['India', 'INDIA', 78, 22],
      ['China', 'CHINA', 105, 35],
    ];
    progs.forEach(([nm, lab, lon, lat], i) => {
      const q = clamp((p * 1.4 - i * 0.12) * 4);
      if (q <= 0) return;
      const f = ctx.assets.geo.byName[nm];
      if (f) drawFeature(g, f, proj, { fill: hexA(C.teal, 0.45 * q), stroke: hexA(C.tealD, q), width: 2 });
      const [x, y] = proj(lon, lat);
      pin(g, x, y, { color: C.teal, r: 9, prog: q, label: lab, labelSize: 22 });
    });
    headline(g, 'EVERY BLOC IS DOING IT', SAFE.x, 212, { size: 58, maxW: 1100, reveal: s.tw(3, 0.05, 0.9) });
    text(g, 'TSMC in Arizona and Japan · Intel and Samsung expanding in the US', SAFE.x, H - 150, {
      size: 28, fam: F.body, fill: C.inkSoft, alpha: clamp((p - 0.5) * 3),
    });
    g.restore();
  }
}

// -------------------------------------------------------- EXPORT CONTROLS ----
export function export_controls(g, s, ctx) {
  slate(g, s, ACT5);

  // L0: strategy two highlighted
  const a0 = segA(s, 0, 0, 0.4);
  if (a0 > 0) {
    g.save(); g.globalAlpha = a0;
    const p = s.tw(0, 0.1, 0.8, E.outBack);
    g.translate(W / 2, H / 2); g.scale(lerp(0.85, 1, clamp(p)), lerp(0.85, 1, clamp(p))); g.translate(-W / 2, -H / 2);
    text(g, 'STOP THE', W / 2, H / 2 - 20, { size: 130, fam: F.display, fill: C.ink, align: 'center', caps: true, track: 3 });
    text(g, 'COMPETITION', W / 2, H / 2 + 110, { size: 130, fam: F.display, fill: C.red, align: 'center', caps: true, track: 3 });
    g.restore();
  }

  // L1: the timeline
  const a1 = segA(s, 1, 1, 0.44);
  if (a1 > 0) {
    const p = segP(s, 1, 1);
    g.save(); g.globalAlpha = a1;
    headline(g, 'TIGHTENED, THEN WIDENED', SAFE.x, 212, { size: 58, maxW: 1200, reveal: s.tw(1, 0.05, 0.9) });
    const ly = H / 2 + 60;
    g.strokeStyle = C.ink; g.lineWidth = 4;
    g.beginPath(); g.moveTo(SAFE.x, ly); g.lineTo(SAFE.x + 1480 * clamp(p * 1.3), ly); g.stroke();
    [['OCT 2022', 'advanced chips and\ntoolmaking equipment', 0.08, C.red],
     ['OCT 2023', 'rules tightened,\nscope widened', 0.58, C.redD]].forEach(([d, note, fx, col], i) => {
      const q = clamp((p * 1.4 - fx) * 3.5);
      if (q <= 0) return;
      const x = SAFE.x + 1480 * fx + 120;
      g.save(); g.globalAlpha = a1 * clamp(q);
      g.beginPath(); g.arc(x, ly, 16, 0, 7); g.fillStyle = col; g.fill();
      g.strokeStyle = C.bg; g.lineWidth = 4; g.stroke();
      text(g, d, x, ly - 50, { size: 44, fam: F.display, fill: C.ink, align: 'center', caps: true, track: 1.4 });
      note.split('\n').forEach((ln, j) => text(g, ln, x, ly + 56 + j * 34, {
        size: 26, fam: F.body, fill: C.inkSoft, align: 'center',
      }));
      g.restore();
    });
    g.restore();
    source(g, 'US Bureau of Industry and Security rules, Oct 2022 & Oct 2023', { alpha: a1 });
  }

  // L2: zero EUV to China
  const a2 = segA(s, 2, 2, 0.44);
  if (a2 > 0 && ctx.assets.geo) {
    const p = segP(s, 2, 2);
    g.save(); g.globalAlpha = a2;
    const proj = makeProj({ scale: 760, cx: 55, cy: 36, oy: H / 2 + 80 });
    drawFeature(g, ctx.assets.geo.land, proj, { fill: hexA(C.ink, 0.1) });
    const nl = ctx.assets.geo.byName['Netherlands'], cn = ctx.assets.geo.byName['China'];
    if (cn) drawFeature(g, cn, proj, { fill: hexA(C.red, 0.22), stroke: C.red, width: 2.5 });
    if (nl) drawFeature(g, nl, proj, { fill: hexA(C.teal, 0.5), stroke: C.tealD, width: 2.5 });
    const [ax, ay] = proj(5.4, 51.4), [bx, by] = proj(110, 34);
    arrow(g, ax, ay, bx, by, { color: C.inkSoft, width: 4, head: 0, prog: clamp(p * 1.4), curve: -0.18, dash: [14, 12] });
    // blocked
    const bq = clamp((p - 0.45) * 3);
    if (bq > 0) {
      const mx = (ax + bx) / 2 + 60, my = (ay + by) / 2 - 90;
      g.strokeStyle = C.red; g.lineWidth = 11; g.lineCap = 'round';
      const r = 56 * bq;
      g.beginPath();
      g.moveTo(mx - r, my - r); g.lineTo(mx + r, my + r);
      g.moveTo(mx + r, my - r); g.lineTo(mx - r, my + r); g.stroke();
    }
    g.restore();
    g.save(); g.globalAlpha = a2 * clamp(p * 1.5);
    panel(g, SAFE.x - 40, 210, 760, 310, { fill: hexA(C.bg, 0.94), r: 10, shadow: 0.1 });
    g.fillStyle = C.red; roundRect(g, SAFE.x - 40, 210, 760, 10, 4); g.fill();
    text(g, '0', SAFE.x, 450, { size: 240, fam: F.stat, fill: C.red });
    text(g, 'EUV MACHINES EVER SOLD TO CHINA', SAFE.x, 500, {
      size: 29, fam: F.label, weight: 700, fill: C.ink, caps: true, track: 2.2,
    });
    g.restore();
  }
}

// ------------------------------------------------------- RESHORING REALITY ----
export function reshoring_reality(g, s, ctx) {
  slate(g, s, ACT5);

  // L0: so how's it going
  const a0 = segA(s, 0, 0, 0.38);
  if (a0 > 0) {
    g.save(); g.globalAlpha = a0;
    headline(g, 'SO HOW IS IT GOING?', W / 2, H / 2 + 30, {
      size: 110, align: 'center', maxW: 1500, reveal: s.tw(0, 0.1, 0.8),
    });
    g.restore();
  }

  // L1: the fab rises
  const a1 = segA(s, 1, 1, 0.4);
  if (a1 > 0) {
    const p = segP(s, 1, 1);
    g.save(); g.globalAlpha = a1;
    headline(g, 'THE FAB IS THE EASY PART', SAFE.x, 212, { size: 62, maxW: 1100, reveal: s.tw(1, 0.05, 0.9) });
    const bx = W / 2 - 300, groundY = H / 2 + 260;
    g.strokeStyle = C.rule; g.lineWidth = 3;
    g.beginPath(); g.moveTo(SAFE.x, groundY); g.lineTo(W - SAFE.x, groundY); g.stroke();
    const bh = 340 * E.outCubic(clamp(p * 1.5));
    g.fillStyle = hexA(C.teal, 0.25); g.strokeStyle = C.teal; g.lineWidth = 4;
    roundRect(g, bx, groundY - bh, 600, bh, 6); g.fill(); g.stroke();
    if (p > 0.5) {
      text(g, 'FAB', bx + 300, groundY - bh / 2 + 16, {
        size: 56, fam: F.display, fill: C.ink, align: 'center', caps: true, track: 2, alpha: clamp((p - 0.5) * 3),
      });
    }
    g.restore();
  }

  // L2 + L3: the ecosystem layers
  const a2 = segA(s, 2, 3, 0.44);
  if (a2 > 0) {
    const p = segP(s, 2, 3);
    g.save(); g.globalAlpha = a2;
    headline(g, 'WHAT YOU CANNOT MOVE', SAFE.x, 212, { size: 58, maxW: 1100, reveal: s.tw(2, 0.05, 0.9) });
    const layers = [
      'SPECIALTY CHEMICAL SUPPLIERS',
      'EQUIPMENT SERVICE ENGINEERS',
      'PACKAGING AND TESTING PLANTS',
      'A WORKFORCE THAT RESTARTS THE LINE AT 3AM',
    ];
    layers.forEach((k, i) => {
      const q = clamp((p * 1.35 - i * 0.16) * 3.5);
      if (q <= 0) return;
      const y = 330 + i * 110;
      g.save(); g.globalAlpha = a2 * clamp(q * 1.3);
      g.translate(0, (1 - E.outCubic(clamp(q))) * 36);
      const col = [C.yellow, C.teal, C.blue, C.red][i];
      panel(g, SAFE.x, y, 1480, 88, { fill: C.white, r: 8, shadow: 0.08 });
      g.fillStyle = col; roundRect(g, SAFE.x, y, 14, 88, 4); g.fill();
      text(g, k, SAFE.x + 46, y + 56, {
        size: 38, fam: F.display, fill: C.ink, caps: true, track: 1.2,
      });
      g.restore();
    });
    // the 3AM clock
    const ck = s.tw(3, 0.6, 0.9);
    if (ck > 0) {
      g.save(); g.globalAlpha = a2 * ck;
      const cx = W - SAFE.x - 70, cy = 830;
      g.beginPath(); g.arc(cx, cy, 62, 0, 7);
      g.fillStyle = C.ink; g.fill();
      text(g, '3:00', cx, cy + 11, { size: 32, fam: F.mono, weight: 500, fill: C.yellow, align: 'center' });
      g.restore();
    }
    g.restore();
  }

  // L4: all roads to Veldhoven
  const a4 = segA(s, 4, 4, 0.44);
  if (a4 > 0) {
    const p = segP(s, 4, 4);
    g.save(); g.globalAlpha = a4;
    headline(g, 'ALL ROADS LEAD BACK', SAFE.x, 212, { size: 58, maxW: 1000, reveal: s.tw(4, 0.05, 0.9) });
    const hubX = W / 2, hubY = H - 300;
    const sites = [['ARIZONA', W / 2 - 520], ['DRESDEN', W / 2], ['KUMAMOTO', W / 2 + 520]];
    sites.forEach(([k, x], i) => {
      const q = clamp((p * 1.4 - i * 0.14) * 3.5);
      if (q <= 0) return;
      g.save(); g.globalAlpha = a4 * clamp(q * 1.3);
      panel(g, x - 190, 340, 380, 130, { fill: C.white, r: 10, shadow: 0.09 });
      g.fillStyle = C.teal; roundRect(g, x - 190, 340, 380, 10, 4); g.fill();
      text(g, k, x, 418, { size: 40, fam: F.display, fill: C.ink, align: 'center', caps: true, track: 1.4 });
      g.restore();
      arrow(g, x, 480, hubX + (x - W / 2) * 0.08, hubY - 80, {
        color: C.inkSoft, width: 4, head: 14, prog: clamp((p * 1.4 - i * 0.14 - 0.25) * 3), curve: 0.04,
      });
    });
    const hq = clamp((p - 0.55) * 3);
    if (hq > 0) {
      g.save(); g.globalAlpha = a4 * hq;
      panel(g, hubX - 300, hubY - 60, 600, 150, { fill: C.ink, r: 12, shadow: 0.2 });
      text(g, 'ONE DUTCH TOWN', hubX, hubY + 10, {
        size: 46, fam: F.display, fill: C.bg, align: 'center', caps: true, track: 1.6,
      });
      text(g, 'one company, one machine', hubX, hubY + 56, {
        size: 26, fam: F.body, fill: hexA(C.bg, 0.7), align: 'center',
      });
      g.restore();
    }
    g.restore();
  }

  // L5: more customers, same neck
  const a5 = segA(s, 5, 5, 0.44);
  if (a5 > 0) {
    const p = segP(s, 5, 5);
    g.save(); g.globalAlpha = a5;
    const cy = H / 2 + 40, nx = W / 2 + 180;
    const N = 20;
    for (let i = 0; i < N; i++) {
      const y0 = cy - 300 + (i / (N - 1)) * 600;
      const y1 = lerp(y0, cy + (i - (N - 1) / 2) * 1.4, clamp(p * 1.3));
      g.strokeStyle = hexA(C.teal, 0.5); g.lineWidth = 3;
      g.beginPath(); g.moveTo(SAFE.x, y0);
      g.bezierCurveTo(W * 0.4, y0, W * 0.44, y1, nx, y1); g.stroke();
    }
    g.strokeStyle = C.red; g.lineWidth = 6;
    const nh = lerp(600, 28, clamp(p * 1.3));
    g.beginPath(); g.moveTo(nx, cy - nh / 2); g.lineTo(nx, cy + nh / 2); g.stroke();
    g.globalAlpha = a5 * clamp((p - 0.45) * 3);
    text(g, 'MORE FABS.', nx + 60, cy - 24, { size: 52, fam: F.display, fill: C.ink, track: 1.4 });
    text(g, 'SAME CHOKEPOINT.', nx + 60, cy + 40, { size: 52, fam: F.display, fill: C.red, track: 1.4 });
    g.restore();
  }
}

// ------------------------------------------------------------ THE WORKAROUND ----
export function smic_workaround(g, s) {
  slate(g, s, ACT5);

  // L0: the leak
  const a0 = segA(s, 0, 0, 0.4);
  if (a0 > 0) {
    const p = segP(s, 0, 0);
    g.save(); g.globalAlpha = a0;
    headline(g, 'AN EFFECT — BUT NOT A CLEAN ONE', SAFE.x, 212, { size: 56, maxW: 1300, reveal: s.tw(0, 0.05, 0.9) });
    const cy = H / 2 + 60;
    g.strokeStyle = C.ink; g.lineWidth = 34; g.lineCap = 'butt';
    g.beginPath(); g.moveTo(SAFE.x, cy); g.lineTo(W - SAFE.x, cy); g.stroke();
    // clamp
    g.fillStyle = C.red; roundRect(g, W / 2 - 40, cy - 60, 80, 120, 8); g.fill();
    // leak drops
    const lq = clamp((p - 0.3) * 2);
    if (lq > 0) for (let i = 0; i < 9; i++) {
      const u = ((s.t * 0.8 + i / 9) % 1);
      g.globalAlpha = a0 * lq * (1 - u) * 0.9;
      g.beginPath(); g.arc(W / 2 + 70 + u * 180, cy + 28 + u * 170, 9, 0, 7);
      g.fillStyle = C.yellow; g.fill();
    }
    g.restore();
  }

  // L1: many more passes
  const a1 = segA(s, 1, 1, 0.44);
  if (a1 > 0) {
    const p = segP(s, 1, 1);
    g.save(); g.globalAlpha = a1;
    headline(g, '7NM-CLASS, WITHOUT EUV', SAFE.x, 212, { size: 60, maxW: 1200, reveal: s.tw(1, 0.05, 0.9) });
    const n = Math.floor(count(s.t, s.ls(1) + 0.9, 2.4, 5, 1));
    const cy = H / 2 + 70;
    for (let k = 0; k < 5; k++) {
      const q = clamp((p * 1.35 - k * 0.15) * 4);
      if (q <= 0) break;
      g.globalAlpha = a1 * q;
      const col = [C.red, C.teal, C.yellow, C.blue, C.plum][k];
      for (let i = 0; i < 6; i++) {
        g.fillStyle = hexA(col, 0.92);
        roundRect(g, SAFE.x + 160 + i * 250 + k * 30, cy - 90, 18, 180, 3); g.fill();
      }
      text(g, 'DUV PASS ' + (k + 1), SAFE.x + 20, cy - 70 + k * 40, {
        size: 23, fam: F.mono, weight: 500, fill: col, align: 'right',
      });
    }
    g.globalAlpha = a1;
    text(g, 'OLDER MACHINES · MANY MORE EXPOSURES', W / 2, H - 200, {
      size: 32, fam: F.display, fill: C.ink, align: 'center', caps: true, track: 1.8, alpha: clamp((p - 0.55) * 3),
    });
    text(g, "Huawei / SMIC, 2023", W / 2, H - 158, {
      size: 26, fam: F.body, fill: C.inkSoft, align: 'center', alpha: clamp((p - 0.65) * 3),
    });
    g.restore();
  }

  // L2: poor yields, high cost, but it exists
  const a2 = segA(s, 2, 2, 0.44);
  if (a2 > 0) {
    const p = segP(s, 2, 2);
    g.save(); g.globalAlpha = a2;
    headline(g, 'EXPENSIVE. BUT REAL.', SAFE.x, 212, { size: 62, maxW: 1100, reveal: s.tw(2, 0.05, 0.9) });
    g.restore();
    barsH(g, [
      { k: 'TSMC YIELD', v: 100, c: C.teal },
      { k: 'SMIC 7NM (EST.)', v: 33, c: C.red },
    ], SAFE.x + 400, 390, { w: 920, barH: 80, gap: 40, max: 110, prog: clamp(p * 1.6), valueFmt: () => '', showValue: false });
    g.save(); g.globalAlpha = a2 * clamp((p - 0.45) * 3);
    text(g, 'ANALYSTS PUT SMIC 7NM YIELDS WELL BELOW TSMC,', SAFE.x + 400, 600, {
      size: 29, fam: F.body, fill: C.inkSoft,
    });
    text(g, 'AT A REPORTED 40–50% PRICE PREMIUM.', SAFE.x + 400, 644, {
      size: 29, fam: F.body, weight: 600, fill: C.ink,
    });
    text(g, '"IMPOSSIBLE" TURNED OUT TO MEAN "EXPENSIVE".', W / 2, H - 180, {
      size: 40, fam: F.display, fill: C.red, align: 'center', caps: true, track: 1.8,
      alpha: clamp((p - 0.68) * 3.5),
    });
    g.restore();
    source(g, 'Reuters / FT analyst estimates — SMIC has never disclosed yields', { alpha: a2 });
  }

  // L3: squeezing tells them where to dig
  const a3 = segA(s, 3, 3, 0.44);
  if (a3 > 0) {
    const p = segP(s, 3, 3);
    g.save(); g.globalAlpha = a3;
    headline(g, 'SQUEEZE A CHOKEPOINT', SAFE.x, 240, { size: 66, maxW: 1000, reveal: s.tw(3, 0.05, 0.9) });
    text(g, 'and you show them exactly where to dig', SAFE.x, 330, {
      size: 34, fam: F.body, fill: C.inkSoft, alpha: clamp((p - 0.25) * 3),
    });
    const cy = H / 2 + 170, sx = SAFE.x, ex = W - SAFE.x;
    g.strokeStyle = C.ink; g.lineWidth = 30;
    g.beginPath(); g.moveTo(sx, cy); g.lineTo(ex, cy); g.stroke();
    g.fillStyle = C.red; roundRect(g, W / 2 - 46, cy - 70, 92, 140, 8); g.fill();
    // new branch forming
    const bq = clamp((p - 0.4) * 2);
    if (bq > 0) {
      g.strokeStyle = C.yellow; g.lineWidth = 18; g.setLineDash([26, 16]);
      g.beginPath();
      g.moveTo(W / 2 - 60, cy);
      g.quadraticCurveTo(W / 2 + 120, cy + 190, lerp(W / 2 - 60, ex, bq), cy + 190);
      g.stroke(); g.setLineDash([]);
      text(g, 'A NEW ROUTE', ex, cy + 250, {
        size: 32, fam: F.display, fill: C.yellowD, align: 'right', caps: true, track: 1.8, alpha: clamp((bq - 0.4) * 3),
      });
    }
    g.restore();
  }
}
