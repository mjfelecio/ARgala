import type { ComponentProps } from 'react';
import { ViroText } from '@reactvision/react-viro';
import type { ArNativeStyle } from './native-styles';

const textureScale = 8;
type Props = Omit<ComponentProps<typeof ViroText>, 'style' | 'width' | 'height' | 'scale'> & {
  width: number; height: number; style: ReturnType<ArNativeStyle['text']>;
};
/** Rasterize larger glyphs, then reduce the whole layout to its intended world size.
 * Viro fontSize controls texture resolution; 3–8 point textures visibly pixelate.
 * Dimensions and glyph size use the same factor so wrapping/pagination stay local.
 * Text is decorative: it cannot steal hits from the visible action quad.
 * Draw after backplates; alpha glyph quads write depth in the pinned renderer.
 */
export function ArText({ width, height, style, renderingOrder = 2, ...props }: Props) {
  return <ViroText {...props} renderingOrder={renderingOrder} ignoreEventHandling width={width * textureScale} height={height * textureScale}
    scale={[1 / textureScale, 1 / textureScale, 1 / textureScale]} style={{ ...style, fontSize: style.fontSize * textureScale }} />;
}
