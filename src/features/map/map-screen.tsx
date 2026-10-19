import { useQuery, useQueryClient } from '@tanstack/react-query';
import Constants from 'expo-constants';
import { router, useIsFocused, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Circle, Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { useTranslation } from 'react-i18next';
import { DISCOVERY } from '@/config/limits';
import { routeService, type WalkingRequest } from '@/features/directions/service';
import { createRoutePreviewIntent } from '@/features/directions/route-preview-intent';
import { decodePolyline } from '@/features/directions/polyline';
import { distanceMeters, isWithinRadius, type Coordinate } from '@/features/location/geo';
import { LocationStatus } from '@/features/location/status';
import { useDeviceLocation } from '@/features/location/use-device-location';
import { placeSelectionOptions, setPlaceSelection } from '@/features/places/selection';
import { detailsRequestSchema } from '../../../supabase/functions/_shared/contracts';
import { placesService } from '@/features/places/service';
import { useSettings } from '@/features/settings/provider';
import { useAppActive } from '@/lib/use-app-active';
import { edgeErrorMessageKey } from '@/lib/edge-error';
import { Notice, Screen } from '@/ui/shared';
import { Button } from 'heroui-native/button';
import { useCSSVariable, useResolveClassNames, withUniwind } from 'uniwind';

import { HomePlaceSheet, type HomePlaceSheetState } from './place-sheet';
import { HomeMapControls } from './home-map-controls';
import { ProviderAttributions, useOpenProviderLink } from './attributions';

const StyledSafeAreaView = withUniwind(SafeAreaView);
const StyledMapView = withUniwind(MapView);

function LaunchControls() {
  const { t } = useTranslation();
  return <View className="flex-row flex-wrap justify-evenly gap-2 px-2"><Button accessibilityLabel={t('map.camera')} onPress={() => router.navigate('/ar')}><Button.Label>{t('map.camera')}</Button.Label></Button>
    <Button variant="secondary" accessibilityLabel={t('destinations.title')} onPress={() => router.navigate('/destinations')}><Button.Label>{t('destinations.title')}</Button.Label></Button></View>;
}
export default function MapScreen() {
  const { t } = useTranslation();
  if (!Constants.expoConfig?.extra?.mapsConfigured) return <Screen><Notice>{t('map.missingKey')}</Notice><LaunchControls /></Screen>;
  return <LocatedMap />;
}
function LocatedMap() {
  const location = useDeviceLocation();
  // A tab refocus rechecks permissions and starts GPS again. Keep the existing
  // map/selection/route mounted while awaiting its next fix, without enabling
  // provider actions based on a retained position after a permission revocation.
  const [retainedPosition, setRetainedPosition] = useState(location.position);
  if (location.position && location.position !== retainedPosition) setRetainedPosition(location.position);
  const position = location.position ?? retainedPosition;
  if (!position) return <Screen><LaunchControls /><LocationStatus location={location} /></Screen>;
  return <MapContent position={position} locationReady={Boolean(location.position)} accuracy={location.accuracy} locationStatus={<LocationStatus location={location} />} />;
}
function MapContent({ position, locationReady, accuracy, locationStatus }: { position: Coordinate; locationReady: boolean; accuracy: number | null; locationStatus: React.ReactNode }) {
  const { t } = useTranslation(); const { language, activationRadiusMeters } = useSettings();
  const queryClient = useQueryClient();
  const params = useLocalSearchParams<{ placeId?: string }>();
  const parsedId = detailsRequestSchema.safeParse({ providerId: params.placeId, language });
  const incomingId = parsedId.success ? parsedId.data.providerId : null;
  const active = useAppActive(); const focused = useIsFocused(); const map = useRef<MapView>(null);
  const previewNavigation = useRef(false);
  useEffect(() => { if (focused) previewNavigation.current = false; }, [focused]);
  const pendingHandoffCenter = useRef<string | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [mapSize, setMapSize] = useState({ width: 0, height: 0 });
  const [headerHeight, setHeaderHeight] = useState(0);
  const [sheetHeight, setSheetHeight] = useState(0);
  const [settledSheetHeight, setSettledSheetHeight] = useState(0);
  const gutter = useResolveClassNames('p-2').padding as number;
  const fitMargin = useResolveClassNames('p-8').padding as number;
  const routeColor = useCSSVariable('--color-route') as string;
  const routeArea = useCSSVariable('--color-route-area') as string;
  const [center, setCenter] = useState(position);
  const [selectedId, setSelectedId] = useState<string | null>(incomingId);
  const [routeRequest, setRouteRequest] = useState<WalkingRequest | null>(null);
  const enabled = active && focused && mapReady && locationReady;
  const [lastIncomingId, setLastIncomingId] = useState(incomingId);
  if (incomingId !== lastIncomingId) {
    setLastIncomingId(incomingId);
    if (incomingId && incomingId !== selectedId) { setSelectedId(incomingId); setRouteRequest(null); }
  }
  const handoff = useQuery(placeSelectionOptions(selectedId));
  useEffect(() => {
    if (!incomingId || !active || !focused) return;
    // Consume the handoff so closing and reopening the same POI works.
    router.setParams({ placeId: undefined });
  }, [incomingId, active, focused]);
  const nearbyOptions = (searchCenter: Coordinate) => ({ queryKey: ['places', searchCenter, language], staleTime: 0,
    queryFn: () => placesService.nearby({ center: searchCenter, radiusMeters: DISCOVERY.radiusMeters, language }) });
  const detailsOptions = (providerId: string | null) => ({ queryKey: ['place-details', providerId, language], staleTime: 0,
    queryFn: () => placesService.details(providerId!, language) });
  const routeOptions = (request: WalkingRequest | null) => ({ queryKey: ['walking-route', request], staleTime: 0,
    queryFn: async () => { const result = await routeService.walking(request!); return { ...result, coordinates: decodePolyline(result.encodedPolyline) }; } });
  // Observe transient results without allowing focus, remounts or invalidation to spend provider calls.
  const nearby = useQuery({ ...nearbyOptions(center), enabled: false });
  const details = useQuery({ ...detailsOptions(selectedId), enabled: false });
  const route = useQuery({ ...routeOptions(routeRequest), enabled: false });
  // Android adds fit edgePadding to mapPadding. Reserve measured chrome once,
  // keeping Google logo/legal controls above the sheet even between route fits.
  // Maps 1.27.2's native padding setter can dereference a null GoogleMap after
  // layout but before onMapReady. Omit the prop until this instance is ready.
  const mapPadding = { top: headerHeight, bottom: sheetHeight, left: gutter, right: gutter };
  const fitGap = Math.max(0, Math.min(fitMargin, (mapSize.height - headerHeight - settledSheetHeight) / 4, (mapSize.width - gutter * 2) / 4));
  useEffect(() => {
    if (!enabled || mapSize.width <= 0 || mapSize.height <= 0 || headerHeight <= 0 || settledSheetHeight <= 0 || !route.data) return;
    map.current?.fitToCoordinates(route.data.coordinates, {
      edgePadding: { top: fitGap, right: fitGap, bottom: fitGap, left: fitGap }, animated: true,
    });
  }, [enabled, mapSize.width, mapSize.height, headerHeight, settledSheetHeight, fitGap, route.data]);
  const place = details.data ?? handoff.data ?? nearby.data?.find((item) => item.providerId === selectedId);
  useEffect(() => {
    if (incomingId) pendingHandoffCenter.current = incomingId;
    if (!enabled || !place || pendingHandoffCenter.current !== place.providerId) return;
    map.current?.animateToRegion({ ...place.coordinates, latitudeDelta: 0.02, longitudeDelta: 0.02 }, 400);
    pendingHandoffCenter.current = null;
  }, [incomingId, enabled, place]);
  const open = useOpenProviderLink();
  function select(providerId: string | null) {
    if (providerId && !enabled) return;
    setSelectedId(providerId); setRouteRequest(null);
    if (providerId) void queryClient.fetchQuery(detailsOptions(providerId)).catch(() => {});
  }
  function discover() {
    if (!enabled || nearby.isFetching) return;
    select(null);
    const searchCenter = { ...position };
    setCenter(searchCenter);
    void queryClient.fetchQuery(nearbyOptions(searchCenter)).catch(() => {});
  }
  function walk() {
    if (!enabled || !place || route.isFetching) return;
    const request = { origin: { ...position }, destination: place.coordinates, language };
    setRouteRequest(request);
    void queryClient.fetchQuery(routeOptions(request)).catch(() => {});
  }
  const state: HomePlaceSheetState = route.isFetching ? 'route-loading' : route.error ? 'route-failed' : route.data ? 'route-ready'
    : selectedId ? 'selected' : nearby.isFetching ? 'loading' : nearby.error ? 'failed' : nearby.isSuccess ? nearby.data.length ? 'results' : 'empty' : 'unsearched';
  const error = route.error ?? (selectedId ? details.error : nearby.error);
  return <StyledSafeAreaView className="flex-1 bg-surface" edges={['left', 'right']}>
    <View className="flex-1">
    <StyledMapView ref={map} className="absolute inset-0" provider={PROVIDER_GOOGLE} initialRegion={{ ...position, latitudeDelta: 0.02, longitudeDelta: 0.02 }}
      {...(mapReady ? { mapPadding } : {})} showsUserLocation showsMyLocationButton={false} onMapReady={() => setMapReady(true)}
      onLayout={(event) => setMapSize({ width: event.nativeEvent.layout.width, height: event.nativeEvent.layout.height })}
      onPoiClick={(event) => select(event.nativeEvent.placeId)}>
      <Circle center={position} radius={activationRadiusMeters} strokeColor={routeColor} fillColor={routeArea} />
      {nearby.data?.map((item) => <Marker key={item.id} coordinate={item.coordinates} title={item.name} onPress={() => select(item.providerId)} />)}
      {place && !nearby.data?.some((item) => item.providerId === place.providerId) && <Marker coordinate={place.coordinates} title={place.name} />}
      {route.data && <Polyline coordinates={route.data.coordinates} strokeColor={routeColor} strokeWidth={5} />}
    </StyledMapView>
    <HomeMapControls onSearchNearby={discover} canSearch={enabled} searching={nearby.isFetching}
      onLayout={(event) => setHeaderHeight(event.nativeEvent.layout.height)}
      onRecenter={() => map.current?.animateToRegion({ ...position, latitudeDelta: 0.02, longitudeDelta: 0.02 }, 400)}
      onOpenAr={() => router.navigate('/ar')} onOpenDestinations={() => router.navigate('/destinations')} />
    <HomePlaceSheet key={selectedId ?? 'nearby'} state={state} selectedPlace={place ?? null} hasSelection={!!selectedId}
      canRequest={enabled} resultCount={nearby.data?.length ?? 0} errorKey={error ? edgeErrorMessageKey(error) : undefined}
      detailsLoaded={!!details.data} detailsLoading={details.isFetching} mapLoading={!mapReady} route={route.data}
      locationStatus={<>{locationStatus}{accuracy !== null && accuracy > activationRadiusMeters && <Notice>{t('location.approximate', { meters: Math.round(accuracy) })}</Notice>}</>}
      selectionSummary={place ? t('map.activation', { active: isWithinRadius(position, place.coordinates, activationRadiusMeters) ? t('map.active') : t('map.inactive'), distance: Math.round(distanceMeters(position, place.coordinates)), meters: activationRadiusMeters }) : undefined}
      onViewDetails={place ? () => {
        if (!active || !focused) return;
        setPlaceSelection(queryClient, place);
        router.navigate({ pathname: '/place/[providerId]', params: { providerId: place.providerId } });
      } : undefined}
      onViewRoute={route.data && routeRequest && place ? () => {
        if (!active || !focused || previewNavigation.current) return;
        previewNavigation.current = true;
        const token = createRoutePreviewIntent(queryClient, place, { origin: routeRequest.origin, destination: routeRequest.destination, route: route.data });
        router.push({ pathname: '/directions', params: { token } });
      } : undefined}
      onRetrySearch={discover} onClosePlace={() => select(null)} onDetails={() => { if (!details.data) select(selectedId); }} onWalk={walk}
      onOpenGoogle={place?.mapsUri ? () => open(place.mapsUri!) : undefined}
      onMeasuredHeight={setSheetHeight} onSettledHeight={setSettledSheetHeight} containerHeight={mapSize.height} maxHeight={mapSize.height > 0 ? Math.max(0, mapSize.height - headerHeight - Math.min(fitMargin * 2, mapSize.height / 10)) : undefined}
      attributions={<ProviderAttributions places={[...(nearby.data ?? []), ...(details.data ? [details.data] : []), ...(handoff.data ? [handoff.data] : [])]} />} />
    </View>
  </StyledSafeAreaView>;
}
