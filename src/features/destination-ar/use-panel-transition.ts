import { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { ViroAnimations, ViroNode } from '@reactvision/react-viro';
import { useReducedMotion } from 'react-native-reanimated';
import type { FocusSelection } from './ring-controller';
import { ringMetrics } from './scene-geometry';

/** One surviving native panel owns its completion. No mode shares mutable state. */
export function usePanelTransition(selection: FocusSelection, enabled: boolean, onComplete: (token: number) => void, animationPrefix: string) {
  const ref = useRef<ViroNode>(null); const reduced = useReducedMotion();
  const moving = selection.phase !== 'focused'; const closing = selection.phase === 'closing';
  const name = closing ? `${animationPrefix}RingClose` : `${animationPrefix}RingFocus`;
  const [registeredToken, setRegisteredToken] = useState<number | null>(null);
  const completion = useRef(onComplete);
  useLayoutEffect(() => { completion.current = onComplete; return () => { completion.current = () => {}; }; }, [onComplete]);
  const finish = useCallback(() => completion.current(selection.token), [selection.token]);
  useLayoutEffect(() => {
    if (!moving) return;
    const from = selection.from; const to = selection.to;
    const rotationDelta = ((to.rotation[1] - from.rotation[1] + 180) % 360 + 360) % 360 - 180;
    ViroAnimations.registerAnimations({ [name]: { duration: reduced ? 0 : ringMetrics.transitionMs, easing: 'EaseInEaseOut', properties: {
      positionX: to.position[0], positionY: to.position[1], positionZ: to.position[2], rotateY: from.rotation[1] + rotationDelta,
      scaleX: to.scale, scaleY: to.scale, scaleZ: to.scale,
    } } });
    let current = true;
    void Promise.resolve().then(() => { if (current) setRegisteredToken(selection.token); });
    return () => { current = false; };
  }, [moving, name, reduced, selection.from, selection.to, selection.token]);
  const animation = useMemo(() => ({ name, run: moving && enabled && registeredToken === selection.token, onFinish: finish, interruptible: true }), [name, moving, enabled, registeredToken, selection.token, finish]);
  useLayoutEffect(() => {
    if (!moving) ref.current?.setNativeProps({ position: selection.to.position, rotation: selection.to.rotation, scale: [selection.to.scale, selection.to.scale, selection.to.scale] });
  }, [moving, selection.to, selection.token]);
  return { ref, reduced, moving, closing, animation, transform: moving ? selection.from : selection.to };
}
