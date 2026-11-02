import React, { useEffect, useRef, useState } from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, staticFile, continueRender, delayRender } from 'remotion';
import * as topojson from 'topojson-client';
// The canvas scene library is shared with the standalone renderer -- one source
// of truth for the visual language, wrapped here so Remotion owns composition,
// preview and encoding.
import { makeTimeline } from '../../video/src/timeline.js';
import { loadFonts } from './fonts';

type Assets = { geo: { land: any; countries: any; byName: Record<string, any> } } | null;

/** Loads the geo topology once and memoises it across frames. */
let assetPromise: Promise<Assets> | null = null;
const loadAssets = (): Promise<Assets> => {
  if (!assetPromise) {
    assetPromise = fetch(staticFile('data/countries-50m.json'))
      .then((r) => r.json())
      .then((topo: any) => {
        const countries = topojson.feature(topo, topo.objects.countries) as any;
        const land = topojson.feature(topo, topo.objects.land) as any;
        const byName: Record<string, any> = {};
        for (const f of countries.features) {
          const n = f.properties?.name;
          if (n) byName[n] = f;
        }
        return { geo: { land, countries, byName } };
      });
  }
  return assetPromise;
};

export const CanvasScene: React.FC<{ timing: any; offset?: number }> = ({ timing, offset = 0 }) => {
  const frame = useCurrentFrame() + offset;
  const { width, height, fps } = useVideoConfig();
  const ref = useRef<HTMLCanvasElement>(null);
  const [assets, setAssets] = useState<Assets>(null);
  const [handle] = useState(() => delayRender('loading map topology + fonts'));

  useEffect(() => {
    Promise.all([loadAssets(), loadFonts()])
      .then(([a]) => {
        setAssets(a);
        continueRender(handle);
      })
      .catch(() => continueRender(handle));
  }, [handle]);

  // the timeline is pure: same frame in, same pixels out
  const tlRef = useRef<any>(null);
  if (assets && !tlRef.current) tlRef.current = makeTimeline(timing, assets);

  useEffect(() => {
    const cv = ref.current;
    if (!cv || !tlRef.current) return;
    const g = cv.getContext('2d', { alpha: false });
    if (!g) return;
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.globalAlpha = 1;
    tlRef.current.draw(g, frame / fps, frame);
  }, [frame, assets, fps]);

  return (
    <AbsoluteFill style={{ background: '#F7F3EC' }}>
      <canvas ref={ref} width={width} height={height}
              style={{ width: '100%', height: '100%', display: 'block' }} />
    </AbsoluteFill>
  );
};
