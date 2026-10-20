import { useQueryClient } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import Constants from 'expo-constants';
import { useState } from 'react';
import { Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Button } from 'heroui-native/button';
import { Spinner } from 'heroui-native/spinner';
import { useThemeColor } from 'heroui-native/hooks';
import { useTranslation } from 'react-i18next';
import { withUniwind } from 'uniwind';
import { RoutePreviewLocationStatus } from './route-preview-location-status';
import { ProviderAttributions } from '@/features/map/attributions';
import { setPlaceSelection } from '@/features/places/selection';
import { useRoutePreview } from './use-route-preview';
import { RoutePreviewMap } from './route-preview-map';
import { RoutePreviewSheet } from './route-preview-sheet';
import { FocusedStatusBar } from '@/features/navigation/focused-status-bar';
import { useSharedValue } from 'react-native-reanimated';
import { destinationIdForRoutePlace } from '@/features/destinations/routing';

const StyledSafeAreaView = withUniwind(SafeAreaView);
export default function RoutePreviewScreen() {
  const { token } = useLocalSearchParams();
  // Different URL intents have independent leases and native map readiness.
  return <Preview key={typeof token === 'string' ? token : ''} token={token} />;
}
function Preview({ token }: { token: unknown }) {
  const { t } = useTranslation();
  const client = useQueryClient();
  const configured = !!Constants.expoConfig?.extra?.mapsConfigured;
  const preview = useRoutePreview(token, configured);
  const { data, result, location, usable, running } = preview;
  const insets = useSafeAreaInsets();
  const sheetPosition = useSharedValue(0);
  const [headerHeight, setHeaderHeight] = useState(0);
  const [settledDockHeight, setSettledDockHeight] = useState(0);
  const [dockHeight, setDockHeight] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(0);
  const accent = useThemeColor('accent');
  const coordinates = result?.coordinates ?? [];
  const place = data?.intent.place;
  function toMap() {
    // Curated Home-map selection is deferred; never forward catalog IDs to Google's selection path.
    if (place?.provider === 'curated') { router.dismissTo('/'); return; }
    if (place) setPlaceSelection(client, place);
    router.dismissTo(place ? { pathname: '/', params: { placeId: place.providerId } } : '/');
  }
  return <StyledSafeAreaView className="flex-1 bg-surface" edges={['left', 'right']}>
    <FocusedStatusBar style="dark" />
    <View className="flex-1" onLayout={event => setViewportHeight(event.nativeEvent.layout.height)}>
      {place && configured && <RoutePreviewMap place={place} origin={result?.origin} destination={result?.destination ?? place.coordinates} coordinates={coordinates}
        currentPosition={usable ? location.position : null} dockHeight={dockHeight} settledDockHeight={settledDockHeight}
        headerHeight={headerHeight} position={sheetPosition} enabled={running} onViewportHeight={setViewportHeight} />}
      <View testID="route-preview-header" className="absolute inset-x-0 top-0 px-4 pb-2" style={{ paddingTop: insets.top + 8 }} onLayout={event => setHeaderHeight(event.nativeEvent.layout.height)}>
        <View className="min-h-14 flex-row items-center gap-2 rounded-pill bg-surface px-1 pr-4 shadow-sm">
          <Button variant="ghost" className="size-12" isIconOnly accessibilityLabel={t('directions.back')} onPress={() => { if (router.canGoBack()) router.back(); else toMap(); }}><Ionicons name="arrow-back" size={22} color={accent} /></Button>
          <Text accessibilityRole="header" className="shrink font-sans text-card font-semibold text-foreground">{t('directions.title')}</Text>
        </View>
      </View>
      <View testID="route-preview-dock" className="absolute inset-0" pointerEvents="box-none">
      <RoutePreviewSheet height={viewportHeight} headerHeight={headerHeight} bottomInset={insets.bottom} position={sheetPosition}
        onOccupation={setDockHeight} onSettledHeight={setSettledDockHeight}>
        {(expanded, toggle) => <>
          <View className="flex-row items-center justify-between gap-2">
            <Text accessibilityRole="header" accessibilityLabel={place?.name} numberOfLines={expanded ? undefined : 2} className="flex-1 font-sans text-card font-semibold text-foreground">{place?.name ?? t('directions.title')}</Text>
            <Button isIconOnly variant="ghost" className="size-12" accessibilityLabel={t(expanded ? 'map.collapse' : 'map.expand')} accessibilityState={{ expanded }} onPress={toggle}>
              <Ionicons name={expanded ? 'chevron-down-outline' : 'chevron-up-outline'} size={22} color={accent} />
            </Button>
          </View>
          {!place && <Text className="font-sans text-base text-muted">{t('directions.unavailable')}</Text>}
          {place && !Constants.expoConfig?.extra?.mapsConfigured && <Text className="font-sans text-base text-muted">{t('map.missingKey')}</Text>}
          {result && coordinates.length > 1 && <>
            <Text className="font-sans text-title font-bold text-foreground">{t('map.routeSummary', { meters: result.route.distanceMeters, minutes: Math.ceil(result.route.durationSeconds / 60) })}</Text>
          </>}
          {place && preview.locationEnabled && data?.status === 'waiting' && <Text accessibilityLiveRegion="polite" className="font-sans text-sm text-muted">{t('directions.waiting')}</Text>}
          {place && preview.locationEnabled && !usable && <><RoutePreviewLocationStatus location={location} />{location.status === 'ready' && <><Text className="font-sans text-sm text-muted">{t('directions.stale')}</Text><Button variant="outline" accessibilityLabel={t('location.retry')} onPress={location.retry}><Button.Label>{t('location.retry')}</Button.Label></Button></>}</>}
          {data?.status === 'waiting' && preview.expired && <Text className="font-sans text-sm text-muted">{t('directions.unavailable')}</Text>}
          {data?.status === 'pending' && <View className="gap-2"><Spinner size="sm" /><Text accessibilityLiveRegion="polite" className="font-sans text-sm text-muted">{t('map.routeLoading')}</Text></View>}
          {data?.errorKey && <Text accessibilityLiveRegion="polite" className="font-sans text-sm text-danger">{t(data.errorKey)}</Text>}
          {preview.needsRetry && <Button variant="outline" accessibilityLabel={t('directions.retry')} isDisabled={!running || !configured} onPress={preview.retry}><Button.Label>{t('directions.retry')}</Button.Label></Button>}
          {expanded && place && <View className="gap-2 border-t border-outline pt-3">
            <Text className="font-sans text-xs font-semibold text-brand-strong">{t('directions.origin')}</Text>
            <Text className="font-sans text-sm text-muted">{t('directions.snapshot')}</Text>
            <Text className="font-sans text-xs font-semibold text-brand-strong">{t('directions.destination')}</Text>
            <Text className="font-sans text-card font-semibold text-foreground">{place.name}</Text>
            {place.address && <Text className="font-sans text-sm text-muted">{place.address}</Text>}
            {place.description && <Text className="font-sans text-sm text-foreground">{place.description}</Text>}
          </View>}
          {expanded && result && <>
            <Text className="font-sans text-sm text-muted">{t('map.walkingCaution')}</Text>
            {result.route.warnings.map((warning, index) => <Text key={index} className="font-sans text-sm text-muted">{warning}</Text>)}
          </>}
          {place && <ProviderAttributions places={[place]} />}
          {expanded && <View className="flex-row flex-wrap gap-2">
            <Button variant="secondary" className="h-auto min-h-12 min-w-36 grow shrink py-3" accessibilityLabel={t('directions.map')} onPress={toMap}><Ionicons name="map-outline" size={22} color={accent} /><Button.Label className="shrink text-center">{t('directions.map')}</Button.Label></Button>
            {place && <Button className="h-auto min-h-12 min-w-36 grow shrink py-3" accessibilityLabel={t('directions.details')} onPress={() => {
              if (place.provider === 'curated') {
                const destinationId = destinationIdForRoutePlace(place);
                router.dismissTo(destinationId ? { pathname: '/destinations/[destinationId]', params: { destinationId } } : '/destinations');
                return;
              }
              setPlaceSelection(client, place);
              router.dismissTo({ pathname: '/place/[providerId]', params: { providerId: place.providerId } });
            }}><Button.Label className="shrink text-center">{t('directions.details')}</Button.Label></Button>}
          </View>}
        </>}
      </RoutePreviewSheet>
      </View>
    </View>
  </StyledSafeAreaView>;
}
