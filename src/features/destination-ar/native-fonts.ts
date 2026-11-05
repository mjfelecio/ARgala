/** Viro resolves its own system-font collection. Android's ordinary Text
 * fallback is not inherited: request CJK coverage explicitly for each glyph. */
export function arFontFamily(primary: unknown = 'PlusJakartaSans') {
  const families = (typeof primary === 'string' ? primary : 'PlusJakartaSans').replaceAll("'", '').replaceAll('"', '').split(',').map(value => value.trim()).filter(Boolean);
  if (!families.length) families.push('PlusJakartaSans');
  if (!families.includes('NotoSansCJK')) families.push('NotoSansCJK');
  return families.join(', ');
}
