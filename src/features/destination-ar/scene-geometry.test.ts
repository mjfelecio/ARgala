import { expect, it } from 'vitest';
import { captureBasis, buildRingSlots, focusTransform } from './scene-geometry';

const forward = { position: [1, 2, 3] as [number, number, number], forward: [0, 0, -1] as [number, number, number] };
const categories = [{ id: 'overview', role: 'overview' as const }, { id: 'history', role: 'history' as const }, { id: 'notes' }, { id: 'facts' }];
it.each([1, 2, 8, 12])('renders %s valid chapters without overlapping square tile footprints', count => {
  const entries = [...categories.slice(0, 2), ...Array.from({ length: 10 }, (_, i) => ({ id: `chapter-${i}` }))].slice(0, count);
  const slots = buildRingSlots(entries, captureBasis(forward)!);
  expect(slots).toHaveLength(count);
  expect(slots[0].angle).toBe(0);
  if (count > 1) expect(slots[1].angle).toBe(90);
  for (let i = 0; i < slots.length; i++) for (let j = i + 1; j < slots.length; j++) {
    expect(Math.hypot(slots[i].position[0] - slots[j].position[0], slots[i].position[2] - slots[j].position[2])).toBeGreaterThan(0.71);
  }
  expect(() => buildRingSlots([...entries, ...Array.from({ length: 13 }, (_, i) => ({ id: `overflow-${i}` }))], captureBasis(forward)!)).toThrow();
});
it('places Overview ahead and History right, facing inward without camera yaw parenting', () => {
  const slots = buildRingSlots(categories, captureBasis(forward)!);
  expect(slots.map(slot => slot.angle)).toEqual([0, 90, 180, 270]);
  expect(slots[0].position).toEqual([0, 0, -2]);
  expect(slots[1].position[0]).toBeCloseTo(2);
  expect(slots[1].position[2]).toBeCloseTo(0);
  expect(slots[1].rotation).toEqual([0, -90, 0]);
});
it('rotates the basis consistently when initial forward is world +X', () => {
  const basis = captureBasis({ ...forward, forward: [1, 0, 0] })!;
  const slots = buildRingSlots(categories, basis);
  expect(slots[0].position[0]).toBeCloseTo(2);
  expect(slots[0].position[2]).toBeCloseTo(0);
  expect(slots[1].position[2]).toBeCloseTo(2);
  expect(slots[0].rotation).toEqual([0, -90, 0]);
});
it('redistributes omitted optional categories without blank slots', () => {
  const basis = captureBasis(forward)!;
  expect(buildRingSlots(categories.slice(0, 3), basis).map(slot => slot.angle)).toEqual([0, 90, 225]);
  expect(buildRingSlots([categories[0], categories[2], categories[3]], basis).map(slot => slot.angle)).toEqual([0, 120, 240]);
  expect(buildRingSlots([], basis)).toEqual([]);
  expect(() => buildRingSlots([categories[0], categories[0]], basis)).toThrow();
});
it('waits for usable horizontal direction and rejects nonfinite or incomplete native samples', () => {
  expect(captureBasis({ ...forward, forward: [0, 1, 0] })).toBeNull();
  expect(captureBasis({ ...forward, position: [NaN, 2, 3] })).toBeNull();
  expect(captureBasis({ forward: [0, 0, -1] } as unknown as typeof forward)).toBeNull();
  expect(captureBasis({ ...forward, forward: [0, 0] as unknown as [number, number, number] })).toBeNull();
});
it('keeps headings near ±180 continuous and captures current focus independent of entry yaw', () => {
  const a = captureBasis({ ...forward, forward: [0.001, 0, 1] })!;
  const b = captureBasis({ ...forward, forward: [-0.001, 0, 1] })!;
  expect(Math.abs(a.forward[0] - b.forward[0])).toBeLessThan(0.003);
  const focused = focusTransform({ position: [5, 2, 6], forward: [1, 0, 0] })!;
  expect(focused.position).toEqual([6.5, 2, 6]);
  expect(focused.rotation).toEqual([0, -90, 0]);
});
