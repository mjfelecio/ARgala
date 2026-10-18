import { describe, expect, it } from 'vitest';
import { relativeHeading } from '@/features/location/geo';
import type { Place } from '@/features/places/service';
import { projectBearing, rankPlaces, layoutLabels, selectedPlaceId } from './projection';

const origin = { latitude: 0, longitude: 0 };
const place = (id: string, latitude: number, longitude = 0): Place => ({ id, providerId: id, provider: 'google', name: id, coordinates: { latitude, longitude }, attributions: [] });
describe('portrait approximate projection', () => {
  it('wraps bearings in both directions across north', () => {
    expect(relativeHeading(1, 359)).toBe(2);
    expect(relativeHeading(359, 1)).toBe(-2);
    expect(projectBearing(1, 359, 60)).toBeCloseTo(0.5 + 2 / 60);
  });
  it('includes FOV edges and excludes points behind the device', () => {
    expect(projectBearing(30, 0, 60)).toBe(1);
    expect(projectBearing(330, 0, 60)).toBe(0);
    expect(projectBearing(30.01, 0, 60)).toBeNull();
    expect(projectBearing(180, 0, 60)).toBeNull();
  });
  it.each([null, NaN, Infinity, -1, 361])('rejects unavailable/invalid heading %s', (heading) => {
    expect(projectBearing(0, heading, 60)).toBeNull();
  });
  it('handles empty results without a selection or labels', () => {
    expect(rankPlaces([], origin, 0, 100)).toEqual([]);
    expect(selectedPlaceId([], null)).toBeNull();
    expect(layoutLabels([], 360, null)).toEqual([]);
  });
  it('activates inclusively at the configured radius independently of discovery', () => {
    const [poi] = rankPlaces([place('north', 0.001)], origin, 0, 1000);
    expect(rankPlaces([poi.place], origin, 0, poi.distance)[0].eligible).toBe(true);
    expect(rankPlaces([poi.place], origin, 0, poi.distance - 0.001)[0].eligible).toBe(false);
  });
  it('sorts the list by proximity and keeps manual selection through rotation', () => {
    const places = [place('far', 0.002), place('near', 0.0001)];
    const ranked = rankPlaces(places, origin, 0, 100);
    expect(ranked.map((p) => p.place.id)).toEqual(['near', 'far']);
    expect(selectedPlaceId(ranked, null)).toBe('near');
    expect(selectedPlaceId(rankPlaces(places, origin, 180, 100), 'far')).toBe('far');
    expect(selectedPlaceId(rankPlaces(places, origin, null, 1), null)).toBeNull();
  });
  it('prioritizes proximity/direction and reserves selected labels without overlap', () => {
    const ranked = rankPlaces([place('a', 0.0001), place('b', 0.0002), place('c', 0.0003), place('selected', 0.001)], origin, 0, 100);
    const labels = layoutLabels(ranked, 360, 'selected');
    expect(labels).toHaveLength(3);
    expect(labels[0].place.id).toBe('selected');
    expect(labels.map((p) => p.place.id)).toEqual(['selected', 'a', 'b']);
    expect(new Set(labels.map((p) => p.lane)).size).toBe(3);
    for (const label of labels) { expect(label.left).toBeGreaterThanOrEqual(8); expect(label.left + label.width).toBeLessThanOrEqual(352); }
    expect(layoutLabels(rankPlaces(ranked.map((p) => p.place), origin, null, 100), 360, null)).toEqual([]);
  });
});
