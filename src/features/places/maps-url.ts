import { isCoordinate, type Coordinate } from '@/features/location/geo';

/** A provider handoff requires no details lookup; internal curated IDs never leave the app. */
export function googleMapsPlaceUrl({ providerId, name, coordinates }: { providerId?: string; name: string; coordinates?: Coordinate }): string {
  const googleId = providerId && !providerId.startsWith('curated_') ? providerId : undefined;
  const query = !googleId && isCoordinate(coordinates) ? `${coordinates.latitude},${coordinates.longitude}` : name.trim() || googleId || '';
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}${googleId ? `&query_place_id=${encodeURIComponent(googleId)}` : ''}`;
}
