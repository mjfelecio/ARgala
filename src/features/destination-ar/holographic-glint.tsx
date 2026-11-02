import { useEffect, useRef } from 'react';
import { ViroAnimations, ViroImage, ViroNode } from '@reactvision/react-viro';
import { holographicAssets } from './holographic-assets';
/** One edge acknowledgement for a real settlement/focus event. No looping,
 * geometry movement, hit ownership or callback that can advance session state. */
export function HolographicGlint({ id, width, height, active, reduced, delay = 0 }: { id: string; width: number; height: number; active: boolean; reduced: boolean; delay?: number }) {
  const ref = useRef<ViroNode>(null); const played = useRef(false);
  useEffect(() => {
    const node = ref.current;
    const settle = () => node?.setNativeProps({ opacity: 0, animation: { name: 'argalaEdgeAck', run: false, interruptible: true } });
    if (!active || played.current) { settle(); return; }
    played.current = true;
    if (reduced) { settle(); return; }
    ViroAnimations.registerAnimations({
      argalaEdgeAckIn: { delay, duration: 80, properties: { opacity: 0.85 } },
      argalaEdgeAckOut: { duration: 140, properties: { opacity: 0 } },
      argalaEdgeAck: [['argalaEdgeAckIn', 'argalaEdgeAckOut']],
    } as unknown as Parameters<typeof ViroAnimations.registerAnimations>[0]);
    node?.setNativeProps({ animation: { name: 'argalaEdgeAck', run: true, loop: false, interruptible: true } });
    return settle;
  }, [active, reduced, delay]);
  return <ViroNode ref={ref} testID={id} position={[0, 0, 0.004]} opacity={0} ignoreEventHandling>
    <ViroImage source={holographicAssets.glint} width={width} height={height} renderingOrder={1} ignoreEventHandling />
  </ViroNode>;
}
