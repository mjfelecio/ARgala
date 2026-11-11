import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { Text, View } from 'react-native';
import { router, useIsFocused, useNavigation } from 'expo-router';
import type { NativeStackNavigationProp } from 'expo-router/native-stack';
import { useReducedMotion } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { Button } from 'heroui-native/button';
import { useSettings } from '@/features/settings/provider';
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
import { previewStoryContent } from './development-featured-media';
import { listDestinations, destinationName, destinationIds, type DestinationId } from '@/features/destinations/catalog';
import { useArSession } from './use-ar-session';
import { useReadingSize } from './use-reading-size';
import { introDuration, introVariant } from './intro-policy';
import { useArIntroduction } from './use-ar-introduction';
import type { AudioManifest } from './system-audio';
import { loadDevelopmentSystemAudio } from './development-audio-loader';
import { loadDevelopmentGalleryContent } from './development-gallery-loader';
import { loadRingScene } from './ring-loader';
import type { RingControls, RingMetrics } from './destination-ring-scene';
import type { SessionIdentity } from './session';
import { ArPhotoControls } from '@/features/ar-photo/ar-photo-controls';
import type { NativeCapture } from '@/features/ar-photo/types';

/** Auth changes get a new in-memory owner. The outer route guard runs before
 * loading this module; this entry is explicitly development provenance only.
 */
export default function DevelopmentSessionRoute() {
  const { session } = useAuth(); const { t } = useTranslation(); const principalId = session?.user.id;
  const scopeId = useId(); // Development correlation only; never verified admission authority.
  const [selection, setSelection] = useState<DestinationId | 'gallery' | null>(null);
  const identity = useMemo<SessionIdentity>(() => ({ admissionId: `development-${scopeId}-${selection ?? 'none'}`, destinationId: `development-${selection ?? 'none'}`, principalId: principalId ?? '', provenance: 'development' }), [principalId, scopeId, selection]);
  if (!principalId || !isViroSpikeEnabled()) return <Screen><Notice>{t('destinationAr.unavailable')}</Notice></Screen>;
  if (selection === 'gallery') return <DevelopmentGallerySession key={`${principalId}:${identity.admissionId}`} identity={identity} />;
  if (selection) return <DestinationArSessionExperience key={`${principalId}:${identity.admissionId}`} identity={identity} freshEligible={isViroSpikeEnabled}
    title={destinationName(listDestinations().find(item => item.id === selection)!)} content={previewStoryContent(selection)}
    preflightNoticeKey="featuredResearch.notice" onReturn={() => setSelection(null)} />;
  return <Screen><Notice>{t('featuredResearch.notice')}</Notice>
    <Text className="font-sans text-lg text-foreground">{t('featuredResearch.title')}</Text>
    {destinationIds.map(id => <Action key={id} title={destinationName(listDestinations().find(item => item.id === id)!)} onPress={() => setSelection(id)} />)}
    <Action title={t('destinationRing.title')} onPress={() => setSelection('gallery')} />
    <Action title={t('common.back')} onPress={() => { if (router.canGoBack()) router.back(); else router.navigate('/'); }} />
  </Screen>;
}

function DevelopmentGallerySession({ identity }: { identity: SessionIdentity }) {
  const { t } = useTranslation();
  const [attempt, setAttempt] = useState(0);
  const [content, setContent] = useState<readonly RingContent[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [audioManifest, setAudioManifest] = useState<AudioManifest | undefined>();
  useEffect(() => {
    let current = true;
    void loadDevelopmentSystemAudio().then(value => { if (current) setAudioManifest(value ?? undefined); }).catch(() => { /* Optional audio never blocks AR entry. */ });
    void loadDevelopmentGalleryContent().then(value => {
      if (!current) return;
      if (value) setContent(value); else setFailed(true);
    }).catch(() => { if (current) setFailed(true); });
    return () => { current = false; };
  }, [attempt]);
  if (content) return <DestinationArSessionExperience identity={identity} freshEligible={isViroSpikeEnabled} content={content} audioManifest={audioManifest} />;
  return <Screen><Notice>{t(failed ? 'destinationRing.contentFailed' : 'common.loading')}</Notice>
    {failed && <Action title={t('common.retry')} onPress={() => { setFailed(false); setAttempt(value => value + 1); }} />}
  </Screen>;
}

type Props = { audioManifest?: AudioManifest; identity: SessionIdentity; freshEligible(): boolean; content?: readonly RingContent[]; entryReady?: boolean; onEstablished?(): void; onExit?(): void; onReturn?(): void; title?: string; guidance?: React.ReactNode; progressFeedback?: React.ReactNode; unsupportedFallback?: React.ReactNode; developmentNoticeKey?: string; preflightNoticeKey?: string };
export function DestinationArSessionExperience({ audioManifest, identity, freshEligible, content = developmentRingContent, entryReady = true, onEstablished, onExit, onReturn, title, guidance, progressFeedback, unsupportedFallback, developmentNoticeKey = 'destinationRing.prototype', preflightNoticeKey }: Props) {
  const { t } = useTranslation(); const focused = useIsFocused(); const active = useAppActive();
  const stack = useNavigation<NativeStackNavigationProp<Record<string, object | undefined>>>('/(app)');
  const [transitionReady, setTransitionReady] = useState(true); const [scene, setScene] = useState({ width: 0, height: 0 });
  const [NativeRing, setNativeRing] = useState<Awaited<ReturnType<typeof loadRingScene>> | null>(null);
  const { systemVoice, soundEffects } = useSettings();
  const audioPreferences = useMemo(() => ({ systemVoice, soundEffects }), [systemVoice, soundEffects]);
  const audition = identity.provenance === 'development' && isViroSpikeEnabled() ? audioManifest : undefined;
  const reading = useReadingSize(); const introduction = useArIntroduction(identity); const reduced = useReducedMotion();
  const [previewEntrance, setPreviewEntrance] = useState(false);
  const variant = introVariant({ ready: true, established: false, seen: introduction.seen && !previewEntrance, reduced });
  const lifecycle = useArSession({ identity, tileIds: content.map(item => item.id), running: focused && active, transitionReady,
    entryReady, measured: scene.width > 0 && scene.height > 0 && NativeRing !== null && introduction.loaded, freshEligible, reveal: true, revealDurationMs: introDuration(variant) });
  const { startup, session, finishReveal, close } = lifecycle;
  useEffect(() => { if (session.established) onEstablished?.(); }, [session.established, onEstablished]);
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
  useEffect(() => { if (session.phase === 'exploring' && !introduction.seen && !introduction.pending) void completeIntroduction(); }, [session.phase, introduction.seen, introduction.pending, completeIntroduction]);
  const [capture, setCapture] = useState<NativeCapture | null>(null);
  const controls = useRef<RingControls | null>(null); const acceptControls = useCallback((value: RingControls | null) => { controls.current = value; setCapture(() => value?.capture ?? null); }, []);
  const [poseRequired, setPoseRequired] = useState(false); const recenterResult = useCallback((success: boolean) => setPoseRequired(!success), []);
  const [help, setHelp] = useState(false); const [metrics, setMetrics] = useState<RingMetrics>({ received: 0, applied: 0 });
  const exploring = session.phase === 'exploring'; const revealing = session.phase === 'reveal' || session.phase === 'limited' && session.revealedCount < content.length;
  const showLiveGuidance = session.phase === 'limited' || revealing || identity.provenance !== 'verified' || poseRequired || help;
  if (startup.errorCode === 'unsupported' && unsupportedFallback && focused && active) return <>{unsupportedFallback}</>;
  return <View testID="destination-ar-scene" className="flex-1 bg-ink" onLayout={event => {
    const { width, height } = event.nativeEvent.layout;
    if (width > 0 && height > 0) setScene(previous => previous.width === width && previous.height === height ? previous : { width, height });
  }}>
    <FocusedStatusBar style="light" />
    {startup.mountScene && NativeRing && <View style={{ position: 'absolute', top: 0, left: 0, width: scene.width, height: scene.height }}>
      <SceneBoundary key={startup.attempt} onFailure={startup.onFailure}>
        <NativeRing onReady={startup.onReady} onTracking={lifecycle.onTracking} onControls={acceptControls} onRecenterResult={recenterResult}
          onMetrics={help && identity.provenance === 'development' ? setMetrics : undefined} reading={reading} content={content} initialProgress={session.progress} onProgress={lifecycle.onProgress}
          audioPreferences={audioPreferences} audioManifest={audition} firstVisit={!introduction.seen || previewEntrance && identity.provenance === 'development'}
          visibleTileCount={session.phase === 'reveal' ? Infinity : session.revealedCount} deployment={session.phase === 'reveal' ? variant : undefined} interactive={exploring && !help} />
      </SceneBoundary>
    </View>}
    <ArUtilityChrome viewportHeight={scene.height} titleKey="destinationRing.title" title={title} onReturn={onReturn} onExit={() => { close(); onExit?.(); }} actions={startup.phase === 'live' ? <>
      <Button variant="secondary" accessibilityLabel={t('destinationRing.help')} accessibilityState={{ expanded: help }} onPress={() => setHelp(value => !value)}><Button.Label>{t('destinationRing.help')}</Button.Label></Button>
    </> : undefined} bottom={startup.phase === 'live' && !help ? <>
      <Button variant="secondary" className="min-h-12" accessibilityLabel={t('destinationRing.recenter')} isDisabled={!exploring} onPress={() => controls.current?.recenter()}><Button.Label>{t('destinationRing.recenter')}</Button.Label></Button>
      {exploring && focused && active && <ArPhotoControls capture={capture} running sessionKey={JSON.stringify([identity.principalId, identity.admissionId, identity.destinationId, identity.provenance, startup.attempt])} />}
    </> : undefined}>
      {session.phase === 'expired' ? <View className="gap-3 p-4"><Notice>{t('destinationSession.expired')}</Notice>
        <Action title={t('arrival.returnToMap')} onPress={() => { close(); onExit?.(); if (onReturn) onReturn(); else router.navigate('/'); }} />
      </View> : <ArPreflight noticeKey={preflightNoticeKey ?? (identity.provenance === 'verified' ? 'arrival.preflight' : 'destinationAr.prototype')} phase={startup.phase} errorCode={startup.errorCode} pending={startup.pending} canAskAgain={startup.canAskAgain} onStart={prompt => void startup.start(prompt)} />}
      {audition && startup.phase === 'idle' && <View className="px-4 pb-3"><Notice>{t('destinationStories.audioPreview')}</Notice></View>}
      {identity.provenance === 'development' && isViroSpikeEnabled() && startup.phase === 'idle' && !startup.pending && <View className="px-4 pb-3"><Action title={t('destinationStories.previewEntrance')} onPress={() => { setPreviewEntrance(true); void startup.start(false); }} /></View>}
      {progressFeedback}
      {!session.established && guidance}
      {session.established && (startup.phase === 'checking' || startup.phase === 'prepared' || startup.phase === 'initializing') && <Notice>{t('destinationSession.restoring')}</Notice>}
      {startup.phase === 'live' && showLiveGuidance && <View className="gap-2 p-4">
        {(session.phase === 'limited' || revealing) && <Notice>{t(session.phase === 'limited' ? 'destinationAr.trackingLost' : 'destinationSession.reveal')}</Notice>}
        {!session.established || revealing ? <Text className="font-sans text-sm text-white">{t('destinationStories.exploreHint')}</Text> : null}
        {identity.provenance !== 'verified' && <Text className="rounded-card bg-ar-panel p-2 font-sans text-xs text-white">{t(developmentNoticeKey)}</Text>}
        {session.phase === 'limited' && <Action title={t('destinationSession.retryTracking')} onPress={lifecycle.retryTracking} disabled={startup.pending} />}
        {revealing && <Action title={t('destinationSession.skip')} onPress={() => { finishReveal(); void completeIntroduction(); }} />}
        {poseRequired && <Notice>{t('destinationRing.poseRequired')}</Notice>}
        {help && <View testID="ar-help" className="gap-3 rounded-card bg-ar-panel p-4">
          <Text accessibilityRole="header" className="font-sans text-card font-semibold text-white">{t('destinationStories.helpTitle')}</Text>
          <Text className="font-sans text-sm text-white">{t('destinationStories.exploreHint')}{'\n\n'}{t('destinationRing.helpText')}</Text>
          {identity.provenance === 'development' && <Text className="font-sans text-xs text-white">{t('destinationRing.poseRate', metrics)}</Text>}
          <Button variant="secondary" accessibilityLabel={t('destinationStories.dismissHelp')} onPress={() => setHelp(false)}><Button.Label>{t('destinationStories.dismissHelp')}</Button.Label></Button>
        </View>}
      </View>}
      <ArIntroductionNotice introduction={introduction} />
    </ArUtilityChrome>
  </View>;
}
