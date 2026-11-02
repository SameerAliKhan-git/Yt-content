// Named, reusable elements -- built once, referenced by name from any scene.
//
// This is the consistency rule: an object that recurs across shots must be ONE
// definition, or each scene invents its own version of the same thing.
//
// Everything here is drawn to the real layout of the device it depicts, not an
// impression of it. The EUV scanner below follows the published architecture of
// an ASML NXE-class machine: laser-produced-plasma source -> collector ->
// intermediate focus -> illuminator -> reflective reticle (above) -> six-mirror
// projection optics -> wafer stage, all under vacuum.
import { C, F, W, H } from '../lib/theme.js';
import { clamp, lerp, tw, E, hexA, hash01 } from '../lib/anim.js';
import { text, roundRect, measure } from '../lib/draw.js';

const lab = (g, s, x, y, { size = 17, fill = C.inkSoft, align = 'left', alpha = 1 } = {}) =>
  text(g, s, x, y, { size, fam: F.label, weight: 700, fill, align, caps: true, track: 1.5, alpha });

/**
 * EUV lithography scanner, cutaway schematic.
 * Local coordinate space is roughly 1180 x 720, centred on (0,0).
 *
 * opts.build   0..1 staged assembly
 * opts.beam    0..1 beam visibility
 * opts.labels  0..1 label visibility
 * opts.dark    render for a dark stage
 */
export function euvScanner(g, cx, cy, sc, {
  build = 1, beam = 1, labels = 1, dark = false, t = 0,
} = {}) {
  const ink = dark ? '#F3EFE7' : C.ink;
  const soft = dark ? hexA('#F3EFE7', 0.55) : C.inkSoft;
  const hull = dark ? '#262019' : '#FFFFFF';
  const edge = dark ? hexA('#F3EFE7', 0.42) : C.ink;
  const B = clamp(build);

  g.save();
  g.translate(cx, cy); g.scale(sc, sc);

  // ---- stage order: each module eases in, left to right ---------------------
  const stage = (d) => E.outCubic(clamp((B - d) * 2.6));

  // vacuum envelope
  const sV = stage(0);
  if (sV > 0) {
    g.save(); g.globalAlpha *= sV;
    g.strokeStyle = hexA(edge, 0.45); g.lineWidth = 3; g.setLineDash([14, 10]);
    roundRect(g, -600, -350, 1200, 700, 22); g.stroke(); g.setLineDash([]);
    if (labels > 0) lab(g, 'VACUUM ENVELOPE', -594, 372, { fill: soft, alpha: labels * sV, size: 15 });
    g.restore();
  }

  // ---------------- 1. source vessel: tin droplets + CO2 laser --------------
  const s1 = stage(0.06);
  if (s1 > 0) {
    g.save(); g.globalAlpha *= s1;
    g.fillStyle = hull; g.strokeStyle = edge; g.lineWidth = 3;
    roundRect(g, -560, -210, 300, 420, 12); g.fill(); g.stroke();

    // droplet generator at the top
    g.fillStyle = ink; roundRect(g, -425, -200, 36, 54, 5); g.fill();
    // falling tin droplets toward the plasma point
    const px = -407, py = 10;
    if (beam > 0) {
      for (let i = 0; i < 7; i++) {
        const u = ((t * 2.2 + i / 7) % 1);
        const y = lerp(-140, py, u);
        g.globalAlpha = s1 * beam * (0.35 + 0.6 * u);
        g.beginPath(); g.arc(px, y, 4.6, 0, 7); g.fillStyle = ink; g.fill();
      }
      g.globalAlpha = s1;
    }
    // CO2 drive laser entering from the left
    g.strokeStyle = C.red; g.lineWidth = 6; g.lineCap = 'round';
    g.beginPath(); g.moveTo(-560, py); g.lineTo(px - 14, py); g.stroke();
    // collector: ellipsoidal mirror gathering plasma light to intermediate focus
    g.strokeStyle = C.teal; g.lineWidth = 8;
    g.beginPath(); g.arc(px, py, 118, Math.PI * 0.60, Math.PI * 1.40); g.stroke();
    // plasma point
    if (beam > 0) {
      const puls = 0.55 + 0.45 * Math.sin(t * 9);
      const grd = g.createRadialGradient(px, py, 1, px, py, 42 * puls);
      grd.addColorStop(0, hexA('#FFFFFF', 0.95 * beam));
      grd.addColorStop(0.4, hexA(C.yellow, 0.7 * beam));
      grd.addColorStop(1, hexA(C.yellow, 0));
      g.fillStyle = grd; g.beginPath(); g.arc(px, py, 42 * puls, 0, 7); g.fill();
    }
    if (labels > 0) {
      const a = labels * s1;
      lab(g, 'TIN DROPLETS', -425, -214, { fill: soft, alpha: a });
      lab(g, 'CO\u2082 LASER', -556, py - 26, { fill: C.red, alpha: a });
      lab(g, 'COLLECTOR', -510, py + 160, { fill: C.teal, alpha: a });
      lab(g, 'LPP SOURCE', -560, 230, { fill: soft, alpha: a, size: 19 });
    }
    g.restore();
  }

  // ---------------- 2. illuminator -------------------------------------------
  const s2 = stage(0.18);
  if (s2 > 0) {
    g.save(); g.globalAlpha *= s2;
    g.fillStyle = hull; g.strokeStyle = edge; g.lineWidth = 3;
    roundRect(g, -240, -170, 250, 340, 12); g.fill(); g.stroke();
    // shaping mirrors
    g.strokeStyle = C.teal; g.lineWidth = 7; g.lineCap = 'round';
    [[-170, -60, 0.5], [-70, 60, -0.45], [-30, -80, 0.35]].forEach(([mx, my, rot]) => {
      g.save(); g.translate(mx, my); g.rotate(rot);
      g.beginPath(); g.moveTo(-42, 0); g.lineTo(42, 0); g.stroke(); g.restore();
    });
    if (labels > 0) lab(g, 'ILLUMINATOR', -240, 190, { fill: soft, alpha: labels * s2, size: 19 });
    g.restore();
  }

  // ---------------- 3. reticle (reflective mask) above ----------------------
  const s3 = stage(0.3);
  if (s3 > 0) {
    g.save(); g.globalAlpha *= s3;
    // reticle stage scans; EUV masks are reflective, not transmissive
    const scan = Math.sin(t * 1.5) * 26;
    g.fillStyle = ink; roundRect(g, 60 + scan, -322, 230, 26, 4); g.fill();
    g.strokeStyle = C.yellow; g.lineWidth = 4;
    g.beginPath(); g.moveTo(60 + scan, -296); g.lineTo(290 + scan, -296); g.stroke();
    if (labels > 0) {
      lab(g, 'RETICLE (REFLECTIVE MASK)', 60 + scan, -336, { fill: soft, alpha: labels * s3 });
      // scan direction arrow
      g.strokeStyle = soft; g.lineWidth = 2;
      g.beginPath(); g.moveTo(310 + scan, -309); g.lineTo(348 + scan, -309); g.stroke();
    }
    g.restore();
  }

  // ---------------- 4. projection optics: six mirrors -----------------------
  const s4 = stage(0.42);
  if (s4 > 0) {
    g.save(); g.globalAlpha *= s4;
    g.fillStyle = hull; g.strokeStyle = edge; g.lineWidth = 3;
    roundRect(g, 40, -230, 330, 460, 12); g.fill(); g.stroke();
    // six-mirror demagnifying column
    const mirrors = [[95, -150, 0.42], [300, -70, -0.5], [120, 10, 0.3],
                     [300, 90, -0.36], [150, 150, 0.5], [285, 195, -0.3]];
    g.strokeStyle = C.teal; g.lineWidth = 7; g.lineCap = 'round';
    mirrors.forEach(([mx, my, rot], i) => {
      const q = clamp((B - 0.42 - i * 0.025) * 9);
      if (q <= 0) return;
      g.save(); g.globalAlpha *= q; g.translate(mx, my); g.rotate(rot);
      const r = 40 - i * 2.5;
      g.beginPath(); g.moveTo(-r, 0); g.lineTo(r, 0); g.stroke();
      g.restore();
    });
    if (labels > 0) {
      lab(g, 'PROJECTION OPTICS', 40, 250, { fill: soft, alpha: labels * s4, size: 19 });
      lab(g, '6 MIRRORS \u00B7 \u22484\u00D7 REDUCTION', 40, 272, { fill: soft, alpha: labels * s4, size: 15 });
    }
    g.restore();
  }

  // ---------------- 5. wafer stage -------------------------------------------
  const s5 = stage(0.56);
  if (s5 > 0) {
    g.save(); g.globalAlpha *= s5;
    const scan = -Math.sin(t * 1.5) * 26 * 0.25;   // opposite sense, 4x reduction
    g.fillStyle = hexA(C.teal, dark ? 0.3 : 0.22);
    g.strokeStyle = C.teal; g.lineWidth = 3;
    roundRect(g, 420 + scan, 250, 200, 30, 4); g.fill(); g.stroke();
    g.fillStyle = ink; roundRect(g, 400 + scan, 284, 240, 22, 4); g.fill();
    if (labels > 0) lab(g, 'WAFER STAGE', 420 + scan, 326, { fill: soft, alpha: labels * s5 });
    g.restore();
  }

  // ---------------- beam path through the whole column ----------------------
  if (beam > 0 && B > 0.6) {
    const bq = clamp((B - 0.6) * 2.5) * beam;
    g.save(); g.globalAlpha *= bq;
    g.strokeStyle = C.yellow; g.lineWidth = 4; g.setLineDash([13, 9]);
    g.lineDashOffset = -t * 42;                      // light travelling
    g.beginPath();
    g.moveTo(-407, 10);        // plasma
    g.lineTo(-250, 10);        // intermediate focus
    g.lineTo(-170, -60);
    g.lineTo(-70, 60);
    g.lineTo(-30, -80);
    g.lineTo(175, -296);       // up to the reticle
    g.lineTo(95, -150);        // into the projection column
    g.lineTo(300, -70);
    g.lineTo(120, 10);
    g.lineTo(300, 90);
    g.lineTo(150, 150);
    g.lineTo(285, 195);
    g.lineTo(520, 250);        // down to the wafer
    g.stroke(); g.setLineDash([]); g.lineDashOffset = 0;
    g.restore();
  }

  g.restore();
}

/** Intermediate-focus callout used when the scene needs to name one part. */
export function callout(g, x, y, label, { prog = 1, color = C.red, len = 90, dir = 1, size = 20 } = {}) {
  const p = clamp(prog); if (p <= 0) return;
  g.save();
  g.strokeStyle = color; g.lineWidth = 3; g.lineCap = 'round';
  g.beginPath(); g.arc(x, y, 7, 0, 7); g.fillStyle = color; g.fill();
  g.beginPath(); g.moveTo(x, y); g.lineTo(x + dir * len * p, y - 46 * p); g.stroke();
  if (p > 0.85) text(g, label, x + dir * (len + 10), y - 52, {
    size, fam: F.label, weight: 700, fill: color, caps: true, track: 1.6,
    align: dir > 0 ? 'left' : 'right', alpha: clamp((p - 0.85) * 7),
  });
  g.restore();
}

/**
 * SoC die floorplan, drawn to the real block structure of a modern mobile SoC:
 * big+little CPU clusters, GPU array, NPU, SLC cache, memory controllers and
 * I/O around the edge. Proportions follow published die-shot annotations
 * rather than decorative rectangles.
 */
const DIE_BLOCKS = [
  // x, y, w, h  (unit square), label, colour key
  [0.04, 0.05, 0.30, 0.26, 'GPU',        'teal'],
  [0.36, 0.05, 0.26, 0.17, 'CPU  P-CORES','red'],
  [0.36, 0.24, 0.26, 0.07, 'E-CORES',    'redD'],
  [0.64, 0.05, 0.22, 0.26, 'NPU',        'yellow'],
  [0.04, 0.33, 0.58, 0.22, 'SLC CACHE',  'blue'],
  [0.64, 0.33, 0.22, 0.22, 'ISP',        'plum'],
  [0.04, 0.57, 0.26, 0.17, 'MEMORY CTRL','teal'],
  [0.32, 0.57, 0.30, 0.17, 'MODEM',      'yellow'],
  [0.64, 0.57, 0.22, 0.17, 'MEDIA',      'teal'],
];

export function dieFloorplan(g, x, y, w, h, {
  prog = 1, labels = 1, alpha = 1, t = 0, dark = false,
} = {}) {
  if (alpha <= 0) return;
  const P = clamp(prog);
  const ink = dark ? '#F3EFE7' : C.ink;
  const COL = { teal: C.teal, red: C.red, redD: C.redD, yellow: C.yellow, blue: C.blue, plum: C.plum };
  g.save(); g.globalAlpha *= alpha;

  // substrate
  g.fillStyle = dark ? '#171310' : hexA(C.ink, 0.06);
  roundRect(g, x, y, w, h, 6); g.fill();
  g.strokeStyle = hexA(ink, 0.5); g.lineWidth = 2; roundRect(g, x, y, w, h, 6); g.stroke();

  // functional blocks
  DIE_BLOCKS.forEach(([bx, by, bw, bh, name, ck], i) => {
    const q = clamp((P * 1.35 - i * 0.07) * 4);
    if (q <= 0) return;
    const X = x + bx * w, Y = y + by * h, Wd = bw * w, Hd = bh * h;
    g.save(); g.globalAlpha *= q;
    g.fillStyle = hexA(COL[ck], 0.3);
    roundRect(g, X, Y, Wd, Hd, 3); g.fill();
    g.strokeStyle = hexA(COL[ck], 0.95); g.lineWidth = 1.6;
    roundRect(g, X, Y, Wd, Hd, 3); g.stroke();
    // repeating sub-structure, as a real block shows
    g.globalAlpha *= 0.5;
    g.strokeStyle = hexA(COL[ck], 0.8); g.lineWidth = 0.8;
    const n = Math.max(2, Math.round(Wd / 9));
    for (let k = 1; k < n; k++) {
      const lx = X + (k / n) * Wd;
      g.beginPath(); g.moveTo(lx, Y + 2); g.lineTo(lx, Y + Hd - 2); g.stroke();
    }
    g.restore();
    if (labels > 0 && Wd > 54 && q > 0.75) {
      text(g, name, X + Wd / 2, Y + Hd / 2 + 4, {
        size: Math.min(13, Wd / 7.5), fam: F.label, weight: 700,
        fill: dark ? '#F3EFE7' : C.ink, align: 'center', caps: true, track: 0.8,
        alpha: labels * clamp((q - 0.75) * 4),
      });
    }
  });

  // bond pads around the edge
  const pq = clamp((P - 0.5) * 3);
  if (pq > 0) {
    g.save(); g.globalAlpha *= pq;
    g.fillStyle = hexA(ink, 0.5);
    const pads = 26;
    for (let i = 0; i < pads; i++) {
      const u = (i + 0.5) / pads;
      g.fillRect(x + u * w - 2, y + h - h * 0.2, 4, h * 0.055);
      g.fillRect(x + u * w - 2, y + h * 0.955, 4, h * 0.035);
    }
    g.restore();
  }
  g.restore();
}

/** FinFET-style transistor row -- the structure under the floorplan. */
export function finfetRow(g, x, y, w, h, { prog = 1, alpha = 1, n = 7, dark = false } = {}) {
  if (alpha <= 0) return;
  const P = clamp(prog);
  g.save(); g.globalAlpha *= alpha;
  const pitch = w / n;
  for (let i = 0; i < n; i++) {
    const q = clamp((P * 1.3 - i * 0.09) * 4);
    if (q <= 0) break;
    const fx = x + i * pitch;
    g.save(); g.globalAlpha *= q;
    // source / drain
    g.fillStyle = hexA(C.teal, 0.45);
    roundRect(g, fx + pitch * 0.08, y + h * 0.42, pitch * 0.3, h * 0.5, 2); g.fill();
    roundRect(g, fx + pitch * 0.62, y + h * 0.42, pitch * 0.3, h * 0.5, 2); g.fill();
    // fins
    g.fillStyle = hexA(C.tealD, 0.85);
    for (let k = 0; k < 3; k++)
      g.fillRect(fx + pitch * 0.2 + k * pitch * 0.2, y + h * 0.3, pitch * 0.07, h * 0.62);
    // gate over the fins
    g.fillStyle = C.red;
    roundRect(g, fx + pitch * 0.36, y + h * 0.12, pitch * 0.26, h * 0.7, 2); g.fill();
    g.restore();
  }
  g.restore();
}
