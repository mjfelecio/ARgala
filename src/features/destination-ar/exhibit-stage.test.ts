import { expect, it } from 'vitest';
import { destinationIds, getDestination } from '@/features/destinations/catalog';
import { exhibitGalleryMedia, danaoStageProfile, buildStageSlots } from './exhibit-stage';
import { captureBasis } from './scene-geometry';
import { previewStoryContent } from './development-featured-media';
import { RingController } from './ring-controller';

it('offers all 53 original photographs in destination order without creating chapters', () => {
  const all = destinationIds.flatMap(id => {
    const media = exhibitGalleryMedia(id);
    expect(media.map(photo => photo.id)).toEqual(getDestination(id)!.media!.map(photo => photo.id));
    expect(media[0].id).toBe(getDestination(id)!.coverMediaId);
    return media;
  });
  expect(all).toHaveLength(53);
  expect(new Set(all.map(photo => photo.id)).size).toBe(53);
  expect(destinationIds.flatMap(previewStoryContent)).toHaveLength(20);
  expect(exhibitGalleryMedia('pilot-aclc')).toEqual([]);
  expect(exhibitGalleryMedia('foreign')).toEqual([]);
  expect(danaoStageProfile.media).toHaveLength(7);
  expect(Object.isFrozen(danaoStageProfile)).toBe(true);
  expect(Object.isFrozen(danaoStageProfile.media)).toBe(true);
});

it('separates gallery and story stations in the captured basis, retaining 2.25-unit focus', () => {
  const pose = { position: [0, 2, 0] as [number, number, number], forward: [0, 0, -1] as [number, number, number] };
  const entries = [{ id: danaoStageProfile.galleryId }, ...previewStoryContent('D01')];
  const slots = buildStageSlots(entries, captureBasis(pose)!);
  expect(slots.map(slot => slot.id)).toEqual(entries.map(entry => entry.id));
  expect(slots[0].position).toEqual([0, 0.18, -2.4]);
  expect(slots.slice(1).map(slot => slot.position)).toEqual([[-0.7, -0.54, -2.15], [0, -0.54, -2.15], [0.7, -0.54, -2.15]]);
  const controller = new RingController(entries, buildStageSlots);
  controller.track('normal'); controller.pose(pose, 1000);
  const focus = controller.select(danaoStageProfile.galleryId, 1000)!;
  expect(focus.to.position).toEqual([0, 2, -2.25]);
  expect(focus.from.scale).toBe(1);
  controller.complete(focus.token);
  expect(controller.close(1000)?.to.scale).toBe(1);
  const turned = buildStageSlots(entries, captureBasis({ ...pose, forward: [1, 0, 0] })!);
  expect(turned[0].position).toEqual([2.4, 0.18, 0]);
  expect(turned[1].position[2]).toBeCloseTo(-0.7);
});
