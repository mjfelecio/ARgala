import { Fragment } from 'react';
import { ViroQuad } from '@reactvision/react-viro';
import { ArText } from './ar-text';
import type { PlacedReaderBlock } from './editorial-layout';
import type { ArNativeStyle } from './native-styles';
import { readingContentWidth } from './reading-widths';

export function EditorialReaderPage({ blocks, style, contentWidth = readingContentWidth }: { blocks: readonly PlacedReaderBlock[]; style: ArNativeStyle; contentWidth?: number }) {
  return <>{blocks.map((block, index) => {
    const callout = block.kind === 'callout';
    const heading = block.kind === 'heading';
    const rowY = block.y + block.height / 2 - block.fontSize * 0.01;
    return <Fragment key={index}>
      {block.marker && <ViroQuad testID="ring-reader-marker" ignoreEventHandling renderingOrder={1}
        position={[-contentWidth / 2 + 0.018, callout ? block.y : rowY, 0.005]}
        width={callout ? 0.014 : 0.023} height={callout ? block.height * 0.86 : 0.023} materials="argalaRingEdge" />}
      <ArText testID={`ring-reader-${block.kind}`} position={[block.x, block.y, 0.006]} width={block.width} height={block.height}
        text={block.text} textLineBreakMode="WordWrap" textClipMode="ClipToBounds"
        style={{ ...style.text(block.fontSize, 'left', heading || callout ? '600' : '400'), textAlignVertical: 'top' }} />
    </Fragment>;
  })}</>;
}
