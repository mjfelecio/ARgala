import { useCallback, useEffect, useMemo, useRef, useState, type ComponentProps, type ReactNode } from 'react';
import { useWindowDimensions } from 'react-native';
import BottomSheet, { BottomSheetHandle, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { useAnimatedReaction, useSharedValue, type SharedValue } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { useResolveClassNames, withUniwind } from 'uniwind';
const Scroll = withUniwind(BottomSheetScrollView);
function Handle(props: ComponentProps<typeof BottomSheetHandle>) { return <BottomSheetHandle {...props} accessible={false} />; }
export function RoutePreviewSheet({ height, headerHeight, bottomInset, position, onOccupation, onSettledHeight, children }: {
  height: number; headerHeight: number; bottomInset: number; position: SharedValue<number>;
  onOccupation(height: number): void; onSettledHeight(height: number): void; children(expanded: boolean, toggle: () => void): ReactNode;
}) {
  const { fontScale = 1 } = useWindowDimensions();
  const [expanded, setExpanded] = useState(false);
  const cap = Math.max(1, height - headerHeight - 64);
  const peek = Math.min(cap, 168 * Math.max(1, fontScale) + bottomInset);
  const full = Math.max(peek, Math.min(cap, height * 0.72));
  const snapPoints = useMemo(() => peek < full ? [peek, full] : [peek], [peek, full]);
  const containerLayoutState = useSharedValue({ height: Math.max(1, height), offset: { top: 0, bottom: 0, left: 0, right: 0 } });
  useEffect(() => { containerLayoutState.set(previous => ({ ...previous, height: Math.max(1, height) })); }, [height, containerLayoutState]);
  const index = expanded ? snapPoints.length - 1 : 0;
  const occupied = snapPoints[index];
  const appliedGeometry = useRef<{ height: number; headerHeight: number; peek: number; full: number } | null>(null);
  useEffect(() => {
    // Only synthesize occupation for initial/changed layout. Index requests must
    // leave the animated position and settled fit to native motion/onChange.
    const previous = appliedGeometry.current;
    if (previous?.height === height && previous.headerHeight === headerHeight && previous.peek === peek && previous.full === full) return;
    appliedGeometry.current = { height, headerHeight, peek, full };
    position.set(height - occupied); onOccupation(occupied); onSettledHeight(occupied);
  }, [height, headerHeight, peek, full, occupied, position, onOccupation, onSettledHeight]);
  const lastReport = useSharedValue(0);
  const report = useCallback((top: number) => onOccupation(Math.max(0, Math.min(height, height - top))), [height, onOccupation]);
  useAnimatedReaction(() => position.get(), (top, previous) => {
    if (top === previous) return;
    const now = Date.now();
    const atDetent = snapPoints.some(point => Math.abs(top - (height - point)) < 0.5);
    if (now - lastReport.get() >= 80 || atDetent) { lastReport.set(now); scheduleOnRN(report, top); }
  }, [height, snapPoints, report]);
  const backgroundStyle = useResolveClassNames('bg-surface rounded-t-sheet rounded-b-none');
  const handleIndicatorStyle = useResolveClassNames('bg-border');
  return <BottomSheet index={index} snapPoints={snapPoints} containerLayoutState={containerLayoutState}
    animateOnMount enableOverDrag={false} enableDynamicSizing={false} enablePanDownToClose={false} animatedPosition={position}
    handleComponent={Handle} accessible={false} backgroundStyle={backgroundStyle} handleIndicatorStyle={handleIndicatorStyle}
    onChange={(next, top) => { if (snapPoints.length > 1) setExpanded(next > 0); report(top); onSettledHeight(Math.max(0, height - top)); }}>
    <Scroll className="flex-1" contentContainerClassName="gap-3 px-5" contentContainerStyle={{ paddingBottom: bottomInset + 24 }}>
      {children(expanded, () => setExpanded(value => !value))}
    </Scroll>
  </BottomSheet>;
}
