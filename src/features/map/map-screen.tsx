import { useQuery, useQueryClient } from '@tanstack/react-query';
import Constants from 'expo-constants';
import { SavePlaceAction, JournalFeedback } from '@/features/journal/actions';
import { router, useIsFocused, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { View, useWindowDimensions } from 'react-native';
import { useSharedValue } from 'react-native-reanimated';
import { FocusedStatusBar } from '@/features/navigation/focused-status-bar';
import { homeSheetGeometry, MAP_SHEET_OVERLAP } from './sheet-geometry';
import { useExplorerMapStyle } from './map-style';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import MapView, { Circle, Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { useTranslation } from 'react-i18next';
import { getDestination } from '@/features/destinations/catalog';
import { featuredMapPlace, matchedFeaturedDestination } from '@/features/destinations/map-selection';
import { destinationToRoutePlace } from '@/features/destinations/routing';
import { useDestinationProximity } from '@/features/destinations/use-destination-proximity';
import { approvedArContent } from '@/features/destinations/ar-content';
import { useArAdmission, useAdmissionSource } from '@/features/destination-ar/admission-context';
import { simulateArEntry } from '@/features/destination-ar/simulation-loader';
import { isViroSpikeEnabled } from '@/features/destination-ar/dev-guard';
import { ArrivalInvitation } from '@/features/destinations/arrival-invitation';
import { DISCOVERY } from '@/config/limits';
import { createRoutePreviewIntent } from '@/features/directions/route-preview-intent';
import { distanceMeters, isWithinRadius, type Coordinate } from '@/features/location/geo';
import { LocationStatus } from '@/features/location/status';
import { useDeviceLocation } from '@/features/location/use-device-location';
import { placeSelectionOptions, setPlaceSelection } from '@/features/places/selection';
import { detailsRequestSchema } from '../../../supabase/functions/_shared/contracts';
import { areaFromRegion, type SearchRegion } from './search-state';
import type { PlacesSearch, SearchCategory } from '../../../supabase/functions/_shared/contracts';
import { placesService } from '@/features/places/service';
import { availablePlaceDetails, placeDetailsOptions } from '@/features/places/details-cache';
import { useSettings } from '@/features/settings/provider';
import { useAppActive } from '@/lib/use-app-active';
import { edgeErrorMessageKey } from '@/lib/edge-error';
import { Notice, Screen } from '@/ui/shared';
import { Button } from 'heroui-native/button';
import { useCSSVariable, useResolveClassNames, withUniwind } from 'uniwind';

import { HomePlaceSheet, type HomePlaceSheetState } from './place-sheet';
import { HomeMapControls } from './home-map-controls';
import { ManualPlaceSearch } from './manual-place-search';
import { MapRecenter } from './map-recenter';
import { PlaceCallout } from './place-callout';
import { ProviderAttributions, useOpenProviderLink } from './attributions';

const StyledSafeAreaView = withUniwind(SafeAreaView);
const StyledMapView = withUniwind(MapView);

function LaunchControls() {
  const { t } = useTranslation();
  return <View className="flex-row flex-wrap justify-evenly gap-2 px-2"><Button variant="secondary" accessibilityLabel={t('destinations.title')} onPress={() => router.navigate('/destinations')}><Button.Label>{t('destinations.title')}</Button.Label></Button></View>;
}
export default function MapScreen() {
  const { t } = useTranslation();
  if (!Constants.expoConfig?.extra?.mapsConfigured) return <Screen><Notice>{t('map.missingKey')}</Notice><LaunchControls /></Screen>;
  return <LocatedMap />;
}
function LocatedMap() {
  const params = useLocalSearchParams<{ featuredDestinationId?: string }>();
  const selected = getDestination(params.featuredDestinationId);
  const client = useQueryClient();
  const location = useDeviceLocation({ distanceIntervalMeters: 0 });
  // A tab refocus rechecks permissions and starts GPS again. Keep the existing
  // map and selection mounted while awaiting its next fix, without enabling
  // provider actions based on a retained position after a permission revocation.
  const [retainedPosition, setRetainedPosition] = useState(location.position ?? selected?.center ?? null);
  if (location.position && location.position !== retainedPosition) setRetainedPosition(location.position);
  else if (!retainedPosition && selected?.center) setRetainedPosition(selected.center);
  const position = location.position ?? retainedPosition ?? selected?.center;
  if (!position) return <Screen><LaunchControls /><LocationStatus location={location} /><ManualPlaceSearch onSelect={(place, language, updatedAt) => {
    setPlaceSelection(client, place, language, updatedAt); setRetainedPosition(place.coordinates);
    router.setParams({ placeId: place.providerId });
  }} /></Screen>;
  return <MapContent position={position} locationReady={Boolean(location.position)} accuracy={location.accuracy} locationStatus={<LocationStatus location={location} />} location={location} />;
}
function MapContent({ position, locationReady, accuracy, locationStatus, location }: { location: ReturnType<typeof useDeviceLocation>; position: Coordinate; locationReady: boolean; accuracy: number | null; locationStatus: React.ReactNode }) {
  const insets = useSafeAreaInsets();
  const customMapStyle = useExplorerMapStyle();
  const { t } = useTranslation(); const { language, activationRadiusMeters } = useSettings();
  const queryClient = useQueryClient();
  const params = useLocalSearchParams<{ placeId?: string; featuredDestinationId?: string }>();
  const parsedId = detailsRequestSchema.safeParse({ providerId: params.placeId, language });
  const incomingFeatured = getDestination(params.featuredDestinationId) ?? (parsedId.success ? matchedFeaturedDestination({ provider: 'google', providerId: parsedId.data.providerId }) : null);
  const [featuredId, setFeaturedId] = useState(incomingFeatured?.id ?? null);
  const featured = getDestination(featuredId);
  const incomingId = !incomingFeatured && parsedId.success ? parsedId.data.providerId : null;
  const active = useAppActive(); const focused = useIsFocused(); const map = useRef<MapView>(null);
  const arrival = useDestinationProximity(featured, { running: active && focused, watcherStatus: location.watcherStatus ?? 'pending', sample: location.watcherSample ?? null });
  const admission = useArAdmission();
  const arSource = useAdmissionSource(admission, featured?.id ?? null, { running: active && focused, watcherStatus: location.watcherStatus ?? 'pending', sample: location.watcherSample ?? null }, true);
  const contentReady = !!approvedArContent(featured, language).length;
  const draftAr = !contentReady && featured?.id === 'pilot-aclc' && isViroSpikeEnabled();
  function launchAr() {
    if (!featured) return;
    const entryToken = arSource.begin(draftAr ? 'draft' : 'approved', language);
    if (entryToken) router.push({ pathname: '/destination-ar/[destinationId]', params: { destinationId: featured.id, entryToken } });
  }
  async function simulateArrival() {
    if (!featured || !isViroSpikeEnabled() || (!contentReady && featured.id !== 'pilot-aclc')) return;
    const entryToken = await simulateArEntry(arSource, contentReady ? 'approved' : 'draft', language);
    if (entryToken) router.push({ pathname: '/destination-ar/[destinationId]', params: { destinationId: featured.id, entryToken } });
  }
  const previewNavigation = useRef(false);
  useEffect(() => { if (focused) previewNavigation.current = false; }, [focused]);
  const pendingHandoffCenter = useRef<string | null>(null);
  const pendingFeaturedCenter = useRef(incomingFeatured);
  const [mapReady, setMapReady] = useState(false);
  const window = useWindowDimensions();
  const [sceneSize, setSceneSize] = useState({ width: 0, height: 0 });
  const [headerHeight, setHeaderHeight] = useState(0);
  const sheetPosition = useSharedValue(0);
  const [sheetHeight, setSheetHeight] = useState(0);
  const gutter = useResolveClassNames('p-2').padding as number;
  const fitMargin = useResolveClassNames('p-8').padding as number;
  const routeColor = useCSSVariable('--color-route') as string;
  const routeArea = useCSSVariable('--color-route-area') as string;
  const [draftQuery, setDraftQuery] = useState('');
  const [category, setCategory] = useState<SearchCategory>('all');
  const [viewport, setViewport] = useState<ReturnType<typeof areaFromRegion>>(null);
  const [committedRequest, setCommittedRequest] = useState<PlacesSearch>({ query: '', category: 'all', area: { center: position, radiusMeters: DISCOVERY.radiusMeters } });
  const [selectedId, setSelectedId] = useState<string | null>(incomingId);
  const mapEnabled = active && focused && mapReady;
  const enabled = mapEnabled && locationReady;
  const [lastIncomingId, setLastIncomingId] = useState(incomingId);
  if (incomingId !== lastIncomingId) {
    setLastIncomingId(incomingId);
    if (incomingId && incomingId !== selectedId) { setSelectedId(incomingId); setFeaturedId(null); }
  }
  const [lastFeatured, setLastFeatured] = useState(incomingFeatured?.id);
  if (incomingFeatured?.id !== lastFeatured) {
    setLastFeatured(incomingFeatured?.id);
    if (incomingFeatured) { setFeaturedId(incomingFeatured.id); setSelectedId(null); }
  }
  const handoff = useQuery(placeSelectionOptions(selectedId));
  useEffect(() => {
    if ((!incomingId && !incomingFeatured) || !active || !focused) return;
    // Consume the handoff so closing and reopening the same POI works.
    router.setParams({ placeId: undefined, featuredDestinationId: undefined });
  }, [incomingId, incomingFeatured, active, focused]);
  const nearbyOptions = (request: PlacesSearch) => ({ queryKey: ['places', { query: request.query ?? '', category: request.category ?? 'all', area: request.area }, language], staleTime: 0,
    queryFn: () => !request.query?.trim() && (request.category ?? 'all') === 'all' && request.area
      ? placesService.nearby({ ...request.area, language }) : placesService.search({ ...request, language }) });
  const detailsOptions = (providerId: string | null) => ({ ...placeDetailsOptions(queryClient, providerId, language), staleTime: 0 });
  // Observe transient results without allowing focus, remounts or invalidation to spend provider calls.
  const nearby = useQuery({ ...nearbyOptions(committedRequest), enabled: false });
  const details = useQuery({ ...detailsOptions(selectedId), enabled: false });
  const maxSheetHeight = sceneSize.height > 0 ? Math.max(0, sceneSize.height - headerHeight - Math.min(fitMargin * 2, sceneSize.height)) : undefined;
  const sheetGeometry = homeSheetGeometry(sceneSize.height || window.height, maxSheetHeight, !!selectedId || !!featured, window.fontScale ?? 1);
  const frameHeight = Math.max(1, Math.min(sceneSize.height, sceneSize.height - sheetGeometry.peek + MAP_SHEET_OVERLAP));
  // Android adds fit edgePadding to mapPadding. Reserve measured chrome once,
  // keeping Google logo/legal controls above the sheet through native sheet gestures.
  // Maps 1.27.2's native padding setter can dereference a null GoogleMap after
  // layout but before onMapReady. Omit the prop until this instance is ready.
  const topPadding = Math.min(headerHeight, Math.max(0, frameHeight - gutter));
  const mapPadding = { top: topPadding, bottom: Math.max(0, Math.min(sheetHeight - sheetGeometry.peek + MAP_SHEET_OVERLAP, frameHeight - topPadding - gutter)), left: gutter, right: gutter };
  const complete = availablePlaceDetails(queryClient, selectedId, language);
  const place = featured ? featuredMapPlace(featured) : complete ?? handoff.data ?? nearby.data?.find((item) => item.providerId === selectedId);
  useEffect(() => {
    if (incomingId) pendingHandoffCenter.current = incomingId;
    if (!enabled || !place || pendingHandoffCenter.current !== place.providerId) return;
    map.current?.animateToRegion({ ...place.coordinates, latitudeDelta: 0.02, longitudeDelta: 0.02 }, 400);
    pendingHandoffCenter.current = null;
  }, [incomingId, enabled, place]);
  useEffect(() => {
    if (incomingFeatured) pendingFeaturedCenter.current = incomingFeatured;
    if (!mapEnabled || !pendingFeaturedCenter.current?.center) return;
    map.current?.animateToRegion({ ...pendingFeaturedCenter.current.center, latitudeDelta: 0.002, longitudeDelta: 0.002 }, 400);
    pendingFeaturedCenter.current = null;
  }, [incomingFeatured, mapEnabled]);
  const open = useOpenProviderLink();
  function select(providerId: string | null) {
    if (providerId && !mapEnabled) return;
    const matched = providerId ? matchedFeaturedDestination({ provider: 'google', providerId }) : null;
    setFeaturedId(matched?.id ?? null);
    setSelectedId(matched ? null : providerId);
    if (matched) return;
    if (providerId && !availablePlaceDetails(queryClient, providerId, language)) void queryClient.fetchQuery(detailsOptions(providerId)).catch(() => {});
  }
  function submitSearch(request: PlacesSearch) {
    if (!mapEnabled || nearby.isFetching || (!request.query?.trim() && !request.area)) return;
    select(null); setCommittedRequest(request);
    void queryClient.fetchQuery(nearbyOptions(request)).catch(() => {});
  }
  function discover() {
    const area = locationReady ? { center: { ...position }, radiusMeters: DISCOVERY.radiusMeters } : viewport ?? undefined;
    submitSearch({ query: draftQuery.trim(), category, ...(area ? { area } : {}) });
  }
  function searchArea() { if (viewport) submitSearch({ query: draftQuery.trim(), category, area: viewport }); }
  function directions() {
    if (!mapEnabled || !place || previewNavigation.current) return;
    const target = featured ? destinationToRoutePlace(featured) : place;
    if (!target) return;
    previewNavigation.current = true;
    const token = createRoutePreviewIntent(queryClient, target, undefined, 'map', language, featured?.id);
    router.push({ pathname: '/directions', params: { token } });
  }
  const state: HomePlaceSheetState = selectedId || featured ? 'selected' : nearby.isFetching ? 'loading' : nearby.error ? 'failed' : nearby.isSuccess ? nearby.data.length ? 'results' : 'empty' : 'unsearched';
  const error = featured ? null : selectedId ? !complete && details.error : nearby.error;
  return <StyledSafeAreaView className="flex-1 bg-surface" edges={['left', 'right']}>
    <FocusedStatusBar style="dark" />
    <View testID="home-map-scene" className="flex-1" onLayout={event => {
      const { width, height } = event.nativeEvent.layout;
      if (width > 0 && height > 0) setSceneSize(previous => previous.width === width && previous.height === height ? previous : { width, height });
    }}>
    <StyledMapView ref={map} className="absolute inset-x-0 top-0" style={{ height: sceneSize.height > 0 ? frameHeight : '100%' }} provider={PROVIDER_GOOGLE} customMapStyle={customMapStyle} initialRegion={{ ...position, latitudeDelta: 0.02, longitudeDelta: 0.02 }}
      {...(mapReady ? { mapPadding } : {})} showsUserLocation={enabled} showsMyLocationButton={false} onMapReady={() => setMapReady(true)}
      onRegionChangeComplete={(region: SearchRegion) => setViewport(areaFromRegion(region))}
      onPoiClick={(event) => select(event.nativeEvent.placeId)}>
      {!featured && locationReady && <Circle center={position} radius={activationRadiusMeters} strokeColor={routeColor} fillColor={routeArea} />}
      {nearby.data?.filter(item => !featured || matchedFeaturedDestination(item)?.id !== featured.id).map((item) => <Marker key={item.id} coordinate={item.coordinates} title={item.name} onPress={() => select(item.providerId)}><PlaceCallout name={item.name} /></Marker>)}
      {place && !nearby.data?.some((item) => item.providerId === place.providerId) && <Marker coordinate={place.coordinates} title={place.name} pinColor={featured ? routeColor : undefined}><PlaceCallout name={place.name} /></Marker>}
    </StyledMapView>
    <View style={{ paddingTop: insets.top }} pointerEvents="box-none">
    <HomeMapControls onSearchNearby={discover} canSearch={mapEnabled && (locationReady || !!draftQuery.trim() || !!viewport)} searching={nearby.isFetching}
      query={draftQuery} onQueryChange={setDraftQuery} category={category} onCategoryChange={setCategory}
      onSearchArea={searchArea} canSearchArea={mapEnabled && !!viewport} areaRadiusMeters={viewport?.radiusMeters}
      onLayout={(event) => setHeaderHeight(event.nativeEvent.layout.height + insets.top)}
      onOpenAr={() => router.navigate('/ar')} onOpenDestinations={() => router.navigate('/destinations')} />
    </View>
    <MapRecenter disabled={!enabled} position={sheetPosition} onPress={() => enabled && map.current?.animateToRegion({ ...position, latitudeDelta: 0.02, longitudeDelta: 0.02 }, 400)} />
    <HomePlaceSheet saveAction={<>{featured ? <SavePlaceAction reference={{kind:'featured',id:featured.id}}/> : place?.provider === 'google' ? <SavePlaceAction reference={{kind:'google',id:place.providerId}}/> : null}<JournalFeedback/></>} geometry={sheetGeometry} animatedPosition={sheetPosition} key={featured?.id ?? selectedId ?? 'nearby'} state={state} selectedPlace={place ?? null} hasSelection={!!selectedId || !!featured}
      canRequest={featured ? mapEnabled && !!destinationToRoutePlace(featured) : mapEnabled} resultCount={nearby.data?.length ?? 0} errorKey={error ? edgeErrorMessageKey(error) : undefined}
      detailsLoaded={!!complete || !!featured} detailsLoading={details.isFetching} mapLoading={!mapReady}
      locationStatus={<>{locationStatus}{featured && <ArrivalInvitation state={arrival.state} contentReady={contentReady} draft={draftAr} onLaunch={admission ? launchAr : undefined} onDismiss={arrival.dismiss} />}{featured && admission && isViroSpikeEnabled() && (contentReady || featured.id === 'pilot-aclc') && <Button variant="outline" accessibilityLabel={t('arrival.simulate')} onPress={() => void simulateArrival()}><Button.Label>{t('arrival.simulate')}</Button.Label></Button>}{accuracy !== null && accuracy > activationRadiusMeters && <Notice>{t('location.approximate', { meters: Math.round(accuracy) })}</Notice>}</>}
      selectionSummary={featured ? t('arrival.teaser') : place && locationReady ? t('map.activation', { active: isWithinRadius(position, place.coordinates, activationRadiusMeters) ? t('map.active') : t('map.inactive'), distance: Math.round(distanceMeters(position, place.coordinates)), meters: activationRadiusMeters }) : place ? t('map.proximityUnavailable') : undefined}
      onViewDetails={place && !featured ? () => {
        if (!active || !focused) return;
        setPlaceSelection(queryClient, place, complete ? language : undefined, detailsOptions(selectedId).initialDataUpdatedAt);
        router.navigate({ pathname: '/place/[providerId]', params: { providerId: place.providerId } });
      } : undefined}
      onRetrySearch={() => submitSearch(committedRequest)} onClosePlace={() => select(null)} onDetails={() => { if (!complete) select(selectedId); }} onDirections={directions}
      onOpenGoogle={place?.mapsUri ? () => open(place.mapsUri!) : undefined}
      onMeasuredHeight={setSheetHeight} containerHeight={sceneSize.height} maxHeight={maxSheetHeight}
      attributions={<ProviderAttributions places={[...(nearby.data ?? []), ...(details.data ? [details.data] : []), ...(handoff.data ? [handoff.data] : [])]} />} />
    </View>
  </StyledSafeAreaView>;
}
