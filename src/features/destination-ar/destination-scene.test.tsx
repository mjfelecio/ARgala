import * as React from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { DestinationScene } from './destination-scene';
import type { PoseSample } from './types';
vi.mock('@reactvision/react-viro', () => ({
  ViroARScene: 'native-scene', ViroNode: 'node', ViroQuad: 'quad', ViroText: 'label',
  ViroARSceneNavigator: 'navigator', ViroMaterials: { createMaterials: vi.fn() },
  ViroTrackingStateConstants: { TRACKING_UNAVAILABLE: 1, TRACKING_LIMITED: 2, TRACKING_NORMAL: 3 },
}));
vi.mock('uniwind', () => ({ useCSSVariable: () => ['#247A53', '#174D38', '#0F2524', '#71DCD2', '#FFFFFF'] }));
vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }));
let tree: ReactTestRenderer; const ready = vi.fn(); const tracking = vi.fn();
const pose: PoseSample = { position: [1, 2, 3], forward: [0, 0, -1] };
async function updatePose(value = pose) { await act(async () => tree.root.findByType('native-scene' as React.ElementType).props.onCameraTransformUpdate(value)); }
async function updateTracking(state: number) { await act(async () => tree.root.findByType('native-scene' as React.ElementType).props.onTrackingUpdated(state, 1)); }
beforeEach(async () => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true }); ready.mockClear(); tracking.mockClear();
  const original = console.error;
  vi.spyOn(console, 'error').mockImplementation((...args: unknown[]) => { if (!String(args[0]).startsWith('react-test-renderer is deprecated')) original(...args); });
  await act(async () => { tree = create(React.createElement(DestinationScene, { onReady: ready, onTracking: tracking })); });
});
afterEach(async () => { await act(async () => tree.unmount()); vi.restoreAllMocks(); });
it('requires normal tracking and a valid horizontal pose before making the square interactive', async () => {
  await updatePose(); expect(tree.root.findAllByType('quad' as React.ElementType)).toHaveLength(0);
  await updateTracking(3);
  await updatePose({ position: [1, 2, 3], forward: [0, 1, 0] });
  expect(tree.root.findAllByType('quad' as React.ElementType)).toHaveLength(0);
  await updatePose();
  expect(tree.root.findByType('node' as React.ElementType).props.position).toEqual([1, 2, 1.5]);
  expect(ready).toHaveBeenCalledOnce();
});
it('keeps the square orientation and focus through same-frame tracking loss after the viewer turns', async () => {
  await updateTracking(3); await updatePose();
  await act(async () => tree.root.findAllByType('quad' as React.ElementType).find(node => node.props.onClick)!.props.onClick());
  const original = tree.root.findByType('node' as React.ElementType).props;
  await updateTracking(2);
  await act(async () => tree.root.findAllByType('quad' as React.ElementType).find(node => node.props.onClick)!.props.onClick());
  await updatePose({ position: [4, 2, 3], forward: [1, 0, 0] });
  expect(tree.root.findByType('node' as React.ElementType).props.opacity).toBeLessThan(1);
  await updateTracking(3); await updatePose({ position: [4, 2, 3], forward: [1, 0, 0] });
  expect(tree.root.findByType('node' as React.ElementType).props.position).toEqual(original.position);
  expect(tree.root.findByType('node' as React.ElementType).props.rotation).toEqual(original.rotation);
  expect(tree.root.findByType('label' as React.ElementType).props.text).toBe('destinationAr.squareTapped');
  expect(ready).toHaveBeenCalledOnce();
});
it('keeps repeated camera callbacks below the host React render boundary', async () => {
  await updateTracking(3); await updatePose();
  for (let n = 0; n < 20; n++) await updatePose({ position: [n, 2, 3], forward: [0, 0, -1] });
  expect(ready).toHaveBeenCalledOnce(); expect(tracking).toHaveBeenCalledOnce();
});
