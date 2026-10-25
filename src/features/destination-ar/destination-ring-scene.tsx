import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { ViroARScene, ViroARSceneNavigator, ViroNode, ViroTrackingStateConstants } from '@reactvision/react-viro';
import { useTranslation } from 'react-i18next';
import { developmentRingContent, type RingContent } from './development-ring-content';
import { RingController, type FocusSelection } from './ring-controller';
import { useArNativeStyle } from './native-styles';
import { InformationTile } from './information-tile';
import { InformationPanel } from './information-panel';
import { useReadingSize } from './use-reading-size';
import type { ReadingCursor } from './content-layout';
import type { PoseSample, TrackingState, Vector3 } from './types';
import type { RingSlot } from './scene-geometry';
export type RingControls = { recenter(): void };
export type RingMetrics = { received: number; applied: number };
type Props = { onReady(): void; onTracking(state: TrackingState): void; onControls?(controls: RingControls | null): void; onRecenterResult?(success: boolean): void; onMetrics?(metrics: RingMetrics): void; content?: readonly RingContent[] };

/** A single native coordinate frame. No destination/GPS admission is granted. */
export function DestinationRingScene({ onReady, onTracking, onControls, onRecenterResult, onMetrics, content = developmentRingContent }: Props) {
  const { t, i18n } = useTranslation(); const style = useArNativeStyle(); const reading = useReadingSize();
  const [snapshot] = useState(() => content.filter(item => i18n.exists(item.bodyKey) && t(item.bodyKey).trim()));
  const [controller] = useState(() => new RingController(snapshot));
  const [frame, setFrame] = useState<{ slots: RingSlot[]; position: Vector3 } | null>(null);
  const [tracking, setTracking] = useState<TrackingState>('unavailable');
  const trackingRef = useRef<TrackingState>('unavailable'); const ring = useRef<ViroNode>(null);
  const [selection, setSelection] = useState<FocusSelection | null>(null);
  const [cursors, setCursors] = useState<Record<string, ReadingCursor>>({});
  const counts = useRef({ received: 0, applied: 0 });
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
      if (update.captured) { setFrame({ slots: controller.slots, position: update.position }); onReady(); }
      else ring.current?.setNativeProps({ position: update.position });
    }
  }
  function select(id: string) { const next = controller.select(id, performance.now()); if (next) setSelection(next); }
  function close() { const next = controller.close(performance.now()); if (next) setSelection(next); }
  function complete(token: number) { if (controller.complete(token)) setSelection(controller.selection); }
  const selectedContent = snapshot.find(item => item.id === selection?.id);
  return <ViroARScene anchorDetectionTypes="None" onTrackingUpdated={track} onCameraTransformUpdate={pose}>
    {/* The pinned bridge anchors direct AR-scene children. Keep moving/animated
        nodes beneath a zero-origin frame so their transforms share camera space. */}
    <ViroNode testID="ring-native-frame" position={[0, 0, 0]}>
    {frame && <ViroNode ref={ring} testID="ring-root" position={frame.position} opacity={(selection ? 0.25 : 1) * (tracking === 'normal' ? 1 : 0.35)}>
      {frame.slots.map(slot => selection?.id === slot.id ? null : <InformationTile key={slot.id} slot={slot} content={snapshot.find(item => item.id === slot.id)!} enabled={tracking === 'normal' && !selection} style={style} onSelect={select} />)}
    </ViroNode>}
    {selection && selectedContent && <InformationPanel selection={selection} content={selectedContent} previous={cursors[selection.id]} reading={reading} enabled={tracking === 'normal'} style={style}
      onCursor={(id, cursor) => setCursors(previous => ({ ...previous, [id]: cursor }))} onClose={close} onComplete={complete} />}
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
  return <RingContext.Provider value={props}><ViroARSceneNavigator initialScene={initialScene} provider="none" frontCameraEnabled={false}
    hdrEnabled={false} pbrEnabled={false} bloomEnabled={false} shadowsEnabled={false} depthEnabled={false} occlusionMode="disabled" style={{ flex: 1 }} /></RingContext.Provider>;
}
