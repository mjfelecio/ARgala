import { ringMetrics } from './scene-geometry';

/** All sizes are local to the focused native frame, never camera/screen bounds. */
export const nativePanelActionHeight = 0.18;
const surfaceHeight = ringMetrics.panelHeight + 0.025;
export const readerLayout = {
  body: { y: -0.09, height: 0.82 },
  image: { y: 0.055, height: 0.76 },
  caption: { y: -0.465, height: 0.24 },
  toolbar: { y: -surfaceHeight / 2 - 0.04 - nativePanelActionHeight / 2, width: 1.49, height: 0.22 },
} as const;
// Two font-point heights per conservative row preserves the existing native
// WordWrap/CJK safety allowance while budgeting the actual new reading boxes.
export const readerLineBudget = (height: number, fontSize: number) => Math.max(1, Math.floor((height + 1e-9) / (fontSize * 0.02)));
