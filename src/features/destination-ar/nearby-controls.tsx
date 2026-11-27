import { useEffect, useState } from 'react';
import { BackHandler, Image, Pressable, ScrollView, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Button } from 'heroui-native/button';
import { SafeAreaView } from 'react-native-safe-area-context';
import { withUniwind } from 'uniwind';
import { distanceMeters, type Coordinate } from '@/features/location/geo';
import { ProviderAttributions, useOpenProviderLink } from '@/features/map/attributions';
import { googleMapsPlaceUrl } from '@/features/places/maps-url';
import type { Place } from '@/features/places/service';
import { edgeErrorMessageKey } from '@/lib/edge-error';
import { LocationStatus } from '@/features/location/status';
import { FocusedStatusBar } from '@/features/navigation/focused-status-bar';
import googleMapsAttribution from '../../../assets/attribution/google-maps.png';
import type { NearbyHeadingStatus } from './nearby-mode';
import type { NearbyMode } from './use-nearby-mode';

const guidanceClass = 'text-center font-sans text-sm text-white';
const StyledSafeAreaView = withUniwind(SafeAreaView);
const headingMessage = { weak: 'arNearby.headingWeak', unavailable: 'arNearby.headingUnavailable', 'no-reading': 'arNearby.headingNoReading' } as const;

export function NearbyControls({ signedIn, nearby, heading, trackingLost, disabled, resultsEnabled, onShowResults }: {
  signedIn: boolean; nearby: NearbyMode; heading: NearbyHeadingStatus; trackingLost: boolean; disabled: boolean;
  resultsEnabled: boolean; onShowResults(): void;
}) {
  const { t } = useTranslation();
  const { location, position, search, state, result } = nearby;
  const count = result?.places.length ?? 0;
  const action = result || state.expired ? 'arNearby.rescan' : 'arNearby.scan';
  const resultsLabel = t('arNearby.results', { count });
  let message: string | null = null;
  if (trackingLost) message = 'arNearby.trackingLost';
  else if (!position && location.status === 'ready') message = 'arNearby.waitingLocation';
  else if (position) {
    if (!result) message = state.expired ? 'arNearby.expired' : 'arNearby.firstScan';
    else if (!count) message = 'arNearby.empty';
    else if (nearby.cards.length && heading !== 'ready') message = headingMessage[heading];
  }
  return <View className="shrink items-center gap-2">
    {!signedIn ? <>
      <Text className={guidanceClass}>{t('arNearby.signInHint')}</Text>
      <Button variant="secondary" accessibilityLabel={t('journal.signIn')} isDisabled={disabled} onPress={() => router.push('/sign-in')}><Button.Label>{t('journal.signIn')}</Button.Label></Button>
    </> : <>
      {!position && <LocationStatus location={location}
        renderMessage={(message, busy) => <Text accessibilityLiveRegion={busy ? 'none' : 'polite'} className={guidanceClass}>{message}</Text>}
        renderRetry={onPress => <Button variant="secondary" isDisabled={disabled} onPress={onPress}><Button.Label>{t(location.status === 'denied' && location.canAskAgain ? 'arNearby.enableLocation' : 'location.retry')}</Button.Label></Button>}
        renderSettingsAction={onPress => <Button variant="secondary" isDisabled={disabled} onPress={onPress}><Button.Label>{t('common.openSettings')}</Button.Label></Button>} />}
      {state.busy ? <Text accessibilityLiveRegion="polite" className={guidanceClass}>{t('arNearby.scanning')}</Text>
        : state.error ? <Text accessibilityRole="alert" className={guidanceClass}>{t(edgeErrorMessageKey(state.error))}</Text>
          : message && <Text accessibilityLiveRegion="polite" className={guidanceClass}>{t(message)}</Text>}
      <View className="flex-row flex-wrap items-center justify-center gap-2">
        {!!count && <Button className="h-auto min-h-12 py-3" accessibilityLabel={resultsLabel} isDisabled={!resultsEnabled} onPress={onShowResults}>
          <Button.Label className="shrink text-center">{resultsLabel}</Button.Label>
        </Button>}
        <Button variant="secondary" className="h-auto min-h-12 py-3" accessibilityLabel={t(action)} isDisabled={disabled || !position || state.busy}
          accessibilityState={{ busy: state.busy }} onPress={search}><Button.Label className="shrink text-center">{t(action)}</Button.Label></Button>
      </View>
    </>}
  </View>;
}

export function NearbyResults({ nearby, origin, interactive, onClose }: {
  nearby: NearbyMode; origin: Coordinate | null; interactive: boolean; onClose(): void;
}) {
  const { t } = useTranslation();
  const openLink = useOpenProviderLink();
  const { result, isResultCurrent } = nearby;
  const [selection, setSelection] = useState<{ result: NonNullable<typeof result>; providerId: string } | null>(null);
  const selected = selection && selection.result === result
    ? result.places.find(place => place.providerId === selection.providerId) : undefined;
  const places = result?.places ?? [];
  const rows = origin
    ? places.map(place => ({ place, meters: distanceMeters(origin, place.coordinates) })).sort((a, b) => a.meters - b.meters)
    : places.map(place => ({ place, meters: null }));
  useEffect(() => {
    if (!interactive) return;
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (selected) setSelection(null);
      else onClose();
      return true;
    });
    return () => subscription.remove();
  }, [interactive, selected, onClose]);

  const mapsAction = (place: Place) => <Button variant="outline" className="h-auto min-h-12 min-w-12 shrink-0 px-3 py-2 self-start"
    accessibilityLabel={t('arNearby.openPlaceInMaps', { name: place.name })} isDisabled={!interactive}
    onPress={() => { if (interactive && result && isResultCurrent(result)) openLink(googleMapsPlaceUrl(place)); }}>
    <Button.Label className="font-ui-semibold">{t('arNearby.maps')}</Button.Label>
  </Button>;
  const distanceText = (meters: number) => t('arNearby.distance', { meters: Math.round(meters) });

  return <StyledSafeAreaView testID="ar-nearby-results-screen" className="flex-1 bg-page" edges={['top', 'bottom', 'left', 'right']}>
    <FocusedStatusBar style="dark" />
    <ScrollView key={selected?.providerId ?? 'results'} testID="ar-nearby-results-scroll"
      className="min-h-0 flex-1" contentContainerClassName="pb-4">
      <View className="gap-2 border-b border-outline px-4 py-4">
        {selected && <Button variant="ghost" className="h-auto min-h-12 self-start py-2"
          accessibilityLabel={t('arNearby.allResults')} onPress={() => setSelection(null)}>
          <Button.Label>{t('arNearby.allResults')}</Button.Label>
        </Button>}
        <Text accessibilityRole="header" className="font-sans text-section font-ui-bold text-brand-strong">{selected?.name ?? t('arNearby.resultsTitle')}</Text>
        {selected && origin && <Text className="font-sans text-sm font-ui-semibold text-brand-strong">{distanceText(distanceMeters(origin, selected.coordinates))}</Text>}
        {!selected && result && <Text className="font-sans text-sm text-muted">{t('arNearby.resultCount', { count: places.length })}</Text>}
      </View>
      {result ? <View className="gap-3 px-4">
        {selected ? <View className="pt-4">{mapsAction(selected)}</View> : <View>
          {rows.map(({ place, meters }) => <View key={place.providerId} className="flex-row items-center gap-2 border-b border-outline py-2">
            <Pressable accessibilityRole="button" disabled={!interactive} className="min-h-12 min-w-0 flex-1 justify-center gap-1 rounded-input px-1 py-2 active:bg-mint"
              onPress={() => { if (interactive && isResultCurrent(result)) setSelection({ result, providerId: place.providerId }); }}>
              <Text className="font-sans text-base font-ui-bold text-brand-strong">{place.name}</Text>
              {meters !== null && <Text className="font-sans text-sm text-muted">{distanceText(meters)}</Text>}
            </Pressable>
            <View className="self-center">{mapsAction(place)}</View>
          </View>)}
        </View>}
        <View className="gap-1 py-1">
          <Image source={googleMapsAttribution} accessibilityLabel="Google Maps" style={{ height: 18, width: 98 }} resizeMode="contain" />
          <ProviderAttributions places={selected ? [selected] : places} />
        </View>
      </View> : <Text accessibilityLiveRegion="polite" className="px-4 py-4 font-sans text-base text-muted">{t('arNearby.resultsExpired')}</Text>}
    </ScrollView>
    <View testID="ar-nearby-results-footer" className="shrink-0 border-t border-outline bg-page px-4 py-3">
      <Button className="h-auto min-h-12 w-full py-3" accessibilityLabel={t('arNearby.returnToAr')} onPress={onClose}>
        <Button.Label className="shrink text-center">{t('arNearby.returnToAr')}</Button.Label>
      </Button>
    </View>
  </StyledSafeAreaView>;
}
