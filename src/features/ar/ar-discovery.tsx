import { useQuery, useQueryClient } from '@tanstack/react-query';
import { placeSelectionOptions, setPlaceSelection } from '@/features/places/selection';
import { router, useLocalSearchParams } from 'expo-router';
import { detailsRequestSchema } from '../../../supabase/functions/_shared/contracts';
import { availablePlaceDetails, placeDetailsOptions } from '@/features/places/details-cache';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Image, ScrollView, Text, View, useWindowDimensions } from 'react-native';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { withUniwind } from 'uniwind';
import googleMapsAttribution from '../../../assets/attribution/google-maps.png';
import { AR } from '@/config/limits';
import type { useDeviceLocation } from '@/features/location/use-device-location';
import { LocationStatus } from '@/features/location/status';
import { useSettings } from '@/features/settings/provider';
import { ProviderAttributions } from '@/features/map/attributions';
import { edgeErrorMessageKey } from '@/lib/edge-error';
import { Action, Notice } from '@/ui/shared';
import { layoutLabels, rankPlaces, selectedPlaceId } from './projection';
import { useArPlaces } from './use-ar-places';
import { ArChrome } from './ar-chrome';
import { ArLabels } from './ar-labels';
import { ArNearbySheet } from './ar-nearby-sheet';
import { createRoutePreviewIntent } from '@/features/directions/route-preview-intent';
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';

const OverlaySafeArea = withUniwind(SafeAreaView);
type Props = { location: ReturnType<typeof useDeviceLocation>; running: boolean; cameraReady: boolean; cameraStatus: ReactNode };
export function ArDiscovery({ location, running, cameraReady, cameraStatus }: Props) {
  const { t } = useTranslation();
  const client = useQueryClient();
  const navigating = useRef(false);
  useEffect(() => { if (running) navigating.current = false; }, [running]);
  const { language, activationRadiusMeters } = useSettings();
  const [now, setNow] = useState(Date.now);
  const [viewport, setViewport] = useState({ width: 0, height: 0 });
  const [chromeHeight, setChromeHeight] = useState(0);
  const { fontScale = 1 } = useWindowDimensions();
  const [occupation, setOccupation] = useState(0);
  const sheetPosition = useSharedValue(0);
  // Clip badges on the UI thread during a drag, including their hit regions.
  const labelClip = useAnimatedStyle(() => ({ height: Math.max(0, sheetPosition.get() - 8) }));
  const params = useLocalSearchParams();
  const parsed = detailsRequestSchema.safeParse({ providerId: params.placeId, language });
  const incomingId = parsed.success ? parsed.data.providerId : null;
  const [selectionRevision, setSelectionRevision] = useState(incomingId ? 1 : 0);
  const [manualId, setManualId] = useState<string | null>(incomingId);
  const [lastIncomingId, setLastIncomingId] = useState(incomingId);
  if (incomingId !== lastIncomingId) {
    setLastIncomingId(incomingId);
    if (incomingId) {
      setManualId(incomingId);
      setSelectionRevision(value => value + 1);
    }
  }
  const handoff = useQuery(placeSelectionOptions(manualId));
  useEffect(() => {
    if (incomingId && running) router.setParams({ placeId: undefined });
  }, [incomingId, running]);
  useEffect(() => {
    if (!running) return;
    let alive = true;
    void Promise.resolve().then(() => { if (alive) setNow(Date.now()); });
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => { alive = false; clearInterval(timer); };
  }, [running, location.positionTimestamp, location.headingTimestamp]);
  const age = (timestamp: number | null, max: number) => timestamp !== null && Number.isFinite(timestamp) &&
    timestamp <= now + 1000 && now - timestamp <= max;
  const tracking = running && location.status === 'ready' && location.watcherStatus === 'ready' &&
    location.position !== null && age(location.positionTimestamp, AR.positionMaxAgeMs) && age(location.watcherTimestamp, AR.positionMaxAgeMs) &&
    location.accuracy !== null && Number.isFinite(location.accuracy) && location.accuracy >= 0 && location.accuracy <= AR.maxPositionAccuracyMeters;
  const heading = tracking && location.headingStatus === 'ready' && age(location.headingTimestamp, AR.headingMaxAgeMs) &&
    location.heading && Number.isFinite(location.heading.degrees) && location.heading.degrees >= 0 && location.heading.degrees <= 360 && location.heading.accuracy >= 2 && location.heading.reference === 'true' ? location.heading.degrees : null;
  const data = useArPlaces(location.position, language);
  const places = data.nearby.data ?? [];
  const ranked = tracking && location.position ? rankPlaces(places, location.position, heading, activationRadiusMeters) : [];
  const manualAvailable = manualId && (places.some(p => p.providerId === manualId) || handoff.data?.providerId === manualId);
  const selectedId = manualAvailable ? manualId : selectedPlaceId(ranked, manualId);
  useQuery(placeSelectionOptions(selectedId));
  const nearest = ranked.find((p) => p.eligible);
  const summary = places.find((p) => p.providerId === selectedId);
  const detailsOptions = placeDetailsOptions(client, selectedId, language);
  useQuery({ ...detailsOptions, enabled: false });
  const detail = availablePlaceDetails(client, selectedId, language);
  const selected = detail ?? summary ?? (handoff.data?.providerId === selectedId ? handoff.data : null);
  const distance = ranked.find((p) => p.place.providerId === selectedId)?.distance;
  const labels = cameraReady && running ? layoutLabels(ranked, viewport.width, selectedId) : [];
  const select = (id: string) => { if (running) { setManualId(id); setSelectionRevision(value => value + 1); } };
  function toMap() {
    if (!running || !selected || navigating.current) return;
    navigating.current = true;
    // Carry the selected summary without a provider request on map entry.
    setPlaceSelection(client, selected, detail ? language : undefined, detailsOptions.initialDataUpdatedAt);
    router.navigate({ pathname: '/', params: { placeId: selected.providerId } });
  }
  function directions() {
    if (!running || !selected || navigating.current) return;
    navigating.current = true;
    setPlaceSelection(client, selected, detail ? language : undefined, detailsOptions.initialDataUpdatedAt);
    const token = createRoutePreviewIntent(client, selected, undefined, 'ar', language);
    router.push({ pathname: '/directions', params: { token } });
  }
  const state = data.nearby.isFetching ? 'scanning' : data.nearby.error ? 'failed' : !data.request ? 'unscanned' : places.length === 0 ? 'empty' : 'results';
  const status = <>
    {cameraStatus}
    {!cameraReady && <Notice>{t('ar.cameraFallback')}</Notice>}
    <LocationStatus location={location} />
    {!tracking && <><Notice>{t('ar.trackingFallback')}</Notice>{location.status === 'ready' && <Action title={t('location.retry')} onPress={location.retry} />}</>}
    {heading === null && <Notice>{t('ar.headingFallback')}</Notice>}
    {data.nearby.error && <Notice>{t(edgeErrorMessageKey(data.nearby.error))}</Notice>}
    {places.length > 0 && tracking && !nearest && <Text className="font-sans text-sm text-muted">{t('ar.noneActive', { meters: activationRadiusMeters })}</Text>}
    {data.detailRequest?.providerId === selectedId && data.details.isFetching && <Notice busy>{t('map.details')}</Notice>}
    {!detail && data.detailRequest?.providerId === selectedId && data.details.error && <Notice>{t(edgeErrorMessageKey(data.details.error))}</Notice>}
  </>;
  const guidance = <>
    {nearest && tracking && <Text className="font-sans text-sm text-muted">{t('ar.nearest', { name: nearest.place.name, meters: Math.round(nearest.distance) })}</Text>}
    <Text className="font-sans text-xs text-muted">{t('ar.approximate', { degrees: AR.horizontalFovDegrees })}</Text>
  </>;
  return <OverlaySafeArea className="flex-1" edges={['top', 'left', 'right', 'bottom']}>
    <View testID="ar-chrome" className="px-3 pb-1 pt-1" onLayout={event => setChromeHeight(event.nativeEvent.layout.height)}>
      <ArChrome headingDegrees={heading} onMap={() => router.navigate('/')}
        onScan={() => { if (tracking) data.scan(); }} scanDisabled={!tracking || data.nearby.isFetching} scanBusy={data.nearby.isFetching} />
    </View>
    <View testID="ar-viewport" className="flex-1" onLayout={event => setViewport(event.nativeEvent.layout)}>
      <Animated.View pointerEvents="box-none" className="absolute left-0 right-0 top-0 overflow-hidden" style={labelClip}>
        <ArLabels labels={chromeHeight ? labels : []} selectedId={selectedId} onSelect={select}
          top={8} bottom={viewport.height - occupation - 8} fontScale={fontScale} />
      </Animated.View>
      <ArNearbySheet rows={ranked.length ? ranked.map(p => ({ place: p.place, distance: p.distance })) : places.map(place => ({ place, distance: undefined }))}
        selected={selected} distance={distance} state={state} status={status} guidance={guidance} running={running}
        height={viewport.height} fontScale={fontScale} selectionRevision={selectionRevision} position={sheetPosition} onOccupation={setOccupation}
        detailsLoaded={!!detail} detailsBusy={data.details.isFetching}
        onSelect={select} onMore={() => { if (running && selected) data.more(selected.providerId); }}
        onDetails={() => {
          if (!running || !selected || navigating.current) return;
          navigating.current = true;
          setPlaceSelection(client, selected, detail ? language : undefined, detailsOptions.initialDataUpdatedAt);
          router.navigate({ pathname: '/place/[providerId]', params: { providerId: selected.providerId } });
        }} onDirections={directions} onMap={toMap} />
    </View>
    {(places.length > 0 || selected) && <View testID="ar-attributions" className="gap-1 border-t border-outline bg-surface px-4 py-2">
      <Image source={googleMapsAttribution} accessibilityLabel="Google Maps" className="h-5 w-28" resizeMode="contain" />
      <ScrollView className="max-h-14"><ProviderAttributions places={[...places, ...(selected ? [selected] : [])]} /></ScrollView>
    </View>}
  </OverlaySafeArea>;
}
