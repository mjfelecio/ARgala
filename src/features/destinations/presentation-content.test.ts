import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { expect, it } from 'vitest';
import { destinationIds, destinationName, getDestination, listDestinations, listFeaturedDestinations } from './catalog';
import { destinationToRoutePlace } from './routing';
import { arStoryReadiness } from './ar-content-readiness';
import content from '../destination-ar/featured-presentation-content.json';
import aclcHandoff from '../../../docs/content/final-handoff-2026-11-19/destination-D10.json';
import { featuredStoryContent } from '../destination-ar/featured-story-content';

it('keeps the approved nine destination records and 53 photo bindings exactly intact', () => {
  const hash = (data: unknown) => createHash('sha256').update(JSON.stringify(data)).digest('hex');
  expect(hash(content.destinations.slice(0, 9))).toBe('83cf6f45c44c7d0440e082295d9482198fa5febf4905aeb5b774403060383941');
  expect(hash(content.media.slice(0, 53))).toBe('ccba46ac96f62c19534b9038180ca56a4bb0f0d425f92c452244f2aa0e46e4c5');
});

it('bundles 63 visuals and 23 chapters for ten permanent destinations', () => {
  expect(content.media).toHaveLength(63);
  expect(content.destinations.flatMap(item => item.chapters)).toHaveLength(23);
  for (const photo of content.media) {
    const bytes = readFileSync(fileURLToPath(new URL(`../../../${photo.file}`, import.meta.url)));
    expect(createHash('sha256').update(bytes).digest('hex')).toBe(photo.sha256);
  }
  for (const destination of listDestinations()) {
    const supplied = content.destinations.find(item => item.id === destination.id)!;
    const id = destinationIds.find(id => id === destination.id)!;
    const chapters = featuredStoryContent(id);
    expect(chapters.map(chapter => chapter.id)).toEqual(supplied.chapters.map(chapter => chapter.id));
    expect(chapters.map(chapter => chapter.approved?.media?.map(photo => photo.id))).toEqual(supplied.chapters.map(chapter => chapter.mediaIds));
    expect(destination.media?.[0].id).toBe(supplied.coverMediaId);
    expect(new Set(destination.media?.map(photo => photo.id))).toEqual(new Set(supplied.gallery));
    if (id !== 'D10') {
      expect(destinationToRoutePlace(destination)?.coordinates).toEqual(supplied.location.routeEntrance);
      expect(destination.center).toEqual(supplied.location.center);
    }
    expect(destination.ar?.activation).toBeUndefined();
    expect(destination.ar?.providerAssociation).toBeUndefined();
    expect(arStoryReadiness(destination)).toMatchObject({ ready: true, scope: 'school-presentation' });
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
    if (destination.id !== 'D10') {
      expect(destination.centerApprovalReference).toContain('2026-11-13');
      expect(destination.routeEntranceApprovalReference).toContain('local access');
    }
  }
  expect(getDestination('pilot-aclc')?.ar?.activation?.radiusMeters).toBe(50);
  expect(getDestination('pilot-aclc')?.visitorGuide).toBeUndefined();
});


it('leads the D10 gallery with the Lilia Avenue cover while retaining its archive, seal and separate coordinates', () => {
  const permanent = getDestination('D10')!;
  const trial = getDestination('pilot-aclc')!;
  expect(listFeaturedDestinations().map(item => item.id)).toEqual(destinationIds);
  expect(permanent.center).toEqual(trial.center);
  expect(permanent.routeEntrance).toEqual(trial.routeEntrance);
  expect(permanent.routeEntrance).not.toEqual(permanent.center);
  expect(destinationToRoutePlace(permanent)?.coordinates).toEqual(trial.routeEntrance);
  expect(permanent.coverMediaId).toBe('D10-cover');
  expect(permanent.media!.map(item => item.id)).toEqual([
    'D10-cover', 'D10-courtyard', 'D10-entrance', 'D10-ched-visit', 'D10-proofpass',
    'D10-tourism-team', 'D10-leadership-summit', 'D10-school-seal', 'D10-archive-2014',
    'D10-stem-congress-2026',
  ]);
  const cover = permanent.media![0];
  expect(cover).toMatchObject({ id: 'D10-cover', credit: 'Jess Edrian (Maps contributor)' });
  expect(cover.kind).toBeUndefined();
  expect(cover.caption?.en?.value).toContain('March 2024');
  const seal = permanent.media!.find(item => item.id === 'D10-school-seal')!;
  expect(seal).toMatchObject({ kind: 'emblem', rightsReference: 'https://www.facebook.com/aclccollegeoformoc' });
  const archive = permanent.media!.find(item => item.id === 'D10-archive-2014')!;
  expect(archive.usageScope).toContain('Nonpublic school demonstration only');
  expect(archive.caption?.en?.value).toContain('published in 2014');
  const record = permanent.media!.find(item => item.id === 'D10-stem-congress-2026')!;
  expect(record).toMatchObject({ kind: 'document' });
  expect(record.caption?.en?.value).toContain('November 2026');
  expect(featuredStoryContent('D10').map(chapter => chapter.approved?.media?.map(item => item.id))).toEqual([
    [], ['D10-proofpass'], ['D10-tourism-team'],
  ]);
  expect(permanent.ar?.tiles.map(tile => tile.mediaIds)).toEqual(aclcHandoff.chapters.map(chapter => chapter.mediaIds));
  expect(permanent.ar?.tiles.map(tile => tile.body.en?.value)).toEqual(aclcHandoff.chapters.map(chapter => chapter.body.en));
  expect(permanent.ar?.activation).toBeUndefined();
});
