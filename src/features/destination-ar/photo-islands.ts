import type { ExhibitStageProfile } from './exhibit-stage';
import type { Basis, RingEntry, RingSlot } from './scene-geometry';
import presentationContent from './featured-presentation-content.json';

export type ExhibitGalleryEntrance = Readonly<{ id: string; mediaId?: string }>;
export const photoIslandMetrics = Object.freeze({
  welcomeWidth: 1.2, welcomeRadius: 2.1, welcomeY: 0.18,
  primary: Object.freeze({ width: 1.18, radius: 2.1, angle: -16, y: 0.22 }),
  secondary: Object.freeze({ width: 1.02, radius: 2.2, angle: 18, y: -0.1 }),
  storyWidth: 1.08, storyHeight: 0.52, storyY: -0.88, storyRadius: 2.45,
});
const normalized = (angle: number) => ((angle % 360) + 360) % 360;

/** Immutable display configuration; never destination geography or progress. */
export function createPhotoIslandsProfile(front: ExhibitStageProfile, angles: readonly number[]): ExhibitStageProfile {
  if (angles.length !== front.stations.length || angles.some(angle => !Number.isFinite(angle))
    || new Set(angles.map(normalized)).size !== angles.length || front.media.length < 1 + angles.length * 2) throw new Error('Invalid photo islands');
  return Object.freeze({ ...front, photoIslands: Object.freeze(angles.map((angle, index) => Object.freeze({ angle,
    mediaIds: Object.freeze([front.media[1 + index * 2].id, front.media[2 + index * 2].id] as [string, string]),
  }))) });
}

export function exhibitGalleryEntries(profile: ExhibitStageProfile): readonly ExhibitGalleryEntrance[] {
  return [{ id: profile.galleryId }, ...(profile.photoIslands ?? []).flatMap(bay => bay.mediaIds.map(mediaId => ({ id: `${profile.galleryId}-photo-${mediaId}`, mediaId })))];
}
export function isExhibitGalleryEntry(profile: ExhibitStageProfile, id: string): boolean {
  return exhibitGalleryEntries(profile).some(entry => entry.id === id);
}
export function exhibitSceneEntries(profile: ExhibitStageProfile, chapters: readonly RingEntry[]): RingEntry[] {
  return [...exhibitGalleryEntries(profile).map(({ id }) => ({ id })), ...chapters];
}

/** Share real photo proportions between the visible image and its focus slot.
 * Bundled editorial dimensions require no image probing or native API work. */
export function photoIslandCoverSize(profile: ExhibitStageProfile, entry: ExhibitGalleryEntrance): Readonly<{ width: number; height: number }> {
  const index = exhibitGalleryEntries(profile).findIndex(item => item.id === entry.id);
  const mediaId = index === 0 ? profile.media[0].id : entry.mediaId;
  const media = presentationContent.media.find(photo => photo.id === mediaId);
  if (index < 0 || !media) throw new Error('Invalid photo island cover');
  const width = index === 0 ? photoIslandMetrics.welcomeWidth : index % 2 ? photoIslandMetrics.primary.width : photoIslandMetrics.secondary.width;
  return { width, height: width * media.height / media.width };
}

/** Each entrance is a real native focus/Close target in the captured frame. */
export function buildPhotoIslandSlots(profile: ExhibitStageProfile, entries: readonly RingEntry[], basis: Basis): RingSlot[] {
  const bays = profile.photoIslands; const gallery = exhibitGalleryEntries(profile);
  if (!bays || entries.length !== gallery.length + bays.length || new Set(entries.map(entry => entry.id)).size !== entries.length
    || gallery.some((entry, index) => entries[index]?.id !== entry.id)) throw new Error('Invalid photo island entries');
  return entries.map((entry, index) => {
    let x: number, y: number, z: number, angle: number, scale: number;
    if (index === 0) {
      x = 0; y = photoIslandMetrics.welcomeY; z = photoIslandMetrics.welcomeRadius; angle = 0;
      scale = photoIslandMetrics.welcomeWidth / 1.25;
    } else {
      const photo = index < gallery.length;
      const localIndex = photo ? index - 1 : index - gallery.length;
      const bay = bays[photo ? Math.floor(localIndex / 2) : localIndex];
      const composition = localIndex % 2 ? photoIslandMetrics.secondary : photoIslandMetrics.primary;
      angle = bay.angle + (photo ? composition.angle : 0);
      const radians = angle * Math.PI / 180;
      const radius = photo ? composition.radius : photoIslandMetrics.storyRadius;
      x = Math.sin(radians) * radius;
      z = Math.cos(radians) * radius;
      y = photo ? composition.y : photoIslandMetrics.storyY;
      scale = (photo ? photoIslandCoverSize(profile, gallery[index]).width : photoIslandMetrics.storyWidth) / 1.25;
    }
    return { ...entry, angle: normalized(angle), scale,
      position: [basis.right[0] * x + basis.forward[0] * z, y, basis.right[2] * x + basis.forward[2] * z],
      rotation: [0, ((basis.yaw - angle + 540) % 360 + 360) % 360 - 180, 0],
    };
  });
}
