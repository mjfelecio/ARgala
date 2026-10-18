import { useQuery, useQueryClient } from '@tanstack/react-query';
import Constants from 'expo-constants';
import { router, useIsFocused, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Circle, Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { useTranslation } from 'react-i18next';
import { DISCOVERY } from '@/config/limits';
import { routeService, type WalkingRequest } from '@/features/directions/service';
import { decodePolyline } from '@/features/directions/polyline';
import { distanceMeters, isWithinRadius, type Coordinate } from '@/features/location/geo';
import { LocationStatus } from '@/features/location/status';
import { useDeviceLocation } from '@/features/location/use-device-location';
import { placeSelectionOptions } from '@/features/places/selection';
import { detailsRequestSchema } from '../../../supabase/functions/_shared/contracts';
import { placesService } from '@/features/places/service';
import { useSettings } from '@/features/settings/provider';
import { useAppActive } from '@/lib/use-app-active';
import { edgeErrorMessageKey } from '@/lib/edge-error';
import { Action, Notice, Screen } from '@/ui/shared';
import { colors, space } from '@/ui/theme';
import { HomePlaceSheet, type HomePlaceSheetState } from './place-sheet';
import { HomeMapControls } from './home-map-controls';
import { ProviderAttributions, useOpenProviderLink } from './attributions';

function LaunchControls() {
  const { t } = useTranslation();
  return <View style={local.controls}><Action title={t('map.camera')} onPress={() => router.push('/ar')} /><Action title={t('map.settings')} onPress={() => router.push('/settings')} /></View>;
}
export default function MapScreen() {
  const { t } = useTranslation();
  if (!Constants.expoConfig?.extra?.mapsConfigured) return <Screen><Notice>{t('map.missingKey')}</Notice><LaunchControls /></Screen>;
  return <LocatedMap />;
}
function LocatedMap() {
  const location = useDeviceLocation();
  if (!location.position) return <Screen><LaunchControls /><LocationStatus location={location} /></Screen>;
  return <MapContent position={location.position} accuracy={location.accuracy} locationStatus={<LocationStatus location={location} />} />;
}
function MapContent({ position, accuracy, locationStatus }: { position: Coordinate; accuracy: number | null; locationStatus: React.ReactNode }) {
  const { t } = useTranslation(); const { language, activationRadiusMeters } = useSettings();
  const queryClient = useQueryClient();
  const params = useLocalSearchParams<{ placeId?: string }>();
  const parsedId = detailsRequestSchema.safeParse({ providerId: params.placeId, language });
  const incomingId = parsedId.success ? parsedId.data.providerId : null;
  const active = useAppActive(); const focused = useIsFocused(); const map = useRef<MapView>(null);
  const [mapReady, setMapReady] = useState(false);
  const [mapSize, setMapSize] = useState({ width: 0, height: 0 });
  const [headerHeight, setHeaderHeight] = useState(0);
  const [sheetHeight, setSheetHeight] = useState(0);
  const [center, setCenter] = useState(position);
  const [selectedId, setSelectedId] = useState<string | null>(incomingId);
  const [routeRequest, setRouteRequest] = useState<WalkingRequest | null>(null);
  const enabled = active && focused && mapReady;
  const [lastIncomingId, setLastIncomingId] = useState(incomingId);
  if (incomingId !== lastIncomingId) {
    setLastIncomingId(incomingId);
    if (incomingId) { setSelectedId(incomingId); setRouteRequest(null); }
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
  const mapPadding = { top: headerHeight, bottom: sheetHeight, left: space.sm, right: space.sm };
  const fitGap = Math.max(0, Math.min(space.xxl, (mapSize.height - headerHeight - sheetHeight) / 4, (mapSize.width - space.lg) / 4));
  useEffect(() => {
    if (!enabled || mapSize.width <= 0 || mapSize.height <= 0 || headerHeight <= 0 || sheetHeight <= 0 || !route.data) return;
    map.current?.fitToCoordinates(route.data.coordinates, {
      edgePadding: { top: fitGap, right: fitGap, bottom: fitGap, left: fitGap }, animated: true,
    });
  }, [enabled, mapSize.width, mapSize.height, headerHeight, sheetHeight, fitGap, route.data]);
  const place = details.data ?? handoff.data ?? nearby.data?.find((item) => item.providerId === selectedId);
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
  return <SafeAreaView style={local.container} edges={['left', 'right', 'bottom']}>
    <View style={local.container}>
    <MapView ref={map} style={local.map} provider={PROVIDER_GOOGLE} initialRegion={{ ...position, latitudeDelta: 0.02, longitudeDelta: 0.02 }}
      mapPadding={mapPadding} showsUserLocation showsMyLocationButton={false} onMapReady={() => setMapReady(true)}
      onLayout={(event) => setMapSize({ width: event.nativeEvent.layout.width, height: event.nativeEvent.layout.height })}
      onPoiClick={(event) => select(event.nativeEvent.placeId)}>
      <Circle center={position} radius={activationRadiusMeters} strokeColor={colors.routeBlue} fillColor="rgba(42,114,229,0.08)" />
      {nearby.data?.map((item) => <Marker key={item.id} coordinate={item.coordinates} title={item.name} onPress={() => select(item.providerId)} />)}
      {place && !nearby.data?.some((item) => item.providerId === place.providerId) && <Marker coordinate={place.coordinates} title={place.name} />}
      {route.data && <Polyline coordinates={route.data.coordinates} strokeColor={colors.routeBlue} strokeWidth={5} />}
    </MapView>
    <HomeMapControls onSearchNearby={discover} canSearch={enabled} searching={nearby.isFetching}
      onLayout={(event) => setHeaderHeight(event.nativeEvent.layout.height)}
      onRecenter={() => map.current?.animateToRegion({ ...position, latitudeDelta: 0.02, longitudeDelta: 0.02 }, 400)}
      onOpenAr={() => router.push('/ar')} onOpenSettings={() => router.push('/settings')} />
    <View pointerEvents="none" style={local.mapSpace} />
    <HomePlaceSheet key={selectedId ?? 'nearby'} state={state} selectedPlace={place ?? null} hasSelection={!!selectedId}
      canRequest={enabled} resultCount={nearby.data?.length ?? 0} errorKey={error ? edgeErrorMessageKey(error) : undefined}
      detailsLoading={details.isFetching} mapLoading={!mapReady} route={route.data}
      locationStatus={<>{locationStatus}{accuracy !== null && accuracy > activationRadiusMeters && <Notice>{t('location.approximate', { meters: Math.round(accuracy) })}</Notice>}</>}
      selectionSummary={place ? t('map.activation', { active: isWithinRadius(position, place.coordinates, activationRadiusMeters) ? t('map.active') : t('map.inactive'), distance: Math.round(distanceMeters(position, place.coordinates)), meters: activationRadiusMeters }) : undefined}
      onRetrySearch={discover} onClosePlace={() => select(null)} onDetails={() => select(selectedId)} onWalk={walk}
      onOpenGoogle={place?.mapsUri ? () => open(place.mapsUri!) : undefined}
      onMeasuredHeight={setSheetHeight} maxHeight={mapSize.height > 0 ? Math.max(0, mapSize.height - headerHeight - 64) : undefined}
      attributions={<ProviderAttributions places={[...(nearby.data ?? []), ...(details.data ? [details.data] : []), ...(handoff.data ? [handoff.data] : [])]} />} />
    </View>
  </SafeAreaView>;
}
const local = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  controls: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-evenly', paddingHorizontal: space.sm },
  map: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 },
  mapSpace: { flex: 1 },
});
