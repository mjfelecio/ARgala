import React from 'react';
import { act, create } from 'react-test-renderer';
import { afterEach, expect, it, vi } from 'vitest';
import { destinationIds } from '@/features/destinations/catalog';
import { getExhibitStageProfile } from './exhibit-stage';
import { DestinationStageScenery, stageContours } from './destination-stage-scenery';
const native = vi.hoisted(() => ({ reduced: false }));
vi.mock('react-native-reanimated', () => ({ useReducedMotion: () => native.reduced }));
vi.mock('@reactvision/react-viro', () => ({ ViroNode: 'node', ViroPolyline: 'polyline' }));
afterEach(() => { native.reduced = false; vi.restoreAllMocks(); });
it('retains the original outdoor exhibits’ distinct bounded symbolic scenery without interactive geometry', async () => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  const original = console.error; vi.spyOn(console, 'error').mockImplementation((...args: unknown[]) => { if (!String(args[0]).startsWith('react-test-renderer is deprecated')) original(...args); });
  const shapes = new Set<string>();
  for (const id of destinationIds.filter(id => id !== 'D01' && id !== 'D10')) {
    const profile = getExhibitStageProfile(id)!; const contours = stageContours(profile.theme);
    expect(contours.length).toBeGreaterThan(3); expect(contours.length).toBeLessThanOrEqual(32);
    expect(contours.flatMap(contour => contour.points).every(point => point.every(Number.isFinite) && Math.abs(point[0]) <= 1.8 && Math.abs(point[1]) <= 1.3)).toBe(true);
    shapes.add(JSON.stringify(contours));
    let tree!: ReturnType<typeof create>;
    await act(async () => { tree = create(<DestinationStageScenery profile={profile} basis={{ forward: [1, 0, 0], right: [0, 0, 1], yaw: -90 }} />); });
    const root = tree.root.findByType('node' as React.ElementType);
    expect(root.props).toMatchObject({ ignoreEventHandling: true, position: [2.8, 0.08, 0], scale: [0.65, 1.1, 1], rotation: [0, -90, 0] });
    expect(tree.root.findAllByType('polyline' as React.ElementType)).toHaveLength(contours.length);
    for (const line of tree.root.findAllByType('polyline' as React.ElementType)) expect(line.props).toMatchObject({ ignoreEventHandling: true, renderingOrder: -1 });
    native.reduced = true;
    await act(async () => tree.update(<DestinationStageScenery profile={profile} basis={{ forward: [1, 0, 0], right: [0, 0, 1], yaw: -90 }} />));
    expect(tree.toJSON()).toBeNull();
    await act(async () => tree.unmount()); native.reduced = false;
  }
  expect(shapes.size).toBe(8);
  expect(stageContours(getExhibitStageProfile('D10')!.theme)).toEqual([]);
});
