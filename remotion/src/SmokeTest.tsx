import { useCurrentFrame, interpolate, AbsoluteFill, Easing } from 'remotion';

export const SmokeTest: React.FC = () => {
  const f = useCurrentFrame();
  const scale = interpolate(f, [0, 60], [1, 1.2], { easing: Easing.out(Easing.cubic) });
  const op = interpolate(f, [0, 15], [0, 1], { extrapolateRight: 'clamp' });
  return (
    <AbsoluteFill style={{ background: '#F7F3EC', justifyContent: 'center', alignItems: 'center' }}>
      <div style={{
        fontFamily: 'sans-serif', fontSize: 140, fontWeight: 900, color: '#15120E',
        opacity: op, transform: `scale(${scale})`,
      }}>
        REMOTION OK · {f}
      </div>
    </AbsoluteFill>
  );
};
