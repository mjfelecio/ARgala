import { expect, it } from 'vitest';
import { destinationIds, getDestination } from '@/features/destinations/catalog';
import { destinationHistory, schoolPresentationHistoryScope } from '@/features/destinations/history-content';
import { featuredStoryContent } from './featured-story-content';
import { withExhibitVisitorContent } from './exhibit-visitor-content';
import { EXHIBIT_HISTORY_ID, EXHIBIT_GUIDE_IDS, exhibitGuideSections } from './ring-content';
import { readingSizes } from './reading-preference';
import { readerLayout } from './reader-layout';
import { layoutGuideEssentials, paginateEditorial } from './editorial-layout';

import { photoIslandGuide } from './photo-islands';

const locales = ['en', 'ja', 'ko'] as const;
const grades = ['D01', 'D03', 'D05', 'D06', 'D07', 'D08', 'D10'];

it.each(destinationIds)('lays out the entire %s visit guide in each language and size', id => {
  const destination = getDestination(id)!;
  const entries = withExhibitVisitorContent(destination, featuredStoryContent(id), schoolPresentationHistoryScope);
  for (const section of exhibitGuideSections) {
    const plan = entries.find(entry => entry.id === EXHIBIT_GUIDE_IDS[section])!;
    for (const locale of locales) {
      const blocks = plan.readerBlocks![locale]!;
      const essentials = plan.guideEssentials![locale]!;
      expect(essentials[0].kind).toBe('heading');
      expect(essentials.length).toBeGreaterThan(1);
      if (section === 'arrival' && destination.requiresGuide) {
        expect(essentials[1]).toEqual(blocks[0]);
        expect(essentials[1].kind).toBe('callout');
      }
      for (const size of readingSizes) {
        const label = `${id}/${section}/${locale}/${size}`;
        const visible = layoutGuideEssentials(essentials, size);
        expect(visible.map(block => block.text.replace(/\s/g, '')), label)
          .toEqual(essentials.map(block => block.text.replace(/\s/g, '')));
        let previousBottom = photoIslandGuide.height / 2;
        for (const block of visible) {
          expect(block.y + block.height / 2, label).toBeLessThanOrEqual(previousBottom + 1e-8);
          previousBottom = block.y - block.height / 2;
          expect(previousBottom, label).toBeGreaterThanOrEqual(-photoIslandGuide.height / 2 + 0.055 - 1e-8);
          expect(Math.abs(block.x) + block.width / 2, label).toBeLessThan(photoIslandGuide.width / 2);
        }
        const { pages, source } = paginateEditorial(blocks, size);
        expect(pages.map(page => source.slice(page.start, page.end)).join('')).toBe(source);
        for (const page of pages) {
          let previousBottom = readerLayout.body.y + readerLayout.body.height / 2;
          for (const block of page.blocks) {
            expect(block.y + block.height / 2).toBeLessThanOrEqual(previousBottom + 1e-8);
            previousBottom = block.y - block.height / 2;
            expect(previousBottom).toBeGreaterThanOrEqual(readerLayout.body.y - readerLayout.body.height / 2 - 1e-8);
          }
        }
      }
    }
  }
});

it('repeats the heading on a continued list and places a marker only on the first fragment of a long item', () => {
  const { pages } = paginateEditorial([
    { kind: 'heading', text: 'Before you go' },
    { kind: 'bullet', text: '地域の案内を確認してください。'.repeat(24) },
    { kind: 'bullet', text: 'Carry water.' },
  ], 'large');
  expect(pages.length).toBeGreaterThan(2);
  expect(pages.slice(1).every(page => page.blocks[0].text === 'Before you go')).toBe(true);
  expect(pages.flatMap(page => page.blocks).filter(block => block.marker)).toHaveLength(2);
});

it.each(destinationIds)('keeps %s story and History facts and media when applying editorial structure', id => {
  const destination = getDestination(id)!;
  const stories = featuredStoryContent(id);
  const entries = withExhibitVisitorContent(destination, stories, schoolPresentationHistoryScope);
  const compact = (text: string) => text.replace(/\s+/g, '');
  for (const locale of locales) {
    for (const entry of entries.slice(0, stories.length)) {
      const original = stories.find(chapter => chapter.id === entry.id)!;
      const blocks = entry.readerBlocks?.[locale];
      const body = original.approved!.body[locale]!.value;
      expect(entry.approved).toBe(original.approved);
      if (blocks) expect(compact(blocks.filter(block => block.kind !== 'heading').map(block => block.text).join(''))).toBe(compact(body));
    }
    const history = entries.find(entry => entry.id === EXHIBIT_HISTORY_ID)!;
    expect(compact(history.readerBlocks![locale]!.map(block => block.text).join('')))
      .toBe(compact(destinationHistory(id, schoolPresentationHistoryScope)!.entry.text[locale]));
  }
  if (grades.includes(id)) expect(entries.slice(0, stories.length).some(entry => entry.readerBlocks?.en?.some(block => block.kind === 'bullet' || block.kind === 'callout'))).toBe(true);
});

it('does not apply an editorial template to a replacement approved body', () => {
  const destination = getDestination('D01')!;
  const original = featuredStoryContent('D01')[0];
  if (!original.approved) throw new Error('Expected a bundled chapter');
  const replacement = { ...original, approved: { ...original.approved!, body: { en: { value: 'New reviewed wording.', approvalReference: 'test' } } } };
  expect(withExhibitVisitorContent(destination, [replacement])[0].readerBlocks?.en).toBeUndefined();
});
