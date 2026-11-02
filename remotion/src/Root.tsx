import React from 'react';
import { Composition, Audio, staticFile, AbsoluteFill } from 'remotion';
import { CanvasScene } from './CanvasScene';
import timing from '../public/data/timing.json';

const FPS = (timing as any).fps ?? 30;
const TOTAL = (timing as any).frames ?? 20646;
const MIN = FPS * 60;

type Props = { offset?: number; withAudio?: boolean };

/**
 * One view of the film. `offset` shifts which part of the timeline is drawn, so
 * a segment composition renders a minute without re-cutting anything: the
 * narration is trimmed to the same offset, keeping picture and sound locked.
 */
const Film: React.FC<Props> = ({ offset = 0, withAudio = true }) => (
  <AbsoluteFill>
    <CanvasScene timing={timing} offset={offset} />
    {withAudio ? <Audio src={staticFile('data/narration.wav')} startFrom={offset} /> : null}
  </AbsoluteFill>
);

const common = { fps: FPS, width: 1920, height: 1080, component: Film } as const;

export const RemotionRoot: React.FC = () => (
  <>
    {/* the whole film */}
    <Composition id="Chokepoint" {...common}
      durationInFrames={TOTAL} defaultProps={{ offset: 0, withAudio: true }} />
    <Composition id="ChokepointSilent" {...common}
      durationInFrames={TOTAL} defaultProps={{ offset: 0, withAudio: false }} />

    {/* per-minute approval segments */}
    {Array.from({ length: Math.ceil(TOTAL / MIN) }).map((_, i) => {
      const offset = i * MIN;
      const dur = Math.min(MIN, TOTAL - offset);
      const id = `Minute${String(i + 1).padStart(2, '0')}`;
      return (
        <Composition key={id} id={id} {...common}
          durationInFrames={dur} defaultProps={{ offset, withAudio: true }} />
      );
    })}
  </>
);
