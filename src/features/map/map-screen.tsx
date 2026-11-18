import { featuredBookmarkAliases } from '@/features/journal/bookmark-aliases';
import { useBookmarkPinClock } from './use-bookmark-pin-clock';
import { displayGooglePlaceId } from '@/features/destinations/google-place-associations';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Constants from 'expo-constants';
import { SavePlaceAction, JournalFeedback } from '@/features/journal/actions';
import { router, useIsFocused, useLocalSearchParams } from 'expo-router';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Text, View, useWindowDimensions } from 'react-native';
import { useSharedValue } from 'react-native-reanimated';
import { FocusedStatusBar } from '@/features/navigation/focused-status-bar';
import { homeSheetGeometry, MAP_SHEET_OVERLAP } from './sheet-geometry';
import { useExplorerMapStyle } from './map-style';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import MapView, { Marker, PROVIDER_GOOGLE, type PoiClickEvent } from 'react-native-maps';
import { useTranslation } from 'react-i18next';
import { destinationName, getDestination, listDestinations } from '@/features/destinations/catalog';
import { useDestinationLookup } from '@/features/destination-content/context';
import { featuredMapPlace, matchedFeaturedDestination } from '@/features/destinations/map-selection';
import { destinationToRoutePlace } from '@/features/destinations/routing';
import { useDestinationProximity } from '@/features/destinations/use-destination-proximity';
import { approvedArContent } from '@/features/destinations/ar-content';
import { useArAdmission, useAdmissionSnapshot, useAdmissionSource } from '@/features/destination-ar/admission-context';
import { simulateArEntry } from '@/features/destination-ar/simulation-loader';
import { isViroSpikeEnabled } from '@/features/destination-ar/dev-guard';
import { ArrivalInvitation } from '@/features/destinations/arrival-invitation';
import { ArrivalUnlock } from '@/features/destinations/arrival-unlock';
import { DISCOVERY } from '@/config/limits';
import { createRoutePreviewIntent } from '@/features/directions/route-preview-intent';
import { distanceMeters, isCoordinate, type Coordinate } from '@/features/location/geo';
import { LocationStatus } from '@/features/location/status';
import { useDeviceLocation } from '@/features/location/use-device-location';
import { placeSelectionOptions } from '@/features/places/selection';
import { detailsRequestSchema } from '../../../supabase/functions/_shared/contracts';
import { areaFromRegion, type SearchRegion } from './search-state';
import type { PlacesSearch, SearchCategory } from '../../../supabase/functions/_shared/contracts';
import { placesService, type Place } from '@/features/places/service';
import { availablePlaceDetails, useAvailablePlaceDetailsSnapshot, placeDetailsOptions } from '@/features/places/details-cache';
import { useSettings } from '@/features/settings/provider';
import { useAppActive } from '@/lib/use-app-active';
import { edgeErrorMessageKey } from '@/lib/edge-error';
import { Notice, Screen } from '@/ui/shared';
import { Button } from 'heroui-native/button';
import { useCSSVariable, useResolveClassNames, withUniwind } from 'uniwind';

import { HomePlaceSheet, type HomePlaceSheetState } from './place-sheet';
import { HomeMapControls } from './home-map-controls';
import { DaytimeGallery } from '@/features/destinations/daytime-gallery';
import { useJournal } from '@/features/journal/context';
import { claimMapSelectionIntent, type MapSelectionIntent, type PlaceSelectionSeed } from '@/features/places/map-selection-intent';
import { googleMapsPlaceUrl } from '@/features/places/maps-url';
import { savedMapMarkers } from './saved-map-markers';
import { StatusRow } from '@/ui/status-row';
import { MapRecenter } from './map-recenter';
import { PlaceCallout } from './place-callout';
import { ProviderAttributions, useOpenProviderLink } from './attributions';

const StyledSafeAreaView = withUniwind(SafeAreaView);
const StyledMapView = withUniwind(MapView);
const featuredPin = require('../../../assets/map-pins/featured.png') as number;
const savedPin = require('../../../assets/map-pins/saved.png') as number;


function nativePoiSeed(event: PoiClickEvent['nativeEvent']): PlaceSelectionSeed {
  return { providerId: event.placeId, name: event.name, ...(isCoordinate(event.coordinate) ? { coordinates: event.coordinate } : {}), capturedAt: Date.now() };
}

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
  const { t } = useTranslation();
  const location = useDeviceLocation({ distanceIntervalMeters: 0 });
  // A tab refocus rechecks permissions and starts GPS again. Keep the existing
  // map and selection mounted while awaiting its next fix, without enabling
  // provider actions based on a retained position after a permission revocation.
  const [retainedPosition, setRetainedPosition] = useState(location.position ?? selected?.center ?? null);
  if (location.position && location.position !== retainedPosition) setRetainedPosition(location.position);
  else if (!retainedPosition && selected?.center) setRetainedPosition(selected.center);
  const position = location.position ?? retainedPosition ?? selected?.center ?? listDestinations().find(item => item.center)?.center ?? { latitude: 0, longitude: 0 };

  return <MapContent position={position} locationReady={Boolean(location.position)} accuracy={location.accuracy} locationStatus={<LocationStatus location={location} renderMessage={(message, busy) => <StatusRow busy={busy}>{message}</StatusRow>} renderRetry={onPress => <Button variant="outline" accessibilityLabel={t('location.retry')} onPress={onPress}><Button.Label>{t('location.retry')}</Button.Label></Button>} renderSettingsAction={onPress => <Button variant="ghost" accessibilityLabel={t('common.openSettings')} onPress={onPress}><Button.Label>{t('common.openSettings')}</Button.Label></Button>} />} location={location} />;
}
function MapContent({ position, locationReady, accuracy, locationStatus, location }: { location: ReturnType<typeof useDeviceLocation>; position: Coordinate; locationReady: boolean; accuracy: number | null; locationStatus: React.ReactNode }) {
  const insets = useSafeAreaInsets();
  const customMapStyle = useExplorerMapStyle();
  const { t } = useTranslation(); const { language, activationRadiusMeters } = useSettings();
  const queryClient = useQueryClient();
  const params = useLocalSearchParams<{ placeId?: string; featuredDestinationId?: string; selectionToken?: string }>();
  const parsedId = detailsRequestSchema.safeParse({ providerId: params.placeId, language });
  const incomingFeatured = getDestination(params.featuredDestinationId) ?? (parsedId.success ? matchedFeaturedDestination({ provider: 'google', providerId: parsedId.data.providerId }) : null);
  const [featuredId, setFeaturedId] = useState(incomingFeatured?.id ?? null);
  const contentDestination = useDestinationLookup();
  const featured = contentDestination(featuredId);
  const incomingId = !incomingFeatured && parsedId.success ? parsedId.data.providerId : null;
  const journal = useJournal();
  const principalId = journal?.principalId ?? 'guest';
  const [pendingIntent, setPendingIntent] = useState<MapSelectionIntent | null>(null);
  const [selectionSeed, setSelectionSeed] = useState<PlaceSelectionSeed | null>(null);
  const [compactMeasurement, setCompactMeasurement] = useState<{ key: string; height: number } | null>(null);
  const mapInteracted = useRef(false);
  const hadLocation = useRef(locationReady);
  const active = useAppActive(); const focused = useIsFocused();
  const pinClock = useBookmarkPinClock(journal?.metadata, active);
  const interactionOwner = useRef({ alive: true, active, focused, principalId });
  useLayoutEffect(() => {
    interactionOwner.current = { alive: true, active, focused, principalId };
    return () => { interactionOwner.current = { alive: false, active: false, focused: false, principalId }; };
  }, [active, focused, principalId]);
  const canInteract = () => { const owner = interactionOwner.current; return owner.alive && owner.active && owner.focused && owner.principalId === principalId; };
  const map = useRef<MapView>(null);
  const admission = useArAdmission();
  const arInput = { running: active && focused, watcherStatus: location.watcherStatus ?? 'pending', sample: location.watcherSample ?? null } as const;
  const onsite = !!(featured && featured.id !== 'pilot-aclc');
  const arrival = useDestinationProximity(admission && onsite ? null : featured, arInput);
  const arSource = useAdmissionSource(admission, featured?.id ?? null, arInput, true);
  const snapshot = useAdmissionSnapshot(admission);
  const arrivalState = admission && onsite
    ? arInput.running && snapshot?.destinationId === featured?.id ? snapshot : null
    : arrival.state;
  const chapterCount = approvedArContent(featured, language).length;
  const contentReady = chapterCount > 0;
  const draftAr = !contentReady && featured?.id === 'pilot-aclc' && isViroSpikeEnabled();
  function launchAr() {
    if (!featured || !canInteract()) return;
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
  const pendingHandoffCenter = useRef<string | null>(incomingId);
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

  const [draftQuery, setDraftQuery] = useState('');
  const [category, setCategory] = useState<SearchCategory>('all');
  const [visibleRegion, setVisibleRegion] = useState<SearchRegion | null>(null);
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
  const nearbyOptions = (request: PlacesSearch) => ({ networkMode: 'always' as const, queryKey: ['places', { query: request.query ?? '', category: request.category ?? 'all', area: request.area }, language], staleTime: 0,
    queryFn: () => !request.query?.trim() && (request.category ?? 'all') === 'all' && request.area
      ? placesService.nearby({ ...request.area, language }) : placesService.search({ ...request, language }) });
  const detailsOptions = (providerId: string | null) => ({ ...placeDetailsOptions(queryClient, providerId, language), staleTime: 0 });
  // Observe transient results without allowing focus, remounts or invalidation to spend provider calls.
  const nearby = useQuery({ ...nearbyOptions(committedRequest), enabled: false });
  const details = useQuery({ ...detailsOptions(selectedId), enabled: false });
  const maxSheetHeight = sceneSize.height > 0 ? Math.max(0, sceneSize.height - headerHeight - Math.min(fitMargin * 2, sceneSize.height)) : undefined;
  const selectionKey = featured?.id ?? selectedId ?? 'nearby';
  const currentSelectionKey = useRef(selectionKey);
  useLayoutEffect(() => { currentSelectionKey.current = selectionKey; }, [selectionKey]);
  const sheetGeometry = homeSheetGeometry(sceneSize.height || window.height, maxSheetHeight, !!selectedId || !!featured, window.fontScale ?? 1, compactMeasurement?.key === selectionKey ? compactMeasurement.height : undefined);
  const frameHeight = Math.max(1, Math.min(sceneSize.height, sceneSize.height - sheetGeometry.peek + MAP_SHEET_OVERLAP));
  // Android adds fit edgePadding to mapPadding. Reserve measured chrome once,
  // keeping Google logo/legal controls above the sheet through native sheet gestures.
  // Maps 1.27.2's native padding setter can dereference a null GoogleMap after
  // layout but before onMapReady. Omit the prop until this instance is ready.
  const topPadding = Math.min(headerHeight, Math.max(0, frameHeight - gutter));
  const mapPadding = { top: topPadding, bottom: Math.max(0, Math.min(sheetHeight - sheetGeometry.peek + MAP_SHEET_OVERLAP, frameHeight - topPadding - gutter)), left: gutter, right: gutter };
  const completeSnapshot = useAvailablePlaceDetailsSnapshot(queryClient, selectedId, language);
  const complete = completeSnapshot?.place;
  const seed = selectionSeed?.providerId === selectedId ? selectionSeed : null;
  const seededPlace: Place | null = seed?.coordinates ? { id: `google:${seed.providerId}`, providerId: seed.providerId, provider: 'google', name: seed.name ?? t('exploreCleanup.unnamed'), coordinates: seed.coordinates, attributions: [] } : null;
  const place = featured ? featuredMapPlace(featured, language) : complete ?? handoff.data ?? nearby.data?.find((item) => item.providerId === selectedId) ?? seededPlace;
  const savedMarkers = savedMapMarkers(journal?.state.bookmarks ?? [], journal?.metadata ?? {}, pinClock, visibleRegion);
  useEffect(() => {
    if (!mapEnabled || !locationReady || hadLocation.current) return;
    hadLocation.current = true;
    if (!mapInteracted.current && !selectedId && !featured) map.current?.animateToRegion({ ...position, latitudeDelta: 0.02, longitudeDelta: 0.02 }, 400);
  }, [mapEnabled, locationReady, selectedId, featured, position]);
  useEffect(() => {
    if (!params.selectionToken) return;
    if (!active) { claimMapSelectionIntent(queryClient, params.selectionToken, principalId); return; }
    if (!focused) return;
    const intent = claimMapSelectionIntent(queryClient, params.selectionToken, principalId);
    const owner = interactionOwner.current;
    let current = true;
    void Promise.resolve().then(() => {
      if (!current || interactionOwner.current !== owner || !owner.alive) return;
      router.setParams({ selectionToken: undefined });
      if (!intent || intent.providerId !== selectedId) return;
      mapInteracted.current = true;
      setSelectionSeed({ providerId: intent.providerId, name: intent.name ?? intent.place?.name, coordinates: intent.coordinates ?? intent.place?.coordinates, capturedAt: intent.capturedAt ?? intent.updatedAt });
      setPendingIntent(intent);
    });
    return () => { current = false; };
  }, [params.selectionToken, active, focused, principalId, selectedId, queryClient]);
  useEffect(() => {
    if (!pendingIntent) return;
    let current = true;
    void Promise.resolve().then(() => {
      if (!current) return;
      // Returning to focus/foreground or changing language cannot revive a command.
      if (!active || !focused || pendingIntent.principalId !== principalId || pendingIntent.providerId !== selectedId || pendingIntent.language && pendingIntent.language !== language || Date.now() < pendingIntent.createdAt || Date.now() - pendingIntent.createdAt >= 30000) { setPendingIntent(null); return; }
      if (!mapEnabled) return;
      setPendingIntent(null);
      if (!availablePlaceDetails(queryClient, pendingIntent.providerId, language)) void queryClient.fetchQuery({ ...placeDetailsOptions(queryClient, pendingIntent.providerId, language), networkMode: 'always', staleTime: 0 }).catch(() => {});
    });
    return () => { current = false; };
  }, [pendingIntent, mapEnabled, active, focused, principalId, selectedId, queryClient, language]);
  useLayoutEffect(() => { if (incomingId) pendingHandoffCenter.current = incomingId; }, [incomingId]);
  useEffect(() => {
    if (!mapEnabled || !place || pendingHandoffCenter.current !== place.providerId) return;
    map.current?.animateToRegion({ ...place.coordinates, latitudeDelta: 0.02, longitudeDelta: 0.02 }, 400);
    pendingHandoffCenter.current = null;
  }, [incomingId, mapEnabled, place]);
  useEffect(() => {
    if (incomingFeatured) pendingFeaturedCenter.current = incomingFeatured;
    if (!mapEnabled || !pendingFeaturedCenter.current?.center) return;
    map.current?.animateToRegion({ ...pendingFeaturedCenter.current.center, latitudeDelta: 0.002, longitudeDelta: 0.002 }, 400);
    pendingFeaturedCenter.current = null;
  }, [incomingFeatured, mapEnabled]);
  useLayoutEffect(() => {
    if (!active || !focused) { pendingHandoffCenter.current = null; pendingFeaturedCenter.current = null; }
  }, [active, focused]);
  const open = useOpenProviderLink();
  function select(providerId: string | null, suppliedSeed?: PlaceSelectionSeed) {
    if (!canInteract()) return;
    setPendingIntent(null);
    pendingHandoffCenter.current = null; pendingFeaturedCenter.current = null;
    if (providerId && (!mapEnabled || !detailsRequestSchema.safeParse({ providerId, language }).success)) return;
    mapInteracted.current = true;
    const matched = providerId ? matchedFeaturedDestination({ provider: 'google', providerId }) : null;
    setFeaturedId(matched?.id ?? null);
    setSelectedId(matched ? null : providerId);
    const known = nearby.data?.find(item => item.providerId === providerId);
    if (providerId && !suppliedSeed?.coordinates && !known) pendingHandoffCenter.current = providerId;
    setSelectionSeed(suppliedSeed ?? (known ? { providerId: known.providerId, name: known.name, coordinates: known.coordinates, capturedAt: nearby.dataUpdatedAt } : null));
    if (matched) return;
    if (providerId && !availablePlaceDetails(queryClient, providerId, language)) void queryClient.fetchQuery({ ...detailsOptions(providerId), networkMode: 'always' }).catch(() => {});
  }
  function submitSearch(request: PlacesSearch) {
    if (!canInteract() || !mapEnabled || nearby.isFetching || (!request.query?.trim() && !request.area)) return;
    select(null); setCommittedRequest(request);
    void queryClient.fetchQuery(nearbyOptions(request)).catch(() => {});
  }
  function discover() {
    const area = locationReady ? { center: { ...position }, radiusMeters: DISCOVERY.radiusMeters } : viewport ?? undefined;
    submitSearch({ query: draftQuery.trim(), category, ...(area ? { area } : {}) });
  }
  function searchArea() { if (viewport) submitSearch({ query: draftQuery.trim(), category, area: viewport }); }
  function directions() {
    if (!canInteract() || !mapEnabled || !place || previewNavigation.current) return;
    const target = featured ? destinationToRoutePlace(featured, language) : place;
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
      {...(mapReady ? { mapPadding } : {})} showsUserLocation={enabled} showsMyLocationButton={false} toolbarEnabled={false} onMapReady={() => setMapReady(true)}
      onPanDrag={() => { mapInteracted.current = true; pendingHandoffCenter.current = null; pendingFeaturedCenter.current = null; }}
      onRegionChangeComplete={(region: SearchRegion) => { setViewport(areaFromRegion(region)); setVisibleRegion(region); }}
      onPoiClick={({ nativeEvent }) => select(nativeEvent.placeId, nativePoiSeed(nativeEvent))}>
      {listDestinations().filter(item => item.center).map(item => <Marker identifier={`featured:${item.id}`} key={`featured:${item.id}`} coordinate={item.center!} title={destinationName(item, language)} image={featuredPin} tracksViewChanges={false} zIndex={featured?.id === item.id ? 50 : 30} onPress={() => { if (!canInteract() || !mapEnabled) return; mapInteracted.current = true; pendingHandoffCenter.current = null; pendingFeaturedCenter.current = null; setFeaturedId(item.id); setSelectedId(null); setSelectionSeed(null); }}><PlaceCallout name={destinationName(item, language)} /></Marker>)}
      {savedMarkers.items.filter(item => !nearby.data?.some(result => result.providerId === item.reference.id) && selectedId !== item.reference.id).map(item => <Marker identifier={`saved:${item.reference.id}`} key={`saved:${item.reference.id}`} coordinate={item.pin.coordinates} title={item.name ?? t('exploreCleanup.unnamed')} image={savedPin} tracksViewChanges={false} zIndex={20} onPress={() => select(item.reference.id, { providerId: item.reference.id, name: item.name, coordinates: item.pin.coordinates, capturedAt: item.pin.capturedAt })}><PlaceCallout name={item.name ?? t('exploreCleanup.unnamed')} /></Marker>)}
      {nearby.data?.filter(item => !matchedFeaturedDestination(item)).map((item) => <Marker identifier={`google:${item.providerId}`} key={item.id} coordinate={item.coordinates} title={item.name} image={journal?.state.bookmarks.some(ref => ref.kind === 'google' && ref.id === item.providerId) ? savedPin : undefined} onPress={() => select(item.providerId)}><PlaceCallout name={item.name} /></Marker>)}
      {place && !nearby.data?.some((item) => item.providerId === place.providerId) && (!featured || featured.id === 'pilot-aclc') && <Marker identifier={`selected:${place.providerId}`} coordinate={place.coordinates} title={place.name} image={journal?.state.bookmarks.some(ref => ref.kind === 'google' && ref.id === place.providerId) ? savedPin : undefined} pinColor={featured ? routeColor : undefined} zIndex={50}><PlaceCallout name={place.name} /></Marker>}
    </StyledMapView>
    <View style={{ paddingTop: insets.top }} pointerEvents="box-none">
    <HomeMapControls onSearchNearby={discover} canSearch={mapEnabled && (locationReady || !!draftQuery.trim() || !!viewport)} searching={nearby.isFetching}
      query={draftQuery} onQueryChange={setDraftQuery} category={category} onCategoryChange={setCategory}
      onSearchArea={searchArea} canSearchArea={mapEnabled && !!viewport} areaRadiusMeters={viewport?.radiusMeters}
      onLayout={(event) => setHeaderHeight(event.nativeEvent.layout.height + insets.top)}
      onOpenAr={() => router.navigate('/ar')} onOpenDestinations={() => router.navigate('/destinations')}
      onOpenSavedPlaces={() => { if (canInteract()) router.navigate('/saved-places'); }} />
    </View>
    <MapRecenter disabled={!enabled} position={sheetPosition} onPress={() => enabled && map.current?.animateToRegion({ ...position, latitudeDelta: 0.02, longitudeDelta: 0.02 }, 400)} />
    <HomePlaceSheet saveAction={<>{featured ? <SavePlaceAction variant="outline" className="h-auto min-h-12 w-full py-3" reference={{kind:'featured',id:featured.id}} aliases={featuredBookmarkAliases(featured.id, journal?.state.bookmarks ?? [])} /> : selectedId ? <SavePlaceAction variant="outline" className="h-auto min-h-12 w-full py-3" reference={{kind:'google',id:selectedId}} placeName={place?.name ?? seed?.name} pin={place && (completeSnapshot?.updatedAt ?? seed?.capturedAt) ? { coordinates: place.coordinates, capturedAt: completeSnapshot?.updatedAt ?? seed!.capturedAt! } : undefined} /> : null}<JournalFeedback/></>} geometry={sheetGeometry} animatedPosition={sheetPosition} key={selectionKey} state={state} selectedPlace={place ?? null} selectionName={seed?.name} hasSelection={!!selectedId || !!featured}
      featured={!!featured} canRequest={mapEnabled && !!place && (!featured || !!destinationToRoutePlace(featured))} canLoadDetails={mapEnabled} resultCount={nearby.data?.length ?? 0} errorKey={error ? edgeErrorMessageKey(error) : undefined}
      detailsLoaded={!!complete || !!featured} detailsLoading={details.isFetching} mapLoading={!mapReady}
      locationStatus={locationStatus}
      extraStatus={<>{savedMarkers.truncated && <Text className="font-sans text-xs text-muted">{t('exploreCleanup.zoomSaved')}</Text>}{featured && <ArrivalInvitation state={arrivalState} chapterCount={chapterCount} contentReady={contentReady} draft={draftAr} keepInline={onsite} onLaunch={admission ? launchAr : undefined} onDismiss={arrival.dismiss} />}{featured && admission && isViroSpikeEnabled() && (contentReady || featured.id === 'pilot-aclc') && <Button variant="outline" accessibilityLabel={t('arrival.simulate')} onPress={() => void simulateArrival()}><Button.Label>{t('arrival.simulate')}</Button.Label></Button>}{accuracy !== null && accuracy > activationRadiusMeters && <Notice>{t('location.approximate', { meters: Math.round(accuracy) })}</Notice>}</>}
      selectionMedia={featured?.media?.length ? <DaytimeGallery media={featured.media} variant="sheet" /> : undefined}
      selectionSummary={featured ? featured.copy?.[language]?.overview?.value ?? t('arrival.teaser') : place && locationReady ? t('exploreCleanup.distance', { meters: Math.round(distanceMeters(position, place.coordinates)) }) : undefined}
      onViewDetails={featured ? () => { if (canInteract()) router.navigate({ pathname: '/destinations/[destinationId]', params: { destinationId: featured.id } }); } : undefined}
      onCompactHeight={height => { if (currentSelectionKey.current === selectionKey) setCompactMeasurement(previous => previous?.key === selectionKey && Math.abs(previous.height - height) < 1 ? previous : { key: selectionKey, height }); }}
      onRetrySearch={() => submitSearch(committedRequest)} onClosePlace={() => select(null)} onDetails={() => { if (!complete) select(selectedId, seed ?? undefined); }} onDirections={directions}
      onOpenGoogle={place || selectedId ? () => { if (canInteract()) open(place?.mapsUri ?? googleMapsPlaceUrl({ providerId: featured ? displayGooglePlaceId(featured.id) : selectedId ?? undefined, name: place?.name ?? seed?.name ?? selectedId ?? '', coordinates: place?.coordinates })); } : undefined}
      onMeasuredHeight={setSheetHeight} containerHeight={sceneSize.height} maxHeight={maxSheetHeight}
      attributions={<ProviderAttributions places={[...(nearby.data ?? []), ...(details.data ? [details.data] : []), ...(handoff.data ? [handoff.data] : [])]} />} />
    {featured && onsite && <ArrivalUnlock eligible={active && focused && contentReady && arrivalState?.eligible === true}
      destinationTitle={destinationName(featured, language)} language={language} claimUnlock={arSource.claimUnlock} onLaunch={launchAr} />}
    </View>
  </StyledSafeAreaView>;
}
