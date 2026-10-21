import { useEffect, useRef } from 'react';
import { Image, Text, View } from 'react-native';
import { withUniwind } from 'uniwind';
import { useTranslation } from 'react-i18next';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { router, useIsFocused } from 'expo-router';
import { Button } from 'heroui-native/button';
import { Card } from 'heroui-native/card';
import { Spinner } from 'heroui-native/spinner';
import { AR, DISCOVERY } from '@/config/limits';
import { distanceMeters, isCoordinate } from '@/features/location/geo';
import { ProviderAttributions } from '@/features/map/attributions';
import { setPlaceSelection } from '@/features/places/selection';
import type { Place } from '@/features/places/service';
import { useSettings } from '@/features/settings/provider';
import { edgeErrorMessageKey } from '@/lib/edge-error';
import { useAppActive } from '@/lib/use-app-active';
import googleMapsAttribution from '../../../assets/attribution/google-maps.png';
import type { Destination } from './catalog';
import { searchDestinationNearby, withinDestinationRadius } from './nearby';

const StyledImage = withUniwind(Image);
export function NearbyEstablishments({ destination }: { destination: Destination }) {
  const { t } = useTranslation();
  const { language } = useSettings();
  const client = useQueryClient();
  const active = useAppActive(); const focused = useIsFocused();
  const navigating = useRef(false);
  useEffect(() => { if (focused) navigating.current = false; }, [focused]);
  const center = isCoordinate(destination.center) && destination.centerApprovalReference?.trim() ? destination.center : null;
  const options = { queryKey: ['destination-nearby', destination.id, center, language],
    queryFn: () => searchDestinationNearby(center, language), gcTime: AR.nearbyReuseMs, staleTime: 0, retry: false,
    // An offline tap must fail now, not queue paid work for a later reconnect.
    networkMode: 'always' as const };
  const nearby = useQuery({ ...options, enabled: false });
  const places = (nearby.data ?? []).filter(item => withinDestinationRadius(center, item.coordinates));
  function search() {
    if (!center || !active || !focused || nearby.isFetching) return;
    void client.fetchQuery(options).catch(() => {});
  }
  function select(place: Place) {
    if (!active || !focused || navigating.current) return;
    navigating.current = true;
    setPlaceSelection(client, place, language);
    router.navigate({ pathname: '/place/[providerId]', params: { providerId: place.providerId } });
  }
  return <View className="gap-3">
    <Text accessibilityRole="header" className="font-sans text-section font-semibold text-foreground">{t('destinations.nearbyTitle')}</Text>
    <Text className="font-sans text-sm text-muted">{t('destinations.nearbyRadius')}</Text>
    {!center && <Text className="font-sans text-sm text-muted">{t(destination.center ? 'destinations.centerInvalid' : 'destinations.centerMissing')}</Text>}
    <Button variant="secondary" accessibilityLabel={t('destinations.exploreNearby')} isDisabled={!center || !active || !focused || nearby.isFetching}
      accessibilityState={{ busy: nearby.isFetching }} onPress={search}><Button.Label>{t('destinations.exploreNearby')}</Button.Label></Button>
    {nearby.isFetching && <View accessibilityLiveRegion="polite" className="gap-2"><Spinner /><Text className="font-sans text-sm text-muted">{t('common.loading')}</Text></View>}
    {nearby.error && <Text selectable accessibilityLiveRegion="polite" className="font-sans text-sm text-danger">{t(edgeErrorMessageKey(nearby.error))}</Text>}
    {center && !nearby.data && !nearby.error && !nearby.isFetching && <Text className="font-sans text-sm text-muted">{t('destinations.nearbyUnsearched')}</Text>}
    {nearby.data && <>
      {places.length === 0 && <Text className="font-sans text-base text-muted">{t('destinations.nearbyEmpty')}</Text>}
      {places.map(place => <Card key={place.id} className="gap-2 p-4 shadow-none">
        <Button variant="secondary" className="justify-start" accessibilityLabel={place.name} onPress={() => select(place)}><Button.Label className="shrink text-left">{place.name}</Button.Label></Button>
        <Text className="font-sans text-sm text-muted">{t('destinations.fromDestination', { meters: Math.round(distanceMeters(center!, place.coordinates)) })}</Text>
      </Card>)}
      <StyledImage source={googleMapsAttribution} accessibilityLabel="Google Maps" className="h-[18px] w-[98px]" resizeMode="contain" />
      <ProviderAttributions places={nearby.data} />
      <Text className="font-sans text-sm text-muted">{t('destinations.nearbyLimit', { count: DISCOVERY.maxResults })}</Text>
    </>}
  </View>;
}
