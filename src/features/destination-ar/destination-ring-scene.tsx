import { CinematicTile, CinematicEmblem } from './cinematic-deployment';
import { useArSystemAudio } from './use-ar-system-audio';
import type { AudioPreferences, AudioManifest } from './system-audio';
import type { IntroVariant } from './intro-policy';
import { ringCopy } from './ring-copy';
import * as React from 'react';
import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ViroARScene, ViroARSceneNavigator, ViroSound, ViroNode, ViroTrackingStateConstants } from '@reactvision/react-viro';
import { useTranslation } from 'react-i18next';
import { isExhibitGuide, type RingContent } from './ring-content';
import { RingController, type FocusSelection } from './ring-controller';
import { useArNativeStyle } from './native-styles';
import { InformationTile } from './information-tile';
import { InformationPanel, type ReadingCommand } from './information-panel';
import type { HolographicFrame } from './holographic-frame';
import { useReadingSize } from './use-reading-size';
import { useArVisualQuality } from './use-ar-visual-quality';
import type { ReadingCursor } from './content-layout';
import type { PoseSample, TrackingState, Vector3 } from './types';
import type { Basis, RingEntry as RingEntryShape, RingSlot } from './scene-geometry';
import type { LogicalArProgress } from './session';
import type { NativeCapture } from '@/features/ar-photo/types';
import type { ExhibitStageProfile } from './exhibit-stage';
import type { ExhibitArrival, ExhibitGalleryEntry, DanaoScenery, PhotoIslandGuidePanel } from './danao-stage';
import type { ExhibitGalleryPanel } from './exhibit-gallery-panel';
import { exhibitGalleryEntries, exhibitSceneEntries, isExhibitGalleryEntry } from './photo-islands';
import { ArViewLayer } from './ar-view-layer';
import { NearbyViroLayer, type NearbySceneContent } from './nearby-viro-layer';
import type { ArViewPhase, ArViewState } from './ar-view-mode';
export type RingControls = { recenter(): void; capture?: NativeCapture; captureRestricted?: boolean; readerAvailable?: boolean; changeReadingSize?: ReadingCommand };
export type RingMetrics = { received: number; applied: number };
export type RingScenePresentation = Readonly<{
  animationPrefix: string;
  buildSlots(entries: readonly RingEntryShape[], basis: Basis): RingSlot[];
  Tile: typeof InformationTile;
  Guide?: typeof PhotoIslandGuidePanel;
  Frame: typeof HolographicFrame;
  revealImages: boolean;
  pageMotion?: boolean;
  focusGlint?: boolean;
  isolateReader: boolean;
  stage?: Readonly<{ profile: ExhibitStageProfile; Entry: typeof ExhibitGalleryEntry; Panel: typeof ExhibitGalleryPanel; Scenery: typeof DanaoScenery; Arrival: typeof ExhibitArrival }>;
}>;
type Props = { presentation?: RingScenePresentation; onReady(): void; onTracking(state: TrackingState): void; onControls?(controls: RingControls | null): void; onRecenterResult?(success: boolean): void; onMetrics?(metrics: RingMetrics): void; content: readonly RingContent[]; reading?: ReturnType<typeof useReadingSize>; initialProgress?: LogicalArProgress; onProgress?(progress: LogicalArProgress): void; visibleTileCount?: number; interactive?: boolean; effectsEnabled?: boolean; deployment?: IntroVariant; firstVisit?: boolean; audioPreferences?: AudioPreferences; audioManifest?: AudioManifest; restrictCapture?: boolean; claimStartupVoice?: () => boolean; viewMode?: ArViewState; nearbyContent?: NearbySceneContent; onViewComplete?(id: number, phase: ArViewPhase): void };

/** A single native coordinate frame. No destination/GPS admission is granted. */
export function DestinationRingScene(props: Props) {
  return props.reading ? <RingScene {...props} reading={props.reading} externalReadingControls /> : <OwnedReadingRingScene {...props} />;
}
function OwnedReadingRingScene(props: Props) { const reading = useReadingSize(); return <RingScene {...props} reading={reading} />; }
function RingScene({ presentation: requestedPresentation, onReady, onTracking, onControls, onRecenterResult, onMetrics, content, reading, viewMode, nearbyContent, onViewComplete, claimStartupVoice, initialProgress, onProgress, visibleTileCount = Infinity, interactive: sceneInteractive = true, effectsEnabled = true, deployment, firstVisit = false, audioPreferences, audioManifest, externalReadingControls = false }: Props & { reading: ReturnType<typeof useReadingSize>; externalReadingControls?: boolean }) {
  const interactive = sceneInteractive && (!viewMode || viewMode.view === 'details' && viewMode.phase === 'ready');
  const canUseNearby = sceneInteractive && viewMode?.view === 'nearby' && viewMode.phase === 'ready';
  const nearbyPose = useRef<((pose: PoseSample) => void) | null>(null);
  const registerNearbyPose = useCallback((listener: (pose: PoseSample) => void) => {
    nearbyPose.current = listener;
    return () => { if (nearbyPose.current === listener) nearbyPose.current = null; };
  }, []);
  const { t, i18n } = useTranslation(); const style = useArNativeStyle();
  // Each mount owns its controller/tokens/timers. A live frame never switches
  // presentation or shares mutable transition state with another mode.
  const [presentation] = useState(requestedPresentation);
  const animationPrefix = presentation?.animationPrefix ?? 'argala';
  const stage = presentation?.stage; const GalleryEntry = stage?.Entry; const GalleryPanel = stage?.Panel;
  const Scenery = stage?.Scenery; const Arrival = stage?.Arrival;
  const Tile = presentation?.Tile ?? InformationTile;
  const Guide = presentation?.Guide;
  const [restored] = useState(initialProgress);
  const [snapshot] = useState(() => content.filter(item => ringCopy(item, 'body', i18n.resolvedLanguage ?? i18n.language, key => t(key), key => i18n.exists(key)).trim()));
  const stories = snapshot.filter(item => !isExhibitGuide(item.id));
  const [controller] = useState(() => new RingController(stage ? exhibitSceneEntries(stage.profile, snapshot) : snapshot, presentation?.buildSlots));
  const [frame, setFrame] = useState<{ slots: RingSlot[]; position: Vector3 } | null>(null);
  const [tracking, setTracking] = useState<TrackingState>('unavailable');
  const language = i18n.resolvedLanguage?.startsWith('ja') ? 'ja' : i18n.resolvedLanguage?.startsWith('ko') ? 'ko' : 'en';
  const audio = useArSystemAudio(language, audioPreferences, tracking === 'normal' && (sceneInteractive || !!deployment), audioManifest, claimStartupVoice);
  const audioEvent = audio.event;
  const audioInteractions = useRef(0);
  const previousModeCue = useRef(viewMode?.cue ?? null);
  useEffect(() => {
    const cue = viewMode?.cue ?? null;
    if (cue !== null && cue !== previousModeCue.current) audioEvent('modeSwitched', String(cue));
    previousModeCue.current = cue;
  }, [viewMode?.cue, audioEvent]);
  const pageSound = useCallback(() => audioEvent('pageChanged', String(++audioInteractions.current)), [audioEvent]);
  const previousDeployment = useRef(false);
  useEffect(() => {
    if (deployment && tracking === 'normal') { previousDeployment.current = true; audioEvent('initialized', 'entry', firstVisit); }
    else if (previousDeployment.current) {
      previousDeployment.current = false;
      if (interactive) audioEvent('deployed', 'entry');
    }
  }, [deployment, interactive, tracking, audioEvent, firstVisit]);
  const quality = useArVisualQuality(interactive && tracking === 'normal');
  const trackingRef = useRef<TrackingState>('unavailable'); const ring = useRef<ViroNode>(null); const panelFrame = useRef<ViroNode>(null);
  const [selection, setSelection] = useState<FocusSelection | null>(null);
  const readingCommand = useRef<ReadingCommand | null>(null);
  const acceptReadingCommand = useCallback((command: ReadingCommand | null) => { readingCommand.current = command; }, []);
  const [cursors, setCursors] = useState<Record<string, ReadingCursor>>(() => initialProgress?.cursors ?? {});
  const [openedIds, setOpenedIds] = useState<readonly string[]>(() => (initialProgress?.openedIds ?? []).filter(id => stories.some(item => item.id === id)));
  const [galleryCursor, setGalleryCursor] = useState<ReadingCursor | undefined>(() => stage ? restored?.exhibitGallery?.cursor ?? {
    page: 0, offset: 0, locale: i18n.resolvedLanguage ?? i18n.language, size: reading.size, mediaId: stage.profile.media[0]?.id, mediaPage: 0,
  } : undefined);
  const logicalProgress = useCallback((focus: FocusSelection | null, cursors: Record<string, ReadingCursor>, openedIds: readonly string[], cursor?: ReadingCursor): LogicalArProgress => ({
    selectedId: focus && focus.phase !== 'closing' && (!stage || !isExhibitGalleryEntry(stage.profile, focus.id)) ? focus.id : null, cursors, openedIds,
    ...(stage && cursor ? { exhibitGallery: { focused: !!focus && isExhibitGalleryEntry(stage.profile, focus.id) && focus.phase !== 'closing', cursor } } : {}),
  }), [stage]);
  const counts = useRef({ received: 0, applied: 0 });
  const closingCommitted = useRef(false);
  const interactiveRef = useRef(false);
  const alive = useRef(false);
  const completedTransition = useRef<number | null>(null);
  const interruptedAudioTransition = useRef<number | null>(null);
  const retireTransitionAudio = useCallback(() => {
    const pending = controller.selection;
    if (pending && pending.phase !== 'focused') interruptedAudioTransition.current = pending.token;
  }, [controller]);
  const progressOwner = useRef({ onProgress, cursors, openedIds, galleryCursor });
  useLayoutEffect(() => { progressOwner.current = { onProgress, cursors, openedIds, galleryCursor }; }, [onProgress, cursors, openedIds, galleryCursor]);
  useLayoutEffect(() => { alive.current = true; return () => { alive.current = false; completedTransition.current = null; }; }, []);
  useLayoutEffect(() => {
    // Queued native clicks must read committed ownership, including retirement.
    interactiveRef.current = interactive;
    if (!interactive) retireTransitionAudio();
    return () => { interactiveRef.current = false; };
  }, [interactive, retireTransitionAudio]);
  useEffect(() => { onProgress?.(logicalProgress(selection, cursors, openedIds, galleryCursor)); }, [onProgress, selection, cursors, openedIds, galleryCursor, logicalProgress]);
  const flushCompletion = useCallback(() => {
    const token = completedTransition.current;
    if (token === null || !alive.current || !interactiveRef.current || !controller.hasTrackingPose()) return;
    completedTransition.current = null;
    if (!controller.complete(token)) return;
    const focused = controller.selection;
    const playCompletion = interruptedAudioTransition.current !== token;
    if (focused?.phase === 'focused') {
      if (playCompletion) audioEvent('focused', String(focused.token));
      if (!isExhibitGuide(focused.id) && (!stage || !isExhibitGalleryEntry(stage.profile, focused.id))) setOpenedIds(previous => previous.includes(focused.id) ? previous : [...previous, focused.id]);
    } else if (!focused && playCompletion) audioEvent('closed', String(token));
    setSelection(focused);
  }, [controller, audioEvent, stage]);
  useLayoutEffect(() => { void Promise.resolve().then(flushCompletion); }, [interactive, tracking, flushCompletion]);
  useLayoutEffect(() => {
    if (frame) ring.current?.setNativeProps({ position: controller.ringPosition! });
  }, [controller, frame]);
  useLayoutEffect(() => {
    closingCommitted.current = selection?.phase === 'closing';
    // Explicitly commit both directions of the origin handoff: unchanged
    // declarative coordinates cannot reset an imperatively translated parent.
    if (selection) panelFrame.current?.setNativeProps({ position: closingCommitted.current ? controller.ringPosition! : selection.origin });
  }, [controller, selection]);
  const recenter = useCallback(() => {
    const openingId = controller.selection?.phase === 'opening' ? controller.selection.id : null;
    const success = controller.recenter(performance.now()); onRecenterResult?.(success);
    if (!success) return;
    completedTransition.current = null;
    if (openingId && !isExhibitGuide(openingId) && (!stage || !isExhibitGalleryEntry(stage.profile, openingId))) setOpenedIds(previous => previous.includes(openingId) ? previous : [...previous, openingId]);
    setFrame({ slots: controller.slots, position: controller.ringPosition! });
    setSelection(controller.selection);
  }, [controller, onRecenterResult, stage]);
  const readerToken = selection?.token;
  const guidesVisible = !!(frame && Guide && !selection && visibleTileCount >= stories.length && snapshot.some(item => isExhibitGuide(item.id)));
  const guideControls = guidesVisible && !deployment && interactive && tracking === 'normal';
  const guideControlsRef = useRef(false);
  useLayoutEffect(() => {
    guideControlsRef.current = guideControls;
    return () => { guideControlsRef.current = false; };
  }, [guideControls]);
  const readerAvailable = (selection?.phase === 'focused' && interactive && tracking === 'normal') || guideControls;
  const canRead = useCallback(() => alive.current && interactiveRef.current && trackingRef.current === 'normal'
    && controller.selection?.phase === 'focused' && controller.selection.token === readerToken, [controller, readerToken]);
  const changePreference = reading.change;
  const changeReadingSize = useCallback<ReadingCommand>(delta => {
    if (canRead()) readingCommand.current?.(delta);
    else if (guideControls && guideControlsRef.current && alive.current && interactiveRef.current
      && trackingRef.current === 'normal' && !controller.selection) changePreference(delta);
  }, [canRead, changePreference, controller, guideControls]);
  const selectedContent = snapshot.find(item => item.id === selection?.id);
  const captureRestricted = selectedContent?.restrictCapture === true;
  useLayoutEffect(() => {
    onControls?.({ recenter, readerAvailable, changeReadingSize, captureRestricted });
    return () => onControls?.(null);
  }, [onControls, recenter, readerAvailable, changeReadingSize, captureRestricted]);
  useEffect(() => {
    if (!onMetrics) return;
    let started = performance.now(); let baseline = { ...counts.current };
    const timer = setInterval(() => {
      const now = performance.now(); const seconds = (now - started) / 1000;
      if (seconds > 0) onMetrics({ received: Math.round((counts.current.received - baseline.received) / seconds), applied: Math.round((counts.current.applied - baseline.applied) / seconds) });
      baseline = { ...counts.current }; started = now;
    }, 2000);
    return () => clearInterval(timer);
  }, [onMetrics]);
  function track(value: number) {
    const next: TrackingState = value === ViroTrackingStateConstants.TRACKING_NORMAL ? 'normal' : value === ViroTrackingStateConstants.TRACKING_LIMITED ? 'limited' : 'unavailable';
    if (next === trackingRef.current) return;
    if (next !== 'normal') {
      previousDeployment.current = false;
      retireTransitionAudio();
    }
    trackingRef.current = next; controller.track(next); setTracking(next); onTracking(next);
  }
  function pose(sample: PoseSample) {
    nearbyPose.current?.(sample);
    counts.current.received++;
    const update = controller.pose(sample, performance.now());
    if (update.position) {
      counts.current.applied++;
      if (update.captured) {
        // Restore logical focus only after this frame supplies its own valid pose.
        if (restored?.selectedId && snapshot.some(item => item.id === restored.selectedId)) {
          const selected = controller.select(restored.selectedId, performance.now());
          if (selected) { controller.complete(selected.token); setSelection(controller.selection); }
        } else if (stage && restored?.exhibitGallery?.focused && stage.profile.media.some(photo => photo.id === restored.exhibitGallery?.cursor.mediaId)) {
          const selected = controller.select(stage.profile.galleryId, performance.now());
          if (selected) { controller.complete(selected.token); setSelection(controller.selection); }
        }
        setFrame({ slots: controller.slots, position: update.position }); onReady();
      }
      else {
        ring.current?.setNativeProps({ position: update.position });
        if (closingCommitted.current && controller.selection?.phase === 'closing') panelFrame.current?.setNativeProps({ position: update.position });
      }
    }
    // NORMAL alone is not a fresh recovered pose. Reconcile a retained finish
    // only after the controller has accepted this frame's pose sample.
    flushCompletion();
  }
  function select(id: string) {
    if (!interactiveRef.current || controller.selection?.id === id) return;
    // Exhibit removes neighboring chapter geometry while the reader is present.
    // A queued click from a retired cover cannot collapse that isolated reader.
    if (presentation?.isolateReader && controller.selection) return;
    // Native completed clicks can arrive before React commits the new selection.
    // An already focused panel closes; another tile never replaces it directly.
    const now = performance.now();
    const next = controller.selection ? controller.close(now) : controller.select(id, now);
    if (next) {
      const entrance = stage && exhibitGalleryEntries(stage.profile).find(entry => entry.id === id);
      // A retired/blocked tap must never reset the shared gallery cursor. The
      // labeled galleries resume; every standalone photo starts at its media ID.
      if (next.phase === 'opening' && entrance?.mediaId) setGalleryCursor({ page: 0, offset: 0,
        locale: i18n.resolvedLanguage ?? i18n.language, size: reading.size, mediaId: entrance.mediaId, mediaPage: 0 });
      commitSelection(next);
    }
  }
  function commitSelection(next: FocusSelection) {
    if (next.phase === 'closing') {
      const progress = progressOwner.current;
      // Capture the accepted intent before an immediately following AppState
      // event can unmount this frame and discard an uncommitted React update.
      progress.onProgress?.(logicalProgress(next, progress.cursors, progress.openedIds, progress.galleryCursor));
    }
    setSelection(next);
  }
  function close() { if (!interactiveRef.current) return; const next = controller.close(performance.now()); if (next) commitSelection(next); }
  const complete = useCallback((token: number) => {
    if (!alive.current || controller.selection?.token !== token || controller.selection.phase === 'focused') return;
    completedTransition.current = token;
    flushCompletion();
  }, [controller, flushCompletion]);
  const detailsContent = <>
    {frame && <ViroNode ref={ring} testID="ring-root" position={frame.position} opacity={(selection ? 0.4 : 1) * (tracking === 'normal' ? 1 : 0.35)}>
      {!stage && deployment === 'full' && controller.basis && <CinematicEmblem basis={controller.basis} animationPrefix={animationPrefix} />}
      {stage && Scenery && Arrival && !selection && controller.basis && quality === 'standard' && effectsEnabled && tracking === 'normal' && (interactive || !!deployment) && <Arrival deployment={deployment} order={0}><Scenery basis={controller.basis} /></Arrival>}
      {stage && GalleryEntry && Arrival && !selection && exhibitGalleryEntries(stage.profile).map(entry => <Arrival key={entry.id} deployment={deployment} order={1}><GalleryEntry profile={stage.profile} entry={entry} slot={frame.slots.find(slot => slot.id === entry.id)!} enabled={!deployment && interactive && tracking === 'normal'} style={style} onSelect={select} /></Arrival>)}
      {Guide && guidesVisible && frame.slots.filter(slot => isExhibitGuide(slot.id)).map(slot =>
        <Guide key={slot.id} slot={slot} content={snapshot.find(item => item.id === slot.id)!}
          enabled={guideControls} style={style} onSelect={select} size={reading.size} />)}
      {frame.slots.filter(slot => !isExhibitGuide(slot.id) && (!stage || !isExhibitGalleryEntry(stage.profile, slot.id))).slice(0, Math.max(0, visibleTileCount)).map((slot, index) => {
        if (selection && (presentation?.isolateReader || selection.id === slot.id)) return null;
        const tile = (localSlot: RingSlot) => <Tile slot={localSlot} ordinal={index + 1} chapterCount={stories.length} opened={openedIds.includes(slot.id)} content={snapshot.find(item => item.id === slot.id)!} enabled={!deployment && interactive && tracking === 'normal' && (!selection || selection.phase === 'focused')} style={style} onSelect={select} decorations={quality === 'standard' && (!stage || effectsEnabled && (interactive || !!deployment) && tracking === 'normal')} />;
        if (stage && Arrival) return <Arrival key={slot.id} deployment={deployment} order={index + 2}>{tile(slot)}</Arrival>;
        return deployment && controller.basis ? <CinematicTile key={slot.id} slot={slot} basis={controller.basis} variant={deployment} ordinal={index} peers={frame.slots} animationPrefix={animationPrefix}>{tile({ ...slot, position: [0, 0, 0], rotation: [0, 0, 0] })}</CinematicTile> : <React.Fragment key={slot.id}>{tile(slot)}</React.Fragment>;
      })}
    </ViroNode>}
    {selection && selectedContent && <ViroNode ref={panelFrame} testID="ring-panel-frame" position={selection.origin}><InformationPanel animationPrefix={animationPrefix} Frame={presentation?.Frame} revealImages={presentation?.revealImages} pageMotion={presentation?.pageMotion} focusGlint={presentation?.focusGlint} selection={selection} ordinal={stories.findIndex(item => item.id === selection.id) + 1} chapterCount={stories.length} openedCount={openedIds.length} content={selectedContent} previous={cursors[selection.id]} reading={reading} enabled={interactive && tracking === 'normal'} style={style} decorations={quality === 'standard'}
      onCursor={(id, cursor) => setCursors(previous => ({ ...previous, [id]: cursor }))} onClose={close} onComplete={complete} onPageChange={pageSound} externalReadingControls={externalReadingControls} onReadingControls={acceptReadingCommand} canInteract={canRead} /></ViroNode>}
    {selection && stage && GalleryPanel && isExhibitGalleryEntry(stage.profile, selection.id) && <ViroNode ref={panelFrame} testID="ring-panel-frame" position={selection.origin}>
      <GalleryPanel profile={stage.profile} selection={selection} previous={galleryCursor} reading={reading} enabled={interactive && tracking === 'normal'} style={style} animationPrefix={animationPrefix}
        onCursor={setGalleryCursor} onClose={close} onComplete={complete} onPageChange={pageSound} externalReadingControls={externalReadingControls} onReadingControls={acceptReadingCommand} decorations={quality === 'standard'} canInteract={canRead} />
    </ViroNode>}
  </>;
  return <ViroARScene anchorDetectionTypes="None" onTrackingUpdated={track} onCameraTransformUpdate={pose}>
    {/* Moving or animated nodes share a zero-origin native frame. */}
    {typeof audio.cue?.source === 'number' && <ViroSound key={audio.cue.playbackId} source={audio.cue.source} volume={audio.cue.channel === 'voice' ? 0.45 : 0.35} loop={false} paused={false} onFinish={audio.finish} onError={audio.finish} />}
    <ViroNode testID="ring-native-frame" position={[0, 0, 0]}>
      {viewMode && onViewComplete ? <>
        <ArViewLayer view="details" state={viewMode} interactive={interactive} onComplete={onViewComplete}>{detailsContent}</ArViewLayer>
        {viewMode.view === 'nearby' && <ArViewLayer view="nearby" state={viewMode} interactive={canUseNearby} onComplete={onViewComplete}>
          {nearbyContent && <NearbyViroLayer key={nearbyContent.resultId} content={nearbyContent} tracking={tracking === 'normal'} interactive={canUseNearby} animateArrival={viewMode.phase === 'ready'} registerPose={registerNearbyPose} style={style} />}
        </ArViewLayer>}
      </> : detailsContent}
    </ViroNode>
  </ViroARScene>;
}
const RingContext = createContext<Props | null>(null);
function RingEntry() {
  const props = useContext(RingContext); if (!props) throw new Error('Missing ring scene owner');
  return <DestinationRingScene {...props} />;
}
const initialScene = { scene: RingEntry };
export function DestinationRingSceneHost(props: Props) {
  const navigator = useRef<ViroARSceneNavigator | null>(null);
  const restrictedExhibit = props.restrictCapture || props.presentation?.stage?.profile.destinationId === 'D10';
  const canCapture = !restrictedExhibit &&
    (!props.viewMode || props.viewMode.view === 'details' && props.viewMode.phase === 'ready' && props.interactive !== false);
  const captureAllowed = useRef(false);
  const readerCaptureBlocked = useRef(true);
  useLayoutEffect(() => {
    captureAllowed.current = canCapture;
    return () => { captureAllowed.current = false; };
  }, [canCapture]);
  const capture = useCallback<NativeCapture>(fileName => captureAllowed.current && !readerCaptureBlocked.current && navigator.current
    ? navigator.current.arSceneNavigator.takeScreenshot(fileName, false)
    : Promise.resolve({ success: false, url: null, errorCode: 6 }), []);
  const onControls = props.onControls;
  const acceptControls = useCallback((controls: RingControls | null) => {
    readerCaptureBlocked.current = !controls || controls.captureRestricted === true;
    onControls?.(controls ? { ...controls, capture: !restrictedExhibit && !controls.captureRestricted ? capture : undefined } : null);
  }, [onControls, capture, restrictedExhibit]);
  return <RingContext.Provider value={{ ...props, onControls: acceptControls }}><ViroARSceneNavigator ref={navigator} initialScene={initialScene} provider="none" frontCameraEnabled={false}
    hdrEnabled={false} pbrEnabled={false} bloomEnabled={false} shadowsEnabled={false} depthEnabled={false} occlusionMode="disabled" style={{ flex: 1 }} /></RingContext.Provider>;
}
