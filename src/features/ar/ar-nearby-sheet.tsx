import { useEffect, useMemo, useRef, useState, type ComponentProps, type ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';
import BottomSheet, { BottomSheetHandle, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { useSharedValue, type SharedValue } from 'react-native-reanimated';
import { useResolveClassNames, withUniwind } from 'uniwind';
import { Button } from 'heroui-native/button';
import { Spinner } from 'heroui-native/spinner';
import { useThemeColor } from 'heroui-native/hooks';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTranslation } from 'react-i18next';
import { DISCOVERY } from '@/config/limits';
import type { Place } from '@/features/places/service';

const SheetScrollView = withUniwind(BottomSheetScrollView);
function ArSheetHandle(props: ComponentProps<typeof BottomSheetHandle>) {
  return <BottomSheetHandle {...props} accessible={false} />;
}
export type ArNearbySheetProps = {
  rows: { place: Place; distance: number | undefined }[]; selected: Place | null; distance: number | undefined;
  state: 'unscanned' | 'scanning' | 'empty' | 'failed' | 'results'; status: ReactNode; guidance?: ReactNode;
  running: boolean; height: number; fontScale: number; selectionRevision: number;
  detailsLoaded: boolean; detailsBusy: boolean; position: SharedValue<number>;
  onSelect(id: string): void; onMore(): void; onDetails(): void; onDirections(): void; onMap(): void;
  onOccupation(height: number): void;
};
/** Camera dock: it owns presentation/gestures, never selection authority or provider calls. */
export function ArNearbySheet({ rows, selected, distance, state, status, guidance, running, height, fontScale, selectionRevision,
  detailsLoaded, detailsBusy, position, onSelect, onMore, onDetails, onDirections, onMap, onOccupation }: ArNearbySheetProps) {
  const { t } = useTranslation();
  const accent = useThemeColor('accent');
  const [showGuidance, setShowGuidance] = useState(false);
  const [expansionOverride, setExpansionOverride] = useState<{ revision: number; expanded: boolean } | null>(null);
  const expanded = expansionOverride?.revision === selectionRevision ? expansionOverride.expanded : selectionRevision > 0;
  const cap = Math.max(1, height);
  const peek = Math.min(cap, 144 * Math.max(1, fontScale));
  const full = Math.max(peek, cap * 0.72);
  const snapPoints = useMemo(() => peek < full ? [peek, full] : [peek], [peek, full]);
  const containerLayoutState = useSharedValue({ height: cap, offset: { top: 0, bottom: 0, left: 0, right: 0 } });
  const backgroundStyle = useResolveClassNames('bg-surface rounded-t-sheet rounded-b-none');
  const indicatorStyle = useResolveClassNames('bg-border');
  useEffect(() => { containerLayoutState.set(current => ({ ...current, height: cap })); }, [cap, containerLayoutState]);
  // Keep user intent through a one-detent viewport; native geometry is clamped separately.
  const index = expanded ? snapPoints.length - 1 : 0;
  const occupied = snapPoints[index];
  const appliedGeometry = useRef<{ cap: number; peek: number; full: number } | null>(null);
  useEffect(() => {
    // Resize can lack an onChange callback. Expansion itself belongs to the
    // native animation so label clipping follows its actual shared position.
    const previous = appliedGeometry.current;
    if (previous?.cap === cap && previous.peek === peek && previous.full === full) return;
    appliedGeometry.current = { cap, peek, full };
    position.set(cap - occupied); onOccupation(occupied);
  }, [cap, peek, full, occupied, position, onOccupation]);
  const distanceText = (value: number | undefined) => value === undefined ? t('ar.distanceUnknown') : t('ar.distance', { meters: Math.round(value) });
  const compactPlace = selected ?? rows[0]?.place;
  const compactDistance = selected ? distance : rows[0]?.distance;
  // SDK 5.2.14 writes its reactive initial index during render when
  // animateOnMount is false and this controlled index changes. Keep the mount
  // seed at -1; its native layout/effect path still applies the requested index.
  return <BottomSheet index={index} snapPoints={snapPoints} containerLayoutState={containerLayoutState}
    enableDynamicSizing={false} enablePanDownToClose={false} animateOnMount
    animatedPosition={position} handleComponent={ArSheetHandle} accessible={false} accessibilityLabel={t('ar.nearby')}
    backgroundStyle={backgroundStyle} handleIndicatorStyle={indicatorStyle}
    onChange={(next, top) => {
      if (snapPoints.length > 1) setExpansionOverride({ revision: selectionRevision, expanded: next > 0 });
      onOccupation(Math.max(0, cap - top));
    }}>
    <SheetScrollView className="flex-1" contentContainerClassName="gap-3 px-4 pb-6">
      <View className="flex-row flex-wrap items-center justify-between gap-2">
        <Text accessibilityRole="header" className="shrink font-sans text-card font-semibold text-foreground">{t('ar.nearby')}</Text>
        <Button isIconOnly variant="ghost" className="size-12" accessibilityLabel={t(expanded ? 'ar.collapse' : 'ar.expand')}
          accessibilityState={{ expanded }} onPress={() => {
            setExpansionOverride({ revision: selectionRevision, expanded: !expanded });
          }}><Ionicons name={expanded ? 'chevron-down-outline' : 'chevron-up-outline'} size={22} color={accent} /></Button>
      </View>
      {state === 'unscanned' && <Text className="font-sans text-sm text-muted">{t('ar.start')}</Text>}
      {state === 'scanning' && <Text accessibilityLiveRegion="polite" className="font-sans text-sm text-muted">{t('ar.scanning')}</Text>}
      {state === 'empty' && <Text className="font-sans text-sm text-muted">{t('ar.empty')}</Text>}
      {state === 'failed' && <Text className="font-sans text-sm text-danger">{t('ar.scanRetry')}</Text>}
      {compactPlace && !expanded && <View className="min-h-12 flex-row items-center justify-between gap-3 pb-2">
        <Text testID="ar-selected-name" accessibilityRole="header" numberOfLines={1} className="min-w-0 flex-1 font-sans text-sm font-semibold text-foreground">{compactPlace.name}</Text>
        <Text className="font-sans text-sm font-semibold text-muted">{distanceText(compactDistance)}</Text>
      </View>}
      {selected && expanded && <View className="gap-4 pb-2">
        <View className="gap-2">
          <Text testID="ar-selected-name" accessibilityRole="header" className="font-sans text-section font-bold text-foreground">{selected.name}</Text>
          <Text className="font-sans text-base font-semibold text-brand-strong">{distanceText(distance)}</Text>
          {selected.address && <Text className="font-sans text-sm text-muted">{selected.address}</Text>}
          {selected.description && <Text className="font-sans text-sm text-foreground">{selected.description}</Text>}
        </View>
        <View className="gap-1">
          <Button accessibilityLabel={t('ar.directions')} isDisabled={!running} onPress={onDirections}><Button.Label>{t('ar.directions')}</Button.Label></Button>
          <View className="w-full flex-row flex-wrap gap-2">
            <Button variant="ghost" className="min-w-32 grow shrink" accessibilityLabel={t('placeDetails.view')} isDisabled={!running} onPress={onDetails}><Button.Label>{t('placeDetails.view')}</Button.Label></Button>
            <Button variant="ghost" className="min-w-32 grow shrink" accessibilityLabel={t('placeDetails.map')} isDisabled={!running} onPress={onMap}><Button.Label>{t('placeDetails.map')}</Button.Label></Button>
          </View>
          {!detailsLoaded && <Button variant="outline" className="w-full" accessibilityLabel={t('ar.more')} isDisabled={!running || detailsBusy}
            accessibilityState={{ busy: detailsBusy }} onPress={onMore}>{detailsBusy && <Spinner size="sm" />}<Button.Label>{t(detailsBusy ? 'placeDetails.loading' : 'ar.more')}</Button.Label></Button>}
        </View>
      </View>}
      {status}
      {expanded && <View className="gap-1 border-t border-outline pt-3">
        <Button variant="ghost" className="justify-start px-0" accessibilityLabel={t('ar.tracking')} accessibilityState={{ expanded: showGuidance }} onPress={() => setShowGuidance(value => !value)}>
          <Ionicons name="information-circle-outline" size={20} color={accent} /><Button.Label className="grow">{t('ar.tracking')}</Button.Label>
          <Ionicons name={showGuidance ? 'chevron-up-outline' : 'chevron-down-outline'} size={18} color={accent} />
        </Button>
        {showGuidance && <View className="gap-2 pb-3">{guidance}<Text className="font-sans text-xs text-muted">{t('map.limit', { count: DISCOVERY.maxResults, meters: DISCOVERY.radiusMeters })}</Text></View>}
      </View>}
      {rows.length > 0 && <Text accessibilityRole="header" className="border-t border-outline pt-4 font-sans text-sm font-semibold text-foreground">{t('ar.otherNearby')}</Text>}
      {rows.map(({ place, distance }) => <Pressable key={place.providerId} testID={`ar-list-${place.providerId}`} accessibilityRole="button"
        accessibilityLabel={`${place.name}, ${distanceText(distance)}`} accessibilityState={{ selected: selected?.providerId === place.providerId }}
        disabled={!running} onPress={() => onSelect(place.providerId)}
        className="min-h-12 flex-row items-center gap-3 border-b border-outline py-3">
        <View className="min-w-0 flex-1 gap-1"><Text className="font-sans text-sm font-semibold text-foreground">{place.name}</Text>
        <Text className="font-sans text-xs text-muted">{distanceText(distance)}</Text></View>
        <Ionicons name={selected?.providerId === place.providerId ? 'checkmark-circle' : 'chevron-forward-outline'} size={20} color={accent} />
      </Pressable>)}
    </SheetScrollView>
  </BottomSheet>;
}
