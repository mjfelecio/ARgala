import { matchedFeaturedDestination } from '@/features/destinations/map-selection';
import type { FeaturedDestinationId } from '@/features/destinations/catalog';
import type { Bookmark } from './model';

/** Existing Google IDs remain intact; an explicit removal handles all saved aliases together. */
export function featuredBookmarkAliases(destinationId: FeaturedDestinationId, bookmarks: readonly Bookmark[]): Bookmark[] {
  return bookmarks.filter(reference => reference.kind === 'google' && matchedFeaturedDestination({ provider: 'google', providerId: reference.id })?.id === destinationId);
}
