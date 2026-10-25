import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { Text, View } from 'react-native';
import { useIsFocused, useNavigation } from 'expo-router';
import type { NativeStackNavigationProp } from 'expo-router/native-stack';
import { useReducedMotion } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { Button } from 'heroui-native/button';
import { useAuth } from '@/features/auth/provider';
import { FocusedStatusBar } from '@/features/navigation/focused-status-bar';
import { useAppActive } from '@/lib/use-app-active';
import { Action, Notice, Screen } from '@/ui/shared';
import { isViroSpikeEnabled } from './dev-guard';
import { SceneBoundary } from './destination-ar-screen';
import { ArPreflight } from './ar-preflight';
import { ArUtilityChrome } from './ar-utility-chrome';
import { ArIntroductionNotice } from './ar-introduction-notice';
import { developmentRingContent, type RingContent } from './development-ring-content';
import { useArSession } from './use-ar-session';
import { useReadingSize } from './use-reading-size';
import { useArIntroduction } from './use-ar-introduction';
import { loadRingScene } from './ring-loader';
import type { RingControls, RingMetrics } from './destination-ring-scene';
import type { SessionIdentity } from './session';

/** Auth changes get a new in-memory owner. The outer route guard runs before
 * loading this module; this entry is explicitly development provenance only.
 */
export default function DevelopmentSessionRoute() {
  const { session } = useAuth(); const { t } = useTranslation(); const principalId = session?.user.id;
  const scopeId = useId(); // Development correlation only; never verified admission authority.
  const identity = useMemo<SessionIdentity>(() => ({ admissionId: `development-${scopeId}`, destinationId: 'development-aclc', principalId: principalId ?? '', provenance: 'development' }), [principalId, scopeId]);
  return principalId ? <DestinationArSessionExperience key={principalId} identity={identity} freshEligible={isViroSpikeEnabled} />
    : <Screen><Notice>{t('destinationAr.unavailable')}</Notice></Screen>;
}

type Props = { identity: SessionIdentity; freshEligible(): boolean; content?: readonly RingContent[] };
export function DestinationArSessionExperience({ identity, freshEligible, content = developmentRingContent }: Props) {
  const { t } = useTranslation(); const focused = useIsFocused(); const active = useAppActive();
  const stack = useNavigation<NativeStackNavigationProp<Record<string, object | undefined>>>('/(app)');
  const [transitionReady, setTransitionReady] = useState(true); const [scene, setScene] = useState({ width: 0, height: 0 });
  const [NativeRing, setNativeRing] = useState<Awaited<ReturnType<typeof loadRingScene>> | null>(null);
  const reading = useReadingSize(); const introduction = useArIntroduction(); const reduced = useReducedMotion();
  const lifecycle = useArSession({ identity, tileIds: content.map(item => item.id), running: focused && active, transitionReady,
    measured: scene.width > 0 && scene.height > 0 && NativeRing !== null, freshEligible, reveal: !introduction.seen && !reduced });
  const { startup, session, finishReveal, close } = lifecycle;
  const completeIntroduction = introduction.complete;
  const reportFailure = startup.onFailure;
  useEffect(() => {
    const start = stack.addListener('transitionStart', event => { if (!event.data.closing) setTransitionReady(false); });
    const end = stack.addListener('transitionEnd', event => { if (!event.data.closing) setTransitionReady(true); });
    return () => { start(); end(); };
  }, [stack]);
  useEffect(() => {
    if (startup.phase !== 'prepared' || NativeRing) return;
    let current = true;
    // Final authorization waits for this module, not just the permission promise.
    void loadRingScene().then(component => { if (current) setNativeRing(() => component); }).catch(() => { if (current) reportFailure(); });
    return () => { current = false; };
  }, [startup.phase, startup.attempt, NativeRing, reportFailure]);
  useEffect(() => { if (session.phase === 'reveal' && (introduction.seen || reduced)) finishReveal(); }, [session.phase, introduction.seen, reduced, finishReveal]);
  useEffect(() => { if (session.phase === 'exploring' && !introduction.seen && !introduction.pending) void completeIntroduction(); }, [session.phase, introduction.seen, introduction.pending, completeIntroduction]);
  const controls = useRef<RingControls | null>(null); const acceptControls = useCallback((value: RingControls | null) => { controls.current = value; }, []);
  const [poseRequired, setPoseRequired] = useState(false); const recenterResult = useCallback((success: boolean) => setPoseRequired(!success), []);
  const [help, setHelp] = useState(false); const [metrics, setMetrics] = useState<RingMetrics>({ received: 0, applied: 0 });
  const exploring = session.phase === 'exploring'; const revealing = session.phase === 'reveal' || session.phase === 'limited' && session.revealedCount < content.length;
  return <View testID="destination-ar-scene" className="flex-1 bg-ink" onLayout={event => {
    const { width, height } = event.nativeEvent.layout;
    if (width > 0 && height > 0) setScene(previous => previous.width === width && previous.height === height ? previous : { width, height });
  }}>
    <FocusedStatusBar style="light" />
    {startup.mountScene && NativeRing && <View style={{ position: 'absolute', top: 0, left: 0, width: scene.width, height: scene.height }}>
      <SceneBoundary key={startup.attempt} onFailure={startup.onFailure}>
        <NativeRing onReady={startup.onReady} onTracking={lifecycle.onTracking} onControls={acceptControls} onRecenterResult={recenterResult}
          onMetrics={help ? setMetrics : undefined} reading={reading} content={content} initialProgress={session.progress} onProgress={lifecycle.onProgress}
          visibleTileCount={session.revealedCount} interactive={exploring} />
      </SceneBoundary>
    </View>}
    <ArUtilityChrome titleKey="destinationRing.title" onExit={close} actions={startup.phase === 'live' ? <>
      <Button variant="secondary" accessibilityLabel={t('destinationRing.recenter')} isDisabled={!exploring} onPress={() => controls.current?.recenter()}><Button.Label>{t('destinationRing.recenter')}</Button.Label></Button>
      <Button variant="secondary" accessibilityLabel={t('destinationRing.help')} accessibilityState={{ expanded: help }} onPress={() => setHelp(value => !value)}><Button.Label>{t('destinationRing.help')}</Button.Label></Button>
    </> : undefined}>
      <ArPreflight phase={startup.phase} errorCode={startup.errorCode} pending={startup.pending} canAskAgain={startup.canAskAgain} onStart={prompt => void startup.start(prompt)} />
      {session.established && (startup.phase === 'checking' || startup.phase === 'prepared' || startup.phase === 'initializing') && <Notice>{t('destinationSession.restoring')}</Notice>}
      {startup.phase === 'live' && <View className="gap-2 p-4">
        <Text className="font-sans text-sm text-white">{t(session.phase === 'limited' ? 'destinationAr.trackingLost' : revealing ? 'destinationSession.reveal' : 'destinationRing.live')}</Text>
        <Text className="font-sans text-xs text-white">{t('destinationRing.prototype')}</Text>
        {revealing && <Action title={t('destinationSession.skip')} onPress={() => { finishReveal(); void completeIntroduction(); }} />}
        {poseRequired && <Notice>{t('destinationRing.poseRequired')}</Notice>}
        {help && <Notice>{t('destinationRing.helpText')}{'\n'}{t('destinationRing.poseRate', metrics)}</Notice>}
      </View>}
      <ArIntroductionNotice introduction={introduction} />
    </ArUtilityChrome>
  </View>;
}
