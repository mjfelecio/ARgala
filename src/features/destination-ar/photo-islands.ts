import type { ExhibitStageProfile } from './exhibit-stage';
import type { Basis, RingEntry, RingSlot } from './scene-geometry';

export type ExhibitGalleryEntrance = Readonly<{ id: string; mediaId?: string }>;
export const photoIslandMetrics = Object.freeze({
  radius: 2.6, halfAngle: 9, photoWidth: 0.82, photoHeight: 0.64,
  storyWidth: 1.08, storyHeight: 0.52, storyY: -0.62,
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

/** Each entrance is a real native focus/Close target in the captured frame. */
export function buildPhotoIslandSlots(profile: ExhibitStageProfile, entries: readonly RingEntry[], basis: Basis): RingSlot[] {
  const bays = profile.photoIslands; const gallery = exhibitGalleryEntries(profile);
  if (!bays || entries.length !== gallery.length + bays.length || new Set(entries.map(entry => entry.id)).size !== entries.length
    || gallery.some((entry, index) => entries[index]?.id !== entry.id)) throw new Error('Invalid photo island entries');
  return entries.map((entry, index) => {
    let x: number, y: number, z: number, angle: number, scale: number;
    if (index === 0) {
      [x, y, z] = profile.gallery; angle = Math.atan2(x, z) * 180 / Math.PI; scale = 1;
    } else {
      const photo = index < gallery.length;
      const localIndex = photo ? index - 1 : index - gallery.length;
      const bay = bays[photo ? Math.floor(localIndex / 2) : localIndex];
      const side = localIndex % 2;
      angle = bay.angle + (photo ? (side ? 1 : -1) * photoIslandMetrics.halfAngle : 0);
      const radians = angle * Math.PI / 180;
      x = Math.sin(radians) * photoIslandMetrics.radius;
      z = Math.cos(radians) * photoIslandMetrics.radius;
      y = photo ? side ? 0.16 : 0.32 : photoIslandMetrics.storyY;
      scale = (photo ? photoIslandMetrics.photoWidth : photoIslandMetrics.storyWidth) / 1.25;
    }
    return { ...entry, angle: normalized(angle), scale,
      position: [basis.right[0] * x + basis.forward[0] * z, y, basis.right[2] * x + basis.forward[2] * z],
      rotation: [0, ((basis.yaw - angle + 540) % 360 + 360) % 360 - 180, 0],
    };
  });
}
