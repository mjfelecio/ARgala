import { expect, it } from 'vitest';
import { destinationIds } from '@/features/destinations/catalog';
import { previewStoryContent } from './development-featured-media';
import { ringCopy } from './ring-copy';
import { galleryPages } from './information-gallery';
import { paginate } from './content-layout';
import { readingSizes } from './reading-preference';

it.each(['en', 'ja', 'ko'] as const)('retains every supplied %s paragraph, photo, caption and complete credit at every reading size', language => {
  const compact = (value: string) => value.replace(/\s/g, '');
  for (const id of destinationIds) {
    for (const chapter of previewStoryContent(id)) {
      const body = ringCopy(chapter, 'body', language);
      const title = ringCopy(chapter, 'title', language);
      const media = chapter.approved!.media!;
      for (const size of readingSizes) {
        const pages = galleryPages(paginate(body, size, title), media, language, size, String, '');
        expect(pages.filter(page => !page.media).map(page => body.slice(page.start, page.end)).join('')).toBe(body);
        expect(new Set(pages.flatMap(page => page.media ? [page.media.id] : []))).toEqual(new Set(media.map(photo => photo.id)));
        for (const photo of media) {
          const rendered = compact(pages.filter(page => page.media?.id === photo.id).map(page => page.flowText ?? page.text).join(''));
          expect(rendered).toContain(compact(photo.credit));
          expect(rendered).toContain(compact(photo.caption![language]!.value));
          expect(photo.rightsReference).toMatch(/^https:\/\//);
        }
      }
    }
  }
});
