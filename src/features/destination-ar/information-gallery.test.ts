import { expect, it } from 'vitest';
import { galleryPages, galleryCursor, cursorAtPage } from './information-gallery';
import { paginate } from './content-layout';
import type { DestinationMedia } from '@/features/destinations/catalog';
const media: DestinationMedia = { id: 'synthetic-photo', source: 1, credit: 'Synthetic credit', rightsReference: 'test', approvalReference: 'test', alt: { en: { value: 'Synthetic photo alt', approvalReference: 'test' }, ja: { value: '合成テスト画像', approvalReference: 'test' } }, caption: { en: { value: 'Synthetic caption '.repeat(30), approvalReference: 'test' } } };
it('starts fresh on the cover and restores text by logical offset within mixed pages', () => {
  const text = 'Synthetic chapter '.repeat(100);
  const pages = galleryPages(paginate(text, 'standard'), [media], 'en', 'standard', String, 'Fallback');
  expect(pages[galleryCursor(pages, undefined, 'en', 'standard').page].media?.id).toBe(media.id);
  const index = pages.findIndex(page => !page.media && page.start > 0);
  const cursor = cursorAtPage(pages, index, 'en', 'standard');
  expect(galleryCursor(pages, cursor, 'en', 'standard').page).toBe(index);
  const larger = galleryPages(paginate(text, 'large'), [media], 'en', 'large', String, 'Fallback');
  const restored = larger[galleryCursor(larger, cursor, 'en', 'large').page];
  expect(restored.media).toBeUndefined();
  expect(restored.start).toBeLessThanOrEqual(cursor.offset);
  expect(restored.end).toBeGreaterThan(cursor.offset);
});
it('leads with approved imagery while preserving all text and complete localized photo metadata', () => {
  const text = 'Synthetic history '.repeat(100); const pages = galleryPages(paginate(text, 'standard'), [media], 'en', 'standard', credit => `Credit: ${credit}`, 'Synthetic fallback label');
  const textPages = pages.filter(page => !page.media);
  expect(pages[0].media?.id).toBe('synthetic-photo');
  expect(textPages.map(page => text.slice(page.start, page.end)).join('')).toBe(text);
  const photos = pages.filter(page => page.media);
  expect(photos.length).toBeGreaterThan(1);
  expect(photos.every(page => page.text.split('\n').length <= 2)).toBe(true);
  expect(photos.map(page => page.text).join('').replaceAll('\n', '')).toContain('Synthetic photo alt');
  expect(photos.map(page => page.text).join('').replaceAll('\n', '')).toContain('Credit: Synthetic credit');
  expect(galleryPages(paginate(text, 'standard'), [], 'en', 'standard', String, 'Synthetic fallback label')).toEqual(paginate(text, 'standard').map(page => ({ ...page, kind: 'text' })));
});
it('restores asset identity through language/size reflow and remount-compatible cursors, then returns to text', () => {
  const old = galleryPages(paginate('Synthetic history '.repeat(100), 'small'), [media], 'en', 'small', String, 'Synthetic fallback label');
  const first = old.findIndex(page => page.media); const cursor = cursorAtPage(old, first + 1, 'en', 'small');
  expect(cursor).toMatchObject({ mediaId: media.id, mediaPage: 1 });
  const next = galleryPages(paginate('短い説明', 'large'), [media], 'ja', 'large', String, 'Synthetic fallback label');
  const restored = galleryCursor(next, JSON.parse(JSON.stringify(cursor)), 'ja', 'large');
  expect(next[restored.page].media?.id).toBe(media.id);
  expect(next.filter(page => page.media).map(page => page.text).join('')).toContain('合成テスト画像');
  expect(cursorAtPage(next, next.findIndex(page => !page.media), 'ja', 'large')).not.toHaveProperty('mediaId');
  const withdrawn = galleryCursor(galleryPages(paginate('text', 'large'), [], 'ja', 'large', String, 'Synthetic fallback label'), cursor, 'ja', 'large');
  expect(withdrawn).toMatchObject({ page: 0 }); expect(withdrawn).not.toHaveProperty('mediaId');
});
it('preserves legacy text cursor offset when adding galleries and changing text size', () => {
  const text = 'Synthetic body '.repeat(100); const before = paginate(text, 'small');
  const old = { page: 3, offset: before[3].start, locale: 'en', size: 'small' as const };
  const next = galleryPages(paginate(text, 'large'), [media], 'en', 'large', String, 'Synthetic fallback label');
  const restored = galleryCursor(next, old, 'en', 'large');
  expect(next[restored.page].start).toBeLessThanOrEqual(old.offset); expect(next[restored.page].end).toBeGreaterThan(old.offset);
});
it('keeps the current image across reordered assets and clamps a shortened caption while retaining text recovery', () => {
  const second = { ...media, id: 'synthetic-second', caption: undefined };
  const old = galleryPages(paginate('text', 'standard'), [media, second], 'en', 'standard', String, 'Synthetic fallback label');
  const cursor = cursorAtPage(old, old.length - 1, 'en', 'standard');
  const next = galleryPages(paginate('long text '.repeat(500), 'large'), [second, media], 'ko', 'large', String, 'Synthetic fallback label');
  const restored = galleryCursor(next, cursor, 'ko', 'large');
  expect(next[restored.page].media?.id).toBe(second.id);
  expect(cursor.mediaId).toBe(second.id);
});
