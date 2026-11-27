import { bearingDegrees, distanceMeters, relativeHeading, type Coordinate } from '@/features/location/geo';
import type { Place } from '@/features/places/service';
import type { Vector3 } from './types';

export type NearbyCard = Readonly<{ place: Place; distance: number; position: Vector3; rotation: Vector3 }>;
export const nearbyCardDefaults = { radius: 3.2, laneSpacing: 0.48, separation: 15, width: 0.78, height: 0.38 } as const;
type LayoutOptions = { radius: number; laneSpacing: number; separation: number };

export function layoutNearbyCards(places: readonly Place[], origin: Coordinate, preferredId?: string | null, options: LayoutOptions = nearbyCardDefaults): NearbyCard[] {
  const ranked = places.map(place => ({ place, distance: distanceMeters(origin, place.coordinates), bearing: bearingDegrees(origin, place.coordinates) }))
    .filter(item => item.distance >= 1)
    .sort((a, b) => Number(b.place.providerId === preferredId) - Number(a.place.providerId === preferredId) ||
      a.distance - b.distance || a.place.providerId.localeCompare(b.place.providerId));
  const laneHeights = [0, 1, -1, 2, -2].map(lane => lane * options.laneSpacing);
  const used = laneHeights.map(() => [] as number[]);
  return ranked.flatMap(({ place, distance, bearing }) => {
    const lane = used.findIndex(angles => angles.every(other => Math.abs(relativeHeading(bearing, other)) >= options.separation));
    if (lane === -1) return [];
    used[lane].push(bearing);
    const radians = bearing * Math.PI / 180;
    return [{ place, distance, position: [Math.sin(radians) * options.radius, laneHeights[lane], -Math.cos(radians) * options.radius],
      rotation: [0, -bearing, 0] }];
  });
}
