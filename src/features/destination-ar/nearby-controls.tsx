import { Image, ScrollView, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Button } from 'heroui-native/button';
import { SafeAreaView } from 'react-native-safe-area-context';
import { withUniwind } from 'uniwind';
import { distanceMeters, type Coordinate } from '@/features/location/geo';
import { ProviderAttributions, useOpenProviderLink } from '@/features/map/attributions';
import { googleMapsPlaceUrl } from '@/features/places/maps-url';
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

export function NearbyResults({ nearby, origin, onShowInCamera, onClose }: {
  nearby: NearbyMode; origin: Coordinate | null;
  onShowInCamera(id: string): void; onClose(): void;
}) {
  const { t } = useTranslation();
  const openLink = useOpenProviderLink();
  const { result, isResultCurrent } = nearby;
  const places = result?.places ?? [];
  return <StyledSafeAreaView testID="ar-nearby-results-screen" className="flex-1 bg-page" edges={['top', 'bottom', 'left', 'right']}>
    <FocusedStatusBar style="dark" />
    <ScrollView className="flex-1" contentContainerClassName="gap-4 px-4 py-4">
      <Text accessibilityRole="header" className="font-sans text-section font-ui-semibold text-brand-strong">{t('arNearby.resultsTitle')}</Text>
      <Button variant={result ? 'secondary' : 'primary'} className="h-auto min-h-12 w-full py-3"
        accessibilityLabel={t('arNearby.returnToAr')} onPress={onClose}><Button.Label className="shrink text-center">{t('arNearby.returnToAr')}</Button.Label></Button>
      {result ? <>
        <View className="gap-3 rounded-card bg-surface p-3">
          <View className="gap-1 p-2">
            <Image source={googleMapsAttribution} accessibilityLabel="Google Maps" style={{ height: 18, width: 98 }} resizeMode="contain" />
            <ProviderAttributions places={places} />
          </View>
          {places.map(place => {
            const meters = origin ? distanceMeters(origin, place.coordinates) : null;
            return <View key={place.providerId} className="gap-2 border-t border-outline pt-3">
              <Text className="font-sans text-card font-ui-semibold text-brand-strong">{place.name}</Text>
              {meters !== null && <Text className="font-sans text-sm text-muted">{t('arNearby.distance', { meters: Math.round(meters) })}</Text>}
              <View className="flex-row flex-wrap gap-2">
                {meters !== null && meters >= 1 && <Button variant="secondary" className="h-auto min-h-12 py-3"
                  onPress={() => { if (isResultCurrent(result)) onShowInCamera(place.providerId); }}>
                  <Button.Label className="shrink text-center">{t('arNearby.showInCamera')}</Button.Label>
                </Button>}
                <Button variant="secondary" className="h-auto min-h-12 py-3"
                  onPress={() => { if (isResultCurrent(result)) openLink(googleMapsPlaceUrl(place)); }}>
                  <Button.Label className="shrink text-center">{t('destinationCleanup.openMaps')}</Button.Label>
                </Button>
              </View>
            </View>;
          })}
        </View>
      </> : <Text accessibilityLiveRegion="polite" className="font-sans text-base text-muted">{t('arNearby.resultsExpired')}</Text>}
    </ScrollView>
  </StyledSafeAreaView>;
}
