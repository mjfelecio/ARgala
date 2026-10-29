import { graphemeSegments } from 'unicode-segmenter/grapheme';
import type { ReadingSize } from './reading-preference';
export type ContentPage = { start: number; end: number; text: string };
export type ReadingCursor = { page: number; offset: number; locale: string; size: ReadingSize; mediaId?: string; mediaPage?: number };
// Conservative trial budgets, NOT a measurement of native font fit (Gate B).
export const readingMetrics = {
  small: { columns: 21, lines: 6, fontSize: 4 },
  standard: { columns: 18, lines: 5, fontSize: 5 },
  large: { columns: 14, lines: 4, fontSize: 6 },
} as const;
export function paginate(text: string, size: ReadingSize): ContentPage[] {
  if (text.length > 24000) throw new Error('AR content exceeds layout budget');
  if (!text) return [{ start: 0, end: 0, text: '' }];
  const budget = readingMetrics[size]; const pages: ContentPage[] = [];
  let start = 0; let end = 0; let line = ''; let units = 0; let lines: string[] = [];
  function finishPage() { pages.push({ start, end, text: lines.join('\n') }); start = end; lines = []; }
  function finishLine() { lines.push(line); line = ''; units = 0; if (lines.length === budget.lines) finishPage(); }
  for (const part of graphemeSegments(text)) {
    if (part.segment === '\n' || part.segment === '\r\n' || part.segment === '\r') {
      end = part.index + part.segment.length; finishLine(); continue;
    }
    // A complete grapheme stays together; non-Latin glyphs get a full cell.
    const width = part.segment === '\t' ? 2 : part.segment === ' ' ? 0.35 : part.segment.codePointAt(0)! > 255 ? 1.2 : 0.55;
    if (line && units + width > budget.columns) finishLine();
    line += part.segment; units += width; end = part.index + part.segment.length;
  }
  if (line || !lines.length && start < end) finishLine();
  if (lines.length) finishPage();
  return pages;
}
export function reflowCursor(pages: readonly ContentPage[], previous: ReadingCursor | undefined, locale: string, size: ReadingSize): ReadingCursor {
  let page = Math.min(Math.max(0, previous?.page ?? 0), pages.length - 1);
  if (previous && previous.locale === locale && previous.size !== size) {
    const containing = pages.findIndex(item => item.start <= previous.offset && item.end > previous.offset);
    page = containing < 0 ? pages.length - 1 : containing;
  }
  return { page, offset: pages[page].start, locale, size };
}
