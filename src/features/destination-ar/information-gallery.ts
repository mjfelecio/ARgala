import { localizedContent, type DestinationMedia } from '@/features/destinations/catalog';
import { paginate, reflowCursor, type ContentPage, type ReadingCursor } from './content-layout';
import type { ReadingSize } from './reading-preference';

export type GalleryPage = ContentPage & { media?: DestinationMedia; mediaPage?: number };
export function galleryPages(textPages: readonly ContentPage[], media: readonly DestinationMedia[], locale: string, size: ReadingSize, credit: (value: string) => string, englishFallback: string): GalleryPage[] {
  const language = locale.startsWith('ja') ? 'ja' : locale.startsWith('ko') ? 'ko' : 'en';
  return [...textPages, ...media.flatMap(item => {
    const alt = localizedContent(item.alt, language);
    const caption = localizedContent(item.caption, language);
    const metadata = [alt?.englishFallback ? englishFallback : undefined, alt?.value,
      caption?.englishFallback && !alt?.englishFallback ? englishFallback : undefined,
      caption?.value !== alt?.value ? caption?.value : undefined, credit(item.credit)].filter(Boolean).join('\n');
    // Reserve the top half of the existing text area for the image. Keep the
    // same glyph widths, with fewer lines; every caption/credit remains reachable.
    const lines = size === 'large' ? 1 : 2;
    const wrapped = paginate(metadata, size).flatMap(page => page.text.split('\n'));
    const pages: GalleryPage[] = [];
    for (let index = 0; index < wrapped.length; index += lines) {
      pages.push({ start: 0, end: 0, text: wrapped.slice(index, index + lines).join('\n'), media: item, mediaPage: pages.length });
    }
    return pages;
  })];
}
export function cursorAtPage(pages: readonly GalleryPage[], page: number, locale: string, size: ReadingSize): ReadingCursor {
  const index = Math.min(pages.length - 1, Math.max(0, page)); const selected = pages[index];
  return { page: index, offset: selected.start, locale, size,
    ...(selected.media ? { mediaId: selected.media.id, mediaPage: selected.mediaPage } : {}) };
}
export function galleryCursor(pages: readonly GalleryPage[], previous: ReadingCursor | undefined, locale: string, size: ReadingSize): ReadingCursor {
  if (previous?.mediaId) {
    const matches = pages.flatMap((page, index) => page.media?.id === previous.mediaId ? [index] : []);
    if (matches.length) return cursorAtPage(pages, matches[Math.min(matches.length - 1, Math.max(0, previous.mediaPage ?? 0))], locale, size);
  }
  const textPages = pages.filter(page => !page.media);
  const textCursor = reflowCursor(textPages, previous?.mediaId ? undefined : previous, locale, size);
  return cursorAtPage(pages, textCursor.page, locale, size);
}
