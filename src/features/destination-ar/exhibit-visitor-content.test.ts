import { schoolPresentationHistoryScope } from '@/features/destinations/history-content';
import { expect, it } from 'vitest';
import { destinationIds, getDestination } from '@/features/destinations/catalog';
import { localizationOptions } from '@/i18n/options';
import { featuredStoryContent } from './featured-story-content';
import { EXHIBIT_HISTORY_ID, EXHIBIT_GUIDE_IDS, exhibitGuideSections, isExhibitGuide } from './ring-content';
import { withExhibitVisitorContent } from './exhibit-visitor-content';
import { ringCopy } from './ring-copy';
import { createPhotoIslandsProfile, exhibitGalleryEntries, exhibitSceneEntries, photoIslandCoverSize, photoIslandGuide, photoIslandMetrics, restrictPhotoIslandsProfile } from './photo-islands';
import { buildDestinationStageSlots, getExhibitStageProfile } from './exhibit-stage';
import { captureBasis, type RingSlot } from './scene-geometry';
import { RingController } from './ring-controller';
import type { PoseSample } from './types';
import historyReview from '../../../docs/content/final-handoff-2026-11-19/history-review.json';

const languages = ['en', 'ja', 'ko'] as const;

it.each(destinationIds)('adds five complete visit guide readers and one history entrance to %s', id => {
  const destination = getDestination(id)!;
  const stories = featuredStoryContent(id);
  const content = withExhibitVisitorContent(destination, stories, schoolPresentationHistoryScope);
  expect(content.slice(0, stories.length).map(item => item.approved)).toEqual(stories.map(item => item.approved));
  const plans = exhibitGuideSections.map(section => content.find(item => item.id === EXHIBIT_GUIDE_IDS[section])!);
  expect(plans).toHaveLength(5);
  expect(plans.every(plan => plan && !plan.approved?.media)).toBe(true);
  const history = content.find(item => item.id === EXHIBIT_HISTORY_ID)!;
  const suppliedHistory = historyReview.entries.find(entry => entry.destinationId === id)!;
  expect(content.filter(item => item.id === EXHIBIT_HISTORY_ID)).toHaveLength(1);
  expect(history.approved?.media?.map(item => item.id) ?? []).toEqual(id === 'D01' ? [] : suppliedHistory.historyMediaReferences);
  for (const language of languages) {
    const guide = destination.visitorGuide![language].value;
    const copy = localizationOptions.resources[language].translation.destinations;
    if (language === 'en') expect(plans.map(plan => ringCopy(plan, 'title', language))).toEqual(
      ['Getting there', 'When to visit', 'Safety', 'Things to do', 'Before you go']);
    expect(ringCopy(history, 'title', language)).toBe(suppliedHistory.title[language]);
    expect(ringCopy(history, 'body', language)).toBe(suppliedHistory.text[language]);
    for (const [index, section] of exhibitGuideSections.entries()) {
      const plan = plans[index];
      const body = ringCopy(plan, 'body', language);
      const values = guide[section];
      const required = section === 'arrival' && destination.requiresGuide ? [copy.guideRequired] : [];
      expect(body).toBe([...required, ...(typeof values === 'string' ? [values] : values)].join('\n'));
      expect(ringCopy(plan, 'title', language)).toBe(plan.guideEssentials?.[language]?.[0].text);
    }
  }
});

it('keeps an existing authorized chapter alongside the independently sourced History panel', () => {
  const destination = getDestination('D01')!;
  const stories = featuredStoryContent('D01');
  const existingHistory = { ...stories[1], role: 'history' as const };
  const authorized = [stories[0], existingHistory, stories[2]];
  const content = withExhibitVisitorContent(destination, authorized, schoolPresentationHistoryScope);
  expect(content.filter(item => item.role === 'history').map(item => item.id)).toEqual([existingHistory.id, EXHIBIT_HISTORY_ID]);
  expect(content.find(item => item.id === existingHistory.id)?.approved).toBe(existingHistory.approved);
  expect(content.filter(item => Object.values(EXHIBIT_GUIDE_IDS).some(id => item.id === id))).toHaveLength(5);
});

it('keeps diagnostic and empty authorized content unchanged', () => {
  const diagnostic = featuredStoryContent('D01');
  const empty = [] as const;
  expect(withExhibitVisitorContent(getDestination('pilot-aclc')!, diagnostic)).toBe(diagnostic);
  expect(withExhibitVisitorContent(getDestination('D01')!, empty)).toBe(empty);
});

it('places all six utilities without moving any of the twelve authorized chapters in a story-only exhibit', () => {
  const destination = getDestination('D01')!;
  const profile = restrictPhotoIslandsProfile(createPhotoIslandsProfile(getExhibitStageProfile('D01')!), []);
  const template = featuredStoryContent('D01')[0];
  const chapters = Array.from({ length: 12 }, (_, index) => ({ ...template, id: `chapter-${index}`, role: undefined }));
  const content = withExhibitVisitorContent(destination, chapters);
  const sample: PoseSample = { position: [0, 2, 0], forward: [0, 0, -1] };
  const basis = captureBasis(sample)!;
  const baseline = buildDestinationStageSlots(profile, chapters, basis);
  const entries = exhibitSceneEntries(profile, content);
  const slots = buildDestinationStageSlots(profile, entries, basis);
  expect(slots).toHaveLength(18);
  expect(slots.slice(0, chapters.length)).toEqual(baseline);
  const controller = new RingController(entries, (items, captured) => buildDestinationStageSlots(profile, items, captured));
  controller.track('normal');
  controller.pose(sample, 100);
  for (const id of [...Object.values(EXHIBIT_GUIDE_IDS), EXHIBIT_HISTORY_ID]) {
    const selection = controller.select(id, 100)!;
    expect(selection.to.position).toEqual([0, 2, -2.25]);
    controller.complete(selection.token);
    const closing = controller.close(100)!;
    expect(closing.to.position).toEqual(slots.find(slot => slot.id === id)?.position);
    controller.complete(closing.token);
  }
});

// Bound the projected slab at the captured camera center. This checks the AR
// geometry even when the visible extent of a tall portrait exceeds its peers.
function angularFootprint(slot: RingSlot, width: number, height: number) {
  const radius = Math.hypot(slot.position[0], slot.position[2]);
  const angle = slot.angle > 180 ? slot.angle - 360 : slot.angle;
  const halfAngle = 180 / Math.PI * Math.atan(width / (2 * radius));
  const cornerDepth = Math.hypot(radius, width / 2);
  const pitches = [slot.position[1] - height / 2, slot.position[1] + height / 2]
    .flatMap(y => [Math.atan(y / radius), Math.atan(y / cornerDepth)]);
  return { left: angle - halfAngle, right: angle + halfAngle, low: Math.min(...pitches), high: Math.max(...pitches) };
}

it.each(destinationIds.flatMap(id => [false, true].map(overflow => ({ id, overflow }))))(
  'clears guides and History for $id with extra stories=$overflow', ({ id, overflow }) => {
  const originals = featuredStoryContent(id);
  const stories = overflow ? [...originals, ...Array.from({ length: 12 - originals.length }, (_, i) => ({
    ...originals[0], id: `extra-${i}`, role: undefined,
  }))] : originals;
  const content = withExhibitVisitorContent(getDestination(id)!, stories, schoolPresentationHistoryScope);
  const full = createPhotoIslandsProfile(getExhibitStageProfile(id)!);
  const basis = captureBasis({ position: [0, 2, 0], forward: [0, 0, -1] })!;
  for (const profile of [full, restrictPhotoIslandsProfile(full, []), ...full.media.map(photo => restrictPhotoIslandsProfile(full, [photo.id]))]) {
    const galleries = exhibitGalleryEntries(profile);
    const baseline = buildDestinationStageSlots(profile, exhibitSceneEntries(profile, stories), basis);
    const slots = buildDestinationStageSlots(profile, exhibitSceneEntries(profile, content), basis);
    const coordinates = ({ id, angle, scale, position, rotation }: RingSlot) => ({ id, angle, scale, position, rotation });
    expect(slots.slice(0, baseline.length).map(coordinates)).toEqual(baseline.map(coordinates));
    const footprints = slots.map(slot => {
      const gallery = galleries.find(entry => entry.id === slot.id);
      const size = gallery ? photoIslandCoverSize(profile, gallery) : isExhibitGuide(slot.id) ? photoIslandGuide
        : { width: photoIslandMetrics.storyWidth, height: photoIslandMetrics.storyHeight };
      const border = gallery ? 0.04 : 0;
      return { id: slot.id, ...angularFootprint(slot, size.width + border, size.height + border) };
    });
    for (const guide of footprints.filter(item => isExhibitGuide(item.id) || item.id === EXHIBIT_HISTORY_ID)) {
      for (const other of footprints.filter(item => item.id !== guide.id)) {
        expect(guide.right < other.left || guide.left > other.right || guide.high < other.low || guide.low > other.high,
          `${id}/${profile.media[0]?.id ?? 'story-only'}/${guide.id} vs ${other.id}`).toBe(true);
      }
    }
    expect(slots.find(slot => slot.id === EXHIBIT_GUIDE_IDS.arrival)?.angle).toBe(0);
    const history = slots.find(slot => slot.id === EXHIBIT_HISTORY_ID)!;
    expect(history.angle).toBeGreaterThan(slots.find(slot => slot.id === EXHIBIT_GUIDE_IDS.safety)!.angle);
  }
});
