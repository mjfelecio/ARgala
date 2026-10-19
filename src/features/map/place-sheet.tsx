import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode, type ComponentProps } from 'react';
import { Text, View, useWindowDimensions } from 'react-native';
import { useTranslation } from 'react-i18next';
import BottomSheet, { BottomSheetHandle, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { useAnimatedReaction, useSharedValue } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { useResolveClassNames, withUniwind } from 'uniwind';
import { Button } from 'heroui-native/button';
import { Card } from 'heroui-native/card';
import { Chip } from 'heroui-native/chip';
import { useThemeColor } from 'heroui-native/hooks';
import { Spinner } from 'heroui-native/spinner';
import { DISCOVERY } from '@/config/limits';
import type { Place } from '@/features/places/service';

const SheetScrollView = withUniwind(BottomSheetScrollView);
// TalkBack uses the translated expand/collapse button, not the SDK's English handle.
function MapSheetHandle(props: ComponentProps<typeof BottomSheetHandle>) {
  return <BottomSheetHandle {...props} accessible={false} />;
}
export type HomePlaceSheetState = 'unsearched' | 'loading' | 'empty' | 'failed' | 'results' | 'selected' | 'route-loading' | 'route-ready' | 'route-failed';
export type HomePlaceSheetProps = {
  state: HomePlaceSheetState; selectedPlace: Place | null; hasSelection: boolean;
  canRequest: boolean; resultCount: number; errorKey?: string; detailsLoading?: boolean; detailsLoaded?: boolean;
  selectionSummary?: string; locationStatus?: ReactNode; mapLoading?: boolean;
  route?: { distanceMeters: number; durationSeconds: number; warnings: string[] };
  attributions: ReactNode; onRetrySearch(): void; onClosePlace(): void; onDetails(): void;
  onWalk(): void; onOpenGoogle?(): void; onMeasuredHeight(height: number): void;
  onSettledHeight?(height: number): void; maxHeight?: number; containerHeight?: number;
};
export function HomePlaceSheet({ state, selectedPlace: place, hasSelection, canRequest, resultCount, errorKey, detailsLoading, detailsLoaded, selectionSummary, locationStatus, mapLoading, route, attributions, onRetrySearch, onClosePlace, onDetails, onWalk, onOpenGoogle, onMeasuredHeight, onSettledHeight, maxHeight, containerHeight }: HomePlaceSheetProps) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const [settledIndex, setSettledIndex] = useState(0);
  const onAccent = useThemeColor('accent-foreground');
  const sheet = useRef<BottomSheet>(null);
  const window = useWindowDimensions();
  const height = containerHeight || window.height;
  const containerLayoutState = useSharedValue({ height, offset: { top: 0, bottom: 0, left: 0, right: 0 } });
  useEffect(() => {
    // Gorhom also writes measured offsets; retain them when the map resizes.
    containerLayoutState.set(current => ({ ...current, height }));
  }, [containerLayoutState, height]);
  const gutter = useResolveClassNames('p-4').padding as number;
  const cap = Math.max(1, Math.min(height, maxHeight ?? height * 0.6));
  const peek = Math.min(cap, Math.max(gutter * 10, cap * 0.65));
  const snapPoints = useMemo(() => peek < cap ? [peek, cap] : [cap], [peek, cap]);
  const position = useSharedValue(height - peek);
  const animatedIndex = useSharedValue(0);
  const lastReportedAt = useSharedValue(0);
  const backgroundStyle = useResolveClassNames('bg-surface rounded-t-sheet rounded-b-none');
  const indicatorStyle = useResolveClassNames('bg-border');
  const reportPosition = useCallback((top: number) => onMeasuredHeight(Math.max(0, Math.min(height, height - top))), [height, onMeasuredHeight]);
  // Credit padding follows the native gesture; fitting uses the settled callback only.
  // Bound JS/native map updates while retaining the exact final position on settle.
  useAnimatedReaction(() => ({ top: position.value, index: animatedIndex.value }), ({ top, index }) => {
    const now = Date.now();
    const nearestIndex = Math.round(index);
    const target = snapPoints[nearestIndex];
    const settled = target !== undefined && Math.abs(index - nearestIndex) < 0.001 && Math.abs(top - (height - target)) < 0.5;
    if (now - lastReportedAt.value >= 80 || settled) {
      lastReportedAt.value = now;
      scheduleOnRN(reportPosition, top);
    }
  }, [height, snapPoints, reportPosition]);
  const settledHeight = snapPoints[Math.min(settledIndex, snapPoints.length - 1)];
  useEffect(() => {
    onMeasuredHeight(settledHeight);
    onSettledHeight?.(settledHeight);
  }, [settledHeight, onMeasuredHeight, onSettledHeight]);
  const busy = state === 'loading' || state === 'route-loading';
  const routeContent = <>
    {state === 'route-loading' && <Message busy>{t('map.routeLoading')}</Message>}
    {route && <>
      <Message>{t('map.routeSummary', { meters: route.distanceMeters, minutes: Math.ceil(route.durationSeconds / 60) })}</Message>
      <Message>{t('map.walkingCaution')}</Message>
      {route.warnings.map((warning, index) => <Message key={index}>{warning}</Message>)}
    </>}
  </>;
  return <BottomSheet ref={sheet} containerLayoutState={containerLayoutState} snapPoints={snapPoints}
    index={0} enableDynamicSizing={false} enablePanDownToClose={false} animateOnMount={false}
    animatedPosition={position} animatedIndex={animatedIndex} handleComponent={MapSheetHandle} backgroundStyle={backgroundStyle} handleIndicatorStyle={indicatorStyle}
    accessible={false} accessibilityLabel={t('map.title')}
    onChange={(index, top) => { setSettledIndex(index); if (snapPoints.length > 1) setExpanded(index > 0); reportPosition(top); onSettledHeight?.(Math.max(0, height - top)); }}>
    <SheetScrollView className="flex-1" contentContainerClassName="gap-3 p-4 pb-8">
      <View className="flex-row flex-wrap items-center justify-between gap-2">
        <Text accessibilityRole="header" className="shrink font-sans text-card font-semibold text-brand-strong">{t('map.title')}</Text>
        <Button variant="secondary" accessibilityLabel={t(expanded ? 'map.collapse' : 'map.expand')} accessibilityState={{ expanded }}
          onPress={() => { const next = !expanded; setExpanded(next); sheet.current?.snapToIndex(next ? snapPoints.length - 1 : 0); }}>
          <Button.Label>{t(expanded ? 'map.collapse' : 'map.expand')}</Button.Label>
        </Button>
      </View>
      {locationStatus}
      {mapLoading && <Message busy>{t('map.loading')}</Message>}
      {state === 'unsearched' && <Message>{t('map.start')}</Message>}
      {state === 'loading' && <Message busy>{t('map.searching')}</Message>}
      {state === 'empty' && <Message>{t('map.empty')}</Message>}
      {state === 'results' && <Chip variant="secondary"><Chip.Label>{t('map.results', { count: resultCount })}</Chip.Label></Chip>}
      {errorKey && <Message error>{t(errorKey)}</Message>}
      {state === 'failed' && <Button variant="outline" accessibilityLabel={t('common.retry')} isDisabled={!canRequest || busy} onPress={onRetrySearch}><Button.Label>{t('common.retry')}</Button.Label></Button>}
      {hasSelection && <>
        {detailsLoading && <Message busy>{t('map.details')}</Message>}
        {!place && <><Message>{t('map.selectionUnavailable')}</Message>{routeContent}</>}
        {place && <Card variant="transparent" className="gap-3 p-0 shadow-none">
          <Card.Header><Text accessibilityRole="header" className="font-sans text-title font-bold text-foreground">{place.name}</Text></Card.Header>
          <Card.Body className="gap-3">
            {routeContent}
            {selectionSummary && <Text className="font-sans text-sm text-muted">{selectionSummary}</Text>}
            {expanded && <>
              {place.address && <Text className="font-sans text-sm text-muted">{place.address}</Text>}
              {place.description && <Text className="font-sans text-sm text-muted">{place.description}</Text>}
              {place.mapsUri && onOpenGoogle && <Button variant="outline" accessibilityLabel={t('map.openGoogle')} onPress={onOpenGoogle}><Button.Label>{t('map.openGoogle')}</Button.Label></Button>}
            </>}
          </Card.Body>
          <Card.Footer><Button accessibilityLabel={t('map.walk')} onPress={onWalk} isDisabled={!canRequest || state === 'route-loading'} accessibilityState={{ busy: state === 'route-loading', disabled: !canRequest || state === 'route-loading' }}>
            {state === 'route-loading' && <Spinner size="sm" color={onAccent} />}<Button.Label>{t('map.walk')}</Button.Label>
          </Button></Card.Footer>
        </Card>}
        {!detailsLoaded && <Button variant="outline" accessibilityLabel={t('ar.more')} onPress={onDetails} isDisabled={!canRequest || detailsLoading} accessibilityState={{ busy: !!detailsLoading, disabled: !canRequest || !!detailsLoading }}><Button.Label>{t('ar.more')}</Button.Label></Button>}
        <Button variant="secondary" accessibilityLabel={t('map.closePlace')} onPress={onClosePlace}><Button.Label>{t('map.closePlace')}</Button.Label></Button>
      </>}
      {!hasSelection && routeContent}
      {(expanded || !hasSelection) && <Text className="font-sans text-xs font-medium text-muted">{t('map.limit', { count: DISCOVERY.maxResults, meters: DISCOVERY.radiusMeters })}</Text>}
      {attributions}
    </SheetScrollView>
  </BottomSheet>;
}
function Message({ children, busy, error }: { children: ReactNode; busy?: boolean; error?: boolean }) {
  return <View className="gap-2">{busy && <Spinner size="sm" />}<Text accessibilityLiveRegion="polite" className={error ? 'font-sans text-sm text-danger' : 'font-sans text-sm text-muted'}>{children}</Text></View>;
}
