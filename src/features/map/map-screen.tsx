import { useQuery } from '@tanstack/react-query';
import Constants from 'expo-constants';
import { router, useIsFocused } from 'expo-router';
import { useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import MapView, { Circle, Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { useTranslation } from 'react-i18next';
import { DISCOVERY } from '@/config/limits';
import { routeService, type WalkingRequest } from '@/features/directions/service';
import { decodePolyline } from '@/features/directions/polyline';
import { distanceMeters, isWithinRadius, type Coordinate } from '@/features/location/geo';
import { LocationStatus } from '@/features/location/status';
import { useDeviceLocation } from '@/features/location/use-device-location';
import { placesService } from '@/features/places/service';
import { useSettings } from '@/features/settings/provider';
import { useAppActive } from '@/lib/use-app-active';
import { Action, Notice, Screen } from '@/ui/shared';
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
  const active = useAppActive(); const focused = useIsFocused(); const map = useRef<MapView>(null);
  const [mapReady, setMapReady] = useState(false);
  const [center, setCenter] = useState(position);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [routeRequest, setRouteRequest] = useState<WalkingRequest | null>(null);
  const enabled = active && focused && mapReady;
  const nearby = useQuery({ queryKey: ['places', center, language], enabled,
    queryFn: () => placesService.nearby({ center, radiusMeters: DISCOVERY.radiusMeters, language }) });
  const details = useQuery({ queryKey: ['place-details', selectedId, language], enabled: enabled && Boolean(selectedId),
    queryFn: () => placesService.details(selectedId!, language) });
  const route = useQuery({ queryKey: ['walking-route', routeRequest], enabled: enabled && Boolean(routeRequest),
    queryFn: async () => { const result = await routeService.walking(routeRequest!); return { ...result, coordinates: decodePolyline(result.encodedPolyline) }; } });
  const place = details.data ?? nearby.data?.find((item) => item.providerId === selectedId);
  const open = useOpenProviderLink();
  function select(providerId: string | null) { setSelectedId(providerId); setRouteRequest(null); }
  function discover() {
    select(null);
    if (center.latitude === position.latitude && center.longitude === position.longitude) void nearby.refetch();
    else setCenter({ ...position });
  }
  return <View style={local.container}>
    <LaunchControls />
    <MapView ref={map} style={local.map} provider={PROVIDER_GOOGLE} initialRegion={{ ...position, latitudeDelta: 0.02, longitudeDelta: 0.02 }}
      showsUserLocation showsMyLocationButton={false} onMapReady={() => setMapReady(true)} onPoiClick={(event) => select(event.nativeEvent.placeId)}>
      <Circle center={position} radius={activationRadiusMeters} strokeColor="#125fac" fillColor="rgba(18,95,172,0.08)" />
      {nearby.data?.map((item) => <Marker key={item.id} coordinate={item.coordinates} title={item.name} onPress={() => select(item.providerId)} />)}
      {place && !nearby.data?.some((item) => item.providerId === place.providerId) && <Marker coordinate={place.coordinates} title={place.name} />}
      {route.data && <Polyline coordinates={route.data.coordinates} strokeColor="#125fac" strokeWidth={5} />}
    </MapView>
    <View style={local.controls}><Action title={t('map.recenter')} onPress={() => map.current?.animateToRegion({ ...position, latitudeDelta: 0.02, longitudeDelta: 0.02 }, 400)} />
      <Action title={t('map.search')} onPress={discover} disabled={!mapReady || nearby.isFetching} /></View>
    <ScrollView style={local.panel} contentContainerStyle={local.panelContent}>
      {locationStatus}
      {!mapReady && <Notice busy>{t('map.loading')}</Notice>}
      {accuracy !== null && accuracy > activationRadiusMeters && <Notice>{t('location.approximate', { meters: Math.round(accuracy) })}</Notice>}
      {nearby.isFetching && <Notice busy>{t('map.searching')}</Notice>}
      {nearby.error && <Notice>{nearby.error.message}</Notice>}
      {nearby.isSuccess && nearby.data.length === 0 && <Notice>{t('map.empty')}</Notice>}
      <Text>{t('map.limit', { count: DISCOVERY.maxResults, meters: DISCOVERY.radiusMeters })}</Text>
      {selectedId && <>
        {details.isFetching && <Notice busy>{t('map.details')}</Notice>}
        {details.error && <Notice>{details.error.message}</Notice>}
        {place && <>
          <Text style={local.title}>{place.name}</Text>{place.address && <Text>{place.address}</Text>}{place.description && <Text>{place.description}</Text>}
          <Text>{t('map.activation', { active: isWithinRadius(position, place.coordinates, activationRadiusMeters) ? t('map.active') : t('map.inactive'), distance: Math.round(distanceMeters(position, place.coordinates)), meters: activationRadiusMeters })}</Text>
          {place.mapsUri && <Action title={t('map.openGoogle')} onPress={() => open(place.mapsUri!)} />}
          <Action title={t('map.walk')} onPress={() => setRouteRequest({ origin: { ...position }, destination: place.coordinates, language })} disabled={route.isFetching} />
        </>}
        <Action title={t('map.closePlace')} onPress={() => select(null)} />
      </>}
      {route.isFetching && <Notice busy>{t('map.routeLoading')}</Notice>}{route.error && <Notice>{route.error.message}</Notice>}
      {route.data && <><Notice>{t('map.routeSummary', { meters: route.data.distanceMeters, minutes: Math.ceil(route.data.durationSeconds / 60) })}</Notice><Notice>{t('map.walkingCaution')}</Notice>{route.data.warnings.map((warning, index) => <Notice key={index}>{warning}</Notice>)}</>}
      <ProviderAttributions places={[...(nearby.data ?? []), ...(details.data ? [details.data] : [])]} />
    </ScrollView>
  </View>;
}
const local = StyleSheet.create({ container: { flex: 1, backgroundColor: '#fff' }, controls: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-evenly', paddingHorizontal: 8 }, map: { flex: 1, minHeight: 220 }, panel: { flexGrow: 0, maxHeight: 260 }, panelContent: { padding: 12, gap: 8 }, title: { fontSize: 20, fontWeight: '600' } });
