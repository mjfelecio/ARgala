import { isCoordinate } from '@/features/location/geo';
import type { Place } from '@/features/places/service';
import { getDestination } from '@/features/destinations/catalog';
import { destinationIdForRoutePlace, destinationToRoutePlace } from '@/features/destinations/routing';
import { travelModeSchema } from '../../../supabase/functions/_shared/contracts';
/** Universal URL opens Maps or its browser fallback. Captured destination only. */
export function googleMapsNavigationUrl(place: Place, mode: unknown): string | null {
  const parsed = travelModeSchema.safeParse(mode);
  if (!parsed.success || !isCoordinate(place.coordinates)) return null;
  if (place.provider === 'curated') {
    const id = destinationIdForRoutePlace(place);
    const destination = getDestination(id);
    const approved = destination ? destinationToRoutePlace(destination) : null;
    if (!approved || approved.coordinates.latitude !== place.coordinates.latitude || approved.coordinates.longitude !== place.coordinates.longitude) return null;
  } else if (place.provider !== 'google') return null;
  const url = new URL('https://www.google.com/maps/dir/');
  url.searchParams.set('api', '1');
  url.searchParams.set('destination', `${place.coordinates.latitude},${place.coordinates.longitude}`);
  url.searchParams.set('travelmode', parsed.data);
  url.searchParams.set('dir_action', 'navigate');
  return url.toString();
}
