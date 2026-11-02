import { C, F, W, H, SAFE } from '../lib/theme.js';
import { clamp, lerp, tw, E, hexA, hash01, count } from '../lib/anim.js';
import { text, headline, roundRect, panel, source, lineChart, axes, measure } from '../lib/draw.js';
import { segA, segP, slate, darkStage } from './_util.js';

// -------------------------------------------------------- THE REAL REASON ----
export function outro_specialization(g, s) {
  slate(g, s, 'WHY IT ENDED UP THIS WAY');

  // L0: not a conspiracy
  const a0 = segA(s, 0, 0, 0.42);
  if (a0 > 0) {
    const p = segP(s, 0, 0);
    g.save(); g.globalAlpha = a0;
    headline(g, 'NOT A CONSPIRACY.\nNOT A FAILURE.', W / 2, H / 2 - 40, {
      size: 104, align: 'center', maxW: 1500, reveal: s.tw(0, 0.1, 1.0),
    });
    text(g, 'SPECIALISATION', W / 2, H / 2 + 170, {
      size: 92, fam: F.display, fill: C.red, align: 'center', caps: true, track: 5,
      alpha: clamp((p - 0.45) * 3),
    });
    g.restore();
  }

  // L1 + L2: the efficiency curve, and the slack that vanished
  const a1 = segA(s, 1, 2, 0.45);
  if (a1 > 0) {
    const p1 = segP(s, 1, 1), p2 = s.said(2) ? segP(s, 2, 2) : 0;
    g.save(); g.globalAlpha = a1;
    headline(g, 'EVERY STEP MADE IT BETTER', SAFE.x, 212, { size: 56, maxW: 1200, reveal: s.tw(1, 0.05, 0.9) });
    const box = { x: SAFE.x + 110, y: 320, w: W - SAFE.x * 2 - 220, h: 440 };
    const xDom = [0, 10], yDom = [0, 10];
    axes(g, box, {
      xTicks: [], yTicks: [], xDom, yDom, alpha: clamp(p1 * 2), grid: false,
    });
    text(g, 'EFFICIENCY', box.x - 70, box.y - 30, {
      size: 23, fam: F.label, weight: 600, fill: C.inkSoft, caps: true, track: 2, alpha: clamp(p1 * 2),
    });
    text(g, 'TIME', box.x + box.w, box.y + box.h + 42, {
      size: 23, fam: F.label, weight: 600, fill: C.inkSoft, align: 'right', caps: true, track: 2, alpha: clamp(p1 * 2),
    });
    // slack band under the curve, fades out on L2
    const pts = [[0, 1], [2, 2.4], [4, 4.2], [6, 6.3], [8, 8.1], [10, 9.3]];
    const slackA = (1 - clamp(p2 * 1.5)) * 0.9;
    if (slackA > 0) {
      g.save(); g.globalAlpha = a1 * slackA;
      g.beginPath();
      g.moveTo(box.x, box.y + box.h);
      pts.forEach(([x, y]) => g.lineTo(box.x + (x / 10) * box.w, box.y + box.h - (y / 10) * box.h));
      g.lineTo(box.x + box.w, box.y + box.h); g.closePath();
      g.fillStyle = hexA(C.teal, 0.22); g.fill();
      text(g, 'SLACK', box.x + box.w * 0.46, box.y + box.h - 60, {
        size: 44, fam: F.display, fill: hexA(C.tealD, 0.85), align: 'center', caps: true, track: 3,
      });
      g.restore();
    }
    lineChart(g, pts, box, { xDom, yDom, color: C.red, width: 8, prog: clamp(p1 * 1.3), dotR: 0, dots: false });
    // the steps
    const steps = ['SPLIT DESIGN FROM MANUFACTURING', 'BUY THE ONE BEST MACHINE', 'CLUSTER WHERE THE EXPERTISE IS'];
    steps.forEach((k, i) => {
      const q = clamp((p1 * 1.4 - i * 0.18) * 3);
      if (q <= 0) return;
      g.save(); g.globalAlpha = a1 * q;
      text(g, '— ' + k, box.x + 40, box.y + 70 + i * 48, {
        size: 27, fam: F.label, weight: 600, fill: C.inkSoft, caps: true, track: 1.6,
      });
      g.restore();
    });
    if (p2 > 0.3) {
      g.save(); g.globalAlpha = a1 * clamp((p2 - 0.3) * 2.6);
      text(g, 'THE FRAGILITY WAS THE PRICE OF GETTING IT RIGHT.', W / 2, H - 150, {
        size: 38, fam: F.display, fill: C.ink, align: 'center', caps: true, track: 1.8,
      });
      g.restore();
    }
    g.restore();
  }

  // L3: the chain tightens
  const a3 = segA(s, 3, 3, 0.45);
  if (a3 > 0) {
    const p = segP(s, 3, 3);
    g.save(); g.globalAlpha = a3;
    headline(g, 'NO SLACK LEFT ANYWHERE', SAFE.x, 212, { size: 62, maxW: 1100, reveal: s.tw(3, 0.05, 0.9) });
    const cy = H / 2 + 70, n = 16;
    const slackAmp = lerp(150, 0, E.inOutCubic(clamp(p * 1.3)));
    g.strokeStyle = C.ink; g.lineWidth = 9;
    for (let i = 0; i < n; i++) {
      const x0 = SAFE.x + (i / n) * 1480, x1 = SAFE.x + ((i + 1) / n) * 1480;
      const y0 = cy + Math.sin((i / n) * Math.PI) * slackAmp;
      const y1 = cy + Math.sin(((i + 1) / n) * Math.PI) * slackAmp;
      g.beginPath(); g.ellipse((x0 + x1) / 2, (y0 + y1) / 2, 50, 26,
        Math.atan2(y1 - y0, x1 - x0), 0, 7); g.stroke();
    }
    g.restore();
  }

  // L4: back to the droplets
  const a4 = segA(s, 4, 4, 0.5);
  if (a4 > 0) {
    const p = segP(s, 4, 4);
    g.save(); g.globalAlpha = a4;
    g.fillStyle = C.dark; g.fillRect(0, 0, W, H);
    const white = '#F3EFE7';
    // droplet stream, pulled back
    const cx = W / 2;
    for (let i = 0; i < 26; i++) {
      const u = ((s.t * 1.9 + i / 26) % 1);
      const y = lerp(140, H - 140, u);
      g.globalAlpha = a4 * (0.3 + 0.6 * Math.sin(u * Math.PI));
      g.beginPath(); g.arc(cx, y, 6, 0, 7);
      g.fillStyle = white; g.fill();
    }
    g.globalAlpha = a4 * clamp(p * 1.4);
    const lines = [
      ['A FEW THOUSAND PEOPLE IN TAIWAN.', white],
      ['A FEW HUNDRED IN A DUTCH TOWN.', white],
      ['AND A STREAM OF TIN DROPLETS,', hexA(white, 0.8)],
      ['FIFTY THOUSAND TIMES A SECOND.', C.yellow],
    ];
    lines.forEach(([ln, col], i) => {
      const q = clamp((p * 1.3 - i * 0.17) * 3);
      if (q <= 0) return;
      g.globalAlpha = a4 * q;
      text(g, ln, SAFE.x, 400 + i * 86, { size: 56, fam: F.display, fill: col, caps: true, track: 1.4 });
    });
    // fade to black at the very end
    const fo = clamp((p - 0.86) / 0.14);
    if (fo > 0) { g.globalAlpha = fo; g.fillStyle = '#000'; g.fillRect(0, 0, W, H); }
    g.restore();
  }
}

// ----------------------------------------------------------------- END CARD ----
export function end_card(g, s) {
  g.fillStyle = C.ink; g.fillRect(0, 0, W, H);
  const p = tw(s.t, 0.1, 0.8, E.outQuint);
  g.save();
  headline(g, 'THE CHOKEPOINT', W / 2, 330, {
    size: 110, align: 'center', fill: C.bg, reveal: p, maxW: 1600, track: 3,
  });
  g.fillStyle = C.red;
  g.fillRect(W / 2 - 700 * p, 390, 1400 * p, 6);

  const a2 = tw(s.t, 0.7, 0.8);
  const srcs = [
    'ASML · Carl Zeiss SMT · TrendForce · AlixPartners',
    'Rhodium Group · Bloomberg Economics · US BIS · Reuters · FT',
  ];
  srcs.forEach((l, i) => text(g, l, W / 2, 490 + i * 42, {
    size: 26, fam: F.body, fill: hexA(C.bg, 0.6), align: 'center', alpha: a2,
  }));
  text(g, 'SOURCES', W / 2, 448, {
    size: 22, fam: F.label, weight: 700, fill: C.yellow, align: 'center', caps: true, track: 3, alpha: a2,
  });

  const a3 = tw(s.t, 1.3, 0.8);
  text(g, 'SUBSCRIBE FOR MORE', W / 2, 700, {
    size: 44, fam: F.display, fill: C.bg, align: 'center', caps: true, track: 3, alpha: a3,
  });
  text(g, 'Estimates in this video are modelled projections, not forecasts.', W / 2, 790, {
    size: 23, fam: F.body, fill: hexA(C.bg, 0.45), align: 'center', alpha: a3,
  });
  g.restore();
}
