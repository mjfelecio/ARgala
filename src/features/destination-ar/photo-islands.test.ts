import { expect, it } from 'vitest';
import { danaoStageProfile, buildDestinationStageSlots } from './exhibit-stage';
import { createPhotoIslandsProfile, exhibitGalleryEntries, exhibitSceneEntries, isExhibitGalleryEntry } from './photo-islands';
import { previewStoryContent } from './development-featured-media';
import { captureBasis } from './scene-geometry';
import { RingController } from './ring-controller';

const makeProfile = () => createPhotoIslandsProfile(danaoStageProfile, [-95, 35, 150]);
const initial = { position: [0, 2, 0] as [number, number, number], forward: [0, 0, -1] as [number, number, number] };

it('gives every Danao photograph a distinct entrance without creating chapters', () => {
  const profile = makeProfile(); const entries = exhibitGalleryEntries(profile);
  expect(entries).toHaveLength(7);
  expect(entries[0]).toEqual({ id: profile.galleryId }); // Welcome resumes, never resets.
  expect(entries.slice(1).map(entry => entry.mediaId)).toEqual(profile.media.slice(1).map(photo => photo.id));
  expect(new Set(entries.map(entry => entry.id)).size).toBe(7);
  for (const entry of entries) expect(isExhibitGalleryEntry(profile, entry.id)).toBe(true);
  for (const id of ['overview', 'exhibit-gallery-D02', `${profile.galleryId}-unknown`, 'pilot-aclc']) expect(isExhibitGalleryEntry(profile, id)).toBe(false);
  const chapters = previewStoryContent('D01'); const all = exhibitSceneEntries(profile, chapters);
  expect(all).toHaveLength(10);
  expect(all.filter(entry => !isExhibitGalleryEntry(profile, entry.id)).map(entry => entry.id)).toEqual(chapters.map(chapter => chapter.id));
  expect(Object.isFrozen(profile)).toBe(true); expect(Object.isFrozen(profile.photoIslands)).toBe(true);
  expect(profile.media).toBe(danaoStageProfile.media);
  expect(danaoStageProfile.photoIslands).toBeUndefined();
  expect(exhibitGalleryEntries(danaoStageProfile)).toEqual([{ id: danaoStageProfile.galleryId }]);
});

it('places separate photo bays around the captured basis with vertical story clearance', () => {
  const profile = makeProfile(); const entries = exhibitSceneEntries(profile, previewStoryContent('D01'));
  const slots = buildDestinationStageSlots(profile, entries, captureBasis(initial)!);
  expect(slots.map(slot => slot.id)).toEqual(entries.map(entry => entry.id));
  expect(slots[0].position).toEqual([0, 0.18, -2.4]);
  expect(slots.slice(1, 7).map(slot => slot.angle)).toEqual([256, 274, 26, 44, 141, 159]);
  expect(slots.slice(7).map(slot => slot.angle)).toEqual([265, 35, 150]);
  for (const slot of slots.slice(1)) expect(Math.hypot(slot.position[0], slot.position[2])).toBeCloseTo(2.6);
  for (const slot of slots.slice(7)) {
    expect(slot.position[1] + 0.52 / 2).toBeLessThan(0.16 - 0.64 / 2 - 0.05);
    expect(slot.scale).toBeCloseTo(1.08 / 1.25);
  }
  const turned = buildDestinationStageSlots(profile, entries, captureBasis({ ...initial, forward: [1, 0, 0] })!);
  slots.forEach((slot, i) => {
    expect(turned[i].position[0]).toBeCloseTo(-slot.position[2]);
    expect(turned[i].position[2]).toBeCloseTo(slot.position[0]);
  });
  expect(() => buildDestinationStageSlots(profile, entries.slice(1), captureBasis(initial)!)).toThrow();
  expect(() => buildDestinationStageSlots(profile, [entries[0], ...entries.slice(2), entries[1]], captureBasis(initial)!)).toThrow();
});

it('focuses each photo from its own transform and closes back without rotating the captured basis', () => {
  const profile = makeProfile(); const entries = exhibitSceneEntries(profile, previewStoryContent('D01'));
  const controller = new RingController(entries, (items, basis) => buildDestinationStageSlots(profile, items, basis));
  controller.track('normal'); controller.pose(initial, 1000);
  const slots = controller.slots;
  for (const entrance of exhibitGalleryEntries(profile)) {
    const focus = controller.select(entrance.id, 1000)!;
    expect(focus.to.position).toEqual([0, 2, -2.25]);
    const slot = slots.find(slot => slot.id === entrance.id)!;
    expect(focus.from.position).toEqual([slot.position[0], slot.position[1] + 2, slot.position[2]]);
    controller.complete(focus.token);
    const close = controller.close(1000)!;
    // Close is local to the translated ring; focus begins in world coordinates.
    expect(close.to.position.map((value, index) => value + close.origin[index])).toEqual(focus.from.position);
    expect(close.to.scale).toEqual(focus.from.scale);
    controller.complete(close.token); expect(controller.slots).toBe(slots);
  }
});

it('rejects bay configurations that cannot map to the approved photographs and chapters', () => {
  expect(() => createPhotoIslandsProfile(danaoStageProfile, [-95, 35])).toThrow();
  expect(() => createPhotoIslandsProfile(danaoStageProfile, [-95, NaN, 150])).toThrow();
  expect(() => createPhotoIslandsProfile(danaoStageProfile, [-95, -95, 150])).toThrow();
});
