import { useEffect, useRef } from 'react';
import { ViroAnimations, ViroImage, ViroNode } from '@reactvision/react-viro';
import { holographicAssets } from './holographic-assets';
/** One edge acknowledgement for a real settlement/focus event. No looping,
 * geometry movement, hit ownership or callback that can advance session state. */
export function HolographicGlint({ id, width, height, active, reduced, delay = 0, animationPrefix = 'argala' }: { id: string; width: number; height: number; active: boolean; reduced: boolean; delay?: number; animationPrefix?: string }) {
  const ref = useRef<ViroNode>(null); const played = useRef(false);
  useEffect(() => {
    const node = ref.current;
    const settle = () => node?.setNativeProps({ opacity: 0, animation: { name: `${animationPrefix}EdgeAck`, run: false, interruptible: true } });
    if (!active || played.current) { settle(); return; }
    played.current = true;
    if (reduced) { settle(); return; }
    ViroAnimations.registerAnimations({
      [`${animationPrefix}EdgeAckIn`]: { delay, duration: 80, properties: { opacity: 0.85 } },
      [`${animationPrefix}EdgeAckOut`]: { duration: 140, properties: { opacity: 0 } },
      [`${animationPrefix}EdgeAck`]: [[`${animationPrefix}EdgeAckIn`, `${animationPrefix}EdgeAckOut`]],
    } as unknown as Parameters<typeof ViroAnimations.registerAnimations>[0]);
    node?.setNativeProps({ animation: { name: `${animationPrefix}EdgeAck`, run: true, loop: false, interruptible: true } });
    return settle;
  }, [active, reduced, delay, animationPrefix]);
  return <ViroNode ref={ref} testID={id} position={[0, 0, 0.004]} opacity={0} ignoreEventHandling>
    <ViroImage source={holographicAssets.glint} width={width} height={height} renderingOrder={1} ignoreEventHandling />
  </ViroNode>;
}
