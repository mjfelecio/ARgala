import { graphemeSegments } from 'unicode-segmenter/grapheme';
import { ringCopy } from './ring-copy';
import type { RingContent } from './ring-content';
import type { DestinationMedia } from '@/features/destinations/catalog';

const noMedia: readonly DestinationMedia[] = [];

/** Local presentation only; never turns missing facts or media into content. */
export function chapterPresentation(content: RingContent, locale: string, translate: (key: string) => string, exists: (key: string) => boolean) {
  const title = ringCopy(content, 'title', locale, translate, exists);
  const parts = [...graphemeSegments(title)];
  const shortened = parts.length > 24;
  const coverTitle = shortened ? parts.slice(0, 23).map(part => part.segment).join('') + '…' : title;
  const body = ringCopy(content, 'body', locale, translate, exists);
  // The reader paginates the full title separately from the body's budget;
  // no factual heading depends on device-specific native cover clipping.
  return { title, coverTitle, body, media: content.approved?.media ?? noMedia };
}
