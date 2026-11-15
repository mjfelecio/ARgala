import { expect, it } from 'vitest';
import { buildExhibitSlots } from './exhibit-layout';
import { RingController } from './ring-controller';
import { captureBasis, ringMetrics } from './scene-geometry';

const entries = [{ id: 'overview', role: 'overview' as const }, { id: 'chapter-2' }, { id: 'chapter-3' }];
const pose = { position: [0, 2, 0] as [number, number, number], forward: [0, 0, -1] as [number, number, number] };
it('places D01 in a front-facing faceted arc without altering Classic geometry', () => {
  const basis = captureBasis(pose)!;
  const slots = buildExhibitSlots(entries, basis);
  expect(slots.map(slot => slot.id)).toEqual(entries.map(entry => entry.id));
  expect(slots.map(slot => slot.angle)).toEqual([0, 24, 336]);
  for (const slot of slots) {
    expect(Math.hypot(slot.position[0], slot.position[2])).toBeCloseTo(2);
    expect(slot.position[2]).toBeLessThan(-1.8);
  }
  const classic = new RingController(entries);
  const exhibit = new RingController(entries, buildExhibitSlots);
  for (const controller of [classic, exhibit]) { controller.track('normal'); controller.pose(pose, 1000); }
  expect(classic.slots.map(slot => slot.angle)).toEqual([0, 120, 240]);
  expect(exhibit.slots.map(slot => slot.angle)).toEqual([0, 24, 336]);
  const focus = exhibit.select('chapter-2', 1000)!;
  expect(focus.to.position).toEqual([0, 2, -2.25]);
  expect(ringMetrics.focusDistance).toBe(2.25);
  expect(classic.complete(focus.token)).toBe(false);
  expect(classic.selection).toBeNull();
  exhibit.complete(focus.token);
  exhibit.track('limited'); exhibit.track('normal'); exhibit.pose(pose, 1100);
  expect(exhibit.selection?.to).toEqual(focus.to);
  expect(exhibit.recenter(1100)).toBe(true);
  expect(exhibit.slots.map(slot => slot.angle)).toEqual([0, 24, 336]);
});
