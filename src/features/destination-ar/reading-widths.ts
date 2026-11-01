// Conservative em advances for printable ASCII (U+0020–U+007E): the maximum
// measured from bundled Plus Jakarta Sans Regular and Android Roboto Regular,
// rounded upward to 0.001 em. Font metrics only; no font assets are copied.
const asciiAdvances = [
  0.249, 0.282, 0.395, 0.79, 0.646, 0.974, 0.734, 0.245, 0.343, 0.349, 0.479, 0.606, 0.27, 0.498, 0.286, 0.429,
  0.732, 0.563, 0.6, 0.609, 0.63, 0.616, 0.597, 0.563, 0.628, 0.597, 0.286, 0.306, 0.606, 0.606, 0.606, 0.499,
  0.929, 0.653, 0.693, 0.781, 0.742, 0.612, 0.581, 0.821, 0.736, 0.272, 0.552, 0.654, 0.539, 0.874, 0.736, 0.878,
  0.643, 0.878, 0.641, 0.646, 0.597, 0.7, 0.652, 0.984, 0.627, 0.623, 0.6, 0.315, 0.429, 0.315, 0.606, 0.598,
  0.352, 0.572, 0.667, 0.6, 0.667, 0.615, 0.393, 0.662, 0.573, 0.244, 0.24, 0.548, 0.244, 0.908, 0.573, 0.655,
  0.667, 0.667, 0.339, 0.517, 0.388, 0.573, 0.517, 0.797, 0.497, 0.536, 0.497, 0.339, 0.3, 0.339, 0.681,
] as const;

export const readingContentWidth = 1.08;
// Pinned Viro 3.0.3 VROText.h: one font point is 0.01 world units.
// ArText's 8x rasterization and reciprocal scale cancel in world space.
const pointToWorld = 0.01;
export const readingEmBudget = (fontSize: number) => (readingContentWidth - 0.04) / (fontSize * pointToWorld);

export function graphemeAdvance(segment: string, fontSize: number) {
  let advance = 0;
  for (const char of segment) {
    const code = char.codePointAt(0)!;
    if (code === 0x200d || code >= 0x300 && code <= 0x36f || code >= 0xfe00 && code <= 0xfe0f || code >= 0xe0100 && code <= 0xe01ef) continue;
    const em = code === 9 ? asciiAdvances[0] * 4 : code >= 32 && code <= 126 ? asciiAdvances[code - 32]
      : code >= 0x1f000 ? 2 : code >= 0x1100 && code <= 0xffff ? 1 : 1.2;
    // Round each glyph's hinted texture advance upward, rather than assuming
    // fractional font metrics survive native bitmap rasterization exactly.
    advance += Math.ceil(em * fontSize * 8) / (fontSize * 8);
  }
  return advance;
}
