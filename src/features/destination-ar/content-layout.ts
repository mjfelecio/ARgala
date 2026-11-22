import { graphemeSegments } from 'unicode-segmenter/grapheme';
import type { ReadingSize } from './reading-preference';
import { graphemeAdvance, readingEmBudget } from './reading-widths';
import { readerLayout, readerLineBudget } from './reader-layout';
export type ContentPage = { start: number; end: number; text: string; flowText?: string };
export type ReadingCursor = { page: number; offset: number; locale: string; size: ReadingSize; mediaId?: string; mediaPage?: number };
// Horizontal budgets follow the rendered box and font point-to-world scale.
// Vertical line budgets remain conservative; native device fit is a separate check.
export const readingMetrics = {
  small: { columns: readingEmBudget(4), lines: readerLineBudget(readerLayout.body.height, 4), fontSize: 4 },
  standard: { columns: readingEmBudget(5), lines: readerLineBudget(readerLayout.body.height, 5), fontSize: 5 },
  large: { columns: readingEmBudget(6), lines: readerLineBudget(readerLayout.body.height, 6), fontSize: 6 },
} as const;
export function paginate(text: string, size: ReadingSize, heading = '', maxLines?: number): ContentPage[] {
  // Heading presentation cannot consume the existing body allowance. Each
  // field stays bounded, and offsets refer to the complete displayed source.
  if (text.length > 24000 || heading.length > 24000) throw new Error('AR content exceeds layout budget');
  if (heading) text = `${heading}\n\n${text}`;
  if (!text) return [{ start: 0, end: 0, text: '' }];
  const budget = readingMetrics[size];
  const rows = wrapReaderText(text, budget.fontSize);
  const lineLimit = maxLines === undefined ? budget.lines
    : Number.isInteger(maxLines) && maxLines > 0 ? maxLines : rows.length;
  const pages: ContentPage[] = [];
  for (let index = 0; index < rows.length; index += lineLimit) {
    pages.push(readerTextPage(rows.slice(index, index + lineLimit), rows[index - 1]?.end ?? 0));
  }
  return pages;
}

type ReaderRow = { text: string; end: number; separator: string };
const cjkClosingPunctuation = /^[、。，．：；？！）］｝〉》」』】〕〗〙〛]/u;
const cjkOpeningPunctuation = /^[（［｛〈《「『【〔〖〘〚]/u;

export function readerTextPage(rows: readonly ReaderRow[], start: number): ContentPage {
  // Ordinary words flow across the native box. Explicit paragraph breaks and
  // protective breaks for long words and CJK remain hard.
  return {
    start,
    end: rows.at(-1)?.end ?? start,
    text: rows.map(row => row.text).join('\n'),
    flowText: rows.map((row, index) => row.text + (index < rows.length - 1 ? row.separator : '')).join(''),
  };
}

export function wrapReaderText(text: string, fontSize: number, width?: number): ReaderRow[] {
  const columns = readingEmBudget(fontSize, width);
  const rows: ReaderRow[] = [];
  type Part = { segment: string; index: number };
  let parts: Part[] = [];
  let units = 0;
  function finishLine(line: Part[], end: number, separator = '\n') {
    rows.push({ text: line.map(part => part.segment).join(''), end, separator });
  }
  for (const part of graphemeSegments(text)) {
    if (part.segment === '\n' || part.segment === '\r\n' || part.segment === '\r') {
      finishLine(parts, part.index + part.segment.length); parts = []; units = 0; continue;
    }
    const width = graphemeAdvance(part.segment, fontSize);
    while (parts.length && units + width > columns) {
      let split = parts.length;
      for (let index = parts.length - 1; index >= 0; index--) {
        if (parts[index].segment === ' ' || parts[index].segment === '\t') { split = index + 1; break; }
      }
      // Keep Japanese punctuation on the same row as the adjacent text, even
      // when the renderer needs an explicit wrap for an unbroken CJK string.
      while (split > 1 && (cjkClosingPunctuation.test(parts[split]?.segment ?? part.segment) ||
          cjkOpeningPunctuation.test(parts[split - 1].segment))) split--;
      const line = parts.slice(0, split); const last = line[line.length - 1];
      finishLine(line, last.index + last.segment.length, last.segment === ' ' || last.segment === '\t' ? '' : '\n');
      parts = parts.slice(split); units = parts.reduce((total, item) => total + graphemeAdvance(item.segment, fontSize), 0);
    }
    parts.push(part); units += width;
  }
  if (parts.length) { const last = parts[parts.length - 1]; finishLine(parts, last.index + last.segment.length); }
  return rows;
}
export function reflowCursor(pages: readonly ContentPage[], previous: ReadingCursor | undefined, locale: string, size: ReadingSize): ReadingCursor {
  let page = Math.min(Math.max(0, previous?.page ?? 0), pages.length - 1);
  if (previous && previous.locale === locale && previous.size !== size) {
    const containing = pages.findIndex(item => item.start <= previous.offset && item.end > previous.offset);
    page = containing < 0 ? pages.length - 1 : containing;
  }
  return { page, offset: pages[page].start, locale, size };
}
