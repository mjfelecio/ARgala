import { ViroImage, ViroNode, ViroQuad } from '@reactvision/react-viro';
import { holographicAssets } from './holographic-assets';
import { memo } from 'react';
/** A single native texture keeps the rounded matte surface and corner language
 * together. Covers use the painted surface itself as the hit geometry; reading
 * frames pass hits through to the actual control quads. Near-invisible quads
 * are not reliable hit targets in the pinned native renderer. */
export function HolographicFrame({ width, height, decorations, interactiveSurface = false, variant = 'tile' }: { width: number; height: number; decorations: boolean; interactiveSurface?: boolean; variant?: 'tile' | 'reader' | 'toolbar' }) {
  return <ViroNode testID="holographic-frame" ignoreEventHandling={!interactiveSurface}>
    <FrameSurface variant={variant} width={width} height={height} interactiveSurface={interactiveSurface} />
    {decorations && <ViroQuad testID="holographic-rule" width={width * 0.42} height={0.002} position={[0, -height * 0.18, 0.003]} materials="argalaRingEdge" opacity={0.5} renderingOrder={1} ignoreEventHandling />}
  </ViroNode>;
}

/** Page/caption commits do not re-prepare the native border image. Actual size,
 * texture or hit-ownership changes still update this surviving surface. */
const FrameSurface = memo(function FrameSurface({ variant, width, height, interactiveSurface }: {
  variant: 'tile' | 'reader' | 'toolbar'; width: number; height: number; interactiveSurface: boolean;
}) {
  return <ViroImage testID="holographic-surface" source={variant === 'tile' ? holographicAssets.frame : holographicAssets[variant]} width={width} height={height}
    renderingOrder={0} highAccuracyEvents={interactiveSurface} ignoreEventHandling={!interactiveSurface} />;
});
