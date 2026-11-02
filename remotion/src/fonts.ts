import { staticFile, continueRender, delayRender } from 'remotion';

// @font-face is injected at runtime with staticFile() URLs rather than written
// in CSS, so webpack never tries to resolve the font paths at bundle time.
const FACES: [string, string, number][] = [
  ['Anton',           'anton.woff2',            400],
  ['ArchivoBlack',    'archivo-black.woff2',    400],
  ['BarlowCondensed', 'barlow-cond-500.woff2',  500],
  ['BarlowCondensed', 'barlow-cond-600.woff2',  600],
  ['BarlowCondensed', 'barlow-cond-700.woff2',  700],
  ['Inter',           'inter-400.woff2',        400],
  ['Inter',           'inter-600.woff2',        600],
  ['Inter',           'inter-700.woff2',        700],
  ['RobotoMono',      'roboto-mono-500.woff2',  500],
];

let started = false;
let ready: Promise<void> | null = null;

/** Loads every face. Canvas text measurement is wrong until these resolve. */
export function loadFonts(): Promise<void> {
  if (ready) return ready;
  ready = (async () => {
    if (started || typeof document === 'undefined') return;
    started = true;
    await Promise.all(
      FACES.map(async ([family, file, weight]) => {
        const face = new FontFace(family, `url(${staticFile('fonts/' + file)})`, {
          weight: String(weight),
        });
        await face.load();
        (document as any).fonts.add(face);
      })
    );
    await (document as any).fonts.ready;
  })();
  return ready;
}

/** Blocks a Remotion render until fonts are in. */
export function useFontGate() {
  if (typeof window === 'undefined') return;
  const h = delayRender('loading fonts');
  loadFonts().finally(() => continueRender(h));
}
