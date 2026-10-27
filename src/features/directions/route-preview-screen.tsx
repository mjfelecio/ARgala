import { useQueryClient } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import Constants from 'expo-constants';
import { useRef, useState } from 'react';
import { Linking, Text, View, useWindowDimensions } from 'react-native';
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
import { ArrivalInvitation } from '@/features/destinations/arrival-invitation';
import { createRoutePreviewIntent } from './route-preview-intent';
import { googleMapsNavigationUrl } from './google-maps-navigation';
import type { TravelMode } from '../../../supabase/functions/_shared/contracts';
import { useRoutePreview } from './use-route-preview';
import { RoutePreviewMap } from './route-preview-map';
import { routeSheetGeometry } from '@/features/map/sheet-geometry';
import { RoutePreviewSheet } from './route-preview-sheet';
import { FocusedStatusBar } from '@/features/navigation/focused-status-bar';
import { useSharedValue } from 'react-native-reanimated';
import { destinationIdForRoutePlace } from '@/features/destinations/routing';
import { useWalkingNavigation } from './use-walking-navigation';
import type { Coordinate } from '@/features/location/geo';

const StyledSafeAreaView = withUniwind(SafeAreaView);
const EMPTY_COORDINATES: Coordinate[] = [];
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
  const coordinates = result?.coordinates ?? EMPTY_COORDINATES;
  const place = data?.intent.place;
  const displayedMode = data?.intent.mode ?? 'walking';
  const [draftMode, setDraftMode] = useState<TravelMode | null>(null);
  const desiredMode = draftMode ?? displayedMode;
  const linking = useRef(false); const [linkPending, setLinkPending] = useState(false);
  const [linkError, setLinkError] = useState(false);
  const target = place ? { ...place, coordinates: result?.destination ?? place.coordinates } : null;
  const externalUrl = target ? googleMapsNavigationUrl(target, displayedMode) : null;
  function startExternalNavigation() {
    if (!externalUrl || !running || linking.current) return;
    linking.current = true; setLinkPending(true); setLinkError(false);
    void Linking.openURL(externalUrl).catch(() => setLinkError(true)).finally(() => { linking.current = false; setLinkPending(false); });
  }
  function previewMode() {
    if (!place || !running || desiredMode === displayedMode || data?.status === 'pending') return;
    const next = createRoutePreviewIntent(client, target!, undefined, 'map', data?.intent.language, data?.intent.featuredDestinationId, desiredMode);
    router.setParams({ token: next });
  }
  const navigation = useWalkingNavigation({ coordinates: displayedMode === 'walking' ? coordinates : EMPTY_COORDINATES, destination: result?.destination ?? place?.coordinates,
    location, usable, running, now: preview.now });
  const navigationStatusKey = {
    preview: 'directions.navigationPreview',
    navigating: 'directions.navigationNavigating',
    uncertain: 'directions.navigationUncertainShort',
    'off-route': 'directions.navigationOffRouteShort',
    arrived: 'directions.navigationArrived',
  }[navigation.status];
  const insets = useSafeAreaInsets();
  const sheetPosition = useSharedValue(0);
  const [headerHeight, setHeaderHeight] = useState(0);
  const [settledDockHeight, setSettledDockHeight] = useState(0);
  const [dockHeight, setDockHeight] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(0);
  const { fontScale = 1 } = useWindowDimensions();
  const sheetGeometry = routeSheetGeometry(viewportHeight, headerHeight, insets.bottom, fontScale);
  const accent = useThemeColor('accent');
  function toMap() {
    // Curated Home-map selection is deferred; never forward catalog IDs to Google's selection path.
    if (place?.provider === 'curated') { router.dismissTo('/'); return; }
    if (place) setPlaceSelection(client, place);
    router.dismissTo(place ? { pathname: '/', params: { placeId: place.providerId } } : '/');
  }
  return <StyledSafeAreaView className="flex-1 bg-surface" edges={['left', 'right']}>
    <FocusedStatusBar style="dark" />
    <View testID="route-preview-scene" className="flex-1" onLayout={event => { if (event.nativeEvent.layout.height > 0) setViewportHeight(event.nativeEvent.layout.height); }}>
      {place && configured && <RoutePreviewMap place={place} origin={result?.origin} destination={result?.destination ?? place.coordinates} coordinates={coordinates}
        displayCoordinates={navigation.started ? navigation.remainingCoordinates : coordinates}
        currentPosition={usable ? location.position : null} dockHeight={dockHeight} settledDockHeight={settledDockHeight}
        headerHeight={headerHeight} position={sheetPosition} enabled={running} sceneHeight={viewportHeight} collapsedHeight={sheetGeometry.peek} />}
      <View testID="route-preview-header" className="absolute inset-x-0 top-0 px-4 pb-1" style={{ paddingTop: insets.top + 4 }} onLayout={event => setHeaderHeight(event.nativeEvent.layout.height)}>
        <View className="min-h-12 flex-row items-center gap-2 rounded-pill bg-surface pr-4 shadow-sm">
          <Button variant="ghost" className="size-12" isIconOnly accessibilityLabel={t('directions.back')} onPress={() => { if (router.canGoBack()) router.back(); else toMap(); }}><Ionicons name="arrow-back" size={22} color={accent} /></Button>
          <Text accessibilityRole="header" className="shrink font-sans text-card font-semibold text-foreground">{t('directions.title')}</Text>
        </View>
      </View>
      <View testID="route-preview-dock" className="absolute inset-0" pointerEvents="box-none">
      <RoutePreviewSheet geometry={sheetGeometry} height={viewportHeight} headerHeight={headerHeight} bottomInset={insets.bottom} position={sheetPosition}
        onOccupation={setDockHeight} onSettledHeight={setSettledDockHeight}>
        {(expanded, toggle) => <>
          <View className="flex-row items-center justify-between gap-2">
            <Text accessibilityRole="header" accessibilityLabel={place?.name} numberOfLines={expanded ? undefined : 2} className="flex-1 font-sans text-card font-semibold text-foreground">{place?.name ?? t('directions.title')}</Text>
            <Button isIconOnly variant="ghost" className="size-12" accessibilityLabel={t(expanded ? 'map.collapse' : 'map.expand')} accessibilityState={{ expanded }} onPress={toggle}>
              <Ionicons name={expanded ? 'chevron-down-outline' : 'chevron-up-outline'} size={22} color={accent} />
            </Button>
          </View>
          {place && <View className="gap-2">
            <View className="flex-row flex-wrap gap-2">{(['walking', 'driving'] as const).map(mode => <Button key={mode} variant={desiredMode === mode ? 'primary' : 'outline'} accessibilityLabel={t(`directions.${mode}`)} accessibilityState={{ selected: desiredMode === mode }} onPress={() => setDraftMode(mode)}><Button.Label>{t(`directions.${mode}`)}</Button.Label></Button>)}</View>
            <Text className="font-sans text-xs text-muted">{t('directions.displayedMode', { mode: t(`directions.${displayedMode}`) })}</Text>
            {desiredMode !== displayedMode && <Button accessibilityLabel={t('directions.previewMode')} isDisabled={!running || data?.status === 'pending'} onPress={previewMode}><Button.Label>{t('directions.previewMode')}</Button.Label></Button>}
            <Button accessibilityLabel={t('directions.startNavigation')} isDisabled={!externalUrl || !running || linkPending} onPress={startExternalNavigation}><Button.Label>{t('directions.startNavigation')}</Button.Label></Button>
            {linkError && <Text accessibilityLiveRegion="polite" className="font-sans text-sm text-danger">{t('directions.mapsFailed')}</Text>}
          </View>}
          {data?.intent.featuredDestinationId && <ArrivalInvitation state={preview.arrival.state} contentReady={false} onDismiss={preview.arrival.dismiss} />}
          {!place && <Text className="font-sans text-base text-muted">{t('directions.unavailable')}</Text>}
          {place && !Constants.expoConfig?.extra?.mapsConfigured && <Text className="font-sans text-base text-muted">{t('map.missingKey')}</Text>}
          {result && coordinates.length > 1 && !navigation.started && <>
            <Text className="font-sans text-title font-bold text-foreground">{t('map.routeSummary', { meters: result.route.distanceMeters, minutes: Math.ceil(result.route.durationSeconds / 60) })}</Text>
            <Text className="font-sans text-xs text-muted">{t(displayedMode === 'walking' ? 'directions.estimated' : 'directions.estimatedDriving')}</Text>
          </>}
          {result && displayedMode === 'walking' && coordinates.length > 1 && !navigation.started && (navigation.canStart
            ? <Button variant="primary" className="min-h-12" accessibilityLabel={t('directions.followWalk')} onPress={navigation.start}><Button.Label>{t('directions.followWalk')}</Button.Label></Button>
            : <Text className="font-sans text-sm text-muted">{t('directions.navigationNeedsLocation')}</Text>)}
          {navigation.started && <View className="gap-2 rounded-card bg-surface-secondary p-3">
            <Text accessibilityLiveRegion="polite" className="font-sans text-sm font-semibold text-foreground">{t(navigationStatusKey)}</Text>
            <Text className="font-sans text-sm text-foreground">{t('directions.remaining', { meters: Math.max(0, Math.round(navigation.remainingMeters)) })}</Text>
            {navigation.status === 'arrived'
              ? <Button variant="outline" accessibilityLabel={t('directions.returnToPreview')} onPress={navigation.stop}><Button.Label>{t('directions.returnToPreview')}</Button.Label></Button>
              : <Button variant="outline" accessibilityLabel={t('directions.stopNavigation')} onPress={navigation.stop}><Button.Label>{t('directions.stopNavigation')}</Button.Label></Button>}
          </View>}
          {place && preview.locationEnabled && data?.status === 'waiting' && <Text accessibilityLiveRegion="polite" className="font-sans text-sm text-muted">{t('directions.waiting')}</Text>}
          {place && preview.locationEnabled && !usable && <><RoutePreviewLocationStatus location={location} />{location.status === 'ready' && <><Text className="font-sans text-sm text-muted">{t('directions.stale')}</Text><Button variant="outline" accessibilityLabel={t('location.retry')} onPress={location.retry}><Button.Label>{t('location.retry')}</Button.Label></Button></>}</>}
          {data?.status === 'waiting' && preview.expired && <Text className="font-sans text-sm text-muted">{t('directions.unavailable')}</Text>}
          {data?.status === 'pending' && <View className="gap-2"><Spinner size="sm" /><Text accessibilityLiveRegion="polite" className="font-sans text-sm text-muted">{t(displayedMode === 'driving' ? 'directions.drivingLoading' : 'map.routeLoading')}</Text></View>}
          {data?.errorKey && <Text accessibilityLiveRegion="polite" className="font-sans text-sm text-danger">{t(data.errorKey)}</Text>}
          {preview.needsRetry && <Button variant="outline" accessibilityLabel={t('directions.retry')} isDisabled={!running || !configured} onPress={preview.retry}><Button.Label>{t('directions.retry')}</Button.Label></Button>}
          {expanded && place && <View className="gap-4 border-t border-outline pt-4">
            <Text accessibilityRole="header" className="font-sans text-card font-semibold text-foreground">{t('directions.journey')}</Text>
            <View className="flex-row items-start gap-3">
              <Ionicons name="radio-button-on-outline" size={20} color={accent} />
              <View className="min-w-0 flex-1 gap-1"><Text className="font-sans text-sm font-semibold text-foreground">{t('directions.origin')}</Text>
                <Text className="font-sans text-sm text-muted">{t('directions.originDescription')}</Text></View>
            </View>
            <View className="flex-row items-start gap-3">
              <Ionicons name="location-outline" size={20} color={accent} />
              <View className="min-w-0 flex-1 gap-1"><Text className="font-sans text-xs text-muted">{t('directions.destination')}</Text>
                <Text className="font-sans text-base font-semibold text-foreground">{place.name}</Text>
                {place.address && <Text className="font-sans text-sm text-muted">{place.address}</Text>}</View>
            </View>
          </View>}
          {expanded && result && <View className="gap-3 border-t border-outline pt-4">
            <Text accessibilityRole="header" className="font-sans text-card font-semibold text-foreground">{t('directions.information')}</Text>
            <Text className="font-sans text-sm text-muted">{t('directions.snapshot')}</Text>
            {result.route.warnings.map((warning, index) => <View key={index} className="flex-row items-start gap-2"><Ionicons name="warning-outline" size={20} color={accent} /><Text className="min-w-0 flex-1 font-sans text-sm text-foreground">{warning}</Text></View>)}
            <Text className="font-sans text-sm text-muted">{t(displayedMode === 'walking' ? 'map.walkingCaution' : 'directions.drivingCaution')}</Text>
          </View>}
          {expanded && navigation.started && <View className="gap-2 border-t border-outline pt-4">
            <Text accessibilityRole="header" className="font-sans text-card font-semibold text-foreground">{t('directions.navigationInformation')}</Text>
            {navigation.status === 'uncertain' && <Text className="font-sans text-sm text-muted">{t('directions.navigationUncertainDetail')}</Text>}
            {navigation.status === 'off-route' && <Text className="font-sans text-sm text-muted">{t('directions.navigationOffRouteDetail')}</Text>}
            {navigation.status === 'arrived' && <Text className="font-sans text-sm text-muted">{t('directions.navigationArrival')}</Text>}
            <Text className="font-sans text-sm text-muted">{t('directions.noAutomaticReroute')}</Text>
          </View>}
          {place && <ProviderAttributions places={[place]} />}
          {expanded && <View className="flex-row flex-wrap gap-2 border-t border-outline pt-4">
            <Button variant="outline" className="h-auto min-h-12 min-w-36 grow shrink py-3" accessibilityLabel={t('directions.map')} onPress={toMap}><Ionicons name="map-outline" size={22} color={accent} /><Button.Label className="shrink text-center">{t('directions.map')}</Button.Label></Button>
            {place && <Button variant="ghost" className="h-auto min-h-12 min-w-36 grow shrink py-3" accessibilityLabel={t('directions.details')} onPress={() => {
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
