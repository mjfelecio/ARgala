import { useLayoutEffect, useRef } from 'react';
import { ViroAnimations, ViroNode } from '@reactvision/react-viro';
/** Page feedback stays inside the stationary frame. No timers, React frames,
 * remounts or native completion callback are needed to reveal usable content. */
export function PageTransition({ identity, enabled, reduced, children, animationPrefix = 'argala' }: { identity: string; enabled: boolean; reduced: boolean; children: React.ReactNode; animationPrefix?: string }) {
  const ref = useRef<ViroNode>(null);
  const previousIdentity = useRef<string | null>(null);
  const name = `${animationPrefix}PageReveal`;
  useLayoutEffect(() => {
    const node = ref.current;
    const changed = previousIdentity.current !== identity;
    previousIdentity.current = identity;
    if (!enabled || reduced || !changed) {
      node?.setNativeProps({ opacity: 1, position: [0, 0, 0], animation: { name, run: false, interruptible: true } });
      return;
    }
    ViroAnimations.registerAnimations({ [name]: { duration: 140, easing: 'EaseOut', properties: { opacity: 1, positionX: 0 } } });
    node?.setNativeProps({ opacity: 0.35, position: [0.018, 0, 0] });
    node?.setNativeProps({ animation: { name, run: true, loop: false, interruptible: true } });
    return () => { node?.setNativeProps({ animation: { name, run: false, interruptible: true } }); };
  }, [identity, enabled, reduced, name]);
  return <ViroNode ref={ref} testID="ring-page-content" opacity={1} position={[0, 0, 0]}>{children}</ViroNode>;
}
