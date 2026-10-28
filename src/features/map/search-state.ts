import { DISCOVERY } from '@/config/limits';
import { distanceMeters, isCoordinate } from '@/features/location/geo';
export type SearchRegion = { latitude: number; longitude: number; latitudeDelta: number; longitudeDelta: number };
/** Settled viewport extent only; this never establishes device position or AR eligibility. */
export function areaFromRegion(region: SearchRegion) {
  if (!isCoordinate(region) || !Number.isFinite(region.latitudeDelta) || !Number.isFinite(region.longitudeDelta) ||
    region.latitudeDelta <= 0 || region.longitudeDelta <= 0 || region.latitudeDelta > 180 || region.longitudeDelta > 360) return null;
  const center = { latitude: region.latitude, longitude: region.longitude };
  const corners = [-1, 1].flatMap(lat => [-1, 1].map(lon => ({
    latitude: Math.max(-90, Math.min(90, center.latitude + lat * region.latitudeDelta / 2)),
    longitude: ((center.longitude + lon * region.longitudeDelta / 2 + 540) % 360) - 180,
  })));
  return { center, radiusMeters: Math.max(1, Math.min(DISCOVERY.maxRadiusMeters, Math.max(...corners.map(corner => distanceMeters(center, corner))))) };
}
