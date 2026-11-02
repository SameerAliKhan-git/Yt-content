// Renders thumbnail variants to assets/thumbnail/.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { serve } from './serve.js';

const require = createRequire(import.meta.url);
const pw = (() => { for (const p of ['playwright', '/opt/node-tools/node_modules/playwright'])
  { try { return require(p); } catch {} } throw new Error('playwright missing'); })();

const OUT = '/home/user/Yt-content/assets/thumbnail';
const CHROMIUM = '/opt/pw-browsers/chromium';

const { srv, port } = await serve(0);
const browser = await pw.chromium.launch({
  executablePath: fs.existsSync(CHROMIUM) ? CHROMIUM : undefined,
  args: ['--no-sandbox', '--disable-gpu', '--force-device-scale-factor=1', '--force-color-profile=srgb'],
});
const page = await browser.newPage({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 });
page.on('pageerror', e => console.error('[pageerror]', e.message));
await page.goto(`http://127.0.0.1:${port}/video/src/thumb.html`, { waitUntil: 'load' });
await page.waitForFunction(() => window.THUMB_READY || window.THUMB_ERROR, { timeout: 30000 });
const err = await page.evaluate(() => window.THUMB_ERROR || null);
if (err) { console.error('BOOT ERROR\n' + err); process.exit(1); }

fs.mkdirSync(OUT, { recursive: true });
for (const [v, name] of [['a', 'thumb_a_machine'], ['b', 'thumb_b_island']]) {
  await page.evaluate(x => THUMB.draw(x), v);
  const buf = await page.screenshot({ type: 'jpeg', quality: 92 });
  fs.writeFileSync(path.join(OUT, name + '.jpg'), buf);
  console.log(`${name}.jpg  ${(buf.length / 1024).toFixed(0)} KB`);
}
await browser.close(); srv.close();
