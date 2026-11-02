import { C, F, W, H, SAFE } from '../lib/theme.js';
import { clamp, lerp, tw, E, hexA, hash01, count, commas, fmtMoney } from '../lib/anim.js';
import { text, headline, roundRect, panel, arrow, drawFeature, makeProj, source,
         barsH, pin, circleHL, measure } from '../lib/draw.js';
import { segA, segP, slate, cards } from './_util.js';

const ACT4 = 'ACT IV — THE STAKES';

// ------------------------------------------------------- THE 2021 SHORTAGE ----
export function auto_shortage(g, s, ctx) {
  slate(g, s, ACT4);

  // L0: 2020 marker
  const a0 = segA(s, 0, 0, 0.38);
  if (a0 > 0) {
    g.save(); g.globalAlpha = a0;
    text(g, '2020', W / 2, H / 2 + 40, { size: 240, fam: F.stat, fill: C.ink, align: 'center', alpha: s.tw(0, 0.1, 0.8) });
    text(g, 'AN ACCIDENTAL EXPERIMENT', W / 2, H / 2 + 120, {
      size: 32, fam: F.label, weight: 700, fill: C.inkSoft, align: 'center', caps: true, track: 4,
      alpha: s.tw(0, 0.45, 0.8),
    });
    g.restore();
  }

  // L1: the queue closes
  const a1 = segA(s, 1, 1, 0.42);
  if (a1 > 0) {
    const p = segP(s, 1, 1);
    g.save(); g.globalAlpha = a1;
    headline(g, 'THE QUEUE CLOSED BEHIND THEM', SAFE.x, 212, { size: 56, maxW: 1300, reveal: s.tw(1, 0.05, 0.9) });
    const oy = H / 2 + 40, slotW = 112, n = 13;
    const ox = W / 2 - (n * slotW) / 2;
    for (let i = 0; i < n; i++) {
      const x = ox + i * slotW;
      g.fillStyle = hexA(C.rule, 0.6); roundRect(g, x, oy, slotW - 12, 150, 6); g.fill();
      // phase 1: cars leave
      const leave = clamp((p * 2.6) - i * 0.06);
      // phase 2: electronics take the slot
      const fill = clamp((p - 0.42) * 2.4 - i * 0.045);
      if (leave < 1) {
        g.save(); g.globalAlpha = a1 * (1 - leave);
        g.fillStyle = C.teal; roundRect(g, x, oy, slotW - 12, 150, 6); g.fill();
        text(g, 'CAR', x + (slotW - 12) / 2, oy + 84, {
          size: 21, fam: F.label, weight: 700, fill: C.white, align: 'center', caps: true, track: 1.4,
        });
        g.restore();
      }
      if (fill > 0) {
        g.save(); g.globalAlpha = a1 * clamp(fill);
        g.fillStyle = C.yellow; roundRect(g, x, oy, slotW - 12, 150, 6); g.fill();
        text(g, 'TV', x + (slotW - 12) / 2, oy + 84, {
          size: 21, fam: F.label, weight: 700, fill: C.dark, align: 'center', caps: true, track: 1.4,
        });
        g.restore();
      }
    }
    g.globalAlpha = a1;
    text(g, 'CARMAKERS CANCELLED  →  ELECTRONICS TOOK THE CAPACITY', W / 2, oy + 240, {
      size: 29, fam: F.display, fill: C.ink, align: 'center', caps: true, track: 1.8,
      alpha: clamp((p - 0.55) * 3),
    });
    g.restore();
  }

  // L2: humble chips
  const a2 = segA(s, 2, 2, 0.4);
  if (a2 > 0) {
    const p = segP(s, 2, 2);
    g.save(); g.globalAlpha = a2;
    headline(g, 'THESE WERE NOT ADVANCED CHIPS', SAFE.x, 212, { size: 56, maxW: 1200, reveal: s.tw(2, 0.05, 0.9) });
    const cx = W / 2, cy = H / 2 + 60;
    const sc = E.outBack(clamp(p * 2));
    g.save();
    g.translate(cx, cy); g.scale(sc, sc); g.translate(-cx, -cy);
    g.fillStyle = C.ink; roundRect(g, cx - 130, cy - 90, 260, 180, 10); g.fill();
    g.fillStyle = C.bg;
    for (let i = 0; i < 7; i++) {
      g.fillRect(cx - 170, cy - 60 + i * 22, 40, 10);
      g.fillRect(cx + 130, cy - 60 + i * 22, 40, 10);
    }
    text(g, 'OLD NODE', cx, cy + 12, { size: 28, fam: F.display, fill: C.bg, align: 'center', caps: true, track: 1.4 });
    g.restore();
    text(g, 'CHEAP. UNGLAMOROUS. INDISPENSABLE.', cx, cy + 210, {
      size: 34, fam: F.display, fill: C.red, align: 'center', caps: true, track: 2, alpha: clamp((p - 0.4) * 3),
    });
    g.restore();
  }

  // L3: $210B + 7.7M cars
  const a3 = segA(s, 3, 3, 0.44);
  if (a3 > 0) {
    const p = segP(s, 3, 3);
    g.save(); g.globalAlpha = a3;
    const v = count(s.t, s.ls(3) + 0.8, 2.6, 210);
    text(g, '$' + v.toFixed(0) + 'B', W / 2, 460, { size: 230, fam: F.stat, fill: C.red, align: 'center' });
    text(g, 'LOST REVENUE, GLOBAL AUTO INDUSTRY, 2021', W / 2, 520, {
      size: 29, fam: F.label, weight: 700, fill: C.inkSoft, align: 'center', caps: true, track: 3,
    });
    // car grid emptying
    const cp = clamp((p - 0.45) * 2.2);
    if (cp > 0) {
      const cols = 44, rows = 7, cw = 32, chh = 20;
      const ox = W / 2 - (cols * cw) / 2, oy = 600;
      for (let i = 0; i < cols * rows; i++) {
        const r = Math.floor(i / cols), c = i % cols;
        const gone = hash01(i, 31) < cp;
        g.globalAlpha = a3 * (gone ? 0.13 : 0.85);
        g.fillStyle = gone ? C.inkSoft : C.teal;
        roundRect(g, ox + c * cw, oy + r * (chh + 6), cw - 6, chh, 3); g.fill();
      }
      g.globalAlpha = a3 * cp;
      text(g, '7.7 MILLION VEHICLES NEVER BUILT', W / 2, oy + rows * 26 + 54, {
        size: 34, fam: F.display, fill: C.ink, align: 'center', caps: true, track: 2,
      });
    }
    g.restore();
    source(g, 'AlixPartners forecast, Sept 2021 (lost revenue, not cost)', { alpha: a3 });
  }

  // L4: lead times
  const a4 = segA(s, 4, 4, 0.4);
  if (a4 > 0) {
    const p = segP(s, 4, 4);
    g.save(); g.globalAlpha = a4;
    headline(g, 'LEAD TIMES PAST 20 WEEKS', SAFE.x, 212, { size: 60, maxW: 1200, reveal: s.tw(4, 0.05, 0.9) });
    const bx = SAFE.x, by = H / 2 - 10, bw = 1480;
    g.fillStyle = hexA(C.rule, 0.6); roundRect(g, bx, by, bw, 72, 5); g.fill();
    g.fillStyle = C.red; roundRect(g, bx, by, bw * clamp(p * 1.4), 72, 5); g.fill();
    for (let i = 0; i <= 21; i += 3) {
      const x = bx + (i / 21) * bw;
      text(g, String(i), x, by + 112, { size: 22, fam: F.mono, fill: C.inkSoft, align: 'center' });
    }
    text(g, 'WEEKS TO FILL A CHIP ORDER', bx, by + 160, {
      size: 26, fam: F.label, weight: 600, fill: C.inkSoft, caps: true, track: 2,
    });
    text(g, 'ASSEMBLY LINES IDLE, WAITING ON PARTS WORTH LESS THAN A COFFEE', W / 2, H - 170, {
      size: 32, fam: F.display, fill: C.ink, align: 'center', caps: true, track: 1.6,
      alpha: clamp((p - 0.5) * 3),
    });
    g.restore();
  }

  // L5: the gears
  const a5 = segA(s, 5, 5, 0.4);
  if (a5 > 0) {
    const p = segP(s, 5, 5);
    g.save(); g.globalAlpha = a5;
    const cx = W / 2, cy = H / 2 + 40;
    [[-180, 1, C.teal], [180, -1, C.yellow]].forEach(([dx, dir, col], i) => {
      g.save();
      g.translate(cx + dx, cy);
      g.rotate(s.t * 0.6 * dir + (i ? 0.16 * clamp(p * 2) : 0));
      g.fillStyle = col;
      for (let k = 0; k < 12; k++) {
        g.save(); g.rotate((k / 12) * 6.283);
        roundRect(g, -17, -178, 34, 54, 5); g.fill();
        g.restore();
      }
      g.beginPath(); g.arc(0, 0, 130, 0, 7); g.fill();
      g.fillStyle = C.bg; g.beginPath(); g.arc(0, 0, 44, 0, 7); g.fill();
      g.restore();
    });
    text(g, 'THE SYSTEM WORKING — WITH THE TIMING SLIGHTLY OFF', W / 2, H - 170, {
      size: 34, fam: F.display, fill: C.ink, align: 'center', caps: true, track: 1.8, alpha: clamp(p * 1.6),
    });
    g.restore();
  }
}

// ---------------------------------------------------------------- BLOCKADE ----
export function blockade_scenarios(g, s, ctx) {
  slate(g, s, ACT4);

  // L0: what if the island stopped
  const a0 = segA(s, 0, 0, 0.4);
  if (a0 > 0 && ctx.assets.geo) {
    const p = segP(s, 0, 0);
    g.save(); g.globalAlpha = a0;
    const proj = makeProj({ scale: 13000, cx: 120.9, cy: 23.9, ox: W / 2, oy: H / 2 + 70 });
    const tw_ = ctx.assets.geo.byName['Taiwan'];
    drawFeature(g, ctx.assets.geo.land, proj, { fill: hexA(C.ink, 0.1) });
    if (tw_) drawFeature(g, tw_, proj, { fill: hexA(C.red, 0.2 + 0.5 * clamp(p * 1.5)), stroke: C.red, width: 5 });
    // ring of blockade
    const [tx, ty] = proj(120.9, 23.75);
    const rr = 400;
    g.strokeStyle = hexA(C.red, 0.85); g.lineWidth = 5; g.setLineDash([22, 18]);
    g.save(); g.translate(tx, ty); g.rotate(s.t * 0.25);
    g.beginPath(); g.arc(0, 0, rr, 0, 6.283 * clamp(p * 1.4)); g.stroke();
    g.restore(); g.setLineDash([]);
    headline(g, 'WHAT IF THE ISLAND STOPPED?', W / 2, 250, {
      size: 72, align: 'center', maxW: 1500, reveal: s.tw(0, 0.1, 1.0), fill: C.ink,
    });
    g.restore();
  }

  // L1: uncertainty caveat
  const a1 = segA(s, 1, 1, 0.4);
  if (a1 > 0) {
    const p = segP(s, 1, 1);
    g.save(); g.globalAlpha = a1;
    panel(g, W / 2 - 620, H / 2 - 140, 1240, 280, { fill: C.white, r: 12, shadow: 0.1, alpha: clamp(p * 2) });
    g.fillStyle = C.yellow; roundRect(g, W / 2 - 620, H / 2 - 140, 1240, 12, 4); g.fill();
    text(g, 'THESE NUMBERS ARE ESTIMATES', W / 2, H / 2 - 50, {
      size: 48, fam: F.display, fill: C.ink, align: 'center', caps: true, track: 1.6,
    });
    text(g, 'The uncertainty is enormous and the models disagree.', W / 2, H / 2 + 20, {
      size: 31, fam: F.body, fill: C.inkSoft, align: 'center', alpha: clamp((p - 0.2) * 3),
    });
    text(g, 'Anyone who tells you otherwise is selling something.', W / 2, H / 2 + 68, {
      size: 31, fam: F.body, weight: 600, fill: C.red, align: 'center', alpha: clamp((p - 0.45) * 3),
    });
    g.restore();
  }

  // L2 + L3 + L4 + L5: the estimate bars
  const aB = segA(s, 2, 5, 0.45);
  if (aB > 0) {
    const pAll = segP(s, 2, 5);
    g.save(); g.globalAlpha = aB;
    headline(g, 'WHAT THE MODELS SAY', SAFE.x, 212, { size: 56, maxW: 1100, reveal: s.tw(2, 0.05, 0.8) });
    g.restore();

    const rows = [
      { k: 'RHODIUM · BLOCKADE', v: 2.0, c: C.yellowD, note: 'activity at risk', li: 2 },
      { k: 'BLOOMBERG · BLOCKADE', v: 5.0, c: C.red, note: '≈5% of global GDP', li: 3 },
      { k: 'BLOOMBERG · WAR', v: 10.0, c: C.redD, note: '', li: 4 },
    ];
    const bx = SAFE.x + 420, by = 360, bw = 1020, bh = 86, gap = 44;
    rows.forEach((r, i) => {
      const p = s.tw(r.li, 0.3, 1.6, E.outQuart);
      if (p <= 0) return;
      const y = by + i * (bh + gap);
      g.save(); g.globalAlpha = aB;
      g.fillStyle = hexA(C.rule, 0.5); roundRect(g, bx, y, bw, bh, 5); g.fill();
      g.fillStyle = r.c; roundRect(g, bx, y, bw * (r.v / 10) * p, bh, 5); g.fill();
      text(g, r.k, bx - 24, y + bh / 2, {
        size: 25, fam: F.label, weight: 700, fill: C.ink, align: 'right', base: 'middle', caps: true, track: 1.4,
      });
      text(g, '$' + (r.v * p).toFixed(1) + 'T', bx + bw * (r.v / 10) * p + 20, y + bh / 2, {
        size: 42, fam: F.stat, fill: r.c, base: 'middle',
      });
      if (r.note && p > 0.8) text(g, r.note, bx + 16, y + bh / 2, {
        size: 23, fam: F.body, fill: hexA('#FFFFFF', 0.9), base: 'middle',
      });
      g.restore();
    });

    // country breakdown on L3
    const a3 = s.tw(3, 1.0, 0.9);
    if (a3 > 0) {
      g.save(); g.globalAlpha = aB * a3;
      const items = [['TAIWAN', -12.2], ['CHINA', -8.9], ['WORLD', -5.0], ['USA', -3.3]];
      items.forEach(([k, v], i) => {
        const x = SAFE.x + 60 + i * 190;
        text(g, v.toFixed(1) + '%', x, H - 196, { size: 46, fam: F.stat, fill: C.red });
        text(g, k, x, H - 162, {
          size: 21, fam: F.label, weight: 700, fill: C.inkSoft, caps: true, track: 1.6,
        });
      });
      text(g, 'FIRST-YEAR GDP IMPACT, YEAR-LONG BLOCKADE SCENARIO', SAFE.x + 60, H - 128, {
        size: 21, fam: F.label, weight: 600, fill: C.inkSoft, caps: true, track: 1.8,
      });
      g.restore();
    }

    // 2008 reference on L5
    const a5 = s.tw(5, 0.3, 1.0);
    if (a5 > 0) {
      g.save(); g.globalAlpha = aB * a5;
      const y = by + 1 * (bh + gap);
      const x = bx + bw * (3.0 / 10);
      g.strokeStyle = C.ink; g.lineWidth = 3; g.setLineDash([9, 7]);
      g.beginPath(); g.moveTo(x, by - 36); g.lineTo(x, y + bh + 30); g.stroke(); g.setLineDash([]);
      text(g, '2008 CRISIS: ~3%', x + 14, by - 46, {
        size: 24, fam: F.label, weight: 700, fill: C.ink, caps: true, track: 1.6,
      });
      g.restore();
    }
    source(g, 'Rhodium Group (2022); Bloomberg Economics (2024). Different methods — not directly comparable', { alpha: aB });
  }
}

// ------------------------------------------------------------ NO STOCKPILE ----
export function no_stockpile(g, s) {
  slate(g, s, ACT4);
  headline(g, 'YOU CANNOT STOCKPILE YOUR WAY OUT', SAFE.x, 212, {
    size: 58, maxW: 1300, reveal: s.tw(0, 0.1, 0.9),
  });

  // L0: oil vs chips
  const a0 = segA(s, 0, 1, 0.42);
  if (a0 > 0) {
    const p = segP(s, 0, 0);
    g.save(); g.globalAlpha = a0;
    // barrel fills
    const bx = W / 2 - 480, by = H / 2 - 60;
    g.strokeStyle = C.ink; g.lineWidth = 5;
    roundRect(g, bx - 100, by - 60, 200, 300, 14); g.stroke();
    g.fillStyle = hexA(C.ink, 0.8);
    const fh = 288 * clamp(p * 1.5);
    g.fillRect(bx - 97, by - 57 + (288 - fh), 194, fh);
    text(g, 'OIL', bx, by + 290, {
      size: 36, fam: F.display, fill: C.ink, align: 'center', caps: true, track: 2,
    });
    text(g, 'fungible · storable', bx, by + 330, { size: 25, fam: F.body, fill: C.inkSoft, align: 'center' });

    // chip can't
    const cx = W / 2 + 420;
    g.fillStyle = hexA(C.teal, 0.2); g.strokeStyle = C.teal; g.lineWidth = 5;
    roundRect(g, cx - 100, by - 60, 200, 200, 10); g.fill(); g.stroke();
    text(g, 'CHIP', cx, by + 60, { size: 36, fam: F.display, fill: C.ink, align: 'center', caps: true, track: 2 });
    const xq = clamp((p - 0.35) * 2.5);
    if (xq > 0) {
      g.strokeStyle = C.red; g.lineWidth = 9; g.lineCap = 'round';
      const r = 110 * xq;
      g.beginPath();
      g.moveTo(cx - r, by + 40 - r); g.lineTo(cx + r, by + 40 + r);
      g.moveTo(cx + r, by + 40 - r); g.lineTo(cx - r, by + 40 + r); g.stroke();
    }
    text(g, 'tied to one factory', cx, by + 290, {
      size: 25, fam: F.body, fill: C.inkSoft, align: 'center', alpha: xq,
    });
    g.restore();
  }

  // L1: the key doesn't fit
  const a1 = segA(s, 1, 1, 0.4);
  if (a1 > 0) {
    const p = segP(s, 1, 1);
    g.save(); g.globalAlpha = a1 * clamp(p * 1.6);
    panel(g, W / 2 - 600, H - 250, 1200, 150, { fill: C.white, r: 10, shadow: 0.1 });
    text(g, 'A DESIGN IS LOCKED TO ONE FACTORY\'S PROCESS', W / 2, H - 190, {
      size: 36, fam: F.display, fill: C.ink, align: 'center', caps: true, track: 1.6,
    });
    text(g, 'you cannot take the blueprint elsewhere and press print', W / 2, H - 146, {
      size: 27, fam: F.body, fill: C.inkSoft, align: 'center', alpha: clamp((p - 0.3) * 3),
    });
    g.restore();
  }
}
