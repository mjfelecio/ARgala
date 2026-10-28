import type { Place } from '@/features/places/service';
import { destinationName, destinationSchema, getDestination, type Destination, type FeaturedDestinationId } from './catalog';

/** A center is never an accessible entrance by implication. */
export function destinationToRoutePlace(destination: Destination): Place | null {
  const parsed = destinationSchema.safeParse(destination);
  if (!parsed.success || !parsed.data.routeEntrance || !parsed.data.routeEntranceApprovalReference) return null;
  const approved = parsed.data;
  return { id: `destination:${approved.id}`, providerId: `curated_${approved.id}`, provider: 'curated', source: 'curated',
    name: destinationName(approved), coordinates: approved.routeEntrance!, attributions: [] };
}
/** Match both internal namespaces; a similarly named Google ID is still Google. */
export function destinationIdForRoutePlace(place: Place | undefined): FeaturedDestinationId | null {
  if (!place || place.provider !== 'curated' || place.source !== 'curated' || !place.id.startsWith('destination:')) return null;
  const destination = getDestination(place.id.slice('destination:'.length));
  return destination && place.providerId === `curated_${destination.id}` ? destination.id : null;
}
