import { expect, it } from 'vitest';
import { RingController } from './ring-controller';
import type { PoseSample } from './types';
const entries = [{ id: 'overview', role: 'overview' as const }, { id: 'history', role: 'history' as const }];
const pose: PoseSample = { position: [0, 2, 0], forward: [0, 0, -1] };
function ready() { const c = new RingController(entries); c.track('normal'); c.pose(pose, 1000); return c; }
it('captures only normal horizontal pose, then follows translation without changing yaw', () => {
  const c = new RingController(entries);
  expect(c.pose(pose, 900).captured).toBe(false);
  c.track('normal'); expect(c.pose({ ...pose, forward: [0, 1, 0] }, 950).captured).toBe(false);
  expect(c.pose(pose, 1000).captured).toBe(true);
  const basis = c.basis;
  const moved = c.pose({ position: [4, 2, 3], forward: [1, 0, 0] }, 1100);
  expect(moved.position).toEqual([4, 2, 3]);
  expect(c.basis).toBe(basis);
  expect(c.slots[0].position).toEqual([0, 0, -2]);
});
it('limits native translation publications and ignores malformed or out-of-order poses', () => {
  const c = ready();
  expect(c.pose({ ...pose, position: [0.01, 2, 0] }, 1010).position).toBeUndefined();
  expect(c.pose({ ...pose, position: [Infinity, 2, 0] }, 1100).position).toBeUndefined();
  expect(c.pose({ ...pose, position: [4, 2, 0] }, 999).position).toBeUndefined();
});
it('focuses once toward the current heading, freezes spatial focus, and restores current ring on close', () => {
  const c = ready(); c.pose({ position: [4, 2, 3], forward: [1, 0, 0] }, 1100);
  const focus = c.select('history', 1100)!;
  expect(focus.to.position).toEqual([5.15, 2, 3]);
  expect(c.select('overview', 1100)).toBeNull();
  expect(c.close(1100)).toBeNull();
  expect(c.complete(focus.token)).toBe(true);
  c.pose({ position: [6, 2, 3], forward: [0, 0, 1] }, 1200);
  expect(c.selection!.to.position).toEqual([5.15, 2, 3]);
  const close = c.close(1200)!;
  expect(close.to.position[0]).toBeCloseTo(8);
  expect(close.to.position[2]).toBeCloseTo(3);
  c.complete(close.token); expect(c.selection).toBeNull();
});
it('retains basis and focused transform through tracking loss and rejects stale interactions', () => {
  const c = ready(); const focus = c.select('overview', 1000)!; c.complete(focus.token);
  const original = c.selection; const basis = c.basis;
  c.track('limited'); c.pose({ ...pose, forward: [1, 0, 0] }, 1200);
  expect(c.close(1200)).toBeNull(); expect(c.recenter(1200)).toBe(false);
  c.track('normal'); c.pose({ position: [1, 2, 1], forward: [1, 0, 0] }, 1300);
  expect(c.basis).toBe(basis); expect(c.selection).toBe(original);
  expect(c.close(2000)).toBeNull();
});
it('recenter cancels an in-flight transition, preserves selected identity, and fences old completion', () => {
  const c = ready(); const focus = c.select('history', 1000)!;
  c.pose({ position: [1, 2, 1], forward: [1, 0, 0] }, 1100);
  expect(c.recenter(1100)).toBe(true);
  expect(c.selection!.id).toBe('history'); expect(c.selection!.phase).toBe('focused');
  expect(c.selection!.to.position).toEqual([2.15, 2, 1]);
  expect(c.complete(focus.token)).toBe(false);
  expect(c.slots[0].position[0]).toBeCloseTo(2);
});

it('requires a new pose after tracking recovery before accepting an interaction', () => {
  const c = ready(); c.track('limited'); c.track('normal');
  expect(c.select('overview', 1100)).toBeNull();
  c.pose({ ...pose, forward: [1, 0, 0] }, 1100);
  expect(c.select('overview', 1100)!.to.position).toEqual([1.15, 2, 0]);
});
