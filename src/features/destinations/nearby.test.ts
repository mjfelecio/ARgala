import { expect, it, vi } from 'vitest';
import { placesService } from '@/features/places/service';
import { distanceMeters } from '@/features/location/geo';
import { DESTINATION_NEARBY_RADIUS_METERS, withinDestinationRadius, searchDestinationNearby } from './nearby';
vi.mock('@/features/places/service', () => ({ placesService: { nearby: vi.fn() } }));
const center = { latitude: 0, longitude: 0 };
const north = (meters: number) => ({ latitude: meters / 6371008.8 * 180 / Math.PI, longitude: 0 });
it.each([[499, true], [500, true], [500.1, false], [500.49, false], [501, false]] as const)('filters %sm using exact destination distance, before rounding', (meters, expected) => {
 expect(distanceMeters(center, north(meters))).toBeCloseTo(meters, 8);
 expect(withinDestinationRadius(center, north(meters))).toBe(expected);
});
it.each([null, undefined, { latitude: NaN, longitude: 0 }, { latitude: 91, longitude: 0 }])('rejects invalid center/item %j without throwing geographic errors into render', value => {
 expect(withinDestinationRadius(value, center)).toBe(false); expect(withinDestinationRadius(center, value)).toBe(false);
});
it('uses the destination center, independent 500m radius and requested language', async () => {
 vi.mocked(placesService.nearby).mockResolvedValue([]);
 await searchDestinationNearby(center, 'ja');
 expect(DESTINATION_NEARBY_RADIUS_METERS).toBe(500);
 expect(placesService.nearby).toHaveBeenLastCalledWith({ center, radiusMeters: 500, language: 'ja' });
});
it('rejects absent or invalid centers before any paid service request', async () => {
 vi.mocked(placesService.nearby).mockClear();
 await expect(searchDestinationNearby(null, 'en')).rejects.toThrow(); expect(placesService.nearby).not.toHaveBeenCalled();
});
