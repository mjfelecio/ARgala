import { arGeofenceSchema } from './ar-geofences';
import { destinationSchema, getDestination } from './catalog';

// Synthetic test data at the equator, unrelated to catalog centers and entrances.
export const syntheticArrivalPoint = { latitude: 0, longitude: 0 };
export const syntheticGeofence = arGeofenceSchema.parse({
  geometryVersion: 'test-1',
  sourceReference: 'Synthetic test survey',
  approvalReference: 'Synthetic test approval',
  geometry: { type: 'Polygon', coordinates: [[[-0.0002, -0.0002], [0.0002, -0.0002], [0.0002, 0.0002], [-0.0002, 0.0002], [-0.0002, -0.0002]]] },
});
export const syntheticFeaturedGeofence = (id: string) => id === 'D01' ? syntheticGeofence : null;

export function syntheticApprovedDestination() {
  const destination = getDestination('D01')!;
  const text = { value: 'Synthetic approved content', approvalReference: 'Synthetic editorial approval' };
  const translated = { en: text, ja: text, ko: text };
  const media = destination.media!.slice(0, 3).map(photo => ({
    ...photo, alt: translated, caption: translated, offlineRightsReference: 'Synthetic offline permission',
  }));
  return destinationSchema.parse({ ...destination, media, ar: {
    schemaVersion: 1, contentVersion: 'test-1',
    storyApproval: {
      contentVersion: 'test-1', approvalReference: 'Synthetic editorial approval', reviewer: 'Test',
      reviewedAt: '2026-11-18', primaryChapterIds: ['overview'],
    },
    tiles: [{ id: 'overview', role: 'overview', title: translated, body: translated, mediaIds: media.slice(0, 2).map(photo => photo.id) }],
  } });
}
