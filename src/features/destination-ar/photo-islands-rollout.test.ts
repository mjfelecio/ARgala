import { expect, it } from 'vitest';
import { destinationIds } from '@/features/destinations/catalog';
import { getExhibitStageProfile, buildDestinationStageSlots } from './exhibit-stage';
import { createPhotoIslandsProfile, exhibitGalleryEntries, exhibitSceneEntries, photoIslandCoverSize, photoIslandStoryY } from './photo-islands';
import { featuredStoryContent } from './featured-story-content';
import { captureBasis } from './scene-geometry';
import { RingController } from './ring-controller';
import content from './featured-presentation-content.json';

const pose = { position: [0, 2, 0] as [number, number, number], forward: [0, 0, -1] as [number, number, number] };
const bayCounts = [3, 2, 3, 3, 3, 3, 2, 3, 3, 0];

it('gives all 54 photographs unique entrances and retains exactly 23 chapters without duplicate padding', () => {
  const allMedia: string[] = []; let chapterCount = 0; const layouts = new Set<string>();
  destinationIds.forEach((id, index) => {
    const front = getExhibitStageProfile(id)!; const profile = createPhotoIslandsProfile(front);
    const chapters = featuredStoryContent(id); const entrances = exhibitGalleryEntries(profile);
    expect(profile.photoIslands).toHaveLength(bayCounts[index]);
    expect(profile.photoIslands!.every(bay => bay.mediaIds.length === 1 || bay.mediaIds.length === 2)).toBe(true);
    if (id !== 'D10') expect(profile.photoIslands!.at(-1)!.mediaIds.length).toBe(profile.media.length === 6 ? 1 : 2);
    expect(entrances.map(entry => entry.mediaId)).toEqual(profile.media.map(media => media.id));
    expect(exhibitSceneEntries(profile, chapters)).toHaveLength(profile.media.length + chapters.length);
    expect(front.photoIslands).toBeUndefined(); expect(profile.theme).toBe(front.theme);
    allMedia.push(...entrances.map(entry => entry.mediaId!)); chapterCount += chapters.length;
    layouts.add(JSON.stringify(buildDestinationStageSlots(profile, exhibitSceneEntries(profile, chapters), captureBasis(pose)!).map(slot => slot.position)));
  });
  expect(allMedia).toHaveLength(54); expect(new Set(allMedia).size).toBe(54);
  expect(chapterCount).toBe(23); expect(layouts.size).toBe(10);
});

it.each(destinationIds)('bounds every %s original photo, clears its stories and retains exact focus/Close scales', id => {
  const profile = createPhotoIslandsProfile(getExhibitStageProfile(id)!);
  const chapters = featuredStoryContent(id); const entries = exhibitSceneEntries(profile, chapters);
  const entrances = exhibitGalleryEntries(profile); const basis = captureBasis(pose)!;
  const slots = buildDestinationStageSlots(profile, entries, basis);
  const controller = new RingController(entries, (items, localBasis) => buildDestinationStageSlots(profile, items, localBasis));
  controller.track('normal'); controller.pose(pose, 1000);
  entrances.forEach((entry, index) => {
    const size = photoIslandCoverSize(profile, entry); const media = content.media.find(item => item.id === entry.mediaId)!;
    expect(size.height).toBeLessThanOrEqual(1.05 + 1e-9);
    expect(size.height / size.width).toBeCloseTo(media.height / media.width);
    expect(slots[index].scale).toBeCloseTo(size.width / 1.25);
    const radius = Math.hypot(slots[index].position[0], slots[index].position[2]);
    expect(2 * Math.atan((size.width + 0.04) / (2 * radius)) * 180 / Math.PI).toBeLessThan(34);
    const focus = controller.select(entry.id, 1000)!;
    expect(focus.to.position).toEqual([0, 2, -2.25]); expect(focus.from.scale).toBeCloseTo(size.width / 1.25);
    controller.complete(focus.token); const close = controller.close(1000)!;
    expect(close.to.scale).toBe(focus.from.scale); expect(close.to.position).toEqual(slots[index].position);
    controller.complete(close.token);
  });
  chapters.forEach((chapter, index) => {
    const slot = slots.find(slot => slot.id === chapter.id)!;
    const bay = profile.photoIslands?.[index];
    if (!bay) { expect(id).toBe('D10'); return; }
    expect(slot.position[1]).toBe(photoIslandStoryY(profile, index));
    for (const mediaId of bay.mediaIds) {
      const entranceIndex = entrances.findIndex(entry => entry.mediaId === mediaId);
      const size = photoIslandCoverSize(profile, entrances[entranceIndex]);
      expect(slot.position[1] + 0.26).toBeLessThanOrEqual(slots[entranceIndex].position[1] - size.height / 2 - 0.16 + 1e-9);
    }
  });
  const turned = buildDestinationStageSlots(profile, entries, captureBasis({ ...pose, forward: [1, 0, 0] })!);
  slots.forEach((slot, i) => { expect(turned[i].position[0]).toBeCloseTo(-slot.position[2]); expect(turned[i].position[2]).toBeCloseTo(slot.position[0]); });
});

it('fits the tall pineapple photograph without removing its content or overlapping the story', () => {
  const profile = createPhotoIslandsProfile(getExhibitStageProfile('D05')!);
  const entry = exhibitGalleryEntries(profile).find(entry => entry.mediaId === 'D05-maps-01')!;
  const size = photoIslandCoverSize(profile, entry);
  expect(size.height).toBeCloseTo(1.05); expect(size.width).toBeLessThan(0.5);
  expect(photoIslandStoryY(profile, 1)).toBeLessThan(-1);
});
