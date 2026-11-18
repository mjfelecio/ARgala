import { expect, it } from 'vitest';
import { destinationIds, getDestination } from '@/features/destinations/catalog';
import { localizationOptions } from '@/i18n/options';
import { featuredStoryContent } from './featured-story-content';
import { EXHIBIT_HISTORY_ID, EXHIBIT_VISIT_PLAN_ID, withExhibitVisitorContent } from './exhibit-visitor-content';
import { ringCopy } from './ring-copy';
import { paginate } from './content-layout';
import { createPhotoIslandsProfile, exhibitSceneEntries, restrictPhotoIslandsProfile } from './photo-islands';
import { buildDestinationStageSlots, getExhibitStageProfile } from './exhibit-stage';
import { captureBasis } from './scene-geometry';
import { RingController } from './ring-controller';
import type { PoseSample } from './types';

const languages = ['en', 'ja', 'ko'] as const;

it.each(destinationIds)('adds a paginated visit plan and one history entrance to %s', id => {
  const destination = getDestination(id)!;
  const stories = featuredStoryContent(id);
  const content = withExhibitVisitorContent(destination, stories);
  expect(content.slice(0, stories.length)).toEqual(stories);
  const plan = content.find(item => item.id === EXHIBIT_VISIT_PLAN_ID)!;
  expect(plan.approved?.media).toBeUndefined();
  const history = content.filter(item => item.role === 'history');
  expect(history).toHaveLength(1);
  expect(history[0].id).toBe(id === 'D09' ? 'chapter-2' : EXHIBIT_HISTORY_ID);
  for (const language of languages) {
    const guide = destination.visitorGuide![language].value;
    const copy = localizationOptions.resources[language].translation.destinations;
    const body = ringCopy(plan, 'body', language);
    expect(ringCopy(plan, 'title', language)).toBeTruthy();
    expect(ringCopy(history[0], 'body', language)).toBeTruthy();
    for (const [section, heading] of Object.entries(copy.visitorGuide)) {
      expect(body).toContain(heading);
      const values = guide[section as keyof typeof guide];
      for (const value of typeof values === 'string' ? [values] : values) expect(body).toContain(value);
    }
    expect(body.includes(copy.guideRequired)).toBe(!!destination.requiresGuide);
    const pages = paginate(body, 'large');
    expect(pages.length).toBeGreaterThan(1);
    expect(pages.map(page => body.slice(page.start, page.end)).join('')).toBe(body);
  }
});

it('keeps an authorized History chapter and its media without adding duplicate content', () => {
  const destination = getDestination('D01')!;
  const stories = featuredStoryContent('D01');
  const existingHistory = { ...stories[1], role: 'history' as const };
  const authorized = [stories[0], existingHistory, stories[2]];
  const content = withExhibitVisitorContent(destination, authorized);
  expect(content.filter(item => item.role === 'history')).toEqual([existingHistory]);
  expect(content.find(item => item.id === existingHistory.id)).toBe(existingHistory);
  expect(content.filter(item => item.id === EXHIBIT_VISIT_PLAN_ID)).toHaveLength(1);
});

it('keeps diagnostic and empty authorized content unchanged', () => {
  const diagnostic = featuredStoryContent('D01');
  const empty = [] as const;
  expect(withExhibitVisitorContent(getDestination('pilot-aclc')!, diagnostic)).toBe(diagnostic);
  expect(withExhibitVisitorContent(getDestination('D01')!, empty)).toBe(empty);
});

it('places both utilities without moving any of the twelve authorized chapters in a story-only exhibit', () => {
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
  expect(slots).toHaveLength(14);
  expect(slots.slice(0, chapters.length)).toEqual(baseline);
  const controller = new RingController(entries, (items, captured) => buildDestinationStageSlots(profile, items, captured));
  controller.track('normal');
  controller.pose(sample, 100);
  for (const id of [EXHIBIT_VISIT_PLAN_ID, EXHIBIT_HISTORY_ID]) {
    const selection = controller.select(id, 100)!;
    expect(selection.to.position).toEqual([0, 2, -2.25]);
    controller.complete(selection.token);
    const closing = controller.close(100)!;
    expect(closing.to.position).toEqual(slots.find(slot => slot.id === id)?.position);
    controller.complete(closing.token);
  }
});
