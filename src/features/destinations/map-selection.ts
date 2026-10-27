import type { QueryClient } from '@tanstack/react-query';
import { AR } from '@/config/limits';
import type { Place } from '@/features/places/service';
import { destinationName, getDestination, listFeaturedDestinations, type Destination, type FeaturedDestinationId } from './catalog';
const prefix = ['featured-selection'] as const;
export function setFeaturedSelection(client: QueryClient, destinationId: FeaturedDestinationId) {
  if (!getDestination(destinationId)) return;
  client.setQueryDefaults(prefix, { gcTime: AR.nearbyReuseMs });
  client.setQueryData([...prefix, destinationId], { destinationId });
}
export const featuredSelectionOptions = (destinationId: FeaturedDestinationId | null) => ({
  queryKey: [...prefix, destinationId], enabled: false, gcTime: AR.nearbyReuseMs,
  queryFn: async (): Promise<{ destinationId: FeaturedDestinationId } | null> => null,
});
/** Essential curated basics only: provider rich copy cannot leak through this sheet. */
export function featuredMapPlace(destination: Destination): Place | null {
  if (!destination.center || !destination.centerApprovalReference) return null;
  return { id: `destination:${destination.id}`, providerId: `curated_${destination.id}`, provider: 'curated', source: 'curated',
    name: destinationName(destination), coordinates: destination.center, attributions: [] };
}
export function matchedFeaturedDestination(place: Pick<Place, 'provider' | 'providerId'>, destinations: readonly Destination[] = listFeaturedDestinations()) {
  if (place.provider !== 'google') return null;
  const matches = destinations.filter(destination => destination.ar?.providerAssociation?.providerId === place.providerId);
  return matches.length === 1 ? matches[0] : null;
}
