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
  const budget = readingMetrics[size]; const pages: ContentPage[] = [];
  const lineLimit = maxLines ?? budget.lines;
  type Part = { segment: string; index: number };
  let start = 0; let end = 0; let parts: Part[] = []; let units = 0; let lines: string[] = [];
  let flow: { text: string; separator: string }[] = [];
  function finishPage() {
    // Soft row boundaries are a pagination estimate, not display instructions.
    // Viro flows ordinary words across its actual box. Explicit paragraph and
    // long-token/CJK breaks remain hard, avoiding pinned WordWrap's overflow.
    const flowText = flow.map((line, index) => line.text + (index < flow.length - 1 ? line.separator : '')).join('');
    pages.push({ start, end, text: lines.join('\n'), flowText }); start = end; lines = []; flow = [];
  }
  function finishLine(line: Part[], sourceEnd: number, separator = '\n') {
    end = sourceEnd; const value = line.map(part => part.segment).join('');
    lines.push(value); flow.push({ text: value, separator });
    if (lines.length === lineLimit) finishPage();
  }
  for (const part of graphemeSegments(text)) {
    if (part.segment === '\n' || part.segment === '\r\n' || part.segment === '\r') {
      finishLine(parts, part.index + part.segment.length); parts = []; units = 0; continue;
    }
    const width = graphemeAdvance(part.segment, budget.fontSize);
    while (parts.length && units + width > budget.columns) {
      let split = parts.length;
      for (let index = parts.length - 1; index >= 0; index--) {
        if (parts[index].segment === ' ' || parts[index].segment === '\t') { split = index + 1; break; }
      }
      const line = parts.slice(0, split); const last = line[line.length - 1];
      finishLine(line, last.index + last.segment.length, last.segment === ' ' || last.segment === '\t' ? '' : '\n');
      parts = parts.slice(split); units = parts.reduce((total, item) => total + graphemeAdvance(item.segment, budget.fontSize), 0);
    }
    parts.push(part); units += width;
  }
  if (parts.length) { const last = parts[parts.length - 1]; finishLine(parts, last.index + last.segment.length); }
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
