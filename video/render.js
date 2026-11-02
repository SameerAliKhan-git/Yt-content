// Deterministic frame renderer: drives the canvas one frame at a time and
// pipes JPEGs straight into ffmpeg. No wall-clock anywhere in the pipeline.
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { serve } from './serve.js';

const require = createRequire(import.meta.url);
function loadPlaywright() {
  for (const p of ['playwright', '/opt/node-tools/node_modules/playwright']) {
    try { return require(p); } catch { /* next */ }
  }
  throw new Error('playwright not found');
}

const argv = process.argv.slice(2);
const arg = (k, d = null) => {
  const i = argv.indexOf('--' + k);
  return i === -1 ? d : (argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : true);
};
const has = k => argv.includes('--' + k);

const CHROMIUM = '/opt/pw-browsers/chromium';

async function openPage(pw, port) {
  const browser = await pw.chromium.launch({
    executablePath: fs.existsSync(CHROMIUM) ? CHROMIUM : undefined,
    args: [
      '--no-sandbox', '--disable-gpu', '--hide-scrollbars',
      '--force-device-scale-factor=1', '--disable-lcd-text',
      '--disable-font-subpixel-positioning',
      '--force-color-profile=srgb', '--disable-dev-shm-usage',
    ],
  });
  const page = await browser.newPage({
    viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1,
  });
  const logs = [];
  page.on('console', m => logs.push(`[${m.type()}] ${m.text()}`));
  page.on('pageerror', e => logs.push('[pageerror] ' + e.message));
  await page.goto(`http://127.0.0.1:${port}/video/src/index.html`, { waitUntil: 'load' });
  await page.waitForFunction(
    () => window.VOX_READY === true || window.VOX_ERROR,
    { timeout: 60000 },
  );
  const err = await page.evaluate(() => window.VOX_ERROR || null);
  if (err) { console.error('BOOT ERROR:\n' + err); console.error(logs.join('\n')); process.exit(1); }
  return { browser, page, logs };
}

// ------------------------------------------------------------------ probe ----
async function probe() {
  const pw = loadPlaywright();
  const { srv, port } = await serve(0);
  const { browser, page, logs } = await openPage(pw, port);
  const meta = await page.evaluate(() => ({
    fps: VOX.fps, frames: VOX.frames, duration: VOX.duration, shots: VOX.shots,
  }));
  console.log(`fps=${meta.fps} frames=${meta.frames} duration=${meta.duration.toFixed(2)}s`);

  const outDir = arg('out-dir', '/home/user/Yt-content/build/probe');
  fs.mkdirSync(outDir, { recursive: true });

  // one still from the middle of every shot, plus any explicit frames
  const picks = [];
  for (const s of meta.shots) {
    picks.push({ name: s.id, frame: Math.round(((s.start + s.end) / 2) * meta.fps) });
  }
  const extra = arg('frames', null);
  if (extra && extra !== true) String(extra).split(',').forEach((f, i) =>
    picks.push({ name: 'f' + f, frame: Number(f) }));

  // timing: how long does a frame take?
  const t0 = Date.now();
  for (const p of picks) {
    await page.evaluate(f => VOX.seek(f), p.frame);
    const buf = await page.screenshot({ type: 'jpeg', quality: 93 });
    fs.writeFileSync(path.join(outDir, `${String(p.frame).padStart(6, '0')}_${p.name}.jpg`), buf);
  }
  const ms = (Date.now() - t0) / picks.length;
  console.log(`wrote ${picks.length} stills to ${outDir}`);
  console.log(`~${ms.toFixed(0)} ms/frame -> full render est. ${(ms * meta.frames / 1000 / 60).toFixed(1)} min single-threaded`);
  const errs = logs.filter(l => l.includes('error') || l.includes('pageerror'));
  console.log(errs.length ? 'PAGE ERRORS:\n' + errs.join('\n') : 'no page errors');
  await browser.close(); srv.close();
}

// ----------------------------------------------------------------- render ----
async function render() {
  const from = Number(arg('from', 0));
  const to = Number(arg('to', -1));
  const out = arg('out', '/home/user/Yt-content/build/chunk.mp4');
  const quality = Number(arg('quality', 94));
  const crf = arg('crf', '18');

  const pw = loadPlaywright();
  const { srv, port } = await serve(0);
  const { browser, page, logs } = await openPage(pw, port);
  const meta = await page.evaluate(() => ({ fps: VOX.fps, frames: VOX.frames }));
  const last = to < 0 ? meta.frames - 1 : Math.min(to, meta.frames - 1);

  fs.mkdirSync(path.dirname(out), { recursive: true });
  const ff = spawn('ffmpeg', [
    '-hide_banner', '-loglevel', 'error', '-y',
    '-f', 'image2pipe', '-framerate', String(meta.fps), '-i', 'pipe:0',
    '-an',
    '-c:v', 'libx264', '-preset', 'medium', '-crf', String(crf),
    '-pix_fmt', 'yuv420p', '-g', String(meta.fps * 2),
    '-movflags', '+faststart',
    out,
  ], { stdio: ['pipe', 'inherit', 'inherit'] });

  // attach error handlers once, not per frame
  let ffErr = null;
  ff.on('error', e => { ffErr = ffErr || e; });
  ff.stdin.on('error', e => { ffErr = ffErr || e; });
  const write = buf => new Promise((res, rej) => {
    if (ffErr) return rej(ffErr);
    if (ff.stdin.write(buf)) return res();
    ff.stdin.once('drain', res);
  });

  const t0 = Date.now();
  let n = 0;
  for (let f = from; f <= last; f++) {
    await page.evaluate(fr => VOX.seek(fr), f);
    await write(await page.screenshot({ type: 'jpeg', quality }));
    n++;
    if (n % 300 === 0) {
      const el = (Date.now() - t0) / 1000;
      const rate = n / el;
      process.stderr.write(
        `  [${from}-${last}] ${n}/${last - from + 1} frames  ${rate.toFixed(1)} fps  ` +
        `eta ${(((last - from + 1) - n) / rate / 60).toFixed(1)}m\n`);
    }
  }
  ff.stdin.end();
  await new Promise((res, rej) => { ff.on('close', c => c === 0 ? res() : rej(new Error('ffmpeg ' + c))); });
  const el = (Date.now() - t0) / 1000;
  console.log(`chunk ${from}-${last}: ${n} frames in ${(el / 60).toFixed(1)}m (${(n / el).toFixed(1)} fps) -> ${out}`);
  const errs = logs.filter(l => l.includes('pageerror'));
  if (errs.length) console.error('PAGE ERRORS:\n' + [...new Set(errs)].join('\n'));
  await browser.close(); srv.close();
}

(has('probe') ? probe() : render()).catch(e => { console.error(e); process.exit(1); });
