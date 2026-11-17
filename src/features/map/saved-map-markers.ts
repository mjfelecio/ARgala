import { distanceMeters } from '@/features/location/geo';
import { validBookmarkPin, type BookmarkMetadataMap } from '@/features/journal/bookmark-metadata';
import { bookmarkKey, type Bookmark } from '@/features/journal/model';
import { matchedFeaturedDestination } from '@/features/destinations/map-selection';
import type { SearchRegion } from './search-state';

/** Viewport-only display work; no location or provider-request authority. */
export function savedMapMarkers(bookmarks: readonly Bookmark[], metadata: BookmarkMetadataMap, now: number, region: SearchRegion | null) {
  const candidates = bookmarks.flatMap(reference => {
    if (reference.kind !== 'google' || matchedFeaturedDestination({ provider: 'google', providerId: reference.id })) return [];
    const item = metadata[bookmarkKey(reference)]; const pin = validBookmarkPin(item, now);
    if (!pin) return [];
    if (region) {
      const longitudeDelta = Math.abs(((pin.coordinates.longitude - region.longitude + 540) % 360) - 180);
      if (Math.abs(pin.coordinates.latitude - region.latitude) > region.latitudeDelta * 0.6 || longitudeDelta > region.longitudeDelta * 0.6) return [];
    }
    return [{ reference, name: item?.label, pin }];
  });
  if (region) candidates.sort((a, b) => distanceMeters(region, a.pin.coordinates) - distanceMeters(region, b.pin.coordinates) || a.reference.id.localeCompare(b.reference.id));
  return { items: candidates.slice(0, 100), truncated: candidates.length > 100 };
}
