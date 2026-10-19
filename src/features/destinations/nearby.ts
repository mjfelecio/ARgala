import { DESTINATIONS } from '@/config/limits';
import { distanceMeters, isCoordinate } from '@/features/location/geo';
import { placesService } from '@/features/places/service';
import type { Language } from '../../../supabase/functions/_shared/contracts';

export const DESTINATION_NEARBY_RADIUS_METERS = DESTINATIONS.nearbyRadiusMeters;
export function withinDestinationRadius(center: unknown, item: unknown): boolean {
  return isCoordinate(center) && isCoordinate(item) && distanceMeters(center, item) <= DESTINATION_NEARBY_RADIUS_METERS;
}
/** Only call from an explicit user action, after checking a catalog center's approval. */
export async function searchDestinationNearby(center: unknown, language: Language) {
  if (!isCoordinate(center)) throw new RangeError('Invalid destination center');
  return placesService.nearby({ center, radiusMeters: DESTINATION_NEARBY_RADIUS_METERS, language });
}
