import { readerTextPage, readingMetrics, wrapReaderText, type ContentPage } from './content-layout';
import { readerLayout } from './reader-layout';
import type { ReadingSize } from './reading-preference';
import { readingContentWidth } from './reading-widths';
import type { ReaderBlock } from './ring-content';
import { photoIslandGuide } from './photo-islands';

export type PlacedReaderBlock = ReaderBlock & {
  y: number; x: number; width: number; height: number; fontSize: number; marker: boolean;
};
export type EditorialPage = ContentPage & { blocks: readonly PlacedReaderBlock[] };

const top = readerLayout.body.y + readerLayout.body.height / 2;
const pageHeight = readerLayout.body.height;
const sectionGap = 0.047;
const itemGap = 0.019;
const paragraphGap = 0.035;
const inset = 0.06;
const epsilon = 1e-8;

function measure(block: ReaderBlock, font: number, contentWidth = readingContentWidth) {
  const indent = block.kind === 'bullet' || block.kind === 'callout' ? inset : 0;
  const fontSize = block.kind === 'heading' ? font + 0.65 : font;
  const width = contentWidth - indent;
  const bold = block.kind === 'heading' || block.kind === 'callout';
  return { ...block, width, fontSize, x: indent / 2, lineHeight: fontSize * 0.02,
    rows: wrapReaderText(block.text, fontSize, bold ? width * 0.92 : width) };
}

function placeBlock(block: ReturnType<typeof measure>, from: number, count: number, topY: number, marker: boolean): PlacedReaderBlock {
  const height = count * block.lineHeight;
  const slice = readerTextPage(block.rows.slice(from, from + count), 0);
  return { kind: block.kind, text: slice.flowText ?? slice.text, marker,
    y: topY - height / 2, x: block.x, width: block.width, height, fontSize: block.fontSize };
}

// The cover texture paints an inner corner stroke. Keep both glyphs and
// hanging markers within that painted boundary at the largest reading size.
export const guideContentWidth = photoIslandGuide.width - 2 * 0.105;
const guideTopPadding = 0.11;

/** Fit the authored essentials as a whole, with the reader's native wrapping
 * and indents. Authored content is verified at every size without truncation. */
export function layoutGuideEssentials(blocks: readonly ReaderBlock[], size: ReadingSize) {
  let y = photoIslandGuide.height / 2 - guideTopPadding;
  return blocks.map(block => {
    const measured = measure(block, readingMetrics[size].fontSize, guideContentWidth);
    const placed = placeBlock(measured, 0, measured.rows.length, y, block.kind === 'bullet' || block.kind === 'callout');
    y -= placed.height + itemGap;
    return placed;
  });
}

export function paginateEditorial(blocks: readonly ReaderBlock[], size: ReadingSize) {
  const font = readingMetrics[size].fontSize;
  const present = blocks.filter(block => block.text.trim());
  const source = present.map(block => block.text).join('\n');
  if (source.length > 24000) throw new Error('AR content exceeds layout budget');
  const measured = present.map(block => measure(block, font));

  const pages: EditorialPage[] = [];
  let placed: PlacedReaderBlock[] = [];
  let used = 0;
  let start = 0;
  let end = 0;
  let base = 0;
  let heading: ReturnType<typeof measure> | undefined;

  function finish() {
    if (!placed.length) return;
    pages.push({ start, end, text: source.slice(start, end), blocks: placed });
    start = end;
    placed = [];
    used = 0;
  }

  function place(block: ReturnType<typeof measure>, from: number, count: number, gap: number, marker = false) {
    const blockLayout = placeBlock(block, from, count, top - used - gap, marker);
    placed.push(blockLayout);
    used += gap + blockLayout.height;
  }

  for (const [index, block] of measured.entries()) {
    const nextBase = base + block.text.length + (index < measured.length - 1 ? 1 : 0);
    if (block.kind === 'heading') {
      const next = measured[index + 1];
      const height = block.rows.length * block.lineHeight;
      if (!next || next.kind === 'heading' || height + itemGap + next.lineHeight > pageHeight) {
        throw new Error('AR heading exceeds reader budget');
      }
      const wholeItem = next.rows.length * next.lineHeight;
      const reserve = next.kind === 'bullet' && height + itemGap + wholeItem <= pageHeight + epsilon
        ? wholeItem : next.lineHeight;
      if (used + sectionGap + height + itemGap + reserve > pageHeight + epsilon) finish();
      place(block, 0, block.rows.length, used ? sectionGap : 0);
      heading = block;
      end = nextBase;
    } else {
      let from = 0;
      while (from < block.rows.length) {
        const repeated = block.kind === 'bullet' ? heading : undefined;
        const gap = placed.length ? (block.kind === 'paragraph' && placed.at(-1)?.kind !== 'heading' ? paragraphGap : itemGap) : 0;
        const capacity = Math.floor((pageHeight - used - gap + epsilon) / block.lineHeight);
        const remaining = block.rows.length - from;
        const firstUnderHeading = placed.length === 1 && placed[0].kind === 'heading';
        const freshHeight = pageHeight - (repeated ? repeated.rows.length * repeated.lineHeight + itemGap : 0);
        const fitsWholeOnFreshPage = remaining * block.lineHeight <= freshHeight + epsilon;

        if (capacity < 1 || (from === 0 && block.kind === 'bullet' && remaining > capacity &&
            fitsWholeOnFreshPage && !firstUnderHeading && placed.at(-1)?.kind !== 'heading')) {
          finish();
          if (repeated) place(repeated, 0, repeated.rows.length, 0);
          continue;
        }

        const count = Math.min(remaining, capacity);
        place(block, from, count, gap, block.kind === 'callout' || (from === 0 && block.kind === 'bullet'));
        from += count;
        end = from === block.rows.length ? nextBase : base + block.rows[from - 1].end;
        if (from < block.rows.length) {
          finish();
          if (repeated) place(repeated, 0, repeated.rows.length, 0);
        }
      }
    }
    base = nextBase;
  }
  finish();
  return { source, pages };
}
