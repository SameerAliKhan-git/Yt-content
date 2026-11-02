import { C, F, W, H, SAFE } from '../lib/theme.js';
import { clamp, lerp, inv, tw, E, hexA, hash01, count, commas } from '../lib/anim.js';
import { text, headline, roundRect, panel, arrow, drawFeature, featureBounds, makeProj,
         source, measure, circleHL, barsH, pin, underline } from '../lib/draw.js';
import { segA, segP, slate, cards, readout, darkStage, machine } from './_util.js';

const ACT2 = 'ACT II — PRINTING WITH LIGHT';

// ------------------------------------------------------ PHOTOLITHOGRAPHY ----
export function litho_process(g, s) {
  slate(g, s, ACT2);
  headline(g, 'CHIPS ARE PRINTED', SAFE.x, 212, { size: 70, maxW: 1100, reveal: s.tw(0, 0.1, 0.8) });

  const cx = W / 2, top = 330;
  const a = s.tw(0, 0.4, 0.9);
  if (a > 0) {
    g.save(); g.globalAlpha = a;
    // lamp
    const lampY = top;
    g.fillStyle = C.ink; roundRect(g, cx - 120, lampY, 240, 56, 8); g.fill();
    text(g, 'LIGHT SOURCE', cx, lampY + 36, {
      size: 22, fam: F.label, weight: 700, fill: C.bg, align: 'center', caps: true, track: 2,
    });
    // rays to mask
    const rp = s.tw(1, 0.2, 1.0);
    const maskY = lampY + 190;
    if (rp > 0) {
      g.strokeStyle = hexA(C.yellow, 0.95); g.lineWidth = 4;
      for (let i = -4; i <= 4; i++) {
        g.beginPath(); g.moveTo(cx + i * 26, lampY + 56);
        g.lineTo(cx + i * 40, lampY + 56 + (maskY - lampY - 56) * rp); g.stroke();
      }
    }
    // mask with pattern
    g.fillStyle = C.bgAlt; g.strokeStyle = C.ink; g.lineWidth = 4;
    roundRect(g, cx - 300, maskY, 600, 44, 4); g.fill(); g.stroke();
    g.fillStyle = C.ink;
    for (let i = 0; i < 14; i++) {
      if (hash01(i, 21) > 0.45) g.fillRect(cx - 288 + i * 42, maskY + 6, 22, 32);
    }
    text(g, 'MASK  (THE BLUEPRINT)', cx + 320, maskY + 28, {
      size: 24, fam: F.label, weight: 700, fill: C.ink, caps: true, track: 1.8,
    });

    // projection to wafer
    const waferY = maskY + 250;
    const pp = s.tw(1, 0.9, 1.0);
    if (pp > 0) {
      g.strokeStyle = hexA(C.yellow, 0.9); g.lineWidth = 3;
      for (let i = -6; i <= 6; i++) {
        const x0 = cx + i * 42;
        g.beginPath(); g.moveTo(x0, maskY + 44);
        g.lineTo(cx + i * 20, maskY + 44 + (waferY - maskY - 44) * pp); g.stroke();
      }
      // lens
      g.globalAlpha = a * pp;
      g.strokeStyle = C.teal; g.lineWidth = 5;
      g.beginPath();
      g.ellipse(cx, (maskY + waferY) / 2, 150, 34, 0, 0, 7); g.stroke();
      text(g, 'LENS', cx + 172, (maskY + waferY) / 2 + 8, {
        size: 22, fam: F.label, weight: 700, fill: C.teal, caps: true, track: 2,
      });
      g.globalAlpha = a;
    }
    // wafer
    g.fillStyle = hexA(C.teal, 0.2); g.strokeStyle = C.teal; g.lineWidth = 4;
    roundRect(g, cx - 340, waferY, 680, 56, 6); g.fill(); g.stroke();
    if (pp > 0.9) {
      g.fillStyle = C.teal;
      for (let i = 0; i < 14; i++) {
        if (hash01(i, 21) > 0.45) g.fillRect(cx - 288 + i * 42 - 10, waferY + 12, 22, 32);
      }
    }
    text(g, 'SILICON WAFER', cx + 360, waferY + 30, {
      size: 24, fam: F.label, weight: 700, fill: C.teal, caps: true, track: 1.8,
    });
    g.restore();
  }

  // L2: repeat 100 times
  const a2 = s.tw(2, 0.2, 1.0);
  if (a2 > 0) {
    g.save(); g.globalAlpha = a2;
    const n = Math.floor(count(s.t, s.ls(2) + 0.3, 2.4, 100));
    panel(g, W - SAFE.x - 420, 300, 420, 300, { fill: C.white, r: 8, shadow: 0.1, alpha: a2 });
    for (let i = 0; i < Math.min(n, 100); i++) {
      const r = Math.floor(i / 20), c = i % 20;
      g.fillStyle = hexA(i % 3 === 0 ? C.teal : i % 3 === 1 ? C.yellow : C.red, 0.75);
      g.fillRect(W - SAFE.x - 400 + c * 19, 480 - r * 16, 15, 11);
    }
    text(g, String(n), W - SAFE.x - 400, 400, { size: 96, fam: F.stat, fill: C.ink, alpha: a2 });
    text(g, 'PATTERNED LAYERS,\nONE ON TOP OF THE NEXT', W - SAFE.x - 400, 540, {
      size: 23, fam: F.label, weight: 600, fill: C.inkSoft, caps: true, track: 1.6, alpha: a2,
    });
    g.restore();
  }
}

// ------------------------------------------------------- WAVELENGTH WALL ----
export function wavelength_bars(g, s) {
  slate(g, s, ACT2);
  headline(g, 'YOU CANNOT PRINT SMALLER\nTHAN YOUR LIGHT', SAFE.x, 206, {
    size: 64, maxW: 1200, reveal: s.tw(0, 0.1, 1.0),
  });

  const a0 = s.tw(0, 0.6, 1.0);
  const cx = W / 2, cy = H / 2 + 110;
  if (a0 > 0) {
    g.save(); g.globalAlpha = a0;
    // the wave
    const amp = 46, wl = 240;
    g.strokeStyle = C.yellow; g.lineWidth = 6; g.lineCap = 'round';
    g.beginPath();
    for (let x = -620; x <= 620; x += 4) {
      const y = Math.sin((x / wl) * Math.PI * 2 + s.t * 2.4) * amp;
      x === -620 ? g.moveTo(cx + x, cy + y) : g.lineTo(cx + x, cy + y);
    }
    g.stroke();
    // feature we want, narrower than the wave
    const fw = 78;
    g.strokeStyle = C.red; g.lineWidth = 4; g.setLineDash([10, 8]);
    g.strokeRect(cx - fw / 2, cy - 150, fw, 300); g.setLineDash([]);
    text(g, 'TARGET FEATURE', cx, cy - 170, {
      size: 24, fam: F.label, weight: 700, fill: C.red, align: 'center', caps: true, track: 2,
    });
    // blur band showing the limit
    const bl = s.tw(0, 1.6, 1.0);
    if (bl > 0) {
      g.globalAlpha = a0 * bl * 0.5;
      const grd = g.createLinearGradient(cx - wl / 2, 0, cx + wl / 2, 0);
      grd.addColorStop(0, hexA(C.red, 0)); grd.addColorStop(0.5, hexA(C.red, 0.55)); grd.addColorStop(1, hexA(C.red, 0));
      g.fillStyle = grd; g.fillRect(cx - wl / 2, cy - 150, wl, 300);
      g.globalAlpha = a0;
      text(g, 'BLURS OUT', cx, cy + 200, {
        size: 30, fam: F.display, fill: C.red, align: 'center', caps: true, track: 2, alpha: bl,
      });
    }
    g.restore();
  }

  // L1: 193nm bar
  const a1 = s.tw(1, 0.2, 0.9);
  if (a1 > 0) {
    g.save(); g.globalAlpha = a1;
    const bw = 820 * s.tw(1, 0.3, 1.1, E.outQuart);
    g.fillStyle = C.ink; roundRect(g, SAFE.x, H - 240, bw, 70, 4); g.fill();
    text(g, '193 NM  ·  DEEP ULTRAVIOLET', SAFE.x + 26, H - 196, {
      size: 32, fam: F.display, fill: C.bg, caps: true, track: 2, alpha: clamp(a1 * 2 - 1),
    });
    text(g, 'the industry standard for two decades', SAFE.x, H - 120, {
      size: 26, fam: F.body, fill: C.inkSoft, alpha: a1,
    });
    g.restore();
  }
}

// ---------------------------------------------------- IMMERSION + MULTI ----
export function immersion_multipattern(g, s) {
  slate(g, s, ACT2);

  // L0: water immersion
  const a0 = segA(s, 0, 0, 0.4);
  if (a0 > 0) {
    const p = s.tw(0, 0.3, 1.3);
    g.save(); g.globalAlpha = a0;
    const cx = W / 2, cy = H / 2 + 40;
    headline(g, 'TRICK ONE: SHOOT THROUGH WATER', SAFE.x, 216, { size: 58, maxW: 1200, reveal: s.tw(0, 0.05, 0.8) });
    // lens
    g.strokeStyle = C.ink; g.lineWidth = 5;
    g.beginPath(); g.ellipse(cx, cy - 150, 190, 44, 0, 0, 7); g.stroke();
    // water gap
    g.fillStyle = hexA(C.blue, 0.3 * p);
    roundRect(g, cx - 190, cy - 110, 380, 86, 10); g.fill();
    text(g, 'WATER', cx + 230, cy - 64, {
      size: 26, fam: F.label, weight: 700, fill: C.blue, caps: true, track: 2, alpha: p,
    });
    // rays bending tighter
    g.lineWidth = 4;
    for (let i = -4; i <= 4; i++) {
      if (!i) continue;
      const x0 = cx + i * 42, xMid = cx + i * 42;
      const xEnd = cx + i * lerp(30, 12, p);
      g.strokeStyle = hexA(C.yellow, 0.95);
      g.beginPath(); g.moveTo(x0, cy - 190); g.lineTo(xMid, cy - 110);
      g.lineTo(xEnd, cy + 60); g.stroke();
    }
    g.fillStyle = hexA(C.teal, 0.25); g.strokeStyle = C.teal; g.lineWidth = 4;
    roundRect(g, cx - 300, cy + 60, 600, 46, 5); g.fill(); g.stroke();
    text(g, 'TIGHTER FOCUS, SAME LIGHT', cx, cy + 180, {
      size: 32, fam: F.display, fill: C.ink, align: 'center', caps: true, track: 1.6, alpha: clamp(p * 1.6 - 0.6),
    });
    g.restore();
  }

  // L1: multi-patterning
  const a1 = segA(s, 1, 1, 0.4);
  if (a1 > 0) {
    const p = segP(s, 1, 1);
    g.save(); g.globalAlpha = a1;
    headline(g, 'TRICK TWO: PRINT IT TWICE.\nTHEN FOUR TIMES.', SAFE.x, 216, {
      size: 58, maxW: 1200, reveal: s.tw(1, 0.05, 0.9),
    });
    const cy = H / 2 + 110, cx = W / 2;
    const passes = 4;
    for (let k = 0; k < passes; k++) {
      const q = clamp((p * 1.3 - k * 0.19) * 4);
      if (q <= 0) continue;
      g.globalAlpha = a1 * q;
      const col = [C.red, C.teal, C.yellow, C.blue][k];
      for (let i = 0; i < 5; i++) {
        const x = cx - 430 + i * 215 + k * 34;
        g.fillStyle = hexA(col, 0.92);
        roundRect(g, x, cy - 70, 20, 140, 3); g.fill();
      }
      g.globalAlpha = a1 * q;
      text(g, `PASS ${k + 1}`, cx - 520, cy - 50 + k * 36, {
        size: 23, fam: F.mono, weight: 500, fill: col, align: 'right',
      });
    }
    g.globalAlpha = a1 * clamp((p - 0.72) * 4);
    text(g, 'LINES FINER THAN THE LIGHT SHOULD ALLOW', cx, cy + 160, {
      size: 30, fam: F.display, fill: C.ink, align: 'center', caps: true, track: 1.6,
    });
    g.restore();
  }

  // L2: the cost of tricks
  const a2 = segA(s, 2, 2, 0.4);
  if (a2 > 0) {
    const p = segP(s, 2, 2);
    g.save(); g.globalAlpha = a2;
    headline(g, 'EVERY TRICK HAS A PRICE', SAFE.x, 216, { size: 64, maxW: 1100, reveal: s.tw(2, 0.05, 0.8) });
    const items = [
      { k: 'COST', v: 100, c: C.red }, { k: 'TIME', v: 86, c: C.red },
      { k: 'DEFECT RISK', v: 72, c: C.redD },
    ];
    g.restore();
    barsH(g, items, SAFE.x + 300, 400, {
      w: 1000, barH: 76, gap: 36, max: 110, prog: clamp(p * 1.6),
      valueFmt: () => '', showValue: false,
    });
    g.save(); g.globalAlpha = a2;
    text(g, 'THE INDUSTRY NEEDED SHORTER LIGHT.', W / 2, H - 170, {
      size: 38, fam: F.display, fill: C.ink, align: 'center', caps: true, track: 2,
      alpha: clamp((p - 0.6) * 3),
    });
    text(g, 'MUCH SHORTER.', W / 2, H - 120, {
      size: 38, fam: F.display, fill: C.red, align: 'center', caps: true, track: 2,
      alpha: clamp((p - 0.78) * 4),
    });
    g.restore();
  }
}

// ------------------------------------------------------------ EUV REVEAL ----
export function euv_reveal(g, s) {
  slate(g, s, ACT2);

  // L0: 193 collapses to 13.5
  const a0 = segA(s, 0, 0, 0.4);
  if (a0 > 0) {
    const p = s.tw(0, 0.25, 1.4, E.inOutExpo);
    g.save(); g.globalAlpha = a0;
    const y = H / 2;
    const fullW = 1100, smallW = fullW * (13.5 / 193);
    const bw = lerp(fullW, smallW, p);
    g.fillStyle = hexA(C.ink, 1 - p * 0.3); roundRect(g, SAFE.x, y - 46, bw, 92, 5); g.fill();
    if (p > 0.6) {
      g.fillStyle = C.red; roundRect(g, SAFE.x, y - 46, smallW, 92, 5); g.fill();
    }
    text(g, p < 0.5 ? '193 NM' : '13.5 NM', SAFE.x + bw + 34, y + 16, {
      size: 72, fam: F.stat, fill: p < 0.5 ? C.ink : C.red, alpha: a0,
    });
    text(g, 'EXTREME ULTRAVIOLET', SAFE.x + bw + 34, y + 62, {
      size: 28, fam: F.label, weight: 700, fill: C.inkSoft, caps: true, track: 3,
      alpha: a0 * clamp((p - 0.55) * 3),
    });
    text(g, '14× SHORTER', SAFE.x, y - 96, {
      size: 30, fam: F.display, fill: C.red, caps: true, track: 2, alpha: a0 * clamp((p - 0.7) * 4),
    });
    g.restore();
  }

  // L1 + L2: absorption / no lenses
  const a1 = segA(s, 1, 2, 0.42);
  if (a1 > 0) {
    const p = segP(s, 1, 2);
    g.save(); g.globalAlpha = a1;
    headline(g, 'EVERYTHING ABSORBS IT', SAFE.x, 216, { size: 66, maxW: 1100, reveal: s.tw(1, 0.1, 0.8) });
    const mats = ['GLASS', 'AIR', 'LENSES', 'NORMAL MIRRORS'];
    const bw = 340, bh = 150, gap = 30;
    const total = mats.length * bw + (mats.length - 1) * gap;
    mats.forEach((m, i) => {
      const q = clamp((p * 1.5 - i * 0.14) * 3.2);
      if (q <= 0) return;
      const x = W / 2 - total / 2 + i * (bw + gap), y = H / 2 - bh / 2 + 20;
      g.save(); g.globalAlpha = a1 * clamp(q * 1.4);
      g.fillStyle = C.white; roundRect(g, x, y, bw, bh, 8); g.fill();
      g.strokeStyle = C.rule; g.lineWidth = 2; roundRect(g, x, y, bw, bh, 8); g.stroke();
      text(g, m, x + bw / 2, y + bh / 2 + 4, {
        size: 34, fam: F.display, fill: C.ink, align: 'center', caps: true, track: 1.4,
      });
      // beam gets eaten
      g.strokeStyle = C.yellow; g.lineWidth = 6;
      g.beginPath(); g.moveTo(x - gap, y + bh / 2); g.lineTo(x + 20, y + bh / 2); g.stroke();
      if (q > 0.55) {
        const k = clamp((q - 0.55) * 3);
        g.strokeStyle = C.red; g.lineWidth = 7; g.lineCap = 'round';
        const cx2 = x + bw / 2, cy2 = y + bh / 2, r = 46;
        g.beginPath();
        g.moveTo(cx2 - r * k, cy2 - r * k); g.lineTo(cx2 + r * k, cy2 + r * k);
        g.moveTo(cx2 + r * k, cy2 - r * k); g.lineTo(cx2 - r * k, cy2 + r * k);
        g.stroke();
      }
      g.restore();
    });
    g.globalAlpha = a1 * clamp((p - 0.7) * 3.5);
    text(g, 'NO LENS CAN BE USED. NOT EVEN AN ORDINARY MIRROR.', W / 2, H - 180, {
      size: 34, fam: F.display, fill: C.ink, align: 'center', caps: true, track: 2,
    });
    g.restore();
  }

  // L3: cut to the chamber
  const a3 = s.tw(3, 0.1, 0.5, E.inQuad);
  if (a3 > 0) { g.save(); g.globalAlpha = a3; g.fillStyle = C.dark; g.fillRect(0, 0, W, H); g.restore(); }
}

// ------------------------------------------------------------ EUV SOURCE ----
export function euv_source(g, s) {
  darkStage(g);
  const white = '#F3EFE7';

  // geometry: chamber left, readout right
  const CL = 260, CR = 1230, CT = 230, CB = 880;
  const fx = (CL + CR) / 2 - 40;       // focus x
  const fy = 610;                      // focus y
  const nozY = CT + 60;
  const PERIOD = 0.46;                 // one droplet cycle
  const phase = (s.t / PERIOD) % 1;

  // chamber
  const ac = s.tw(0, 0.1, 1.0);
  g.save(); g.globalAlpha = ac;
  g.strokeStyle = hexA(white, 0.2); g.lineWidth = 3;
  roundRect(g, CL, CT, CR - CL, CB - CT, 18); g.stroke();
  text(g, 'VACUUM CHAMBER', CL + 6, CT - 18, {
    size: 23, fam: F.label, weight: 700, fill: hexA(white, 0.42), caps: true, track: 2.4,
  });
  g.restore();

  // collector mirror: a bowl to the LEFT of the focus, gathering light rightward
  const am = s.tw(0, 0.9, 1.0);
  if (am > 0) {
    g.save(); g.globalAlpha = am;
    g.strokeStyle = hexA(C.teal, 0.95); g.lineWidth = 10; g.lineCap = 'round';
    g.beginPath(); g.arc(fx, fy, 250, Math.PI * 0.62, Math.PI * 1.38); g.stroke();
    text(g, 'COLLECTOR', fx - 268, fy + 210, {
      size: 22, fam: F.label, weight: 700, fill: C.teal, caps: true, track: 2, align: 'center',
    });
    g.restore();
  }

  // nozzle + falling tin droplets
  const ad = s.tw(0, 0.4, 1.0);
  if (ad > 0) {
    g.save(); g.globalAlpha = ad;
    g.fillStyle = hexA(white, 0.85);
    roundRect(g, fx - 28, nozY - 56, 56, 74, 7); g.fill();
    text(g, 'MOLTEN TIN', fx + 46, nozY - 16, {
      size: 22, fam: F.label, weight: 700, fill: hexA(white, 0.72), caps: true, track: 2,
    });
    const N = 11;
    for (let i = 0; i < N; i++) {
      const u = ((phase + i / N) % 1);
      const y = lerp(nozY + 24, fy, u);
      if (y >= fy - 2) continue;
      const a = 0.35 + 0.65 * Math.min(1, u * 3);
      g.globalAlpha = ad * a;
      g.beginPath(); g.ellipse(fx, y, lerp(8, 6, u), lerp(8, 9.5, u), 0, 0, 7);
      g.fillStyle = white; g.fill();
    }
    g.restore();
  }

  // the laser, reaching the focus
  const al = s.tw(1, 0.2, 0.9);
  if (al > 0) {
    g.save(); g.globalAlpha = al;
    const pre = phase > 0.40 && phase < 0.56;
    const main = phase >= 0.56 && phase < 0.74;
    g.lineCap = 'round';
    g.strokeStyle = hexA(C.red, 0.28); g.lineWidth = 4;
    g.beginPath(); g.moveTo(CL + 30, fy); g.lineTo(fx - 10, fy); g.stroke();
    if (pre || main) {
      g.strokeStyle = hexA(C.red, main ? 1 : 0.8);
      g.lineWidth = main ? 20 : 10;
      g.beginPath(); g.moveTo(CL + 30, fy); g.lineTo(fx - 10, fy); g.stroke();
    }
    text(g, 'CO\u2082 LASER', CL + 30, fy - 36, {
      size: 24, fam: F.label, weight: 700, fill: C.red, caps: true, track: 2,
    });
    text(g, pre ? 'PULSE 1 — FLATTEN' : main ? 'PULSE 2 — VAPORISE' : 'HIT TWICE', CL + 30, fy + 48, {
      size: 22, fam: F.mono, weight: 500, fill: hexA(white, 0.62), alpha: s.tw(2, 0.1, 0.8),
    });
    g.restore();
  }

  // plasma bloom + emission
  const ap = s.tw(2, 0.3, 1.0);
  if (ap > 0) {
    g.save(); g.globalAlpha = ap;
    const bloom = phase >= 0.56 ? Math.max(0, 1 - (phase - 0.56) / 0.4) : 0;
    if (bloom > 0) {
      const r = lerp(22, 150, 1 - bloom);
      const grd = g.createRadialGradient(fx, fy, 2, fx, fy, r);
      grd.addColorStop(0, hexA('#FFFFFF', 0.95 * bloom));
      grd.addColorStop(0.3, hexA(C.yellow, 0.75 * bloom));
      grd.addColorStop(1, hexA(C.yellow, 0));
      g.fillStyle = grd; g.beginPath(); g.arc(fx, fy, r, 0, 7); g.fill();
      // collected light leaving to the right
      g.strokeStyle = hexA(C.yellow, 0.75 * bloom); g.lineWidth = 3;
      for (let i = 0; i < 7; i++) {
        const yy = fy - 90 + i * 30;
        g.beginPath(); g.moveTo(fx + 40, fy); g.lineTo(CR - 20, yy); g.stroke();
      }
    }
    g.restore();
  }

  // readout column, inside frame on the right
  const ar = s.tw(0, 1.2, 1.0);
  if (ar > 0) {
    g.save(); g.globalAlpha = ar;
    const rx = CR + 90;
    text(g, commas(count(s.t, s.ls(0) + 1.2, 2.2, 50000)), rx, 400, {
      size: 96, fam: F.stat, fill: C.yellow,
    });
    text(g, 'TIN DROPLETS PER SECOND', rx, 444, {
      size: 24, fam: F.label, weight: 700, fill: hexA(white, 0.7), caps: true, track: 2.2,
    });
    const a2 = s.tw(2, 0.9, 0.8);
    if (a2 > 0) {
      g.globalAlpha = ar * a2;
      g.fillStyle = hexA(white, 0.16); g.fillRect(rx, 500, 420, 2);
      text(g, '13.5 NM', rx, 600, { size: 84, fam: F.stat, fill: white });
      text(g, 'PLASMA EMISSION', rx, 642, {
        size: 24, fam: F.label, weight: 700, fill: hexA(white, 0.55), caps: true, track: 2.2,
      });
    }
    g.restore();
  }
}

// ----------------------------------------------------------- MIRROR STACK ----
export function mirror_stack(g, s) {
  slate(g, s, ACT2);

  // L0: mirrors not lenses
  const a0 = segA(s, 0, 0, 0.38);
  if (a0 > 0) {
    const p = s.tw(0, 0.2, 1.1);
    g.save(); g.globalAlpha = a0;
    headline(g, 'MIRRORS, NOT LENSES', SAFE.x, 216, { size: 68, maxW: 1100, reveal: s.tw(0, 0.05, 0.8) });
    const cy = H / 2 + 60;
    let x = SAFE.x + 60, y = cy;
    g.strokeStyle = C.yellow; g.lineWidth = 5;
    for (let i = 0; i < 6; i++) {
      const q = clamp((p * 1.4 - i * 0.12) * 4);
      if (q <= 0) break;
      const nx = x + 250, ny = i % 2 ? cy + 150 : cy - 150;
      g.globalAlpha = a0 * q;
      g.beginPath(); g.moveTo(x, y); g.lineTo(nx, ny); g.stroke();
      g.save();
      g.translate(nx, ny); g.rotate(i % 2 ? -0.5 : 0.5);
      g.fillStyle = C.teal; roundRect(g, -60, -8, 120, 16, 6); g.fill();
      g.restore();
      x = nx; y = ny;
    }
    g.restore();
  }

  // L1: Mo/Si bilayers
  const a1 = segA(s, 1, 1, 0.4);
  if (a1 > 0) {
    const p = segP(s, 1, 1);
    g.save(); g.globalAlpha = a1;
    headline(g, 'DOZENS OF LAYERS,\nA FEW ATOMS THICK', SAFE.x, 216, { size: 58, maxW: 1000, reveal: s.tw(1, 0.05, 0.9) });
    const ox = W / 2 - 120, oy = 380, lw = 700, lh = 15;
    const n = 22;
    for (let i = 0; i < n; i++) {
      const q = clamp((p * 1.5 - i * 0.035) * 6);
      if (q <= 0) break;
      g.globalAlpha = a1 * q;
      g.fillStyle = i % 2 ? hexA(C.inkSoft, 0.85) : hexA(C.teal, 0.85);
      g.fillRect(ox - lw / 2, oy + i * (lh + 2), lw, lh);
    }
    g.globalAlpha = a1 * clamp(p * 2);
    [['MOLYBDENUM', C.inkSoft, 0], ['SILICON', C.teal, 1]].forEach(([k, col, i]) => {
      const ly = oy + 14 + i * 44;
      g.fillStyle = col; g.fillRect(ox + lw / 2 + 24, ly - 11, 26, 14);
      text(g, k, ox + lw / 2 + 60, ly, {
        size: 23, fam: F.label, weight: 700, fill: col, caps: true, track: 1.8,
      });
    });
    // constructive addition
    const ca = clamp((p - 0.5) * 3);
    if (ca > 0) {
      g.globalAlpha = a1 * ca;
      g.strokeStyle = C.yellow; g.lineWidth = 4;
      g.beginPath();
      for (let x = 0; x <= 320; x += 3) {
        const yy = oy + 400 + Math.sin(x / 26 + s.t * 3) * (12 + x * 0.09);
        x === 0 ? g.moveTo(ox - 160 + x, yy) : g.lineTo(ox - 160 + x, yy);
      }
      g.stroke();
      text(g, 'WEAK REFLECTIONS ADD UP', ox - 160, oy + 490, {
        size: 27, fam: F.display, fill: C.ink, caps: true, track: 1.6,
      });
    }
    g.restore();
  }

  // L2: 70% each, loss across 10
  const a2 = segA(s, 2, 2, 0.4);
  if (a2 > 0) {
    const p = segP(s, 2, 2);
    g.save(); g.globalAlpha = a2;
    headline(g, 'EACH MIRROR LOSES 30%', SAFE.x, 216, { size: 64, maxW: 1100, reveal: s.tw(2, 0.05, 0.8) });
    const n = 10, bw = 132, oy = H / 2 + 40;
    for (let i = 0; i < n; i++) {
      const q = clamp((p * 1.4 - i * 0.085) * 5);
      if (q <= 0) break;
      const frac = Math.pow(0.7, i + 1);
      const x = SAFE.x + i * bw;
      const h = 300 * frac;
      g.globalAlpha = a2 * q;
      g.fillStyle = hexA(C.yellow, 0.3 + 0.6 * frac);
      g.fillRect(x, oy - h, bw - 14, h);
      text(g, (frac * 100).toFixed(frac < 0.1 ? 1 : 0) + '%', x + (bw - 14) / 2, oy + 32, {
        size: 22, fam: F.mono, weight: 500, fill: C.inkSoft, align: 'center',
      });
      text(g, 'M' + (i + 1), x + (bw - 14) / 2, oy + 62, {
        size: 19, fam: F.label, weight: 600, fill: C.rule, align: 'center', caps: true, track: 1,
      });
    }
    g.globalAlpha = a2 * clamp((p - 0.62) * 3);
    text(g, 'AFTER 10 MIRRORS: ~3% OF THE BEAM SURVIVES', SAFE.x, H - 150, {
      size: 36, fam: F.display, fill: C.red, caps: true, track: 1.8,
    });
    text(g, 'so the source has to be brutally overpowered', SAFE.x, H - 108, {
      size: 26, fam: F.body, fill: C.inkSoft,
    });
    g.restore();
  }
}

// ------------------------------------------------------- ZEISS / GERMANY ----
export function zeiss_germany(g, s, ctx) {
  slate(g, s, ACT2);
  headline(g, 'GROUND TO AN IMPOSSIBLE PRECISION', SAFE.x, 212, {
    size: 58, maxW: 1200, reveal: s.tw(0, 0.1, 0.9),
  });

  // L0: the mirror blank
  const a0 = segA(s, 0, 0, 0.45);
  if (a0 > 0) {
    const p = s.tw(0, 0.3, 1.2);
    g.save(); g.globalAlpha = a0;
    const cx = W / 2, cy = H / 2 + 60;
    g.beginPath(); g.ellipse(cx, cy, 240 * p, 240 * p, 0, 0, 7);
    const grd = g.createRadialGradient(cx - 70, cy - 70, 20, cx, cy, 260);
    grd.addColorStop(0, hexA(C.teal, 0.55)); grd.addColorStop(1, hexA(C.tealD, 0.9));
    g.fillStyle = grd; g.fill();
    g.strokeStyle = C.ink; g.lineWidth = 4; g.stroke();
    // polishing sweep
    const sw = (s.t * 0.8) % 1;
    g.strokeStyle = hexA('#FFFFFF', 0.4); g.lineWidth = 30;
    g.beginPath(); g.arc(cx, cy, 170, sw * 6.28, sw * 6.28 + 0.6); g.stroke();
    g.restore();
  }

  // L1: the Germany analogy
  const a1 = segA(s, 1, 1, 0.45);
  if (a1 > 0 && ctx.assets.geo) {
    const p = segP(s, 1, 1);
    const de = ctx.assets.geo.byName['Germany'];
    g.save(); g.globalAlpha = a1;
    if (de) {
      const [x0, y0, x1, y1] = featureBounds(de);
      const scale = 7600;
      const proj = makeProj({
        scale, cx: (x0 + x1) / 2, cy: (y0 + y1) / 2,
        ox: W / 2 - 430, oy: H / 2 + 110,
      });
      drawFeature(g, de, proj, { fill: hexA(C.teal, 0.22), stroke: C.tealD, width: 4, alpha: clamp(p * 2.5) });
    }
    // callout
    const ca = clamp((p - 0.3) * 2.2);
    if (ca > 0) {
      g.globalAlpha = a1 * ca;
      const bx = W / 2 + 200, by = H / 2 - 60;
      panel(g, bx, by, 560, 280, { fill: C.white, r: 10, shadow: 0.12, alpha: ca });
      text(g, 'SCALE THE MIRROR', bx + 36, by + 62, {
        size: 26, fam: F.label, weight: 700, fill: C.inkSoft, caps: true, track: 2.2,
      });
      text(g, 'TO THE SIZE OF GERMANY', bx + 36, by + 100, {
        size: 34, fam: F.display, fill: C.ink, caps: true, track: 1.2,
      });
      text(g, '0.1 mm', bx + 36, by + 196, { size: 86, fam: F.stat, fill: C.red });
      text(g, 'TALLEST BUMP ON ITS SURFACE', bx + 36, by + 234, {
        size: 23, fam: F.label, weight: 600, fill: C.inkSoft, caps: true, track: 1.8,
      });
    }
    g.restore();
    source(g, "Carl Zeiss SMT's own published comparison", { alpha: a1 });
  }
}

// ---------------------------------------------------------- MACHINE SPECS ----
export function machine_specs(g, s) {
  slate(g, s, ACT2);

  // L0: the stage
  const a0 = segA(s, 0, 0, 0.4);
  if (a0 > 0) {
    const p = s.tw(0, 0.2, 1.0);
    g.save(); g.globalAlpha = a0;
    headline(g, 'A STAGE THAT NEVER MISSES', SAFE.x, 216, { size: 64, maxW: 1100, reveal: s.tw(0, 0.05, 0.8) });
    const cy = H / 2 + 40, cx = W / 2;
    const osc = Math.sin(s.t * 3.4) * 240 * p;
    g.strokeStyle = C.rule; g.lineWidth = 3;
    g.beginPath(); g.moveTo(cx - 420, cy + 70); g.lineTo(cx + 420, cy + 70); g.stroke();
    g.fillStyle = C.teal;
    roundRect(g, cx + osc - 110, cy - 20, 220, 90, 8); g.fill();
    text(g, 'WAFER', cx + osc, cy + 32, {
      size: 26, fam: F.label, weight: 700, fill: C.white, align: 'center', caps: true, track: 2,
    });
    // position readout
    text(g, (osc / 240 * 0.3).toFixed(3) + ' nm error', cx, cy + 160, {
      size: 36, fam: F.mono, weight: 500, fill: C.inkSoft, align: 'center', alpha: p,
    });
    text(g, 'HELD TO A FRACTION OF A NANOMETRE, AT SPEED', cx, cy + 220, {
      size: 28, fam: F.display, fill: C.ink, align: 'center', caps: true, track: 1.8, alpha: clamp(p * 2 - 1),
    });
    g.restore();
  }

  // L1: uptime
  const a1 = segA(s, 1, 1, 0.4);
  if (a1 > 0) {
    const p = segP(s, 1, 1);
    g.save(); g.globalAlpha = a1;
    headline(g, 'RUNNING AROUND THE CLOCK,\nFOR YEARS', SAFE.x, 216, { size: 60, maxW: 1100, reveal: s.tw(1, 0.05, 0.9) });
    const cx = W / 2, cy = H / 2 + 60, r = 160;
    g.strokeStyle = C.rule; g.lineWidth = 14;
    g.beginPath(); g.arc(cx, cy, r, 0, 7); g.stroke();
    g.strokeStyle = C.teal; g.lineWidth = 14; g.lineCap = 'round';
    g.beginPath(); g.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + 6.28 * 0.97 * clamp(p * 1.5)); g.stroke();
    text(g, '24 / 7', cx, cy + 16, { size: 76, fam: F.stat, fill: C.ink, align: 'center' });
    g.restore();
  }

  // L2: the price
  const a2 = segA(s, 2, 2, 0.4);
  if (a2 > 0) {
    const p = segP(s, 2, 2);
    g.save(); g.globalAlpha = a2;
    const sc = E.outBack(clamp(p * 2.2));
    g.translate(W / 2, H / 2 - 20); g.scale(lerp(0.8, 1, clamp(sc)), lerp(0.8, 1, clamp(sc))); g.translate(-W / 2, -H / 2 + 20);
    text(g, '€350M+', W / 2, H / 2 + 20, { size: 220, fam: F.stat, fill: C.ink, align: 'center' });
    text(g, 'REPORTED PRICE OF THE NEWEST GENERATION', W / 2, H / 2 + 86, {
      size: 29, fam: F.label, weight: 700, fill: C.inkSoft, align: 'center', caps: true, track: 3,
    });
    g.restore();
    g.save(); g.globalAlpha = a2 * clamp((p - 0.5) * 3);
    text(g, 'FABS BUY THEM ANYWAY. THE ALTERNATIVE IS NOT COMPETING.', W / 2, H - 170, {
      size: 34, fam: F.display, fill: C.red, align: 'center', caps: true, track: 2,
    });
    g.restore();
    source(g, 'analyst estimates reported in trade press; list prices vary', { alpha: a2 });
  }
}

// ------------------------------------------------------------- SUPPLY WEB ----
export function supply_web(g, s, ctx) {
  slate(g, s, ACT2);
  const p = segP(s, 0, 2);
  const proj = makeProj({ scale: 560, cx: 14, cy: 28, oy: H / 2 + 70 });

  if (ctx.assets.geo) {
    drawFeature(g, ctx.assets.geo.land, proj, { fill: hexA(C.ink, 0.1), alpha: s.tw(0, 0.1, 0.9) });
  }

  // Veldhoven, NL as the convergence point
  const [hx, hy] = proj(5.4, 51.4);

  // supplier nodes scattered across the industrial world
  const regions = [
    [-100, 40, 14], [-120, 37, 8], [8, 50, 22], [2, 48, 10], [13, 52, 14],
    [139, 36, 18], [127, 37, 9], [121, 24, 7], [116, 40, 6], [78, 20, 5],
    [-1, 52, 9], [11, 46, 7], [18, 59, 5], [34, 32, 3], [151, -33, 3],
  ];
  let total = 0;
  regions.forEach(([lon, lat, n], ri) => {
    for (let i = 0; i < n; i++) {
      const jx = (hash01(ri * 131 + i, 17) - 0.5) * 11;
      const jy = (hash01(ri * 977 + i, 23) - 0.5) * 7;
      const [x, y] = proj(lon + jx, lat + jy);
      const q = clamp((p * 1.25 - hash01(ri * 31 + i, 41) * 0.45) * 5);
      if (q <= 0) continue;
      total++;
      // link to hub, drawn during L1
      const lq = clamp((s.tw(1, 0.1, 2.4, E.inOutQuad) - hash01(ri * 7 + i, 13) * 0.35) * 2.2);
      if (lq > 0) {
        g.save(); g.globalAlpha = 0.3 * lq;
        g.strokeStyle = C.teal; g.lineWidth = 1.4;
        g.beginPath(); g.moveTo(x, y);
        g.quadraticCurveTo((x + hx) / 2, (y + hy) / 2 - 60, lerp(x, hx, lq), lerp(y, hy, lq));
        g.stroke(); g.restore();
      }
      g.save(); g.globalAlpha = q * 0.9;
      g.beginPath(); g.arc(x, y, 4.2, 0, 7);
      g.fillStyle = C.teal; g.fill(); g.restore();
    }
  });

  // the hub
  const hq = s.tw(1, 1.4, 0.9, E.outBack);
  if (hq > 0) {
    const pls = (s.t * 0.8) % 1;
    pin(g, hx, hy, { color: C.red, r: 13, prog: hq, pulseP: pls });
    g.save(); g.globalAlpha = clamp(hq * 1.5);
    text(g, 'VELDHOVEN, NL', hx + 26, hy - 14, {
      size: 27, fam: F.display, fill: C.ink, caps: true, track: 1.2,
    });
    text(g, 'one company', hx + 26, hy + 16, { size: 23, fam: F.body, fill: C.red });
    g.restore();
  }

  headline(g, 'NOT A PATENT.\nAN ECOSYSTEM.', SAFE.x, 216, { size: 62, maxW: 900, reveal: s.tw(0, 0.1, 1.0) });

  // closing line
  const a2 = s.tw(2, 0.2, 0.9);
  if (a2 > 0) {
    panel(g, W / 2 - 560, H - 236, 1120, 132, { fill: C.white, r: 8, shadow: 0.1, alpha: a2 });
    text(g, 'YOU CANNOT BUY IT. YOU CANNOT STEAL IT. YOU HAVE TO GROW IT.', W / 2, H - 182, {
      size: 36, fam: F.display, fill: C.ink, align: 'center', caps: true, track: 1.6, alpha: a2,
    });
    text(g, '~5,000 suppliers across 29 countries, thirty years deep', W / 2, H - 142, {
      size: 26, fam: F.body, fill: C.inkSoft, align: 'center', alpha: a2,
    });
  }
  source(g, 'ASML supplier disclosures', { alpha: s.tw(0, 0.4, 0.8) * 0.85 });
}
