import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode, type ComponentProps } from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Text, View, useWindowDimensions } from 'react-native';
import { useTranslation } from 'react-i18next';
import BottomSheet, { BottomSheetHandle, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { useAnimatedReaction, useSharedValue, type SharedValue } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { useResolveClassNames, withUniwind } from 'uniwind';
import { Button } from 'heroui-native/button';
import { Chip } from 'heroui-native/chip';
import { useThemeColor } from 'heroui-native/hooks';
import { StatusRow } from '@/ui/status-row';
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
  featured?: boolean; selectionName?: string; canLoadDetails?: boolean; extraStatus?: ReactNode; onCompactHeight?(height: number): void;
  saveAction?: ReactNode; selectionSummary?: string; selectionMedia?: ReactNode; locationStatus?: ReactNode; mapLoading?: boolean;
  attributions: ReactNode; onRetrySearch(): void; onClosePlace(): void; onDetails(): void;
  onViewDetails?(): void; onDirections(): void; onOpenGoogle?(): void; onMeasuredHeight(height: number): void;
  animatedPosition?: SharedValue<number>;
  onSettledHeight?(height: number): void; maxHeight?: number; containerHeight?: number;
};
export function HomePlaceSheet({ geometry, state, selectedPlace: place, selectionName, hasSelection, featured, canLoadDetails, extraStatus, onCompactHeight, canRequest, resultCount, errorKey, detailsLoading, detailsLoaded, saveAction, selectionSummary, selectionMedia, locationStatus, mapLoading, attributions, onRetrySearch, onClosePlace, onDetails, onViewDetails, onDirections, onOpenGoogle, onMeasuredHeight, onSettledHeight, maxHeight, containerHeight, animatedPosition }: HomePlaceSheetProps) {
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
  const compactParts = useRef({ header: 0, actions: 0 });
  const alive = useRef(true);
  useLayoutEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);
  function measureCompact(part: 'header' | 'actions', value: number) {
    if (!alive.current || !Number.isFinite(value) || value <= 0) return;
    compactParts.current[part] = value;
    const { header, actions } = compactParts.current;
    if (header && (!hasSelection || actions)) onCompactHeight?.(header + (hasSelection ? actions + 12 : 0) + 24 + 24);
  }
  const busy = state === 'loading';
  const canLoad = canLoadDetails ?? canRequest;
  // Keep native opening pending until the handle is measured. In 5.2.14,
  // disabling mount animation can discard opening before layout is ready.
  return <BottomSheet ref={sheet} containerLayoutState={containerLayoutState} snapPoints={snapPoints}
    index={0} enableDynamicSizing={false} enablePanDownToClose={false} animateOnMount
    animatedPosition={position} animatedIndex={animatedIndex} handleComponent={MapSheetHandle} backgroundStyle={backgroundStyle} handleIndicatorStyle={indicatorStyle}
    accessible={false} accessibilityLabel={t('map.title')}
    onChange={(index, top) => { setSettledIndex(index); if (snapPoints.length > 1) setExpanded(index > 0); reportPosition(top); onSettledHeight?.(Math.max(0, height - top)); }}>
    <SheetScrollView className="flex-1" contentContainerClassName="gap-3 px-5 pb-6">
      <View testID="home-place-header" className="gap-3" onLayout={event => measureCompact('header', event.nativeEvent.layout.height)}>
        {featured && <View className="self-start rounded-pill bg-mint px-3 py-1"><Text className="font-sans text-xs font-ui-semibold text-brand-strong">{t('exploreCleanup.featuredBadge')}</Text></View>}
        <View className="flex-row items-start gap-1">
          <Text accessibilityRole="header" className="min-w-0 flex-1 font-sans text-section font-ui-bold text-brand-strong">{hasSelection ? place?.name ?? selectionName ?? t('exploreCleanup.selectedPlace') : t('map.title')}</Text>
          {hasSelection && <Button isIconOnly variant="ghost" className="size-12" accessibilityLabel={t('map.closePlace')} onPress={onClosePlace}><Ionicons name="close-outline" size={22} color={ink} accessible={false} /></Button>}
          <Button isIconOnly variant="ghost" className="size-12" accessibilityLabel={t(expanded ? 'map.collapse' : 'map.expand')} accessibilityState={{ expanded }}
            onPress={() => { const next = !expanded; setExpanded(next); sheet.current?.snapToIndex(next ? snapPoints.length - 1 : 0); }}>
            <Ionicons name={expanded ? 'chevron-down-outline' : 'chevron-up-outline'} size={22} color={ink} accessible={false} />
          </Button>
        </View>
        {locationStatus}
        {mapLoading && <Message busy>{t('map.loading')}</Message>}
        {state === 'unsearched' && <Message>{t('map.start')}</Message>}
        {state === 'loading' && <Message busy>{t('map.searching')}</Message>}
        {state === 'empty' && <Message>{t('map.empty')}</Message>}
        {state === 'results' && <Chip variant="secondary"><Chip.Label>{t('map.results', { count: resultCount })}</Chip.Label></Chip>}
        {selectionSummary && <Text className="font-sans text-sm text-muted">{selectionSummary}</Text>}
        {hasSelection && detailsLoading && <Message busy>{t('map.details')}</Message>}
        {errorKey && <Message error>{t(errorKey)}</Message>}
      </View>
      {state === 'failed' && <Button variant="outline" accessibilityLabel={t('common.retry')} isDisabled={!canLoad || busy} onPress={onRetrySearch}><Button.Label>{t('common.retry')}</Button.Label></Button>}
      {hasSelection && <>
        {expanded && selectionMedia}
        <View testID="home-place-actions" className="gap-3" onLayout={event => measureCompact('actions', event.nativeEvent.layout.height)}>
          {onOpenGoogle && <Button variant="primary" className="h-auto min-h-12 w-full py-3" accessibilityLabel={t('map.openGoogle')} onPress={onOpenGoogle}><Button.Label className="shrink text-center">{t('map.openGoogle')}</Button.Label></Button>}
          <View className="flex-row flex-wrap items-start gap-2">
            <Button variant="outline" className="h-auto min-h-12 min-w-28 flex-1 py-3" accessibilityLabel={t('placeDetails.directions')} onPress={onDirections} isDisabled={!canRequest} accessibilityState={{ disabled: !canRequest }}><Ionicons name="navigate-outline" size={20} color={ink} accessible={false} /><Button.Label className="shrink text-center">{t('placeDetails.directions')}</Button.Label></Button>
            {saveAction && <View className="min-w-28 flex-1">{saveAction}</View>}
          </View>
        </View>
        {featured && onViewDetails && <Button variant="ghost" accessibilityLabel={t('placeDetails.view')} onPress={onViewDetails}><Button.Label className="shrink text-center">{t('exploreCleanup.viewDestination')}</Button.Label><Ionicons name="chevron-forward" size={18} color={ink} accessible={false} /></Button>}
        {expanded && <>{place?.address && <Text className="font-sans text-sm text-muted">{place.address}</Text>}{place?.description && <Text className="font-sans text-sm text-muted">{place.description}</Text>}</>}
        {!detailsLoaded && <Button variant="outline" accessibilityLabel={t('exploreCleanup.loadDetails')} onPress={onDetails} isDisabled={!canLoad || detailsLoading} accessibilityState={{ busy: !!detailsLoading, disabled: !canLoad || !!detailsLoading }}><Button.Label>{t('exploreCleanup.loadDetails')}</Button.Label></Button>}
      </>}
      {extraStatus}
      {expanded && <Text className="font-sans text-xs font-ui-medium text-muted">{t('map.limit', { count: DISCOVERY.maxResults, meters: DISCOVERY.radiusMeters })}</Text>}
      {attributions}
    </SheetScrollView>
  </BottomSheet>;
}
function Message({ children, busy, error }: { children: ReactNode; busy?: boolean; error?: boolean }) {
  return <StatusRow busy={busy} error={error}>{children}</StatusRow>;
}
