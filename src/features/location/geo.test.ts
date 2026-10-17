import { describe, expect, it } from 'vitest';
import { bearingDegrees, distanceMeters, isCoordinate, isWithinRadius, normalizeHeading, relativeHeading } from './geo';
const origin = { latitude: 0, longitude: 0 };
describe('geographic calculations', () => {
  it('validates finite coordinates including the geographic boundaries', () => {
    for (const value of [origin, { latitude: -90, longitude: 180 }, { latitude: 90, longitude: -180 }]) expect(isCoordinate(value)).toBe(true);
    for (const value of [null, {}, { latitude: 91, longitude: 0 }, { latitude: 0, longitude: 181 }, { latitude: NaN, longitude: 0 }, { latitude: 0, longitude: Infinity }]) expect(isCoordinate(value)).toBe(false);
  });
  it('computes Haversine distances at the equator and across the dateline', () => {
    expect(distanceMeters(origin, origin)).toBe(0);
    expect(distanceMeters(origin, { latitude: 0, longitude: 1 })).toBeCloseTo(111195.08, 0);
    expect(distanceMeters({ latitude: 0, longitude: 179.9 }, { latitude: 0, longitude: -179.9 })).toBeCloseTo(22239.02, 0);
    expect(distanceMeters(origin, { latitude: 0, longitude: 180 })).toBeCloseTo(Math.PI * 6371008.8, 4);
  });
  it('computes cardinal bearings', () => {
    expect(bearingDegrees(origin, { latitude: 1, longitude: 0 })).toBe(0);
    expect(bearingDegrees(origin, { latitude: 0, longitude: 1 })).toBe(90);
    expect(bearingDegrees(origin, { latitude: -1, longitude: 0 })).toBe(180);
    expect(bearingDegrees(origin, { latitude: 0, longitude: -1 })).toBe(270);
  });
  it('normalizes heading and signed relative angles at wraparound', () => {
    expect(normalizeHeading(-1)).toBe(359); expect(normalizeHeading(720)).toBe(0);
    expect(relativeHeading(5, 355)).toBe(10); expect(relativeHeading(355, 5)).toBe(-10);
    expect(relativeHeading(180, 0)).toBe(-180);
  });
  it('includes radius boundaries and rejects invalid inputs', () => {
    expect(isWithinRadius(origin, origin, 0)).toBe(true);
    const other = { latitude: 0, longitude: 0.001 };
    const distance = distanceMeters(origin, other);
    expect(isWithinRadius(origin, other, distance)).toBe(true);
    expect(isWithinRadius(origin, other, distance - 1)).toBe(false);
    expect(() => distanceMeters(origin, { latitude: 91, longitude: 0 })).toThrow();
    expect(() => normalizeHeading(NaN)).toThrow();
    expect(() => isWithinRadius(origin, origin, -1)).toThrow();
  });
});
