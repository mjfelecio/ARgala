import { expect, it } from 'vitest';
import { destinationIds, getDestination } from '@/features/destinations/catalog';
import { exhibitGalleryMedia, danaoStageProfile } from './exhibit-stage';
import { featuredStoryContent } from './featured-story-content';

it('offers all 54 supplied photographs in destination order without creating chapters', () => {
  const all = destinationIds.flatMap(id => {
    const media = exhibitGalleryMedia(id);
    expect(media.map(photo => photo.id)).toEqual(getDestination(id)!.media!.map(photo => photo.id));
    expect(media[0].id).toBe(getDestination(id)!.coverMediaId);
    return media;
  });
  expect(all).toHaveLength(54);
  expect(new Set(all.map(photo => photo.id)).size).toBe(54);
  expect(destinationIds.flatMap(featuredStoryContent)).toHaveLength(23);
  expect(exhibitGalleryMedia('pilot-aclc')).toEqual([]);
  expect(exhibitGalleryMedia('foreign')).toEqual([]);
  expect(danaoStageProfile.media).toHaveLength(7);
  expect(Object.isFrozen(danaoStageProfile)).toBe(true);
  expect(Object.isFrozen(danaoStageProfile.media)).toBe(true);
});
