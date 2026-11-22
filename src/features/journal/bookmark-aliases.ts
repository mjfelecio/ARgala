import { matchedFeaturedDestination } from '@/features/destinations/map-selection';
import { getDestination, type FeaturedDestinationId } from '@/features/destinations/catalog';
import type { Bookmark } from './model';

// Resolve old ACLC references at the bookmark UI boundary. The journal still
// stores original reference IDs and records the pilot and D10 stamps separately.
const featuredBookmarkDestinationId = (id: FeaturedDestinationId) => id === 'pilot-aclc' ? 'D10' : id;

export function destinationForBookmark(reference: Bookmark) {
  return reference.kind === 'featured'
    ? getDestination(featuredBookmarkDestinationId(reference.id))
    : matchedFeaturedDestination({ provider: 'google', providerId: reference.id });
}

export function featuredBookmarkAliases(destinationId: FeaturedDestinationId, bookmarks: readonly Bookmark[]): Bookmark[] {
  const displayedId = featuredBookmarkDestinationId(destinationId);
  return bookmarks.filter(reference => (reference.kind !== 'featured' || reference.id !== destinationId)
    && destinationForBookmark(reference)?.id === displayedId);
}
