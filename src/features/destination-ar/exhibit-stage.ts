import { destinationIds, getDestination, type DestinationMedia } from '@/features/destinations/catalog';
import type { Basis, RingEntry, RingSlot } from './scene-geometry';

/** Display media only. This neither creates a chapter nor grants admission. */
export function exhibitGalleryMedia(destinationId: string): readonly DestinationMedia[] {
  if (!destinationIds.some(id => id === destinationId)) return [];
  return getDestination(destinationId)?.media ?? [];
}
export type ExhibitStageProfile = Readonly<{
  destinationId: string;
  galleryId: string;
  media: readonly DestinationMedia[];
}>;
export const danaoStageProfile: ExhibitStageProfile = Object.freeze({
  destinationId: 'D01', galleryId: 'exhibit-gallery-D01',
  media: Object.freeze([...exhibitGalleryMedia('D01')]),
});

/** A suspended composition in the captured basis, never an earth/floor anchor. */
export function buildStageSlots(entries: readonly RingEntry[], basis: Basis): RingSlot[] {
  if (entries.length < 3 || entries.length > 4 || !entries[0]?.id.startsWith('exhibit-gallery-') || new Set(entries.map(item => item.id)).size !== entries.length) throw new Error('Invalid exhibit stage');
  const offsets = entries.length === 4 ? [-0.7, 0, 0.7] : [-0.4, 0.4];
  return entries.map((entry, index) => {
    const x = index === 0 ? 0 : offsets[index - 1];
    const z = index === 0 ? 2.4 : 2.15;
    const angle = Math.atan2(x, z) * 180 / Math.PI;
    return { ...entry, angle: (angle + 360) % 360, scale: index === 0 ? 1 : 0.46,
      position: [basis.right[0] * x + basis.forward[0] * z, index === 0 ? 0.18 : -0.54, basis.right[2] * x + basis.forward[2] * z],
      rotation: [0, ((basis.yaw - angle + 540) % 360) - 180, 0],
    };
  });
}
