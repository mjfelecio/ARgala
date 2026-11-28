import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { ViroAnimations, ViroNode } from '@reactvision/react-viro';
import { useReducedMotion } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import type { WatcherSample } from '@/features/destinations/proximity';
import { ArText } from './ar-text';
import { cameraHeadingModule, updateHeadingLocation } from './camera-heading';
import { HolographicFrame } from './holographic-frame';
import { nearbyCardDefaults } from './nearby-card-layout';
import { CameraNorthAlignment, matchCameraHeading, nearbySearchOrigin, type NearbyCard, type NearbyHeadingStatus } from './nearby-mode';
import type { ArNativeStyle } from './native-styles';
import { validPose } from './scene-geometry';
import type { PoseSample, Vector3 } from './types';

export type NearbySceneContent = Readonly<{
  enabled: boolean; resultId: number | null;
  cards: readonly NearbyCard[]; fix: WatcherSample | null;
  onHeading(status: NearbyHeadingStatus): void; onOpenPlace(providerId: string): void;
}>;

const pairingMs = 250;
const headingMaxAgeMs = 180;
export const nearbyDisplayGraceMs = 5000;
const emptyCards: readonly NearbyCard[] = [];
type Placement = { offset: number; at: number; cards: readonly NearbyCard[] };
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
  const [shown, setShown] = useState(emptyCards);
  const placement = useRef<Placement | null>(null);
  const expiryTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const interactiveRef = useRef(false);
  const [module] = useState(cameraHeadingModule);
  const { onHeading } = content;
  const headingOwner = useRef<number | null>(null);
  const evidence = useRef(content);
  const running = content.enabled && tracking && content.resultId !== null;
  const clearDisplay = useCallback(() => {
    clearTimeout(expiryTimer.current);
    expiryTimer.current = undefined;
    if (!placement.current) return;
    placement.current = null;
    setShown(emptyCards);
    onHeading('weak');
  }, [onHeading]);
  const expire = useCallback(function tick() {
    const current = placement.current;
    if (!current) return;
    const remaining = current.at + nearbyDisplayGraceMs - performance.now();
    if (remaining > 0) expiryTimer.current = setTimeout(tick, remaining);
    else clearDisplay();
  }, [clearDisplay]);

  useLayoutEffect(() => {
    interactiveRef.current = interactive && running;
    return () => { interactiveRef.current = false; };
  }, [interactive, running]);
  useLayoutEffect(() => {
    evidence.current = content;
  }, [content]);
  useLayoutEffect(() => {
    if (!running) {
      headingOwner.current = null;
      clearDisplay();
      return;
    }
    const unregister = registerPose(sample => {
      if (!validPose(sample)) return;
      const now = performance.now();
      latestPose.current = { sample, at: now };
      const current = placement.current;
      if (!current || now - current.at >= nearbyDisplayGraceMs || now - lastTransform.current < 90) return;
      lastTransform.current = now;
      root.current?.setNativeProps({ position: sample.position, rotation: [0, -current.offset, 0] });
    });
    return () => {
      unregister();
      clearTimeout(expiryTimer.current);
      expiryTimer.current = undefined;
      alignment.reset();
      latestPose.current = null;
      lastTransform.current = -Infinity;
    };
  }, [alignment, running, registerPose, clearDisplay]);
  useLayoutEffect(() => {
    if (module && content.fix && headingOwner.current !== null) updateHeadingLocation(module, headingOwner.current, content.fix);
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
      if (degrees === null) { alignment.reset(); return; }
      const now = performance.now();
      const pose = latestPose.current;
      if (!pose || now - pose.at > pairingMs) return;
      const offset = matchCameraHeading(pose.sample, degrees);
      if (offset === null) { alignment.reset(); return; }
      const next = alignment.observe(offset, degrees, now);
      const { fix, cards } = evidence.current;
      if (next === null || !nearbySearchOrigin(fix, 'ready', Date.now())) return;
      if (!cards.length) { clearDisplay(); return; }

      // Only a jointly usable GPS fix and heading pair can renew the display.
      // Render the last accepted layout through a short sensor interruption.
      const previous = placement.current;
      placement.current = { offset: next, at: now, cards };
      if (previous?.cards !== cards) setShown(cards);
      if (!previous || now - previous.at >= nearbyDisplayGraceMs) {
        root.current?.setNativeProps({ position: pose.sample.position, rotation: [0, -next, 0] });
        onHeading('ready');
      }
      if (expiryTimer.current === undefined) expiryTimer.current = setTimeout(expire, nearbyDisplayGraceMs);
    });
    module.start(nativeOwner);
    if (evidence.current.fix) updateHeadingLocation(module, nativeOwner, evidence.current.fix);
    return () => {
      headingOwner.current = null;
      clearTimeout(startupTimeout);
      subscription.remove();
      module.stop(nativeOwner);
    };
  }, [alignment, running, module, onHeading, expire, clearDisplay]);
  const canSelect = shown.length > 0 && interactive && running;
  return <ViroNode ref={root} testID="ar-nearby-bearing-frame" position={origin} visible={shown.length > 0 && running} ignoreEventHandling={!canSelect}>
    {shown.length > 0 && running && <NearbyCardArrival animate={animateArrival}>{shown.map(card => <ViroNode key={card.place.providerId} position={card.position} rotation={card.rotation} ignoreEventHandling={!canSelect}
      onClick={canSelect ? () => {
        const current = placement.current;
        if (interactiveRef.current && current && performance.now() - current.at < nearbyDisplayGraceMs && current.cards.includes(card)) {
          content.onOpenPlace(card.place.providerId);
        }
      } : undefined}>
      <HolographicFrame width={nearbyCardDefaults.width} height={nearbyCardDefaults.height} decorations={false} interactiveSurface={canSelect} />
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
