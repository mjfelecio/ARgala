import { useQuery, useQueryClient } from '@tanstack/react-query';
import Constants from 'expo-constants';
import { router, useIsFocused, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
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
  const [mapLaidOut, setMapLaidOut] = useState(false);
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
  useEffect(() => {
    if (!enabled || !mapLaidOut || !route.data) return;
    map.current?.fitToCoordinates(route.data.coordinates, {
      edgePadding: { top: 48, right: 48, bottom: 48, left: 48 }, animated: true,
    });
  }, [enabled, mapLaidOut, route.data]);
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
  return <View style={local.container}>
    <MapView ref={map} style={local.map} provider={PROVIDER_GOOGLE} initialRegion={{ ...position, latitudeDelta: 0.02, longitudeDelta: 0.02 }}
      showsUserLocation showsMyLocationButton={false} onMapReady={() => setMapReady(true)}
      onLayout={(event) => setMapLaidOut(event.nativeEvent.layout.width > 0 && event.nativeEvent.layout.height > 0)}
      onPoiClick={(event) => select(event.nativeEvent.placeId)}>
      <Circle center={position} radius={activationRadiusMeters} strokeColor="#125fac" fillColor="rgba(18,95,172,0.08)" />
      {nearby.data?.map((item) => <Marker key={item.id} coordinate={item.coordinates} title={item.name} onPress={() => select(item.providerId)} />)}
      {place && !nearby.data?.some((item) => item.providerId === place.providerId) && <Marker coordinate={place.coordinates} title={place.name} />}
      {route.data && <Polyline coordinates={route.data.coordinates} strokeColor="#125fac" strokeWidth={5} />}
    </MapView>
    <HomeMapControls onSearchNearby={discover} canSearch={enabled} searching={nearby.isFetching}
      onRecenter={() => map.current?.animateToRegion({ ...position, latitudeDelta: 0.02, longitudeDelta: 0.02 }, 400)}
      onOpenAr={() => router.push('/ar')} onOpenSettings={() => router.push('/settings')} />
    <ScrollView style={local.panel} contentContainerStyle={local.panelContent}>
      {locationStatus}
      {!mapReady && <Notice busy>{t('map.loading')}</Notice>}
      {accuracy !== null && accuracy > activationRadiusMeters && <Notice>{t('location.approximate', { meters: Math.round(accuracy) })}</Notice>}
      {nearby.isFetching && <Notice busy>{t('map.searching')}</Notice>}
      {nearby.error && <Notice>{t(edgeErrorMessageKey(nearby.error))}</Notice>}
      {nearby.isSuccess && nearby.data.length === 0 && <Notice>{t('map.empty')}</Notice>}
      <Text>{t('map.limit', { count: DISCOVERY.maxResults, meters: DISCOVERY.radiusMeters })}</Text>
      {selectedId && <>
        {!place && <><Notice>{t('map.selectionUnavailable')}</Notice><Action title={t('ar.more')} onPress={() => select(selectedId)} disabled={!enabled || details.isFetching} /></>}
        {details.isFetching && <Notice busy>{t('map.details')}</Notice>}
        {details.error && <Notice>{t(edgeErrorMessageKey(details.error))}</Notice>}
        {place && <>
          <Text style={local.title}>{place.name}</Text>{place.address && <Text>{place.address}</Text>}{place.description && <Text>{place.description}</Text>}
          <Text>{t('map.activation', { active: isWithinRadius(position, place.coordinates, activationRadiusMeters) ? t('map.active') : t('map.inactive'), distance: Math.round(distanceMeters(position, place.coordinates)), meters: activationRadiusMeters })}</Text>
          {place.mapsUri && <Action title={t('map.openGoogle')} onPress={() => open(place.mapsUri!)} />}
          <Action title={t('map.walk')} onPress={walk} disabled={!enabled || route.isFetching} />
        </>}
        <Action title={t('map.closePlace')} onPress={() => select(null)} />
      </>}
      {route.isFetching && <Notice busy>{t('map.routeLoading')}</Notice>}{route.error && <Notice>{t(edgeErrorMessageKey(route.error))}</Notice>}
      {route.data && <><Notice>{t('map.routeSummary', { meters: route.data.distanceMeters, minutes: Math.ceil(route.data.durationSeconds / 60) })}</Notice><Notice>{t('map.walkingCaution')}</Notice>{route.data.warnings.map((warning, index) => <Notice key={index}>{warning}</Notice>)}</>}
      <ProviderAttributions places={[...(nearby.data ?? []), ...(details.data ? [details.data] : []), ...(handoff.data ? [handoff.data] : [])]} />
    </ScrollView>
  </View>;
}
const local = StyleSheet.create({ container: { flex: 1, backgroundColor: '#fff' }, controls: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-evenly', paddingHorizontal: 8 }, map: { flex: 1, minHeight: 220 }, panel: { flexGrow: 0, maxHeight: 260 }, panelContent: { padding: 12, gap: 8 }, title: { fontSize: 20, fontWeight: '600' } });
