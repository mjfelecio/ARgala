import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { BackHandler, Text, View } from 'react-native';
import { router, useIsFocused, useNavigation } from 'expo-router';
import type { NativeStackNavigationProp } from 'expo-router/native-stack';
import { useReducedMotion } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { Button } from 'heroui-native/button';
import { useThemeColor } from 'heroui-native/hooks';
import Ionicons from '@expo/vector-icons/Ionicons';
import { destinationIds, type DestinationId } from '@/features/destinations/catalog';
import { useSettings } from '@/features/settings/provider';
import { useOpenProviderLink } from '@/features/map/attributions';
import { googleMapsPlaceUrl } from '@/features/places/maps-url';
import { FocusedStatusBar } from '@/features/navigation/focused-status-bar';
import { useAppActive } from '@/lib/use-app-active';
import { Action, Notice } from '@/ui/shared';
import { isViroSpikeEnabled } from './dev-guard';
import { SceneBoundary } from './scene-boundary';
import { ArPreflight } from './ar-preflight';
import { ArUtilityChrome } from './ar-utility-chrome';
import { ArIntroductionNotice } from './ar-introduction-notice';
import type { RingContent } from './ring-content';
import { useArSession } from './use-ar-session';
import { useReadingSize } from './use-reading-size';
import { introDuration, introVariant } from './intro-policy';
import { useArIntroduction, type IntroductionMemory } from './use-ar-introduction';
import type { AudioManifest } from './system-audio';
import type { loadRingScene } from './ring-loader';
import type { RingControls, RingMetrics } from './destination-ring-scene';
import type { SessionIdentity } from './session';
import { ArPhotoControls } from '@/features/ar-photo/ar-photo-controls';
import type { NativeCapture } from '@/features/ar-photo/types';
import { advanceView, arViewDuration, defaultArView, requestView, settleInterruptedView, type ArView, type ArViewPhase } from './ar-view-mode';
import { useNearbyMode } from './use-nearby-mode';
import type { Coordinate } from '@/features/location/geo';
import type { NearbyHeadingStatus } from './nearby-mode';
import { NearbyControls, NearbyResults } from './nearby-controls';

export type SessionExperienceProps = { introductionMemory?: IntroductionMemory; preparation?: React.ReactNode; sceneLoader: typeof loadRingScene; audioManifest?: AudioManifest; identity: SessionIdentity; freshEligible(): boolean; content: readonly RingContent[]; galleryMediaIds?: readonly string[]; entryReady?: boolean; onEstablished?(): void; onExit?(): void; onReturn?(): void; title?: string; guidance?: React.ReactNode; progressFeedback?: React.ReactNode; unsupportedFallback?: React.ReactNode; developmentNoticeKey?: string; preflightNoticeKey?: string };
export function DestinationArSessionExperience({ sceneLoader, introductionMemory, preparation, audioManifest, identity, freshEligible, content, galleryMediaIds, entryReady = true, onEstablished, onExit, onReturn, title, guidance, progressFeedback, unsupportedFallback, developmentNoticeKey, preflightNoticeKey }: SessionExperienceProps) {
  const { t } = useTranslation(); const focused = useIsFocused(); const active = useAppActive();
  const openProviderLink = useOpenProviderLink();
  const utilityInk = useThemeColor('foreground');
  const stack = useNavigation<NativeStackNavigationProp<Record<string, object | undefined>>>('/(app)');
  const [transitionReady, setTransitionReady] = useState(true); const [scene, setScene] = useState({ width: 0, height: 0 });
  const [NativeRing, setNativeRing] = useState<Awaited<ReturnType<typeof loadRingScene>> | null>(null);
  const { systemVoice, soundEffects, language } = useSettings();
  const audioPreferences = useMemo(() => ({ systemVoice, soundEffects }), [systemVoice, soundEffects]);
  const audition = identity.provenance === 'development' && isViroSpikeEnabled() ? audioManifest : undefined;
  const reading = useReadingSize(); const introduction = useArIntroduction(identity, introductionMemory); const reduced = useReducedMotion();
  const [previewEntrance, setPreviewEntrance] = useState(false);
  const [results, setResults] = useState<{ origin: Coordinate | null } | null>(null);
  const closeResults = useCallback(() => setResults(null), []);
  useEffect(() => {
    if (!results || !focused || !active) return;
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      closeResults();
      return true;
    });
    return () => subscription.remove();
  }, [results, focused, active, closeResults]);
  const variant = introVariant({ ready: true, established: false, seen: introduction.seen && !previewEntrance, reduced });
  const lifecycle = useArSession({ identity, tileIds: content.map(item => item.id), galleryMediaIds, running: focused && active && !results, transitionReady,
    entryReady, measured: scene.width > 0 && scene.height > 0 && NativeRing !== null && introduction.loaded, freshEligible, onEstablished, reveal: true, revealDurationMs: introDuration(variant) });
  const { startup, session, close } = lifecycle;
  const startupVoice = useRef<string | null>(null);
  const sessionKey = JSON.stringify([identity.principalId, identity.admissionId, identity.destinationId, identity.provenance]);
  const claimStartupVoice = useCallback(() => {
    if (startupVoice.current === sessionKey) return false;
    startupVoice.current = sessionKey;
    return true;
  }, [sessionKey]);
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
    void sceneLoader().then(component => { if (current) setNativeRing(() => component); }).catch(() => { if (current) reportFailure(); });
    return () => { current = false; };
  }, [startup.phase, startup.attempt, NativeRing, reportFailure, sceneLoader]);
  useEffect(() => { if (session.phase === 'exploring' && !introduction.seen && !introduction.pending) void completeIntroduction(); }, [session.phase, introduction.seen, introduction.pending, completeIntroduction]);
  const [capture, setCapture] = useState<NativeCapture | null>(null);
  const [readerControls, setReaderControls] = useState<RingControls | null>(null);
  const controls = useRef<RingControls | null>(null); const acceptControls = useCallback((value: RingControls | null) => {
    controls.current = value; setCapture(() => value?.capture ?? null);
    setReaderControls(previous => previous?.readerAvailable === value?.readerAvailable && previous?.changeReadingSize === value?.changeReadingSize ? previous : value);
  }, []);
  const [poseRequired, setPoseRequired] = useState(false); const recenterResult = useCallback((success: boolean) => setPoseRequired(!success), []);
  const [help, setHelp] = useState(false); const [metrics, setMetrics] = useState<RingMetrics>({ received: 0, applied: 0 });
  const exploring = session.phase === 'exploring';
  const supportsViews = identity.provenance !== 'development' && destinationIds.includes(identity.destinationId as DestinationId);
  const signedIn = !!identity.principalId && identity.principalId !== 'guest';
  const [viewMode, setViewMode] = useState(defaultArView);
  const [heading, setHeading] = useState<NearbyHeadingStatus>('weak');
  const [preferredNearbyId, setPreferredNearbyId] = useState<string | null>(null);
  const readyView = startup.mountScene && exploring && focused && active && !help;
  const nearbyView = supportsViews && viewMode.view === 'nearby';
  const detailsView = !nearbyView && viewMode.phase === 'ready';
  const inNearby = startup.mountScene && session.established && focused && active && !help && nearbyView;
  const browsingNearby = inNearby && viewMode.phase === 'ready';
  const nearby = useNearbyMode(inNearby && signedIn, readyView && browsingNearby, language, preferredNearbyId);
  if (!readyView && viewMode.phase !== 'ready') setViewMode(settleInterruptedView(viewMode));
  if (heading !== 'weak' && (!readyView || !nearbyView || !nearby.fix || !nearby.cards.length)) setHeading('weak');
  const showResults = () => {
    if (!browsingNearby || !nearby.result || !nearby.isResultCurrent(nearby.result)) return;
    setResults(current => current ?? { origin: nearby.position });
  };
  const nearbyLink = useRef<((id: string) => void) | null>(null);
  useLayoutEffect(() => {
    if (readyView && browsingNearby && !results && heading === 'ready') {
      nearbyLink.current = id => {
        const result = nearby.result;
        if (!result || !nearby.isResultCurrent(result) || !nearby.cards.some(card => card.place.providerId === id)) return;
        const place = result.places.find(item => item.providerId === id);
        if (place) openProviderLink(googleMapsPlaceUrl(place));
      };
    }
    return () => { nearbyLink.current = null; };
  });
  const openNearbyPlace = useCallback((id: string) => nearbyLink.current?.(id), []);
  const viewOwner = useRef(false);
  useLayoutEffect(() => {
    viewOwner.current = readyView;
    return () => { viewOwner.current = false; };
  }, [readyView]);
  const completeView = useCallback((id: number, phase: ArViewPhase) => {
    if (viewOwner.current) setViewMode(current => advanceView(current, id, phase));
  }, []);
  useEffect(() => {
    if (!readyView || viewMode.phase === 'ready') return;
    const { phase, id } = viewMode;
    // Give the native completion priority and bound missing callbacks during view creation.
    const timer = setTimeout(() => completeView(id, phase), arViewDuration[phase] + 200);
    return () => clearTimeout(timer);
  }, [readyView, viewMode, completeView]);
  const revealing = session.phase === 'reveal' || session.phase === 'limited' && session.revealedCount < content.length;
  const compactUtilities = scene.height > 0 && scene.height < 600;
  const showLiveGuidance = session.phase === 'limited' || revealing || poseRequired || help;
  const preparing = !startup.mountScene && !session.established;
  if (results) return <NearbyResults nearby={nearby} origin={results.origin}
    onShowInCamera={providerId => { setPreferredNearbyId(providerId); closeResults(); }}
    onClose={closeResults} />;
  if (startup.errorCode === 'unsupported' && unsupportedFallback && focused && active) return <>{unsupportedFallback}</>;
  return <View testID="destination-ar-scene" className={preparing ? 'flex-1 bg-page' : 'flex-1 bg-ink'} onLayout={event => {
    const { width, height } = event.nativeEvent.layout;
    if (width > 0 && height > 0) setScene(previous => previous.width === width && previous.height === height ? previous : { width, height });
  }}>
    <FocusedStatusBar style={preparing ? 'dark' : 'light'} />
    {startup.mountScene && NativeRing && <View style={{ position: 'absolute', top: 0, left: 0, width: scene.width, height: scene.height }}>
      <SceneBoundary key={startup.attempt} onFailure={startup.onFailure}>
        <NativeRing onReady={startup.onReady} onTracking={lifecycle.onTracking} onControls={acceptControls} onRecenterResult={recenterResult}
          claimStartupVoice={identity.provenance === 'development' ? undefined : claimStartupVoice}
          restrictCapture={identity.destinationId === 'D10'}
          viewMode={supportsViews ? viewMode : undefined} onViewComplete={completeView}
          nearbyContent={nearbyView ? { cards: nearby.cards, fix: nearby.fix, onHeading: setHeading, onOpenPlace: openNearbyPlace } : undefined}
          onMetrics={help && identity.provenance === 'development' ? setMetrics : undefined} reading={reading} content={content} initialProgress={session.progress} onProgress={lifecycle.onProgress}
          audioPreferences={audioPreferences} audioManifest={audition} firstVisit={!introduction.seen || previewEntrance && identity.provenance === 'development'}
          visibleTileCount={session.phase === 'reveal' ? Infinity : session.revealedCount} deployment={session.phase === 'reveal' ? variant : undefined} interactive={exploring && !help} effectsEnabled={!help} />
      </SceneBoundary>
    </View>}
    <ArUtilityChrome appearance={preparing ? 'page' : 'camera'} viewportHeight={scene.height} titleKey={identity.provenance === 'development' ? 'destinationRing.title' : 'arShowcase.title'} title={title} onReturn={onReturn} onExit={() => { close(); onExit?.(); }} actions={startup.phase === 'live' ? <>
      <Button variant="secondary" accessibilityLabel={t('destinationRing.help')} accessibilityState={{ expanded: help }} onPress={() => setHelp(value => !value)}><Button.Label>{t('destinationRing.help')}</Button.Label></Button>
    </> : undefined} underHeader={startup.phase === 'live' && supportsViews && !help &&
      <View testID="ar-view-selector" accessibilityRole="tablist" accessibilityLabel={t('arNearby.mode')}
        className="mx-4 mt-2 max-w-sm shrink-0 flex-row gap-1 self-center rounded-card bg-ar-panel p-1">
        {(['details', 'nearby'] as const).map((view: ArView) => <Button key={view} testID={`ar-select-${view}`}
          variant={viewMode.target === view ? 'primary' : 'ghost'} className="h-auto min-h-12 min-w-0 flex-1 px-3 py-2"
          accessibilityRole="tab" accessibilityLabel={t(`arNearby.${view}`)} accessibilityState={{ selected: viewMode.target === view }}
          isDisabled={!readyView || viewMode.phase !== 'ready'} onPress={() => setViewMode(current => requestView(current, view, reduced))}>
          <Button.Label className={viewMode.target === view ? 'shrink text-center' : 'shrink text-center text-white'}>{t(`arNearby.${view}`)}</Button.Label>
        </Button>)}
      </View>}
      bottom={startup.phase === 'live' && !help ? <>
      {nearbyView && <NearbyControls signedIn={signedIn} nearby={nearby} heading={heading} trackingLost={session.phase === 'limited'}
        disabled={!readyView || viewMode.phase !== 'ready'} resultsEnabled={browsingNearby} onShowResults={showResults} />}
      {detailsView && <><ArPhotoControls capture={capture} running={exploring && focused && active} compact={compactUtilities} sessionKey={`${sessionKey}:${startup.attempt}`} leadingAction={
        <Button variant="secondary" isIconOnly={compactUtilities} className={compactUtilities ? 'size-12 p-0' : 'min-h-12'} accessibilityLabel={t('destinationRing.recenter')} isDisabled={!exploring} onPress={() => controls.current?.recenter()}>{compactUtilities ? <Ionicons name="scan-outline" size={22} color={utilityInk} accessible={false} /> : <Button.Label>{t('destinationRing.recenter')}</Button.Label>}</Button>
      } />
      {readerControls?.readerAvailable && exploring && focused && active && <View testID="ar-reading-controls" className="flex-row items-center gap-2" pointerEvents="box-none">
        <Button variant="secondary" className="min-h-12 min-w-12 px-3" accessibilityLabel={t('destinationRing.decreaseTextSize')} isDisabled={reading.size === 'small'} onPress={() => readerControls.changeReadingSize?.(-1)}><Button.Label>{t('destinationRing.smaller')}</Button.Label></Button>
        <Button variant="secondary" className="min-h-12 min-w-12 px-3" accessibilityLabel={t('destinationRing.increaseTextSize')} isDisabled={reading.size === 'large'} onPress={() => readerControls.changeReadingSize?.(1)}><Button.Label>{t('destinationRing.larger')}</Button.Label></Button>
      </View>}
      {reading.error && <View testID="ar-reading-feedback" className="w-full gap-2">
        <Text accessibilityRole="alert" className="font-sans text-sm text-white">{t(`destinationRing.${reading.error}`)}</Text>
        <Action title={t('common.retry')} onPress={() => void reading.retry()} disabled={reading.pending} />
      </View>}</>}
    </> : undefined}>
      {!startup.mountScene && preparation}
      {session.phase === 'expired' ? <View className="gap-3 p-4"><Notice>{t(identity.provenance === 'showcase' ? 'arShowcase.expired' : 'destinationSession.expired')}</Notice>
        <Action title={t(identity.provenance === 'showcase' ? 'arShowcase.return' : 'arrival.returnToMap')} onPress={() => { close(); onExit?.(); if (onReturn) onReturn(); else router.navigate('/'); }} />
      </View> : <ArPreflight appearance={preparing ? 'page' : 'camera'} noticeKey={preflightNoticeKey ?? (identity.provenance === 'verified' ? 'arrival.preflight' : 'destinationAr.prototype')} phase={startup.phase} errorCode={startup.errorCode} pending={startup.pending} canAskAgain={startup.canAskAgain} onStart={prompt => void startup.start(prompt)} />}
      {audition && startup.phase === 'idle' && <View className="px-4 pb-3"><Notice>{t('destinationStories.audioPreview')}</Notice></View>}
      {identity.provenance === 'development' && isViroSpikeEnabled() && startup.phase === 'idle' && !startup.pending && <View className="px-4 pb-3"><Action title={t('destinationStories.previewEntrance')} onPress={() => { setPreviewEntrance(true); void startup.start(false); }} /></View>}
      {progressFeedback}
      {!session.established && guidance}
      {session.established && (startup.phase === 'checking' || startup.phase === 'prepared' || startup.phase === 'initializing') && <Notice>{t('destinationSession.restoring')}</Notice>}
      {startup.phase === 'live' && showLiveGuidance && <View className="gap-2 p-4">
        {((session.phase === 'limited' && (!nearbyView || !signedIn || help)) || revealing) && <Notice>{t(session.phase === 'limited' ? 'destinationAr.trackingLost' : 'destinationSession.reveal')}</Notice>}
        {!session.established || revealing ? <Text className="rounded-card bg-ar-panel p-3 font-sans text-sm text-white">{t('destinationStories.exploreHint')}</Text> : null}
        {identity.provenance === 'development' && <Text className="rounded-card bg-ar-panel p-2 font-sans text-xs text-white">{t(developmentNoticeKey ?? 'destinationRing.prototype')}</Text>}
        {session.phase === 'limited' && <Action title={t('destinationSession.retryTracking')} onPress={lifecycle.retryTracking} disabled={startup.pending} />}
        {poseRequired && <Notice>{t('destinationRing.poseRequired')}</Notice>}
        {help && <View testID="ar-help" className="gap-3 rounded-card bg-ar-panel p-4">
          <Text accessibilityRole="header" className="font-sans text-card font-ui-semibold text-white">{t('destinationStories.helpTitle')}</Text>
          <View className="gap-1">
            <Text className="font-sans text-base font-ui-semibold text-white">{t('destinationStories.helpLookTitle')}</Text>
            <Text className="font-sans text-sm text-white">{t('destinationStories.helpLook')}</Text>
          </View>
          <View className="gap-1 border-t border-white/15 pt-3">
            <Text className="font-sans text-base font-ui-semibold text-white">{t('destinationStories.helpReadTitle')}</Text>
            <Text className="font-sans text-sm text-white">{t('destinationStories.helpRead')}</Text>
          </View>
          <View className="gap-1 border-t border-white/15 pt-3">
            <Text className="font-sans text-base font-ui-semibold text-white">{t('destinationStories.helpPositionTitle')}</Text>
            <Text className="font-sans text-sm text-white">{t('destinationRing.recenterRecovery')}</Text>
          </View>
          {identity.provenance === 'development' && <Text className="font-sans text-xs text-white">{t('destinationRing.poseRate', metrics)}</Text>}
          <Button variant="secondary" accessibilityLabel={t('destinationStories.dismissHelp')} onPress={() => setHelp(false)}><Button.Label>{t('destinationStories.dismissHelp')}</Button.Label></Button>
        </View>}
      </View>}
      <ArIntroductionNotice introduction={introduction} />
    </ArUtilityChrome>
  </View>;
}
