import { expect, it } from 'vitest';
import { chapterPresentation } from './chapter-presentation';
import type { RingContent } from './ring-content';

it('keeps the full long approved title available in the reader while bounding its cover', () => {
  const title = 'Long destination chapter '.repeat(8);
  const content: RingContent = { id: 'long', approved: { title: { en: { value: title, approvalReference: 'test' } }, body: { en: { value: 'Complete body.', approvalReference: 'test' } } } };
  const chapter = chapterPresentation(content, 'en', key => key, () => true);
  expect(chapter.coverTitle.length).toBeLessThan(title.length);
  expect(chapter.title).toBe(title);
  expect(chapter.body).toContain('Complete body.');
});
it('preserves independently localized content and fallback disclosure without inventing media', () => {
  const content: RingContent = { id: 'overview', role: 'overview', approved: { title: { en: { value: 'Overview', approvalReference: 'test' } }, body: { en: { value: 'English approved text', approvalReference: 'test' } } } };
  const chapter = chapterPresentation(content, 'ja', key => key, () => true);
  expect(chapter.body).toContain('destinations.englishFallback');
  expect(chapter.body).toContain('English approved text');
  expect(chapter.title).toBe('Overview');
  expect(chapter.media).toEqual([]);
});
