import { useQuery, useQueryClient } from '@tanstack/react-query';
import { placeSelectionOptions } from '@/features/places/selection';
import { router, useLocalSearchParams } from 'expo-router';
import { detailsRequestSchema } from '../../../supabase/functions/_shared/contracts';
import { placesService } from '@/features/places/service';
import { useEffect, useState, type ReactNode } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import googleMapsAttribution from '../../../assets/attribution/google-maps.png';
import { AR, DISCOVERY } from '@/config/limits';
import type { useDeviceLocation } from '@/features/location/use-device-location';
import { LocationStatus } from '@/features/location/status';
import { useSettings } from '@/features/settings/provider';
import { ProviderAttributions } from '@/features/map/attributions';
import { edgeErrorMessageKey } from '@/lib/edge-error';
import { Action, Notice } from '@/ui/shared';
import { layoutLabels, rankPlaces, selectedPlaceId } from './projection';
import { useArPlaces } from './use-ar-places';
import { ArChrome } from './ar-chrome';

type Props = { location: ReturnType<typeof useDeviceLocation>; running: boolean; cameraReady: boolean; preview: ReactNode; cameraStatus: ReactNode };
export function ArDiscovery({ location, running, cameraReady, preview, cameraStatus }: Props) {
  const { t } = useTranslation();
  const client = useQueryClient();
  const { language, activationRadiusMeters } = useSettings();
  const [now, setNow] = useState(Date.now);
  const [width, setWidth] = useState(0);
  const params = useLocalSearchParams();
  const parsed = detailsRequestSchema.safeParse({ providerId: params.placeId, language });
  const incomingId = parsed.success ? parsed.data.providerId : null;
  const [manualId, setManualId] = useState<string | null>(incomingId);
  const [lastIncomingId, setLastIncomingId] = useState(incomingId);
  if (incomingId !== lastIncomingId) {
    setLastIncomingId(incomingId);
    if (incomingId) setManualId(incomingId);
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
  const cachedDetails = useQuery({ queryKey: ['place-details', selectedId, language],
    queryFn: () => placesService.details(selectedId!, language), enabled: false, gcTime: AR.nearbyReuseMs });
  const detail = cachedDetails.data?.providerId === selectedId ? cachedDetails.data : null;
  const selected = detail ?? summary ?? (handoff.data?.providerId === selectedId ? handoff.data : null);
  const distance = ranked.find((p) => p.place.providerId === selectedId)?.distance;
  const labels = cameraReady && running ? layoutLabels(ranked, width, selectedId) : [];
  const select = (id: string) => setManualId(id);
  const distanceText = (meters: number | undefined) => meters === undefined ? t('ar.distanceUnknown') : t('ar.distance', { meters: Math.round(meters) });
  function directions() {
    if (!running || !selected) return;
    // Carry the selected summary without a provider request on map entry.
    client.setQueryData(placeSelectionOptions(selected.providerId).queryKey, selected);
    router.navigate({ pathname: '/', params: { placeId: selected.providerId } });
  }
  return <View style={styles.container}>
    <View testID="ar-viewport" style={styles.preview} onLayout={(event) => setWidth(event.nativeEvent.layout.width)}>
      {preview}
      <View className="absolute left-3 right-3 top-3"><ArChrome headingDegrees={heading} onMap={() => router.navigate('/')}
        onScan={() => { if (tracking) data.scan(); }} scanDisabled={!tracking || data.nearby.isFetching} scanBusy={data.nearby.isFetching} /></View>
      <View style={styles.cameraStatus}>{cameraStatus}</View>
      {labels.map((label) => <Pressable key={label.place.providerId} testID={`ar-label-${label.place.providerId}`}
        accessibilityRole="button" accessibilityState={{ selected: selectedId === label.place.providerId }}
        accessibilityLabel={`${label.place.name}, ${distanceText(label.distance)}`}
        onPress={() => select(label.place.providerId)}
        style={[styles.label, label.eligible && styles.eligible, selectedId === label.place.providerId && styles.selected,
          { left: label.left, top: 12 + label.lane * 76, width: label.width }]}>
        <Text numberOfLines={1} style={styles.labelName}>{label.place.name}</Text>
        <Text numberOfLines={1}>{distanceText(label.distance)}</Text>
      </Pressable>)}
    </View>
    <View style={styles.content}>
      <Text style={styles.hint}>{t('ar.approximate', { degrees: AR.horizontalFovDegrees })}</Text>
      <ScrollView style={styles.panel} contentContainerStyle={styles.panelContent}>
        <LocationStatus location={location} />
        {!tracking && <><Notice>{t('ar.trackingFallback')}</Notice>{location.status === 'ready' && <Action title={t('location.retry')} onPress={location.retry} />}</>}
        {heading === null && <Notice>{t('ar.headingFallback')}</Notice>}
        {!data.request && <Notice>{t('ar.start')}</Notice>}
        {data.nearby.isFetching && <Notice busy>{t('ar.scanning')}</Notice>}
        {data.nearby.error && <Notice>{t(edgeErrorMessageKey(data.nearby.error))}</Notice>}
        {data.nearby.data?.length === 0 && !data.nearby.isFetching && <Notice>{t('ar.empty')}</Notice>}
        {places.length > 0 && tracking && <Notice>{nearest ? t('ar.nearest', { name: nearest.place.name, meters: Math.round(nearest.distance) }) : t('ar.noneActive', { meters: activationRadiusMeters })}</Notice>}
        {selected && <View style={styles.details}>
          <Text testID="ar-selected-name" style={styles.title}>{selected.name}</Text>
          <Text>{selected.address ?? t('ar.addressUnknown')}</Text>
          <Text>{distanceText(distance)}</Text>
          {detail?.description && <Text>{detail.description}</Text>}
          {data.detailRequest?.providerId === selectedId && data.details.isFetching && <Notice busy>{t('map.details')}</Notice>}
          {data.detailRequest?.providerId === selectedId && data.details.error && <Notice>{t(edgeErrorMessageKey(data.details.error))}</Notice>}
          {!detail && <Action title={t('ar.more')} onPress={() => { if (running) data.more(selected.providerId); }} disabled={!running || data.details.isFetching} />}
          <Action title={t('placeDetails.view')} onPress={() => {
            if (!running) return;
            client.setQueryData(placeSelectionOptions(selected.providerId).queryKey, selected);
            router.navigate({ pathname: '/place/[providerId]', params: { providerId: selected.providerId } });
          }} disabled={!running} />
          <Action title={t('ar.directions')} onPress={directions} disabled={!running} />
        </View>}
        <Text>{t('map.limit', { count: DISCOVERY.maxResults, meters: DISCOVERY.radiusMeters })}</Text>
        {places.length > 0 && <Text style={styles.title}>{t('ar.nearby')}</Text>}
        {(ranked.length ? ranked.map((p) => ({ place: p.place, distance: p.distance })) : places.map((place) => ({ place, distance: undefined }))).map(({ place, distance }) =>
          <Pressable key={place.providerId} testID={`ar-list-${place.providerId}`} accessibilityRole="button"
            accessibilityState={{ selected: selectedId === place.providerId }} disabled={!running} onPress={() => select(place.providerId)}
            style={[styles.row, nearest?.place.providerId === place.providerId && styles.eligible, selectedId === place.providerId && styles.selected]}>
            <Text style={styles.rowName}>{place.name}</Text><Text>{distanceText(distance)}</Text>
          </Pressable>)}
      </ScrollView>
      {(places.length > 0 || selected) && <View style={styles.attribution}>
        <Image source={googleMapsAttribution} accessibilityLabel="Google Maps" style={styles.google} resizeMode="contain" />
        <ScrollView style={styles.credits}><ProviderAttributions places={[...places, ...(selected ? [selected] : [])]} /></ScrollView>
      </View>}
    </View>
  </View>;
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#111' }, preview: { flex: 1, minHeight: 240, overflow: 'hidden' },
  cameraStatus: { position: 'absolute', bottom: 0, left: 8, right: 8, backgroundColor: '#fff' },
  content: { flex: 1, backgroundColor: '#fff', paddingBottom: 16 }, toolbar: { alignItems: 'center' },
  hint: { paddingHorizontal: 12, fontSize: 12, color: '#444' }, panel: { flex: 1 }, panelContent: { padding: 12, gap: 8 },
  label: { position: 'absolute', height: 64, padding: 8, borderRadius: 8, backgroundColor: '#fff', borderWidth: 2, borderColor: '#777' },
  labelName: { fontWeight: '600', fontSize: 16 }, eligible: { backgroundColor: '#e3f3e4', borderColor: '#24752c' },
  selected: { borderColor: '#125fac', borderWidth: 2 }, row: { padding: 10, gap: 4, borderWidth: 1, borderColor: '#ddd', borderRadius: 6 },
  rowName: { fontWeight: '600' }, details: { padding: 12, gap: 8, borderWidth: 1, borderColor: '#125fac', borderRadius: 8 },
  title: { fontSize: 18, fontWeight: '600' }, attribution: { paddingHorizontal: 12, paddingTop: 10, paddingBottom: 5, gap: 8 },
  google: { width: 98, height: 18 }, credits: { maxHeight: 56 },
});
