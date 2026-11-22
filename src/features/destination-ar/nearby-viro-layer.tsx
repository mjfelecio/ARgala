import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { ViroAnimations, ViroNode } from '@reactvision/react-viro';
import { useReducedMotion } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import type { WatcherSample } from '@/features/destinations/proximity';
import { ArText } from './ar-text';
import { cameraHeadingModule, updateHeadingLocation } from './camera-heading';
import { HolographicFrame } from './holographic-frame';
import { CameraNorthAlignment, matchCameraHeading, type NearbyCard, type NearbyHeadingStatus } from './nearby-mode';
import type { ArNativeStyle } from './native-styles';
import { validPose } from './scene-geometry';
import type { PoseSample, Vector3 } from './types';

export type NearbySceneContent = Readonly<{
  cards: readonly NearbyCard[]; fix: WatcherSample | null;
  onHeading(status: NearbyHeadingStatus): void; onSelect(providerId: string): void;
}>;

const pairingMs = 250;
const headingMaxAgeMs = 180;
let nextHeadingOwner = 0;
const origin: Vector3 = [0, 0, 0];

export function NearbyViroLayer({ content, tracking, interactive, animateArrival, registerPose, style }: {
  content: NearbySceneContent; tracking: boolean; interactive: boolean; animateArrival: boolean; registerPose(listener: (pose: PoseSample) => void): () => void; style: ArNativeStyle;
}) {
  const { t } = useTranslation();
  const root = useRef<ViroNode>(null);
  const latestPose = useRef<{ sample: PoseSample; at: number } | null>(null);
  const [alignment] = useState(() => new CameraNorthAlignment());
  const lastTransform = useRef(-Infinity);
  const [visible, setVisible] = useState(false);
  const visibleRef = useRef(false);
  const interactiveRef = useRef(false);
  const [module] = useState(cameraHeadingModule);
  const { onHeading } = content;
  const headingOwner = useRef<number | null>(null);
  const latestFix = useRef(content.fix);
  const hasFix = !!content.fix;
  const running = hasFix && tracking && content.cards.length > 0;
  const setReady = useCallback((value: boolean) => {
    if (visibleRef.current === value) return;
    visibleRef.current = value;
    setVisible(value);
    onHeading(value ? 'ready' : 'weak');
  }, [onHeading]);
  const reset = useCallback(() => {
    alignment.reset();
    latestPose.current = null;
    lastTransform.current = -Infinity;
    setReady(false);
  }, [alignment, setReady]);
  useLayoutEffect(() => {
    interactiveRef.current = interactive && tracking;
    return () => { interactiveRef.current = false; };
  }, [interactive, tracking]);
  useLayoutEffect(() => {
    if (!running) { reset(); return; }
    const unregister = registerPose(sample => {
      if (!validPose(sample)) return;
      const now = performance.now();
      latestPose.current = { sample, at: now };
      const offset = alignment.get(now);
      if (offset === null || now - lastTransform.current < 90) return;
      lastTransform.current = now;
      root.current?.setNativeProps({ position: sample.position, rotation: [0, -offset, 0] });
    });
    return () => { unregister(); reset(); };
  }, [alignment, running, registerPose, reset]);
  useLayoutEffect(() => {
    const fix = content.fix;
    latestFix.current = fix;
    if (module && fix && headingOwner.current !== null) updateHeadingLocation(module, headingOwner.current, fix);
  }, [module, content.fix]);
  useEffect(() => {
    if (!running) return;
    if (!module) { onHeading('unavailable'); return; }
    const nativeOwner = ++nextHeadingOwner;
    headingOwner.current = nativeOwner;
    let latestHeadingAt = -Infinity;
    const startupTimeout = setTimeout(() => onHeading('no-reading'), 2500);
    const subscription = module.addListener('onHeading', ({ owner, degrees, measuredAt }) => {
      if (owner !== nativeOwner || headingOwner.current !== nativeOwner) return;
      const age = Date.now() - measuredAt;
      if (!Number.isFinite(age) || age < -50 || age > headingMaxAgeMs || measuredAt <= latestHeadingAt) return;
      if (latestHeadingAt === -Infinity) {
        clearTimeout(startupTimeout);
        onHeading('weak');
      }
      latestHeadingAt = measuredAt;
      if (degrees === null) { reset(); return; }
      const now = performance.now();
      const pose = latestPose.current;
      if (!pose || now - pose.at > pairingMs) return;
      const offset = matchCameraHeading(pose.sample, degrees);
      if (offset === null) { reset(); return; }
      const next = alignment.observe(offset, degrees, now);
      if (next === null) { setReady(false); return; }
      if (!visibleRef.current) {
        root.current?.setNativeProps({ position: pose.sample.position, rotation: [0, -next, 0] });
        setReady(true);
      }
    });
    module.start(nativeOwner);
    if (latestFix.current) updateHeadingLocation(module, nativeOwner, latestFix.current);
    const interval = setInterval(() => {
      if (visibleRef.current && alignment.get(performance.now()) === null) reset();
    }, 250);
    return () => {
      headingOwner.current = null;
      clearInterval(interval);
      clearTimeout(startupTimeout);
      subscription.remove();
      module.stop(nativeOwner);
    };
  }, [alignment, running, module, onHeading, reset, setReady]);
  const canSelect = visible && interactive && tracking;
  return <ViroNode ref={root} testID="ar-nearby-bearing-frame" position={origin} visible={visible && running} ignoreEventHandling={!canSelect}>
    {visible && content.cards.length > 0 && <NearbyCardArrival animate={animateArrival}>{content.cards.map(card => <ViroNode key={card.place.providerId} position={card.position} rotation={card.rotation} ignoreEventHandling={!canSelect}
      onClick={canSelect ? () => { if (interactiveRef.current && visibleRef.current) content.onSelect(card.place.providerId); } : undefined}>
      <HolographicFrame width={0.78} height={0.38} decorations={false} interactiveSurface={canSelect} />
      <ArText text={card.place.name} maxLines={2} textLineBreakMode="WordWrap" textClipMode="ClipToBounds"
        width={0.69} height={0.22} position={[0, 0.045, 0.006]} style={style.text(4.3, 'center', '600')} />
      <ArText text={t('arNearby.distance', { meters: Math.round(card.distance) })} width={0.67} height={0.08}
        position={[0, -0.1, 0.006]} style={style.text(3.2)} />
    </ViroNode>)}</NearbyCardArrival>}
  </ViroNode>;
}

function NearbyCardArrival({ animate, children }: { animate: boolean; children: ReactNode }) {
  const reduced = useReducedMotion();
  const [enabled] = useState(() => animate && !reduced);
  const [registered, setRegistered] = useState(false);
  const [settled, setSettled] = useState(false);
  const finish = useCallback(() => setSettled(true), []);
  useLayoutEffect(() => {
    if (!enabled) return;
    ViroAnimations.registerAnimations({ argalaNearbyCardsEnter: {
      duration: 240, easing: 'EaseOut', properties: { opacity: 1, positionY: 0 },
    } });
    let current = true;
    void Promise.resolve().then(() => { if (current) setRegistered(true); });
    const timer = setTimeout(finish, 440);
    return () => { current = false; clearTimeout(timer); };
  }, [enabled, finish]);
  const moving = enabled && !settled;
  return <ViroNode position={[0, moving ? -0.14 : 0, 0]} opacity={moving ? 0 : 1}
    animation={moving ? { name: 'argalaNearbyCardsEnter', run: registered, onFinish: finish } : undefined}>{children}</ViroNode>;
}
