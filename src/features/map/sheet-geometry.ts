/** Map coverage behind the rounded dock corners, in React Native dp (1.5 rem). */
export const MAP_SHEET_OVERLAP = 24;
/** Native handle and scroll-content clearance are included once in the route peek. */
export const ROUTE_SHEET_HANDLE_HEIGHT = 24;
export const ROUTE_SHEET_BOTTOM_GAP = 24;

/** Shared by each scene and its dock so the map baseline cannot drift from the peek. */
export function homeSheetGeometry(height: number, maxHeight: number | undefined, hasSelection: boolean, fontScale: number) {
  const cap = Math.max(1, Math.min(height, maxHeight ?? height * 0.6));
  return { cap, peek: Math.min(cap, (hasSelection ? 264 : 156) * Math.max(1, fontScale)) };
}
export function routeSheetGeometry(height: number, headerHeight: number, bottomInset: number, fontScale: number, primaryHeight?: number) {
  const cap = Math.max(1, height - headerHeight - 64);
  // Start conservatively until native layout measures the compact title, modes
  // and all primary actions. Expanded details never participate in this height.
  const contentHeight = primaryHeight !== undefined && Number.isFinite(primaryHeight) && primaryHeight > 0
    ? primaryHeight : 272 * Math.max(1, fontScale);
  const peek = Math.min(cap, contentHeight + ROUTE_SHEET_HANDLE_HEIGHT + ROUTE_SHEET_BOTTOM_GAP + bottomInset);
  return { cap, peek, full: Math.max(peek, Math.min(cap, height * 0.72)) };
}
