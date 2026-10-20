import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode, type ComponentProps } from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Text, View, useWindowDimensions } from 'react-native';
import { useTranslation } from 'react-i18next';
import BottomSheet, { BottomSheetHandle, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { useAnimatedReaction, useSharedValue, type SharedValue } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { useResolveClassNames, withUniwind } from 'uniwind';
import { Button } from 'heroui-native/button';
import { Card } from 'heroui-native/card';
import { Chip } from 'heroui-native/chip';
import { useThemeColor } from 'heroui-native/hooks';
import { Spinner } from 'heroui-native/spinner';
import { homeSheetGeometry } from './sheet-geometry';
import { DISCOVERY } from '@/config/limits';
import type { Place } from '@/features/places/service';

const SheetScrollView = withUniwind(BottomSheetScrollView);
// TalkBack uses the translated expand/collapse button, not the SDK's English handle.
function MapSheetHandle(props: ComponentProps<typeof BottomSheetHandle>) {
  return <BottomSheetHandle {...props} accessible={false} />;
}
export type HomePlaceSheetState = 'unsearched' | 'loading' | 'empty' | 'failed' | 'results' | 'selected';
export type HomePlaceSheetProps = {
  geometry?: ReturnType<typeof homeSheetGeometry>;
  state: HomePlaceSheetState; selectedPlace: Place | null; hasSelection: boolean;
  canRequest: boolean; resultCount: number; errorKey?: string; detailsLoading?: boolean; detailsLoaded?: boolean;
  selectionSummary?: string; locationStatus?: ReactNode; mapLoading?: boolean;
  attributions: ReactNode; onRetrySearch(): void; onClosePlace(): void; onDetails(): void;
  onViewDetails?(): void; onDirections(): void; onOpenGoogle?(): void; onMeasuredHeight(height: number): void;
  animatedPosition?: SharedValue<number>;
  onSettledHeight?(height: number): void; maxHeight?: number; containerHeight?: number;
};
export function HomePlaceSheet({ geometry, state, selectedPlace: place, hasSelection, canRequest, resultCount, errorKey, detailsLoading, detailsLoaded, selectionSummary, locationStatus, mapLoading, attributions, onRetrySearch, onClosePlace, onDetails, onViewDetails, onDirections, onOpenGoogle, onMeasuredHeight, onSettledHeight, maxHeight, containerHeight, animatedPosition }: HomePlaceSheetProps) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const [settledIndex, setSettledIndex] = useState(0);
  const ink = useThemeColor('default-foreground');
  const sheet = useRef<BottomSheet>(null);
  const window = useWindowDimensions();
  const height = containerHeight || window.height;
  const containerLayoutState = useSharedValue({ height, offset: { top: 0, bottom: 0, left: 0, right: 0 } });
  useEffect(() => {
    // Gorhom also writes measured offsets; retain them when the map resizes.
    containerLayoutState.set(current => ({ ...current, height }));
  }, [containerLayoutState, height]);
  const { cap, peek } = geometry ?? homeSheetGeometry(height, maxHeight, hasSelection, window.fontScale ?? 1);
  const snapPoints = useMemo(() => peek < cap ? [peek, cap] : [cap], [peek, cap]);
  const localPosition = useSharedValue(height - peek);
  const position = animatedPosition ?? localPosition;
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
    position.set(height - settledHeight);
    onMeasuredHeight(settledHeight);
    onSettledHeight?.(settledHeight);
  }, [height, position, settledHeight, onMeasuredHeight, onSettledHeight]);
  const busy = state === 'loading';
  return <BottomSheet ref={sheet} containerLayoutState={containerLayoutState} snapPoints={snapPoints}
    index={0} enableDynamicSizing={false} enablePanDownToClose={false} animateOnMount={false}
    animatedPosition={position} animatedIndex={animatedIndex} handleComponent={MapSheetHandle} backgroundStyle={backgroundStyle} handleIndicatorStyle={indicatorStyle}
    accessible={false} accessibilityLabel={t('map.title')}
    onChange={(index, top) => { setSettledIndex(index); if (snapPoints.length > 1) setExpanded(index > 0); reportPosition(top); onSettledHeight?.(Math.max(0, height - top)); }}>
    <SheetScrollView className="flex-1" contentContainerClassName="gap-3 px-5 pb-6">
      <View className="flex-row flex-wrap items-center justify-between gap-2">
        <Text accessibilityRole="header" className="shrink font-sans text-card font-semibold text-foreground">{t('map.title')}</Text>
        <Button isIconOnly variant="ghost" className="size-12" accessibilityLabel={t(expanded ? 'map.collapse' : 'map.expand')} accessibilityState={{ expanded }}
          onPress={() => { const next = !expanded; setExpanded(next); sheet.current?.snapToIndex(next ? snapPoints.length - 1 : 0); }}>
          <Ionicons name={expanded ? 'chevron-down-outline' : 'chevron-up-outline'} size={22} color={ink} />
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
        {!place && <><Message>{t('map.selectionUnavailable')}</Message></>}
        {place && <Card variant="transparent" className="gap-3 p-0 shadow-none">
          <Card.Header><Text accessibilityRole="header" className="font-sans text-title font-bold text-foreground">{place.name}</Text></Card.Header>
          <Card.Body className="gap-3">
            {selectionSummary && <Text className="font-sans text-sm text-muted">{selectionSummary}</Text>}
            {expanded && <>
              {place.address && <Text className="font-sans text-sm text-muted">{place.address}</Text>}
              {place.description && <Text className="font-sans text-sm text-muted">{place.description}</Text>}
              {place.mapsUri && onOpenGoogle && <Button variant="outline" accessibilityLabel={t('map.openGoogle')} onPress={onOpenGoogle}><Button.Label>{t('map.openGoogle')}</Button.Label></Button>}
            </>}
          </Card.Body>
          <Card.Footer className="flex-row flex-wrap gap-2">{onViewDetails && <Button variant="secondary" className="h-auto min-h-12 min-w-28 flex-1 py-3" accessibilityLabel={t('placeDetails.view')} onPress={onViewDetails}><Button.Label className="shrink text-center">{t('placeDetails.view')}</Button.Label></Button>}<Button className="h-auto min-h-12 min-w-28 flex-1 py-3" accessibilityLabel={t('placeDetails.directions')} onPress={onDirections} isDisabled={!canRequest} accessibilityState={{ disabled: !canRequest }}>
            <Button.Label className="shrink text-center">{t('placeDetails.directions')}</Button.Label>
          </Button></Card.Footer>
        </Card>}
        {!detailsLoaded && <Button variant="outline" accessibilityLabel={t('ar.more')} onPress={onDetails} isDisabled={!canRequest || detailsLoading} accessibilityState={{ busy: !!detailsLoading, disabled: !canRequest || !!detailsLoading }}><Button.Label>{t('ar.more')}</Button.Label></Button>}
        <Button variant="ghost" accessibilityLabel={t('map.closePlace')} onPress={onClosePlace}><Button.Label>{t('map.closePlace')}</Button.Label></Button>
      </>}
      {expanded && <Text className="font-sans text-xs font-medium text-muted">{t('map.limit', { count: DISCOVERY.maxResults, meters: DISCOVERY.radiusMeters })}</Text>}
      {attributions}
    </SheetScrollView>
  </BottomSheet>;
}
function Message({ children, busy, error }: { children: ReactNode; busy?: boolean; error?: boolean }) {
  return <View className="gap-2">{busy && <Spinner size="sm" />}<Text accessibilityLiveRegion="polite" className={error ? 'font-sans text-sm text-danger' : 'font-sans text-sm text-muted'}>{children}</Text></View>;
}
