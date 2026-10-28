import { expect, it } from 'vitest';
import { googleMapsNavigationUrl } from './google-maps-navigation';
import { destinationToRoutePlace } from '@/features/destinations/routing';
import { getDestination } from '@/features/destinations/catalog';
const place = { id: 'google:test', providerId: 'test', provider: 'google', name: 'Test', coordinates: { latitude: 1, longitude: 2 }, attributions: [] };
it.each(['walking', 'driving'] as const)('hands ordinary places to Maps in %s mode without an origin or provider call', mode => {
 const url = new URL(googleMapsNavigationUrl(place, mode)!);
 expect(url.origin + url.pathname).toBe('https://www.google.com/maps/dir/');
 expect(url.searchParams.get('api')).toBe('1'); expect(url.searchParams.get('travelmode')).toBe(mode);
 expect(url.searchParams.get('destination')).toBe('1,2'); expect(url.searchParams.has('origin')).toBe(false);
});
it('requires the exact approved curated entrance and never substitutes the activation center', () => {
 const pilot = getDestination('pilot-aclc')!; const entrance = destinationToRoutePlace(pilot)!;
 expect(new URL(googleMapsNavigationUrl(entrance, 'driving')!).searchParams.get('destination')).toBe(`${pilot.routeEntrance!.latitude},${pilot.routeEntrance!.longitude}`);
 expect(googleMapsNavigationUrl({ ...entrance, coordinates: pilot.center! }, 'walking')).toBeNull();
 expect(googleMapsNavigationUrl({ ...entrance, providerId: 'curated_D01' }, 'walking')).toBeNull();
});
it('rejects invalid coordinates and modes before linking', () => {
 expect(googleMapsNavigationUrl({ ...place, coordinates: { latitude: NaN, longitude: 0 } }, 'walking')).toBeNull();
 expect(googleMapsNavigationUrl(place, 'flying')).toBeNull();
});
