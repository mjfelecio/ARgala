import { ViroNode } from '@reactvision/react-viro';
import { HolographicFrame } from './holographic-frame';
import type { ComponentProps } from 'react';

/** The painted rounded texture owns the complete silhouette. A rectangular
 * decorative backing would show sharp corners beyond its translucent edge. */
export function ExhibitFrame(props: ComponentProps<typeof HolographicFrame>) {
  return <ViroNode testID="exhibit-layered-frame" ignoreEventHandling={!props.interactiveSurface}>
    <HolographicFrame {...props} decorations={false} />
  </ViroNode>;
}
