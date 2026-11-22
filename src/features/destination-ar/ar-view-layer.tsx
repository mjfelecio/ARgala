import { useLayoutEffect, useMemo, useState, type ReactNode } from 'react';
import { ViroAnimations, ViroNode } from '@reactvision/react-viro';
import { arViewDuration, type ArView, type ArViewPhase, type ArViewState } from './ar-view-mode';

const rest: [number, number, number] = [0, 0, 0];
const enter: [number, number, number] = [0, -0.22, 0];

/** Keep Details mounted so a view change cannot replace its reader or frame. */
export function ArViewLayer({ view, state, children, interactive, onComplete }: {
  view: ArView; state: ArViewState; children: ReactNode; interactive: boolean;
  onComplete(id: number, phase: ArViewPhase): void;
}) {
  const visible = state.view === view;
  const motion = visible && state.phase !== 'ready' ? state.phase : null;
  const id = state.id;
  const animationName = motion ? `argalaView${motion === 'enter' ? 'Enter' : 'Exit'}` : 'argalaViewEnter';
  const [registered, setRegistered] = useState<string | null>(null);
  const attempt = motion ? `${id}:${motion}` : null;
  useLayoutEffect(() => {
    if (!motion || !attempt) return;
    const arriving = motion === 'enter';
    ViroAnimations.registerAnimations({ [animationName]: {
      duration: arViewDuration[motion], easing: 'EaseOut',
      properties: { opacity: arriving ? 1 : 0, positionY: arriving ? 0 : 0.22 },
    } });
    let current = true;
    void Promise.resolve().then(() => { if (current) setRegistered(attempt); });
    return () => { current = false; };
  }, [motion, attempt, animationName]);
  const animation = useMemo(() => motion ? { name: animationName, run: registered === attempt, interruptible: true,
    onFinish: () => onComplete(id, motion) } : undefined, [animationName, attempt, id, motion, onComplete, registered]);
  return <ViroNode testID={`ar-view-${view}`} visible={visible} ignoreEventHandling={!visible || !interactive} position={motion === 'enter' ? enter : rest}
    opacity={motion === 'enter' ? 0 : 1} animation={animation}>{children}</ViroNode>;
}
