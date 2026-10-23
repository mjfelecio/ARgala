import { describe, expect, it } from 'vitest';
import { snapLabelLeft } from './label-placement';

describe('display-only label stops', () => {
  it('holds indoor jitter at one of three positions and resists a shared boundary in both directions', () => {
    let left = snapLabelLeft(null, 104, 8, 232);
    expect(left).toBe(120);
    // Approximate stationary target range observed on the device recording.
    for (const target of [111, 115, 31, 45, 101, 82, 98, 33, 88, 70]) {
      left = snapLabelLeft(left, target, 8, 232);
      expect(left).toBe(120);
    }
    expect(snapLabelLeft(left, 24, 8, 232)).toBe(8);
    left = 8;
    for (const target of [97, 101, 99, 103]) expect(snapLabelLeft(left, target, 8, 232)).toBe(8);
    left = snapLabelLeft(left, 104, 8, 232);
    expect(left).toBe(120);
    for (const target of [97, 103, 101, 104]) expect(snapLabelLeft(left, target, 8, 232)).toBe(120);
  });
  it('responds immediately to deliberate large movement in either direction', () => {
    expect(snapLabelLeft(40, 220, 8, 232)).toBe(232);
    expect(snapLabelLeft(232, 8, 8, 232)).toBe(8);
  });
  it('keeps stops inside resized and narrow safe bounds, including both edges', () => {
    for (const maximum of [8, 17, 46, 153, 232, 487]) {
      expect(snapLabelLeft(null, 8, 8, maximum)).toBe(8);
      expect(snapLabelLeft(null, maximum, 8, maximum)).toBeCloseTo(maximum);
      for (let target = 8; target <= maximum; target += 0.7) {
        const left = snapLabelLeft(null, target, 8, maximum);
        expect(left).toBeGreaterThanOrEqual(8);
        expect(left).toBeLessThanOrEqual(maximum);
      }
    }
  });
  it('initializes fresh targets without reusing a previous session position', () => {
    expect(snapLabelLeft(null, 180, 8, 232)).toBe(232);
    expect(snapLabelLeft(null, 8, 8, 232)).toBe(8);
  });
});
