import { ViroNode, ViroQuad } from '@reactvision/react-viro';
import { HolographicFrame } from './holographic-frame';
import type { ComponentProps } from 'react';

/** Decorative layers sit behind the existing painted hit surface. Reader/control
 * quads keep their own hit ownership; no transparent overlay catches a tap. */
export function ExhibitFrame(props: ComponentProps<typeof HolographicFrame>) {
  const { width, height, decorations } = props;
  return <ViroNode testID="exhibit-layered-frame" ignoreEventHandling={!props.interactiveSurface}>
    {decorations && <ViroNode position={[0.015, -0.012, -0.025]} ignoreEventHandling>
      <ViroQuad width={width} height={height} materials="argalaRingSurface" opacity={0.75} renderingOrder={-2} ignoreEventHandling />
      <ViroQuad position={[0, height / 2, 0.001]} width={width * 0.75} height={0.003} materials="argalaRingEdge" opacity={0.7} renderingOrder={-1} ignoreEventHandling />
    </ViroNode>}
    {/* Classic's inner rule crosses the photo-led title. Exhibit owns its
        perimeter accents and keeps both cover and reader content clear. */}
    <HolographicFrame {...props} decorations={false} />
  </ViroNode>;
}
