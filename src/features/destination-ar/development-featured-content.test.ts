import { createInstance } from 'i18next';
import { describe, expect, it } from 'vitest';
import { destinationIds } from '@/features/destinations/catalog';
import { localizationOptions } from '@/i18n/options';
import { ringCopy } from './ring-copy';
import { developmentFeaturedStories } from './development-featured-content';

describe('featured research previews', () => {
  it('provides sourced chapters for every featured destination through the real locale fallback', async () => {
    const i18n = createInstance();
    await i18n.init({ ...localizationOptions, lng: 'ja' });
    expect(Object.keys(developmentFeaturedStories)).toEqual(destinationIds);
    for (const story of Object.values(developmentFeaturedStories)) {
      expect(story.chapters.length).toBeGreaterThanOrEqual(2);
      expect(story.sources.length).toBeGreaterThan(0);
      for (const chapter of story.chapters) {
        const title = ringCopy(chapter, 'title', 'ja', key => i18n.t(key), key => i18n.exists(key));
        const body = ringCopy(chapter, 'body', 'ja', key => i18n.t(key), key => i18n.exists(key));
        expect(title).toBeTruthy();
        expect(body.length).toBeGreaterThan(30);
      }
    }
  });
});

it.each(['ja', 'ko'] as const)('provides complete %s preview translations for every chapter', async locale => {
  const i18n = createInstance();
  await i18n.init({ ...localizationOptions, lng: locale, fallbackLng: false });
  for (const story of Object.values(developmentFeaturedStories)) {
    for (const chapter of story.chapters) {
      expect(i18n.exists(chapter.titleKey!, { lng: locale })).toBe(true);
      expect(i18n.exists(chapter.bodyKey!, { lng: locale })).toBe(true);
    }
  }
});
