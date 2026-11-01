import { localizedContent, type DestinationMedia } from '@/features/destinations/catalog';
import { paginate, type ContentPage, type ReadingCursor } from './content-layout';
import type { ReadingSize } from './reading-preference';

export type GalleryPage = ContentPage & ({ kind: 'text'; media?: never; mediaPage?: never } | { kind: 'image'; media: DestinationMedia; mediaPage: number });
export function galleryPages(textPages: readonly ContentPage[], media: readonly DestinationMedia[], locale: string, size: ReadingSize, credit: (value: string) => string, englishFallback: string): GalleryPage[] {
  const language = locale.startsWith('ja') ? 'ja' : locale.startsWith('ko') ? 'ko' : 'en';
  const images = media.map(item => {
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
      pages.push({ kind: 'image', start: 0, end: 0, text: wrapped.slice(index, index + lines).join('\n'), media: item, mediaPage: pages.length });
    }
    return pages;
  });
  return [...(images[0] ?? []), ...textPages.map(page => ({ ...page, kind: 'text' as const })), ...images.slice(1).flat()];
}
export function cursorAtPage(pages: readonly GalleryPage[], page: number, locale: string, size: ReadingSize): ReadingCursor {
  const index = Math.min(pages.length - 1, Math.max(0, page)); const selected = pages[index];
  return { page: index, offset: selected.start, locale, size,
    ...(selected.media ? { mediaId: selected.media.id, mediaPage: selected.mediaPage } : {}) };
}
export function galleryCursor(pages: readonly GalleryPage[], previous: ReadingCursor | undefined, locale: string, size: ReadingSize): ReadingCursor {
  if (!previous) return cursorAtPage(pages, 0, locale, size);
  if (previous?.mediaId) {
    const matches = pages.flatMap((page, index) => page.media?.id === previous.mediaId ? [index] : []);
    if (matches.length) return cursorAtPage(pages, matches[Math.min(matches.length - 1, Math.max(0, previous.mediaPage ?? 0))], locale, size);
  }
  const textPages = pages.filter(page => !page.media);
  // Mixed-page indices are not text indices. Preserve source offsets through
  // inserted covers, size changes and legacy text-only session snapshots.
  const index = previous.locale === locale && !previous.mediaId
    ? textPages.findIndex(page => page.start <= previous.offset && page.end > previous.offset) : 0;
  const text = textPages[index < 0 ? textPages.length - 1 : index];
  return cursorAtPage(pages, pages.indexOf(text), locale, size);
}
