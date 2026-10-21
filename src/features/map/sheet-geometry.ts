/** Shared by each scene and its dock so the map baseline cannot drift from the peek. */
export const MAP_SHEET_OVERLAP = 5;

export function homeSheetGeometry(height: number, maxHeight: number | undefined, hasSelection: boolean, fontScale: number) {
  const cap = Math.max(1, Math.min(height, maxHeight ?? height * 0.6));
  return { cap, peek: Math.min(cap, (hasSelection ? 264 : 156) * Math.max(1, fontScale)) };
}
export function routeSheetGeometry(height: number, headerHeight: number, bottomInset: number, fontScale: number) {
  const cap = Math.max(1, height - headerHeight - 64);
  const peek = Math.min(cap, 168 * Math.max(1, fontScale) + bottomInset);
  return { cap, peek, full: Math.max(peek, Math.min(cap, height * 0.72)) };
}
