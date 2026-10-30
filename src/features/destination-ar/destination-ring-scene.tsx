import { ringCopy } from './ring-copy';
import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ViroARScene, ViroARSceneNavigator, ViroNode, ViroTrackingStateConstants } from '@reactvision/react-viro';
import { useTranslation } from 'react-i18next';
import { developmentRingContent, type RingContent } from './development-ring-content';
import { RingController, type FocusSelection } from './ring-controller';
import { useArNativeStyle } from './native-styles';
import { InformationTile } from './information-tile';
import { InformationPanel } from './information-panel';
import { useReadingSize } from './use-reading-size';
import { useArVisualQuality } from './use-ar-visual-quality';
import type { ReadingCursor } from './content-layout';
import type { PoseSample, TrackingState, Vector3 } from './types';
import type { RingSlot } from './scene-geometry';
import type { LogicalArProgress } from './session';
import type { NativeCapture } from '@/features/ar-photo/types';
export type RingControls = { recenter(): void; capture?: NativeCapture };
export type RingMetrics = { received: number; applied: number };
type Props = { onReady(): void; onTracking(state: TrackingState): void; onControls?(controls: RingControls | null): void; onRecenterResult?(success: boolean): void; onMetrics?(metrics: RingMetrics): void; content?: readonly RingContent[]; reading?: ReturnType<typeof useReadingSize>; initialProgress?: LogicalArProgress; onProgress?(progress: LogicalArProgress): void; visibleTileCount?: number; interactive?: boolean };

/** A single native coordinate frame. No destination/GPS admission is granted. */
export function DestinationRingScene(props: Props) {
  return props.reading ? <RingScene {...props} reading={props.reading} /> : <OwnedReadingRingScene {...props} />;
}
function OwnedReadingRingScene(props: Props) { const reading = useReadingSize(); return <RingScene {...props} reading={reading} />; }
function RingScene({ onReady, onTracking, onControls, onRecenterResult, onMetrics, content = developmentRingContent, reading, initialProgress, onProgress, visibleTileCount = Infinity, interactive = true }: Props & { reading: ReturnType<typeof useReadingSize> }) {
  const { t, i18n } = useTranslation(); const style = useArNativeStyle();
  const [restored] = useState(initialProgress);
  const [snapshot] = useState(() => content.filter(item => ringCopy(item, 'body', i18n.resolvedLanguage ?? i18n.language, key => t(key), key => i18n.exists(key)).trim()));
  const [controller] = useState(() => new RingController(snapshot));
  const [frame, setFrame] = useState<{ slots: RingSlot[]; position: Vector3 } | null>(null);
  const [tracking, setTracking] = useState<TrackingState>('unavailable');
  const quality = useArVisualQuality(interactive && tracking === 'normal');
  const trackingRef = useRef<TrackingState>('unavailable'); const ring = useRef<ViroNode>(null); const panelFrame = useRef<ViroNode>(null);
  const [selection, setSelection] = useState<FocusSelection | null>(null);
  const [cursors, setCursors] = useState<Record<string, ReadingCursor>>(() => initialProgress?.cursors ?? {});
  const counts = useRef({ received: 0, applied: 0 });
  const closingCommitted = useRef(false);
  const interactiveRef = useRef(false);
  useLayoutEffect(() => {
    // Queued native clicks must read committed ownership, including retirement.
    interactiveRef.current = interactive;
    return () => { interactiveRef.current = false; };
  }, [interactive]);
  useEffect(() => { onProgress?.({ selectedId: selection?.id ?? null, cursors }); }, [onProgress, selection, cursors]);
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
    const success = controller.recenter(performance.now()); onRecenterResult?.(success);
    if (!success) return;
    setFrame({ slots: controller.slots, position: controller.ringPosition! });
    setSelection(controller.selection);
  }, [controller, onRecenterResult]);
  useEffect(() => { onControls?.({ recenter }); return () => onControls?.(null); }, [onControls, recenter]);
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
    trackingRef.current = next; controller.track(next); setTracking(next); onTracking(next);
  }
  function pose(sample: PoseSample) {
    counts.current.received++;
    const update = controller.pose(sample, performance.now());
    if (update.position) {
      counts.current.applied++;
      if (update.captured) {
        // Restore logical focus only after this frame supplies its own valid pose.
        if (restored?.selectedId && snapshot.some(item => item.id === restored.selectedId)) {
          const selected = controller.select(restored.selectedId, performance.now());
          if (selected) { controller.complete(selected.token); setSelection(controller.selection); }
        }
        setFrame({ slots: controller.slots, position: update.position }); onReady();
      }
      else {
        ring.current?.setNativeProps({ position: update.position });
        if (closingCommitted.current && controller.selection?.phase === 'closing') panelFrame.current?.setNativeProps({ position: update.position });
      }
    }
  }
  function select(id: string) {
    if (!interactiveRef.current || controller.selection?.id === id) return;
    // Native completed clicks can arrive before React commits the new selection.
    // An already focused panel closes; another tile never replaces it directly.
    const now = performance.now();
    const next = controller.selection ? controller.close(now) : controller.select(id, now);
    if (next) setSelection(next);
  }
  function close() { if (!interactiveRef.current) return; const next = controller.close(performance.now()); if (next) setSelection(next); }
  function complete(token: number) { if (controller.complete(token)) setSelection(controller.selection); }
  const selectedContent = snapshot.find(item => item.id === selection?.id);
  return <ViroARScene anchorDetectionTypes="None" onTrackingUpdated={track} onCameraTransformUpdate={pose}>
    {/* The pinned bridge anchors direct AR-scene children. Keep moving/animated
        nodes beneath a zero-origin frame so their transforms share camera space. */}
    <ViroNode testID="ring-native-frame" position={[0, 0, 0]}>
    {frame && <ViroNode ref={ring} testID="ring-root" position={frame.position} opacity={(selection ? 0.25 : 1) * (tracking === 'normal' ? 1 : 0.35)}>
      {frame.slots.slice(0, Math.max(0, visibleTileCount)).map(slot => selection?.id === slot.id ? null : <InformationTile key={slot.id} slot={slot} content={snapshot.find(item => item.id === slot.id)!} enabled={interactive && tracking === 'normal' && (!selection || selection.phase === 'focused')} style={style} onSelect={select} decorations={quality === 'standard'} />)}
    </ViroNode>}
    {selection && selectedContent && <ViroNode ref={panelFrame} testID="ring-panel-frame" position={selection.origin}><InformationPanel selection={selection} content={selectedContent} previous={cursors[selection.id]} reading={reading} enabled={interactive && tracking === 'normal'} style={style} decorations={quality === 'standard'}
      onCursor={(id, cursor) => setCursors(previous => ({ ...previous, [id]: cursor }))} onClose={close} onComplete={complete} /></ViroNode>}
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
  const capture = useCallback<NativeCapture>(fileName => navigator.current
    ? navigator.current.arSceneNavigator.takeScreenshot(fileName, false)
    : Promise.resolve({ success: false, url: null, errorCode: 6 }), []);
  const onControls = props.onControls;
  const acceptControls = useCallback((controls: RingControls | null) => onControls?.(controls ? { ...controls, capture } : null), [onControls, capture]);
  return <RingContext.Provider value={{ ...props, onControls: acceptControls }}><ViroARSceneNavigator ref={navigator} initialScene={initialScene} provider="none" frontCameraEnabled={false}
    hdrEnabled={false} pbrEnabled={false} bloomEnabled={false} shadowsEnabled={false} depthEnabled={false} occlusionMode="disabled" style={{ flex: 1 }} /></RingContext.Provider>;
}
