import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { expect, it } from 'vitest';
import { destinationName, getDestination, listDestinations } from './catalog';
import { destinationToRoutePlace } from './routing';
import { arStoryReadiness } from './ar-content-readiness';
import content from '../destination-ar/featured-presentation-content.json';
import { featuredStoryContent } from '../destination-ar/featured-story-content';

it('bundles all 53 source photographs with their supplied hashes and chapter bindings', () => {
  expect(content.media).toHaveLength(53);
  expect(content.destinations.flatMap(item => item.chapters)).toHaveLength(20);
  for (const photo of content.media) {
    const bytes = readFileSync(fileURLToPath(new URL(`../../../${photo.file}`, import.meta.url)));
    expect(createHash('sha256').update(bytes).digest('hex')).toBe(photo.sha256);
  }
  for (const destination of listDestinations()) {
    const supplied = content.destinations.find(item => item.id === destination.id)!;
    const chapters = featuredStoryContent(destination.id as 'D01');
    expect(chapters.map(chapter => chapter.id)).toEqual(supplied.chapters.map(chapter => chapter.id));
    expect(chapters.map(chapter => chapter.approved?.media?.map(photo => photo.id))).toEqual(supplied.chapters.map(chapter => chapter.mediaIds));
    expect(destination.media?.[0].id).toBe(supplied.coverMediaId);
    expect(new Set(destination.media?.map(photo => photo.id))).toEqual(new Set(supplied.gallery));
    expect(destinationToRoutePlace(destination)?.coordinates).toEqual(supplied.location.routeEntrance);
    expect(destination.center).toEqual(supplied.location.center);
    expect(destination.ar?.activation).toBeUndefined();
    expect(destination.ar?.providerAssociation).toBeUndefined();
    expect(arStoryReadiness(destination).ready).toBe(false);
    for (const language of ['en', 'ja', 'ko'] as const) {
      expect(destinationName(destination, language)).toBe(supplied.name[language]);
      expect(destination.copy?.[language]?.overview?.value).toBe(supplied.summary[language]);
      expect(destination.visitorGuide?.[language]?.value).toEqual(supplied.visitorGuide[language]);
      for (const chapter of chapters) {
        expect(chapter.approved?.title[language]?.value).toBeTruthy();
        expect(chapter.approved?.body[language]?.value).toBeTruthy();
        for (const photo of chapter.approved?.media ?? []) {
          expect(photo.alt[language]?.value).toBeTruthy();
          expect(photo.caption?.[language]?.value).toBeTruthy();
          expect(photo.offlineRightsReference).toBeUndefined();
        }
      }
    }
  }
});

it('records separate location confirmations, guide requirements and preserves the ACLC pilot', () => {
  expect(listDestinations().filter(item => item.requiresGuide).map(item => item.id)).toEqual(['D02', 'D03', 'D07']);
  expect(getDestination('D02')?.visitorGuide?.en?.value.arrival).toContain('basketball');
  expect(JSON.stringify(getDestination('D02')?.visitorGuide?.en)).toContain('one hour');
  for (const destination of listDestinations()) {
    expect(destination.centerApprovalReference).toContain('2026-11-13');
    expect(destination.routeEntranceApprovalReference).toContain('local access');
  }
  expect(getDestination('pilot-aclc')?.ar?.activation?.radiusMeters).toBe(50);
  expect(getDestination('pilot-aclc')?.visitorGuide).toBeUndefined();
});
