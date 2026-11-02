// Canvas drawing primitives in the Vox house style.
import { C, F, font, W, H } from './theme.js';
import { clamp, lerp, inv, tw, E, hexA, hash01, commas } from './anim.js';

// ---------------------------------------------------------------- text ----
export function text(g, str, x, y, {
  size = 40, fam = F.body, weight = 400, fill = C.ink,
  align = 'left', base = 'alphabetic', track = 0, caps = false, alpha = 1,
} = {}) {
  if (alpha <= 0) return 0;
  const s = caps ? String(str).toUpperCase() : String(str);
  g.save();
  g.globalAlpha *= alpha;
  g.font = font(size, fam, weight);
  g.fillStyle = fill;
  g.textBaseline = base;
  if (!track) {
    g.textAlign = align;
    g.fillText(s, x, y);
    const w = g.measureText(s).width;
    g.restore();
    return w;
  }
  // manual letter-spacing
  const chars = [...s];
  const total = chars.reduce((a, c) => a + g.measureText(c).width + track, 0) - track;
  let cx = align === 'center' ? x - total / 2 : align === 'right' ? x - total : x;
  g.textAlign = 'left';
  for (const ch of chars) { g.fillText(ch, cx, y); cx += g.measureText(ch).width + track; }
  g.restore();
  return total;
}

export function measure(g, str, size, fam = F.body, weight = 400, track = 0) {
  g.save(); g.font = font(size, fam, weight);
  const chars = [...String(str)];
  const w = track
    ? chars.reduce((a, c) => a + g.measureText(c).width + track, 0) - track
    : g.measureText(String(str)).width;
  g.restore(); return w;
}

export function wrap(g, str, maxW, size, fam = F.body, weight = 400) {
  g.save(); g.font = font(size, fam, weight);
  const words = String(str).split(/\s+/), lines = []; let cur = '';
  for (const w of words) {
    const test = cur ? cur + ' ' + w : w;
    if (g.measureText(test).width > maxW && cur) { lines.push(cur); cur = w; }
    else cur = test;
  }
  if (cur) lines.push(cur);
  g.restore(); return lines;
}

export function paragraph(g, str, x, y, {
  maxW = 900, size = 34, fam = F.body, weight = 400, lh = 1.45,
  fill = C.ink, align = 'left', alpha = 1, reveal = 1,
} = {}) {
  const lines = wrap(g, str, maxW, size, fam, weight);
  const shown = Math.ceil(lines.length * clamp(reveal) );
  lines.slice(0, shown).forEach((ln, i) => {
    const la = i === shown - 1 ? clamp((clamp(reveal) * lines.length) - (shown - 1)) : 1;
    text(g, ln, x, y + i * size * lh, { size, fam, weight, fill, align, alpha: alpha * la });
  });
  return lines.length * size * lh;
}

/** Headline that reveals word-by-word. */
export function headline(g, str, x, y, {
  size = 92, maxW = 1400, fill = C.ink, align = 'left', reveal = 1,
  lh = 1.02, fam = F.display, weight = 400, track = 1,
} = {}) {
  const lines = wrap(g, String(str).toUpperCase(), maxW, size, fam, weight);
  const all = lines.map(l => l.split(' '));
  const nWords = all.reduce((a, l) => a + l.length, 0);
  const shown = clamp(reveal) * nWords;
  let idx = 0;
  all.forEach((words, li) => {
    const yy = y + li * size * lh;
    let cx = align === 'center'
      ? x - measure(g, words.join(' '), size, fam, weight, track) / 2
      : align === 'right'
        ? x - measure(g, words.join(' '), size, fam, weight, track) : x;
    for (const w of words) {
      const a = clamp(shown - idx);
      if (a > 0) {
        const dy = (1 - E.outCubic(a)) * size * 0.26;
        text(g, w, cx, yy + dy, { size, fam, weight, fill, track, alpha: a });
      }
      cx += measure(g, w + ' ', size, fam, weight, track);
      idx++;
    }
  });
  return lines.length * size * lh;
}

/** Small all-caps kicker with a rule, the Vox section marker. */
export function kicker(g, str, x, y, { fill = C.red, size = 26, alpha = 1, ruleW = 54 } = {}) {
  if (alpha <= 0) return;
  g.save(); g.globalAlpha *= alpha;
  g.fillStyle = fill;
  g.fillRect(x, y - size * 0.42, ruleW * 1, 5);
  text(g, str, x + ruleW + 16, y, { size, fam: F.label, weight: 700, fill, caps: true, track: 2.4 });
  g.restore();
}

/** Giant stat number with label underneath. */
export function stat(g, value, label, x, y, {
  size = 180, fill = C.ink, labelFill = C.inkSoft, align = 'center', alpha = 1, labelSize = 30,
} = {}) {
  if (alpha <= 0) return;
  text(g, value, x, y, { size, fam: F.stat, fill, align, alpha, base: 'alphabetic' });
  if (label) text(g, label, x, y + labelSize * 1.5, {
    size: labelSize, fam: F.label, weight: 600, fill: labelFill,
    align, caps: true, track: 3, alpha,
  });
}

// -------------------------------------------------------------- shapes ----
export function roundRect(g, x, y, w, h, r = 12) {
  const rr = Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2);
  g.beginPath(); g.moveTo(x + rr, y);
  g.arcTo(x + w, y, x + w, y + h, rr);
  g.arcTo(x + w, y + h, x, y + h, rr);
  g.arcTo(x, y + h, x, y, rr);
  g.arcTo(x, y, x + w, y, rr);
  g.closePath();
}

export function panel(g, x, y, w, h, { fill = C.white, r = 14, shadow = 0.1, alpha = 1 } = {}) {
  if (alpha <= 0) return;
  g.save(); g.globalAlpha *= alpha;
  if (shadow) { g.shadowColor = hexA('#000000', shadow); g.shadowBlur = 26; g.shadowOffsetY = 8; }
  g.fillStyle = fill; roundRect(g, x, y, w, h, r); g.fill();
  g.restore();
}

export function arrow(g, x1, y1, x2, y2, {
  color = C.ink, width = 5, head = 20, prog = 1, dash = null, curve = 0,
} = {}) {
  const p = clamp(prog); if (p <= 0) return;
  g.save(); g.strokeStyle = color; g.lineWidth = width; g.lineCap = 'round';
  if (dash) g.setLineDash(dash);
  const mx = (x1 + x2) / 2 - (y2 - y1) * curve;
  const my = (y1 + y2) / 2 + (x2 - x1) * curve;
  // sample quadratic to p
  const pt = u => {
    const k = 1 - u;
    return [k * k * x1 + 2 * k * u * mx + u * u * x2, k * k * y1 + 2 * k * u * my + u * u * y2];
  };
  g.beginPath(); g.moveTo(x1, y1);
  const N = 40;
  for (let i = 1; i <= N; i++) { const [px, py] = pt(p * i / N); g.lineTo(px, py); }
  g.stroke();
  if (p > 0.985 && head > 0) {
    const [ax, ay] = pt(p), [bx, by] = pt(p - 0.02);
    const a = Math.atan2(ay - by, ax - bx);
    g.setLineDash([]); g.fillStyle = color;
    g.beginPath();
    g.moveTo(ax, ay);
    g.lineTo(ax - head * Math.cos(a - 0.42), ay - head * Math.sin(a - 0.42));
    g.lineTo(ax - head * Math.cos(a + 0.42), ay - head * Math.sin(a + 0.42));
    g.closePath(); g.fill();
  }
  g.restore();
}

/** Hand-drawn-feel circle highlight that draws on. */
export function circleHL(g, cx, cy, rx, ry, { color = C.red, width = 6, prog = 1, seed = 3, rot = -0.2 } = {}) {
  const p = clamp(prog); if (p <= 0) return;
  g.save(); g.strokeStyle = color; g.lineWidth = width; g.lineCap = 'round';
  g.translate(cx, cy); g.rotate(rot);
  g.beginPath();
  const N = 90, turns = 1.06;
  for (let i = 0; i <= N * p; i++) {
    const a = (i / N) * Math.PI * 2 * turns;
    const w = 1 + (hash01(i, seed) - 0.5) * 0.045;
    const x = Math.cos(a) * rx * w, y = Math.sin(a) * ry * w;
    i === 0 ? g.moveTo(x, y) : g.lineTo(x, y);
  }
  g.stroke(); g.restore();
}

export function underline(g, x, y, w, { color = C.yellow, h = 14, prog = 1, alpha = 1 } = {}) {
  const p = clamp(prog); if (p <= 0) return;
  g.save(); g.globalAlpha *= alpha; g.fillStyle = color;
  g.fillRect(x, y, w * p, h); g.restore();
}

// -------------------------------------------------------------- charts ----
export function barsH(g, items, x, y, {
  w = 900, barH = 56, gap = 22, max = null, prog = 1, labelSize = 26,
  valueFmt = v => commas(v), stagger = 0.12, showValue = true,
} = {}) {
  const mx = max ?? Math.max(...items.map(d => d.v));
  items.forEach((d, i) => {
    const p = clamp((prog - i * stagger) / (1 - Math.min(0.85, stagger * (items.length - 1))));
    const pe = E.outQuart(clamp(p));
    const yy = y + i * (barH + gap);
    g.fillStyle = hexA(C.rule, 0.5); roundRect(g, x, yy, w, barH, 4); g.fill();
    const bw = w * (d.v / mx) * pe;
    g.fillStyle = d.c || C.red; roundRect(g, x, yy, Math.max(0, bw), barH, 4); g.fill();
    text(g, d.k, x - 22, yy + barH * 0.5, {
      size: labelSize, fam: F.label, weight: 600, fill: C.ink,
      align: 'right', base: 'middle', caps: true, track: 1.5, alpha: pe,
    });
    if (showValue && pe > 0.03) {
      const vs = valueFmt(d.v * pe);
      const inside = bw > measure(g, vs, labelSize + 4, F.mono, 500) + 36;
      text(g, vs, inside ? x + bw - 16 : x + bw + 16, yy + barH * 0.5, {
        size: labelSize + 4, fam: F.mono, weight: 500,
        fill: inside ? C.white : C.inkSoft, align: inside ? 'right' : 'left',
        base: 'middle', alpha: pe,
      });
    }
  });
  return items.length * (barH + gap) - gap;
}

/** Line chart; set logY for decades. pts = [[x,y],...] in data space. */
export function lineChart(g, pts, box, {
  logY = false, xDom = null, yDom = null, color = C.red, width = 6,
  prog = 1, dots = true, dotR = 9, fillUnder = false,
} = {}) {
  const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]);
  const xd = xDom ?? [Math.min(...xs), Math.max(...xs)];
  const yd = yDom ?? [Math.min(...ys), Math.max(...ys)];
  const ty = v => logY
    ? inv(Math.log10(v), Math.log10(yd[0]), Math.log10(yd[1]))
    : inv(v, yd[0], yd[1]);
  const px = v => box.x + inv(v, xd[0], xd[1]) * box.w;
  const py = v => box.y + box.h - ty(v) * box.h;
  const p = clamp(prog);
  const n = pts.length, shown = p * (n - 1);
  g.save();
  const path = [];
  for (let i = 0; i < n; i++) {
    if (i <= shown) path.push([px(pts[i][0]), py(pts[i][1])]);
    else if (i - 1 < shown) {
      const f = shown - (i - 1);
      path.push([lerp(px(pts[i - 1][0]), px(pts[i][0]), f),
                 lerp(py(pts[i - 1][1]), py(pts[i][1]), f)]);
      break;
    }
  }
  if (path.length > 1) {
    if (fillUnder) {
      g.beginPath(); g.moveTo(path[0][0], box.y + box.h);
      path.forEach(([a, b]) => g.lineTo(a, b));
      g.lineTo(path[path.length - 1][0], box.y + box.h); g.closePath();
      g.fillStyle = hexA(color, 0.14); g.fill();
    }
    g.beginPath(); g.moveTo(...path[0]);
    path.forEach(([a, b]) => g.lineTo(a, b));
    g.strokeStyle = color; g.lineWidth = width; g.lineJoin = 'round'; g.lineCap = 'round'; g.stroke();
  }
  if (dots) path.forEach(([a, b], i) => {
    if (i >= Math.floor(shown) + 1) return;
    g.beginPath(); g.arc(a, b, dotR, 0, 7); g.fillStyle = C.bg; g.fill();
    g.lineWidth = 5; g.strokeStyle = color; g.stroke();
  });
  g.restore();
  return { px, py };
}

export function axes(g, box, { xTicks = [], yTicks = [], fmtX = v => v, fmtY = v => v,
  logY = false, xDom, yDom, alpha = 1, grid = true } = {}) {
  if (alpha <= 0) return;
  g.save(); g.globalAlpha *= alpha;
  const ty = v => logY
    ? inv(Math.log10(v), Math.log10(yDom[0]), Math.log10(yDom[1]))
    : inv(v, yDom[0], yDom[1]);
  g.strokeStyle = C.rule; g.lineWidth = 2;
  yTicks.forEach(v => {
    const y = box.y + box.h - ty(v) * box.h;
    if (grid) { g.beginPath(); g.moveTo(box.x, y); g.lineTo(box.x + box.w, y); g.stroke(); }
    text(g, fmtY(v), box.x - 18, y, { size: 22, fam: F.mono, fill: C.inkSoft, align: 'right', base: 'middle' });
  });
  xTicks.forEach(v => {
    const x = box.x + inv(v, xDom[0], xDom[1]) * box.w;
    text(g, fmtX(v), x, box.y + box.h + 34, { size: 24, fam: F.label, weight: 600, fill: C.inkSoft, align: 'center', track: 1 });
  });
  g.strokeStyle = C.ink; g.lineWidth = 3;
  g.beginPath(); g.moveTo(box.x, box.y + box.h); g.lineTo(box.x + box.w, box.y + box.h); g.stroke();
  g.restore();
}

/** Wafer of dies with deterministic defects. */
export function wafer(g, cx, cy, r, {
  cols = 11, good = C.teal, bad = C.red, defectRate = 0.2, seed = 7,
  prog = 1, showDefects = 1, dieGap = 3,
} = {}) {
  const d = (r * 2) / cols, out = { good: 0, bad: 0 };
  g.save();
  g.beginPath(); g.arc(cx, cy, r + d * 0.3, 0, 7);
  g.fillStyle = hexA(C.ink, 0.06); g.fill();
  let k = 0;
  for (let i = 0; i < cols; i++) for (let j = 0; j < cols; j++) {
    const x = cx - r + i * d, y = cy - r + j * d;
    const mx = x + d / 2 - cx, my = y + d / 2 - cy;
    if (Math.hypot(mx, my) > r - d * 0.25) continue;
    const idx = k++;
    const isBad = hash01(idx, seed) < defectRate;
    isBad ? out.bad++ : out.good++;
    const ap = clamp((prog - (idx / 140) * 0.55) * 4);
    if (ap <= 0) continue;
    g.globalAlpha = ap;
    g.fillStyle = isBad
      ? (showDefects > 0 ? hexA(bad, 0.25 + 0.75 * showDefects) : hexA(good, 0.9))
      : hexA(good, 0.9);
    roundRect(g, x + dieGap / 2, y + dieGap / 2, d - dieGap, d - dieGap, 2); g.fill();
    if (isBad && showDefects > 0.4) {
      g.globalAlpha = ap * showDefects; g.strokeStyle = bad; g.lineWidth = 2.5;
      const p = 5;
      g.beginPath();
      g.moveTo(x + p, y + p); g.lineTo(x + d - p, y + d - p);
      g.moveTo(x + d - p, y + p); g.lineTo(x + p, y + d - p); g.stroke();
    }
  }
  g.restore(); return out;
}

// ----------------------------------------------------------------- map ----
export function makeProj({ cx = 0, cy = 20, scale = 300, w = W, h = H, ox = w / 2, oy = h / 2 }) {
  // Equirectangular with latitude compression — readable and cheap.
  const k = scale / 180;
  return (lon, lat) => [ox + (lon - cx) * k * 1.0, oy - (lat - cy) * k * 1.0];
}

/** Collect every polygon ring set from a Feature, FeatureCollection or geometry. */
function collectPolys(node, out = []) {
  if (!node) return out;
  if (node.type === 'FeatureCollection') { node.features.forEach(f => collectPolys(f, out)); return out; }
  if (node.type === 'GeometryCollection') { node.geometries.forEach(f => collectPolys(f, out)); return out; }
  const geom = node.geometry || node;
  if (!geom || !geom.type) return out;
  if (geom.type === 'Polygon') out.push(geom.coordinates);
  else if (geom.type === 'MultiPolygon') out.push(...geom.coordinates);
  else if (geom.type === 'GeometryCollection') geom.geometries.forEach(f => collectPolys(f, out));
  return out;
}

export function drawFeature(g, feature, proj, { fill = null, stroke = null, width = 1.5, alpha = 1 } = {}) {
  if (alpha <= 0 || !feature) return;
  const polys = collectPolys(feature);
  g.save(); g.globalAlpha *= alpha;
  g.beginPath();
  for (const poly of polys) for (const ring of poly) {
    ring.forEach(([lon, lat], i) => {
      const [x, y] = proj(lon, lat);
      i === 0 ? g.moveTo(x, y) : g.lineTo(x, y);
    });
    g.closePath();
  }
  if (fill) { g.fillStyle = fill; g.fill(); }
  if (stroke) { g.strokeStyle = stroke; g.lineWidth = width; g.lineJoin = 'round'; g.stroke(); }
  g.restore();
}

/** Bounding box of a feature in lon/lat. */
export function featureBounds(feature) {
  let x0 = 180, y0 = 90, x1 = -180, y1 = -90;
  const polys = collectPolys(feature);
  for (const poly of polys) for (const ring of poly) for (const [lon, lat] of ring) {
    if (lon < x0) x0 = lon; if (lon > x1) x1 = lon;
    if (lat < y0) y0 = lat; if (lat > y1) y1 = lat;
  }
  return [x0, y0, x1, y1];
}

export function pin(g, x, y, { color = C.red, r = 11, prog = 1, label = null, labelSize = 22, pulseP = 0 } = {}) {
  const p = E.outBack(clamp(prog)); if (p <= 0) return;
  g.save();
  if (pulseP > 0) {
    const rr = r + 28 * pulseP;
    g.beginPath(); g.arc(x, y, rr, 0, 7);
    g.fillStyle = hexA(color, 0.28 * (1 - pulseP)); g.fill();
  }
  g.beginPath(); g.arc(x, y, r * p, 0, 7);
  g.fillStyle = color; g.fill();
  g.lineWidth = 3.5; g.strokeStyle = C.bg; g.stroke();
  if (label) text(g, label, x + r + 12, y, {
    size: labelSize, fam: F.label, weight: 700, fill: C.ink, base: 'middle', caps: true, track: 1.2, alpha: clamp(prog * 2 - 1),
  });
  g.restore();
}

// ------------------------------------------------------------------ fx ----
let _noiseTile = null;
function noiseTile() {
  if (_noiseTile) return _noiseTile;
  const N = 256;
  const c = (typeof OffscreenCanvas !== 'undefined')
    ? new OffscreenCanvas(N, N)
    : Object.assign(document.createElement('canvas'), { width: N, height: N });
  const x = c.getContext('2d');
  const img = x.createImageData(N, N);
  for (let i = 0; i < N * N; i++) {
    const v = hash01(i, 101);
    const lum = v < 0.5 ? 0 : 255;
    img.data[i * 4] = img.data[i * 4 + 1] = img.data[i * 4 + 2] = lum;
    // only a sparse subset carries any opacity -> fine grain, not a crosshatch
    img.data[i * 4 + 3] = v < 0.12 || v > 0.88 ? 255 : 0;
  }
  x.putImageData(img, 0, 0);
  _noiseTile = c; return c;
}

/** Film grain: a cached 256px noise tile, jittered per frame. */
export function grain(g, amount = 0.02, frame = 0) {
  if (amount <= 0) return;
  const t = noiseTile();
  const ox = -Math.floor(hash01(frame, 7) * 256);
  const oy = -Math.floor(hash01(frame, 13) * 256);
  g.save();
  g.globalAlpha = amount;
  const pat = g.createPattern(t, 'repeat');
  if (pat) {
    g.fillStyle = pat;
    g.translate(ox, oy);
    g.fillRect(0, 0, W + 256, H + 256);
  }
  g.restore();
}

export function vignette(g, strength = 0.22) {
  if (strength <= 0) return;
  const grd = g.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, H * 0.95);
  grd.addColorStop(0, 'rgba(0,0,0,0)');
  grd.addColorStop(1, hexA('#000000', strength));
  g.save(); g.fillStyle = grd; g.fillRect(0, 0, W, H); g.restore();
}

/** Source credit, bottom-left — keeps the video honest. */
export function source(g, str, { alpha = 1, y = H - 46 } = {}) {
  if (alpha <= 0 || !str) return;
  text(g, 'SOURCE: ' + str, 140, y, {
    size: 21, fam: F.label, weight: 600, fill: C.inkSoft, caps: true, track: 1.6, alpha: alpha * 0.9,
  });
}

export function lowerThird(g, title, sub, { prog = 1, y = H - 230 } = {}) {
  const p = E.outCubic(clamp(prog)); if (p <= 0) return;
  const w = 760 * p;
  g.save();
  g.fillStyle = C.ink; g.fillRect(140, y, w, 4);
  if (p > 0.5) {
    const a = clamp(p * 2 - 1);
    text(g, title, 140, y + 56, { size: 46, fam: F.display, fill: C.ink, caps: true, track: 1, alpha: a });
    if (sub) text(g, sub, 140, y + 92, { size: 26, fam: F.body, fill: C.inkSoft, alpha: a });
  }
  g.restore();
}
