import type { ExhibitStageProfile } from './exhibit-stage';
import type { Basis, RingEntry, RingSlot } from './scene-geometry';
import presentationContent from './featured-presentation-content.json';
import { EXHIBIT_HISTORY_ID, EXHIBIT_VISIT_PLAN_ID } from './exhibit-visitor-content';
import type { DestinationId } from '@/features/destinations/catalog';

export type ExhibitGalleryEntrance = Readonly<{ id: string; mediaId?: string }>;
export const photoIslandMetrics = Object.freeze({
  welcomeWidth: 1.2, welcomeRadius: 2.1, welcomeY: 0.18,
  primary: Object.freeze({ width: 1.18, radius: 2.1, angle: -16, y: 0.22 }),
  secondary: Object.freeze({ width: 1.02, radius: 2.2, angle: 18, y: -0.1 }),
  storyWidth: 1.08, storyHeight: 0.52, storyY: -0.88, storyRadius: 2.45,
  maxPhotoHeight: 1.05, storyClearance: 0.16,
});
const normalized = (angle: number) => ((angle % 360) + 360) % 360;
const destinationAngles: Readonly<Record<DestinationId, readonly number[]>> = Object.freeze({
  D01: Object.freeze([-95, 65, 165]), D02: Object.freeze([-85, 95]),
  D03: Object.freeze([-105, 70, 170]), D04: Object.freeze([-90, 75, 170]),
  D05: Object.freeze([-100, 65, 165]), D06: Object.freeze([-85, 80, 175]),
  D07: Object.freeze([-100, 100]), D08: Object.freeze([-95, 70, 165]),
  D09: Object.freeze([-90, 80, 175]),
});

/** Immutable display configuration; never destination geography or progress. */
export function createPhotoIslandsProfile(front: ExhibitStageProfile, angles: readonly number[] = destinationAngles[front.destinationId]): ExhibitStageProfile {
  const bayCount = Math.ceil((front.media.length - 1) / 2);
  if (front.media.length < 2 || angles.length !== bayCount || bayCount < front.stations.length || angles.some(angle => !Number.isFinite(angle))
    || new Set(angles.map(normalized)).size !== angles.length) throw new Error('Invalid photo islands');
  return Object.freeze({ ...front, photoIslands: Object.freeze(angles.map((angle, index) => {
    const first = front.media[1 + index * 2].id; const second = front.media[2 + index * 2]?.id;
    return Object.freeze({ angle, mediaIds: second ? Object.freeze([first, second] as const) : Object.freeze([first] as const) });
  })) });
}

/** A real entry exposes only media bound to its already authorized chapters.
 * Empty authorization stays story-only; it never falls back to the showcase. */
export function restrictPhotoIslandsProfile(profile: ExhibitStageProfile, allowedMediaIds: readonly string[]): ExhibitStageProfile {
  const allowed = new Set(allowedMediaIds);
  const media = Object.freeze(profile.media.filter(photo => allowed.has(photo.id)));
  const count = Math.max(0, Math.ceil((media.length - 1) / 2));
  const photoIslands = Object.freeze(destinationAngles[profile.destinationId].slice(0, count).map((angle, index) => {
    const first = media[1 + index * 2].id; const second = media[2 + index * 2]?.id;
    return Object.freeze({ angle, mediaIds: second ? Object.freeze([first, second] as const) : Object.freeze([first] as const) });
  }));
  return Object.freeze({ ...profile, media, photoIslands });
}

export function exhibitGalleryEntries(profile: ExhibitStageProfile): readonly ExhibitGalleryEntrance[] {
  if (!profile.media.length) return [];
  return [{ id: profile.galleryId, ...(profile.photoIslands ? { mediaId: profile.media[0].id } : {}) }, ...(profile.photoIslands ?? []).flatMap(bay => bay.mediaIds.map(mediaId => ({ id: `${profile.galleryId}-photo-${mediaId}`, mediaId })))];
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
  const nominalWidth = index === 0 ? photoIslandMetrics.welcomeWidth : index % 2 ? photoIslandMetrics.primary.width : photoIslandMetrics.secondary.width;
  const width = Math.min(nominalWidth, photoIslandMetrics.maxPhotoHeight * media.width / media.height);
  return { width, height: width * media.height / media.width };
}

/** Portrait originals keep their full image and push optional stories down. */
export function photoIslandStoryY(profile: ExhibitStageProfile, bayIndex: number): number {
  const bay = profile.photoIslands?.[bayIndex];
  if (!bay) throw new Error('Invalid photo island bay');
  const entrances = exhibitGalleryEntries(profile);
  const bottom = Math.min(...bay.mediaIds.map((id, side) => {
    const entry = entrances.find(entry => entry.mediaId === id)!;
    const size = photoIslandCoverSize(profile, entry);
    const composition = side ? photoIslandMetrics.secondary : photoIslandMetrics.primary;
    return composition.y - size.height / 2;
  }));
  return Math.min(photoIslandMetrics.storyY, bottom - photoIslandMetrics.storyClearance - photoIslandMetrics.storyHeight / 2);
}

// Utility covers flank the welcome photo below its image, inside the gap
// between the first story bays. Their slots are independent of story count.
const utilityAngles = new Map([
  [EXHIBIT_VISIT_PLAN_ID, -28],
  [EXHIBIT_HISTORY_ID, 28],
]);

/** Each entrance is a real native focus/Close target in the captured frame. */
export function buildPhotoIslandSlots(profile: ExhibitStageProfile, entries: readonly RingEntry[], basis: Basis): RingSlot[] {
  const bays = profile.photoIslands; const gallery = exhibitGalleryEntries(profile);
  const chapters = entries.slice(gallery.length).filter(entry => !utilityAngles.has(entry.id));
  if (!bays || entries.length < gallery.length || chapters.length > 12 || new Set(entries.map(entry => entry.id)).size !== entries.length
    || gallery.some((entry, index) => entries[index]?.id !== entry.id)) throw new Error('Invalid photo island entries');
  const storyAngles = destinationAngles[profile.destinationId];
  // Preserve the accepted gallery and first story bays exactly. Additional
  // authorized chapters use a separate lower ring, clear of those controls.
  const overflowY = Math.min(photoIslandMetrics.storyY, ...bays.map((_, index) => photoIslandStoryY(profile, index)))
    - photoIslandMetrics.storyHeight - photoIslandMetrics.storyClearance;
  let chapterIndex = 0;
  return entries.map((entry, index) => {
    const utilityAngle = utilityAngles.get(entry.id);
    let y: number, angle: number, scale: number, radius: number;
    if (index === 0 && gallery.length) {
      y = photoIslandMetrics.welcomeY;
      radius = photoIslandMetrics.welcomeRadius;
      angle = 0;
      scale = photoIslandCoverSize(profile, gallery[0]).width / 1.25;
    } else if (utilityAngle !== undefined) {
      y = photoIslandMetrics.storyY;
      radius = photoIslandMetrics.storyRadius;
      angle = utilityAngle;
      scale = photoIslandMetrics.storyWidth / 1.25;
    } else {
      const photo = index < gallery.length;
      const localIndex = photo ? index - 1 : chapterIndex++;
      const mediaId = gallery[index]?.mediaId;
      const bayIndex = photo ? bays.findIndex(bay => bay.mediaIds.some(id => id === mediaId)) : localIndex;
      const bay = bays[bayIndex];
      const secondary = photo && bay.mediaIds[1] === mediaId;
      const composition = secondary ? photoIslandMetrics.secondary : photoIslandMetrics.primary;
      const overflow = !photo && localIndex >= storyAngles.length;
      angle = overflow ? (localIndex - storyAngles.length) * 360 / (12 - storyAngles.length)
        : (bay?.angle ?? storyAngles[localIndex]) + (photo ? composition.angle : 0);
      radius = photo ? composition.radius : photoIslandMetrics.storyRadius;
      y = photo ? composition.y : overflow ? overflowY : bay ? photoIslandStoryY(profile, bayIndex) : photoIslandMetrics.storyY;
      scale = (photo ? photoIslandCoverSize(profile, gallery[index]).width : photoIslandMetrics.storyWidth) / 1.25;
    }
    const radians = angle * Math.PI / 180;
    const x = Math.sin(radians) * radius;
    const z = Math.cos(radians) * radius;
    return { ...entry, angle: normalized(angle), scale,
      position: [basis.right[0] * x + basis.forward[0] * z, y, basis.right[2] * x + basis.forward[2] * z],
      rotation: [0, ((basis.yaw - angle + 540) % 360 + 360) % 360 - 180, 0],
    };
  });
}
