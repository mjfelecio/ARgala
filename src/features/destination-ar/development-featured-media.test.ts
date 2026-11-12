import { expect, it, vi } from 'vitest';
import { previewStoryContent } from './development-featured-media';
import { ringCopy } from './ring-copy';

vi.mock('./development-featured-media-assets', () => ({ featuredPreviewAssets: { D01: 1, D02: 2, D03: 3, D04: 4, D05: 5, D06: 6, D07: 7, D08: 8, D09: 9 }, additionalPreviewAssets: { D01: 101, D03: 103, D04: 104, D05: 105, D06: 106, D07: 107, D09: 109 } }));

it('shows the destination photograph and localized overview while retaining all story chapters', () => {
  for (const id of ['D01', 'D02', 'D03', 'D04', 'D05', 'D06', 'D07', 'D08', 'D09'] as const) {
    const pages = previewStoryContent(id);
    expect(pages[0].approved?.media?.[0].source).toBeTruthy();
    expect(ringCopy(pages[0], 'title', 'ja')).not.toBe(ringCopy(pages[0], 'title', 'en'));
    expect(ringCopy(pages[0], 'body', 'ko').length).toBeGreaterThan(10);
    expect(pages.length).toBeGreaterThanOrEqual(2);
  }
});

it('includes a distinct sourced second photograph for supported destinations', () => {
  for (const id of ['D01', 'D03', 'D04', 'D05', 'D06', 'D07', 'D09'] as const) {
    const photos = previewStoryContent(id)[0].approved?.media ?? [];
    expect(photos).toHaveLength(2);
    expect(photos[0].source).not.toBe(photos[1].source);
    expect(photos[1].rightsReference).toMatch(/^https:\/\//);
    for (const language of ['en', 'ja', 'ko'] as const) expect(photos[1].alt[language]?.value).toBeTruthy();
  }
});

it('keeps photo credits concise enough for the AR reader while preserving source links', () => {
  for (const id of ['D01', 'D02', 'D03', 'D04', 'D05', 'D06', 'D07', 'D08', 'D09'] as const) {
    for (const photo of previewStoryContent(id)[0].approved?.media ?? []) {
      expect(photo.credit.length).toBeLessThanOrEqual(45);
      expect(photo.rightsReference).toMatch(/^https:\/\//);
    }
  }
});
