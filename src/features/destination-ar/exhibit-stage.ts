import { destinationIds, getDestination, type DestinationId, type DestinationMedia } from '@/features/destinations/catalog';
import type { Basis, RingEntry, RingSlot } from './scene-geometry';
import { buildPhotoIslandSlots } from './photo-islands';

/** Display media only. This neither creates a chapter nor grants admission. */
export function exhibitGalleryMedia(destinationId: string): readonly DestinationMedia[] {
  if (!destinationIds.some(id => id === destinationId)) return [];
  return getDestination(destinationId)?.media ?? [];
}
export type ExhibitStageProfile = Readonly<{
  destinationId: DestinationId;
  galleryId: string;
  media: readonly DestinationMedia[];
  theme: 'shoreline' | 'fern' | 'basin' | 'roots' | 'fields' | 'fairway' | 'ridges' | 'garden' | 'coast';
  gallery: readonly [x: number, y: number, forward: number];
  stations: readonly (readonly [x: number, y: number, forward: number])[];
  photoIslands?: readonly Readonly<{ angle: number; mediaIds: readonly [string, string] }>[];
}>;

function profile(destinationId: DestinationId, theme: ExhibitStageProfile['theme'], gallery: ExhibitStageProfile['gallery'], stations: ExhibitStageProfile['stations']): ExhibitStageProfile {
  return Object.freeze({ destinationId, theme, galleryId: `exhibit-gallery-${destinationId}`,
    media: Object.freeze([...exhibitGalleryMedia(destinationId)]), gallery: Object.freeze(gallery),
    stations: Object.freeze(stations.map(point => Object.freeze(point))),
  });
}
// Shapes complement the supplied stories; coordinates are symbolic display
// composition only, never destination geography or geographic admission.
const stages: Readonly<Record<DestinationId, ExhibitStageProfile>> = Object.freeze({
  D01: profile('D01', 'shoreline', [0, 0.18, 2.4], [[-0.7, -0.54, 2.15], [0, -0.54, 2.15], [0.7, -0.54, 2.15]]),
  D02: profile('D02', 'fern', [0, 0.22, 2.4], [[-0.42, -0.56, 2.22], [0.42, -0.56, 2.22]]),
  D03: profile('D03', 'basin', [0, 0.24, 2.45], [[-0.44, -0.58, 2.12], [0.44, -0.58, 2.12]]),
  D04: profile('D04', 'roots', [0.06, 0.2, 2.4], [[-0.5, -0.58, 2.18], [0.5, -0.52, 2.25]]),
  D05: profile('D05', 'fields', [0, 0.25, 2.45], [[-0.72, -0.6, 2.23], [0, -0.54, 2.17], [0.72, -0.6, 2.23]]),
  D06: profile('D06', 'fairway', [-0.04, 0.2, 2.4], [[-0.46, -0.55, 2.16], [0.46, -0.6, 2.27]]),
  D07: profile('D07', 'ridges', [0.04, 0.26, 2.45], [[-0.44, -0.68, 2.27], [0.44, -0.5, 2.14]]),
  D08: profile('D08', 'garden', [0, 0.23, 2.4], [[-0.46, -0.6, 2.2], [0.46, -0.6, 2.2]]),
  D09: profile('D09', 'coast', [0, 0.19, 2.4], [[-0.45, -0.57, 2.18], [0.45, -0.57, 2.18]]),
});
export const danaoStageProfile = stages.D01;
export function getExhibitStageProfile(destinationId: string): ExhibitStageProfile | null {
  return destinationIds.some(id => id === destinationId) ? stages[destinationId as DestinationId] : null;
}

/** A suspended composition in the captured basis, never an earth/floor anchor. */
export function buildStageSlots(entries: readonly RingEntry[], basis: Basis): RingSlot[] {
  return buildDestinationStageSlots(danaoStageProfile, entries, basis);
}
export function buildDestinationStageSlots(stage: ExhibitStageProfile, entries: readonly RingEntry[], basis: Basis): RingSlot[] {
  if (stage.photoIslands) return buildPhotoIslandSlots(stage, entries, basis);
  if (entries.length !== stage.stations.length + 1 || entries[0]?.id !== stage.galleryId || new Set(entries.map(item => item.id)).size !== entries.length) throw new Error('Invalid exhibit stage');
  return entries.map((entry, index) => {
    const [x, y, z] = index === 0 ? stage.gallery : stage.stations[index - 1];
    const angle = Math.atan2(x, z) * 180 / Math.PI;
    return { ...entry, angle: (angle + 360) % 360, scale: index === 0 ? 1 : 0.46,
      position: [basis.right[0] * x + basis.forward[0] * z, y, basis.right[2] * x + basis.forward[2] * z],
      rotation: [0, ((basis.yaw - angle + 540) % 360) - 180, 0],
    };
  });
}
