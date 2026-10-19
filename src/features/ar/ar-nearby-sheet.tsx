import { useEffect, useMemo, useState, type ComponentProps, type ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';
import BottomSheet, { BottomSheetHandle, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { useSharedValue, type SharedValue } from 'react-native-reanimated';
import { useResolveClassNames, withUniwind } from 'uniwind';
import { Button } from 'heroui-native/button';
import { Card } from 'heroui-native/card';
import { useTranslation } from 'react-i18next';
import { DISCOVERY } from '@/config/limits';
import type { Place } from '@/features/places/service';

const SheetScrollView = withUniwind(BottomSheetScrollView);
function ArSheetHandle(props: ComponentProps<typeof BottomSheetHandle>) {
  return <BottomSheetHandle {...props} accessible={false} />;
}
export type ArNearbySheetProps = {
  rows: { place: Place; distance: number | undefined }[]; selected: Place | null; distance: number | undefined;
  state: 'unscanned' | 'scanning' | 'empty' | 'failed' | 'results'; status: ReactNode;
  running: boolean; height: number; fontScale: number; selectionRevision: number;
  detailsLoaded: boolean; detailsBusy: boolean; position: SharedValue<number>;
  onSelect(id: string): void; onMore(): void; onDetails(): void; onDirections(): void; onMap(): void;
  onOccupation(height: number): void;
};
/** Camera dock: it owns presentation/gestures, never selection authority or provider calls. */
export function ArNearbySheet({ rows, selected, distance, state, status, running, height, fontScale, selectionRevision,
  detailsLoaded, detailsBusy, position, onSelect, onMore, onDetails, onDirections, onMap, onOccupation }: ArNearbySheetProps) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const cap = Math.max(1, height);
  const peek = Math.min(cap, 176 * Math.max(1, fontScale));
  const full = Math.max(peek, cap * 0.72);
  const snapPoints = useMemo(() => peek < full ? [peek, full] : [peek], [peek, full]);
  const containerLayoutState = useSharedValue({ height: cap, offset: { top: 0, bottom: 0, left: 0, right: 0 } });
  const backgroundStyle = useResolveClassNames('bg-surface rounded-t-sheet rounded-b-none');
  const indicatorStyle = useResolveClassNames('bg-border');
  useEffect(() => { containerLayoutState.set(current => ({ ...current, height: cap })); }, [cap, containerLayoutState]);
  // Keep user intent through a one-detent viewport; native geometry is clamped separately.
  const index = expanded ? snapPoints.length - 1 : 0;
  const occupied = snapPoints[index];
  useEffect(() => {
    // Geometry can change without a native onChange for the same snap index.
    position.set(cap - occupied); onOccupation(occupied);
  }, [cap, occupied, position, onOccupation]);
  const selectedId = selected?.providerId;
  const measured = height > 0;
  const [lastSelection, setLastSelection] = useState({ id: selectedId, revision: selectionRevision, measured: false });
  if (lastSelection.id !== selectedId || lastSelection.revision !== selectionRevision || lastSelection.measured !== measured) {
    setLastSelection({ id: selectedId, revision: selectionRevision, measured });
    if (selectedId && measured) setExpanded(true);
  }
  const distanceText = (value: number | undefined) => value === undefined ? t('ar.distanceUnknown') : t('ar.distance', { meters: Math.round(value) });
  return <BottomSheet index={index} snapPoints={snapPoints} containerLayoutState={containerLayoutState}
    enableDynamicSizing={false} enablePanDownToClose={false} animateOnMount={false}
    animatedPosition={position} handleComponent={ArSheetHandle} accessible={false} accessibilityLabel={t('ar.nearby')}
    backgroundStyle={backgroundStyle} handleIndicatorStyle={indicatorStyle}
    onChange={(next, top) => { if (snapPoints.length > 1) setExpanded(next > 0); onOccupation(Math.max(0, cap - top)); }}>
    <SheetScrollView className="flex-1" contentContainerClassName="gap-3 px-4 pb-6">
      <View className="flex-row flex-wrap items-center justify-between gap-2">
        <Text accessibilityRole="header" className="shrink font-sans text-card font-semibold text-brand-strong">{t('ar.nearbyCount', { count: rows.length })}</Text>
        <Button variant="secondary" size="sm" accessibilityLabel={t(expanded ? 'ar.collapse' : 'ar.expand')}
          accessibilityState={{ expanded }} onPress={() => {
            setExpanded(value => !value);
          }}><Button.Label>{t(expanded ? 'ar.collapse' : 'ar.expand')}</Button.Label></Button>
      </View>
      {state === 'unscanned' && <Text className="font-sans text-sm text-muted">{t('ar.start')}</Text>}
      {state === 'scanning' && <Text accessibilityLiveRegion="polite" className="font-sans text-sm text-muted">{t('ar.scanning')}</Text>}
      {state === 'empty' && <Text className="font-sans text-sm text-muted">{t('ar.empty')}</Text>}
      {state === 'failed' && <Text className="font-sans text-sm text-danger">{t('ar.scanRetry')}</Text>}
      {selected && <Card variant="transparent" className="gap-3 p-0 shadow-none">
        <Card.Header className="gap-2">
          <Text testID="ar-selected-name" accessibilityRole="header" numberOfLines={expanded ? undefined : 1} className="font-sans text-section font-bold text-foreground">{selected.name}</Text>
          <Text className="font-sans text-sm text-muted">{distanceText(distance)}</Text>
        </Card.Header>
        <Card.Body className="gap-2">
          {selected.address && <Text className="font-sans text-sm text-muted">{selected.address}</Text>}
          {selected.description && <Text className="font-sans text-sm text-foreground">{selected.description}</Text>}
        </Card.Body>
        <Card.Footer className="flex-col gap-2">
          <View className="w-full flex-row flex-wrap gap-2">
            <Button variant="secondary" className="min-w-32 grow shrink" accessibilityLabel={t('placeDetails.view')} isDisabled={!running} onPress={onDetails}><Button.Label>{t('placeDetails.view')}</Button.Label></Button>
            <Button className="min-w-32 grow shrink" accessibilityLabel={t('ar.directions')} isDisabled={!running} onPress={onDirections}><Button.Label>{t('ar.directions')}</Button.Label></Button>
          </View>
          <Button variant="secondary" className="w-full" accessibilityLabel={t('placeDetails.map')} isDisabled={!running} onPress={onMap}><Button.Label>{t('placeDetails.map')}</Button.Label></Button>
          {!detailsLoaded && <Button variant="outline" className="w-full" accessibilityLabel={t('ar.more')} isDisabled={!running || detailsBusy}
            accessibilityState={{ busy: detailsBusy }} onPress={onMore}><Button.Label>{t('ar.more')}</Button.Label></Button>}
        </Card.Footer>
      </Card>}
      {status}
      <Text className="font-sans text-xs text-muted">{t('map.limit', { count: DISCOVERY.maxResults, meters: DISCOVERY.radiusMeters })}</Text>
      {rows.map(({ place, distance }) => <Pressable key={place.providerId} testID={`ar-list-${place.providerId}`} accessibilityRole="button"
        accessibilityLabel={`${place.name}, ${distanceText(distance)}`} accessibilityState={{ selected: selected?.providerId === place.providerId }}
        disabled={!running} onPress={() => onSelect(place.providerId)}
        className={selected?.providerId === place.providerId ? 'min-h-12 gap-1 rounded-card border border-brand-primary bg-mint p-3' : 'min-h-12 gap-1 rounded-card border border-outline bg-surface p-3'}>
        <Text className="font-sans text-sm font-semibold text-foreground">{place.name}</Text>
        <Text className="font-sans text-xs text-muted">{distanceText(distance)}</Text>
      </Pressable>)}
    </SheetScrollView>
  </BottomSheet>;
}
