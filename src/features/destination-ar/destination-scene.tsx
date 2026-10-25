import { useEffect, useRef, useState } from 'react';
import { ViroARScene, ViroARSceneNavigator, ViroMaterials, ViroNode, ViroQuad, ViroText, ViroTrackingStateConstants } from '@reactvision/react-viro';
import { useCSSVariable } from 'uniwind';
import { useTranslation } from 'react-i18next';
import type { PoseSample, TrackingState, Vector3 } from './types';

type Callbacks = { onReady(): void; onTracking(state: TrackingState): void };
type Placement = { position: Vector3; rotation: Vector3 };

/** One world-stable square, not the M2 translation-following ring. */
export function DestinationScene({ onReady, onTracking }: Callbacks) {
  const { t } = useTranslation();
  const [brand, strong, panel, edge, white] = useCSSVariable(['--color-brand-primary', '--color-brand-strong', '--color-ar-panel', '--color-ar-edge', '--color-white']) as string[];
  const [tracking, setTracking] = useState<TrackingState>('unavailable');
  const trackingRef = useRef<TrackingState>('unavailable');
  const placed = useRef(false);
  const [placement, setPlacement] = useState<Placement | null>(null);
  const [tapped, setTapped] = useState(false);
  useEffect(() => {
    ViroMaterials.createMaterials({
      argalaSpikeEdge: { diffuseColor: edge, lightingModel: 'Constant' },
      argalaSpikePanel: { diffuseColor: panel, lightingModel: 'Constant' },
      argalaSpikeSelected: { diffuseColor: strong, lightingModel: 'Constant' },
    });
  }, [brand, strong, panel, edge]);
  function track(value: number) {
    const next: TrackingState = value === ViroTrackingStateConstants.TRACKING_NORMAL ? 'normal'
      : value === ViroTrackingStateConstants.TRACKING_LIMITED ? 'limited' : 'unavailable';
    if (trackingRef.current === next) return;
    trackingRef.current = next; setTracking(next); onTracking(next);
  }
  function transform(pose: PoseSample) {
    // Per-frame callbacks stay inside this scene. Capture once in this frame;
    // LIMITED -> NORMAL never resets orientation or the tapped square.
    if (trackingRef.current !== 'normal' || placed.current) return;
    if (!pose.position?.every(Number.isFinite) || !pose.forward?.every(Number.isFinite)) return;
    const horizontal = Math.hypot(pose.forward[0], pose.forward[2]);
    if (horizontal < 0.05) return;
    const x = pose.forward[0] / horizontal; const z = pose.forward[2] / horizontal;
    placed.current = true;
    setPlacement({ position: [pose.position[0] + x * 1.5, pose.position[1], pose.position[2] + z * 1.5], rotation: [0, Math.atan2(-x, -z) * 180 / Math.PI, 0] });
    onReady();
  }
  function tap() { if (trackingRef.current === 'normal') setTapped(value => !value); }
  return <ViroARScene anchorDetectionTypes="None" onTrackingUpdated={track} onCameraTransformUpdate={transform}>
    {/* One click owner keeps press/release valid across text, fill and border. */}
    {placement && <ViroNode position={placement.position} rotation={placement.rotation} opacity={tracking === 'normal' ? 1 : 0.35} onClick={tap}>
      <ViroQuad width={0.84} height={0.84} materials="argalaSpikeEdge" />
      <ViroQuad width={0.8} height={0.8} position={[0, 0, 0.003]} opacity={0.94} materials={tapped ? 'argalaSpikeSelected' : 'argalaSpikePanel'} />
      <ViroText position={[0, 0, 0.006]} width={0.68} height={0.65} text={t(tapped ? 'destinationAr.squareTapped' : 'destinationAr.square')}
        style={{ fontFamily: 'PlusJakartaSans', fontSize: 8, color: white, textAlign: 'center', textAlignVertical: 'center' }} />
    </ViroNode>}
  </ViroARScene>;
}

export function DestinationSceneHost(props: Callbacks) {
  // Keep the scene class identity stable as controller status/copy changes.
  const callbacks = useRef(props);
  useEffect(() => { callbacks.current = props; }, [props]);
  const [scene] = useState(() => function SpikeScene() {
    return <DestinationScene onReady={() => callbacks.current.onReady()} onTracking={state => callbacks.current.onTracking(state)} />;
  });
  return <ViroARSceneNavigator initialScene={{ scene }} provider="none" frontCameraEnabled={false}
    hdrEnabled={false} pbrEnabled={false} bloomEnabled={false} shadowsEnabled={false} depthEnabled={false} occlusionMode="disabled" style={{ flex: 1 }} />;
}
