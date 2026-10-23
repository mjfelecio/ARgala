import { AR } from '@/config/limits';
import { bearingDegrees, distanceMeters, relativeHeading, type Coordinate } from '@/features/location/geo';
import type { Place } from '@/features/places/service';

/** Normalized horizontal position; null means outside the approximate camera view. */
export function projectBearing(bearing: number, heading: number | null, fov: number = AR.horizontalFovDegrees): number | null {
  if (heading === null || !Number.isFinite(heading) || heading < 0 || heading > 360 ||
      !Number.isFinite(bearing) || !Number.isFinite(fov) || fov <= 0 || fov >= 180) return null;
  const relative = relativeHeading(bearing, heading);
  return Math.abs(relative) <= fov / 2 ? 0.5 + relative / fov : null;
}
export type RankedPlace = { place: Place; distance: number; bearing: number; x: number | null; eligible: boolean };
export function rankPlaces(places: Place[], origin: Coordinate, heading: number | null, radius: number): RankedPlace[] {
  return places.map((place) => {
    const distance = distanceMeters(origin, place.coordinates);
    const bearing = bearingDegrees(origin, place.coordinates);
    return { place, distance, bearing, x: projectBearing(bearing, heading), eligible: distance <= radius };
  }).sort((a, b) => a.distance - b.distance || a.place.providerId.localeCompare(b.place.providerId));
}
/** Manual selection wins even when it leaves the FOV or activation radius. */
export function selectedPlaceId(places: RankedPlace[], manualId: string | null): string | null {
  return places.find((p) => p.place.providerId === manualId)?.place.providerId ??
    places.find((p) => p.eligible)?.place.providerId ?? null;
}
export type OverlayLabel = RankedPlace & { left: number; maxLeft: number; width: number; lane: number };
/** One label per vertical lane prevents overlap, including clustered bearings. */
export function layoutLabels(places: RankedPlace[], viewportWidth: number, selectedId: string | null): OverlayLabel[] {
  if (!Number.isFinite(viewportWidth) || viewportWidth < 2 * AR.labelGap + 48) return [];
  const width = Math.min(AR.labelWidth, viewportWidth - 2 * AR.labelGap);
  return places.filter((p) => p.x !== null).sort((a, b) =>
    Number(b.place.providerId === selectedId) - Number(a.place.providerId === selectedId) ||
    // Distance dominates, with a small center preference for similarly distant POIs.
    (a.distance + Math.abs(a.x! - 0.5) * 40) - (b.distance + Math.abs(b.x! - 0.5) * 40) ||
    a.place.providerId.localeCompare(b.place.providerId))
    .slice(0, AR.maxLabels).map((p, lane) => ({ ...p, lane, width, maxLeft: viewportWidth - width - AR.labelGap,
      left: Math.max(AR.labelGap, Math.min(viewportWidth - width - AR.labelGap, p.x! * viewportWidth - width / 2)) }));
}
