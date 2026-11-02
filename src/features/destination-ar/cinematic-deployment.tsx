import { useEffect, useRef } from 'react';
import { ViroAnimations, ViroImage, ViroNode } from '@reactvision/react-viro';
import { introEmblemAsset } from './intro-emblem-asset';
import { deploymentTransform, deploymentKeyframes } from './intro-deployment';
import { introDuration, type IntroVariant } from './intro-policy';
import { ringMetrics, type Basis, type RingSlot } from './scene-geometry';

/** Native animation owns all in-between frames. The session deadline removes
 * this wrapper even when a native completion callback is lost or interrupted.
 */
export function CinematicTile({ slot, basis, variant, ordinal, peers, children }: { slot: RingSlot; peers: readonly RingSlot[]; basis: Basis; variant: IntroVariant; ordinal: number; children: React.ReactNode }) {
  const ref = useRef<ViroNode>(null);
  const initial = deploymentTransform(slot, basis, 0, variant, peers);
  useEffect(() => {
    const name = `argalaDeploy${ordinal}`;
    const duration = introDuration(variant);
    const delay = variant === 'full' ? 600 : 0;
    // Full entry leaves 600ms for the emblem. Sample a short outward arc;
    // the final keyframe comes directly from the canonical ring transform.
    const keyframes = deploymentKeyframes(slot, basis, variant, peers);
    const steps = keyframes.map(({ transform: value, yawDelta, opacity }, index) => {
      return { duration: (duration - delay) / keyframes.length,
        delay: index === 0 ? delay : 0, easing: 'Linear', properties: {
          positionX: value.position[0], positionY: value.position[1], positionZ: value.position[2],
          rotateY: `${yawDelta < 0 ? '-=' : '+='}${Math.abs(yawDelta)}`, scaleX: value.scale / ringMetrics.tileScale, scaleY: value.scale / ringMetrics.tileScale, scaleZ: value.scale / ringMetrics.tileScale,
          opacity,
        } };
    });
    const registry = Object.fromEntries(steps.map((step, index) => [`${name}-${index}`, step]));
    // Viro's first array level is parallel; the inner chain is sequential.
    ViroAnimations.registerAnimations({ ...registry, [name]: [steps.map((_, index) => `${name}-${index}`)] } as unknown as Parameters<typeof ViroAnimations.registerAnimations>[0]);
    const node = ref.current;
    node?.setNativeProps({ animation: { name, run: true, loop: false, interruptible: true } });
    return () => { node?.setNativeProps({ animation: { name, run: false, interruptible: true } }); };
  }, [slot, basis, variant, ordinal, peers]);
  return <ViroNode ref={ref} testID={`cinematic-${slot.id}`} ignoreEventHandling position={initial.position} rotation={initial.rotation}
    scale={[initial.scale / ringMetrics.tileScale, initial.scale / ringMetrics.tileScale, initial.scale / ringMetrics.tileScale]} opacity={0}>{children}</ViroNode>;
}
export function CinematicEmblem({ basis }: { basis: Basis }) {
  const ref = useRef<ViroNode>(null);
  useEffect(() => {
    ViroAnimations.registerAnimations({
      argalaEmblemIn: { duration: 220, easing: 'EaseOut', properties: { opacity: 1, scaleX: 1.08, scaleY: 1.08, scaleZ: 1.08 } },
      argalaEmblemHold: { duration: 200, easing: 'EaseInEaseOut', properties: { scaleX: 1, scaleY: 1, scaleZ: 1 } },
      argalaEmblemOut: { duration: 180, easing: 'EaseIn', properties: { opacity: 0, scaleX: 0.8, scaleY: 0.8, scaleZ: 0.8 } },
      argalaEmblem: [['argalaEmblemIn', 'argalaEmblemHold', 'argalaEmblemOut']],
    } as unknown as Parameters<typeof ViroAnimations.registerAnimations>[0]);
    ref.current?.setNativeProps({ animation: { name: 'argalaEmblem', run: true, loop: false, interruptible: true } });
  }, []);
  return <ViroNode ref={ref} testID="cinematic-emblem" ignoreEventHandling position={[basis.forward[0] * 1.2, 0, basis.forward[2] * 1.2]} rotation={[0, basis.yaw, 0]} scale={[0.65, 0.65, 0.65]} opacity={0}>
    <ViroImage source={introEmblemAsset} width={0.42} height={0.3642} resizeMode="ScaleToFit" ignoreEventHandling />
  </ViroNode>;
}
