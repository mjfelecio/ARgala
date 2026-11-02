import { expect, it, vi } from 'vitest';
import { createInstance } from 'i18next';
import { localizationOptions } from '@/i18n/options';
import { chapterPresentation } from './chapter-presentation';
import { paginate } from './content-layout';
import { galleryPages } from './information-gallery';
import { developmentGalleryContent } from './development-gallery-content';
vi.mock('./development-gallery-assets', () => ({ developmentGalleryAssets: { campus: 1, scenery: 2 } }));
it.each(['en', 'ja', 'ko'])('keeps sample identity, full credits and localized warnings reachable in %s', async locale => {
  const translations = createInstance(); await translations.init({ ...localizationOptions, lng: locale });
  for (const content of developmentGalleryContent.slice(0, 2)) {
    const chapter = chapterPresentation(content, locale, key => translations.t(key), key => translations.exists(key));
    const pages = galleryPages(paginate(chapter.body, 'large', chapter.title), chapter.media, locale, 'large', credit => translations.t('destinationRing.imageCredit', { credit }), translations.t('destinations.englishFallback'), chapter.presentation);
    expect(new Set(pages.flatMap(page => page.media ? [page.media.id] : []))).toEqual(new Set(['sample-aclc-iriga', 'sample-scenery']));
    for (const [index, key] of ['campus', 'scenery'].entries()) {
      const media = chapter.media.find(item => item.id === (index ? 'sample-scenery' : 'sample-aclc-iriga'))!;
      const visible = pages.filter(page => page.media?.id === media.id).map(page => page.text).join('');
      expect(visible.replace(/\s/g, '')).toContain(translations.t(`destinationRing.samples.${key}`).replace(/\s/g, ''));
      expect(visible.replace(/\s/g, '')).toContain(media.credit.replace(/\s/g, ''));
      expect(media.approvalReference).toContain('no destination approval');
      expect(media.alt).toHaveProperty(locale);
    }
  }
});
