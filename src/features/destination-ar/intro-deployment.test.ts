import { expect, it } from 'vitest';
import { deploymentTransform } from './intro-deployment';
import { buildRingSlots, captureBasis, slotTransform } from './scene-geometry';
it.each([1, 5, 12])('settles %s chapters at the unchanged canonical transforms for varied initial yaw', count => {
  for (const forward of [[0, 0, -1], [1, 0, 0], [-0.6, 0, 0.8]] as [number, number, number][]) {
    const basis = captureBasis({ position: [0, 0, 0], forward })!;
    const entries = Array.from({ length: count }, (_, i) => ({ id: String(i), role: i === 0 ? 'overview' as const : i === 1 ? 'history' as const : undefined }));
    const slots = buildRingSlots(entries, basis);
    for (const slot of slots) {
      for (const variant of ['full', 'return', 'reduced', 'none'] as const) {
        expect(deploymentTransform(slot, basis, 1, variant)).toEqual(slotTransform(slot, [0, 0, 0]));
        for (const progress of [0, 0.1, 0.5, 0.99, NaN, Infinity, -1, 2]) {
          const value = deploymentTransform(slot, basis, progress, variant);
          expect([...value.position, ...value.rotation, value.scale].every(Number.isFinite)).toBe(true);
        }
      }
    }
    expect(slots[0].angle).toBe(0); if (count > 1) expect(slots[1].angle).toBe(90);
  }
});
it('moves full deployment outward from the emblem while repeat/reduced stay at final positions', () => {
  const basis = captureBasis({ position: [0, 0, 0], forward: [0, 0, -1] })!;
  const slot = buildRingSlots([{ id: 'overview' }], basis)[0];
  expect(deploymentTransform(slot, basis, 0, 'full').position).toEqual([0, 0, -0.4]);
  expect(deploymentTransform(slot, basis, 0.5, 'full').position).not.toEqual(slot.position);
  expect(deploymentTransform(slot, basis, 0.5, 'return').position).toEqual(slot.position);
  expect(deploymentTransform(slot, basis, 0.5, 'reduced').position).toEqual(slot.position);
});
it('uses small relative yaw steps so native normalized Euler angles cannot introduce full spins', async () => {
  const { deploymentKeyframes } = await import('./intro-deployment');
  for (const yaw of [-170, -90, 0, 170]) {
    const radians = yaw * Math.PI / 180;
    const basis = captureBasis({ position: [0, 0, 0], forward: [-Math.sin(radians), 0, -Math.cos(radians)] })!;
    const slots = buildRingSlots(Array.from({ length: 12 }, (_, i) => ({ id: String(i) })), basis);
    for (const slot of slots) {
      const steps = deploymentKeyframes(slot, basis, 'full');
      expect(steps).toHaveLength(12);
      expect(steps.every(step => Math.abs(step.yawDelta) < 90)).toBe(true);
      const finalYaw = steps.reduce((yaw, step) => ((yaw + step.yawDelta) % 360 + 360) % 360, basis.yaw);
      expect(finalYaw).toBeCloseTo((slot.rotation[1] + 360) % 360);
    }
  }
});
