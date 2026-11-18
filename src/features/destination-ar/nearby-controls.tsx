import { Image, ScrollView, Text, View, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Button } from 'heroui-native/button';
import { Dialog } from 'heroui-native/dialog';
import { AR } from '@/config/limits';
import { distanceMeters } from '@/features/location/geo';
import { ProviderAttributions, useOpenProviderLink } from '@/features/map/attributions';
import { googleMapsPlaceUrl } from '@/features/places/maps-url';
import { edgeErrorMessageKey } from '@/lib/edge-error';
import { LocationStatus } from '@/features/location/status';
import googleMapsAttribution from '../../../assets/attribution/google-maps.png';
import type { NearbyMode } from './use-nearby-mode';

const guidanceClass = 'font-sans text-sm text-white';

export function NearbyControls({ signedIn, nearby, headingReady, disabled, resultsEnabled, onShowResults }: {
  signedIn: boolean; nearby: NearbyMode; headingReady: boolean; disabled: boolean; resultsEnabled: boolean; onShowResults(): void;
}) {
  const { t } = useTranslation();
  const { location, position, search, state, result } = nearby;
  const count = result?.places.length ?? 0;
  const action = result || state.expired ? 'arNearby.rescan' : 'arNearby.scan';
  return <View className="w-full gap-2">
    {!signedIn ? <>
      <Text className={guidanceClass}>{t('arNearby.signInHint')}</Text>
      <Button variant="secondary" accessibilityLabel={t('journal.signIn')} isDisabled={disabled} onPress={() => router.push('/sign-in')}><Button.Label>{t('journal.signIn')}</Button.Label></Button>
    </> : <>
      <View className="flex-row flex-wrap gap-2">
        <Button variant="secondary" accessibilityLabel={t(action)} isDisabled={disabled || !position || state.busy} accessibilityState={{ busy: state.busy }} onPress={search}><Button.Label>{t(action)}</Button.Label></Button>
        {!!count && <Button variant="secondary" accessibilityLabel={t('arNearby.results', { count })} isDisabled={!resultsEnabled} onPress={onShowResults}><Button.Label>{t('arNearby.results', { count })}</Button.Label></Button>}
      </View>
      {!position && <LocationStatus location={location}
        renderMessage={(message, busy) => <Text accessibilityLiveRegion={busy ? 'none' : 'polite'} className={guidanceClass}>{message}</Text>}
        renderRetry={onPress => <Button variant="secondary" isDisabled={disabled} onPress={onPress}><Button.Label>{t(location.status === 'denied' && location.canAskAgain ? 'arNearby.enableLocation' : 'location.retry')}</Button.Label></Button>}
        renderSettingsAction={onPress => <Button variant="secondary" isDisabled={disabled} onPress={onPress}><Button.Label>{t('common.openSettings')}</Button.Label></Button>} />}
      {!position && location.status === 'ready' && <Text className={guidanceClass}>{t('arNearby.waitingLocation')}</Text>}
      {state.busy ? <Text accessibilityLiveRegion="polite" className={guidanceClass}>{t('arNearby.scanning')}</Text>
        : state.error ? <Text accessibilityRole="alert" className={guidanceClass}>{t(edgeErrorMessageKey(state.error))}</Text>
          : result ? (!count ? <Text className={guidanceClass}>{t('arNearby.empty')}</Text> : !headingReady && <Text className={guidanceClass}>{t('arNearby.headingUnavailable')}</Text>)
            : position && <Text className={guidanceClass}>{t(state.expired ? 'arNearby.expired' : 'arNearby.firstScan')}</Text>}
      {!!count && <View className="self-start rounded-input bg-page px-3 py-2">
        <Image source={googleMapsAttribution} accessibilityLabel="Google Maps" style={{ height: 18, width: 98 }} resizeMode="contain" />
        <ProviderAttributions places={result!.places} />
      </View>}
    </>}
  </View>;
}

export function NearbyResults({ nearby, selected, headingReady, onShowInCamera, onShowAll, onClose }: {
  nearby: NearbyMode; selected: string | null; headingReady: boolean; onShowInCamera(id: string): void; onShowAll(): void; onClose(): void;
}) {
  const { t } = useTranslation();
  const openLink = useOpenProviderLink();
  const { height } = useWindowDimensions();
  const result = nearby.result;
  if (!result) return null;
  const places = selected ? result.places.filter(place => place.providerId === selected) : result.places;
  return <Dialog isOpen onOpenChange={open => { if (!open) onClose(); }}>
    <Dialog.Portal>
      <Dialog.Overlay />
      <Dialog.Content isSwipeable={false} accessibilityViewIsModal className="w-full max-w-sm bg-page">
        <Dialog.Title className="font-sans text-section font-ui-semibold text-brand-strong">{t('arNearby.resultsTitle')}</Dialog.Title>
        <ScrollView style={{ maxHeight: Math.min(380, height * 0.5) }} contentContainerClassName="gap-3 py-3">
          {places.map(place => {
            const meters = nearby.position ? distanceMeters(nearby.position, place.coordinates) : null;
            return <View key={place.providerId} className="gap-2 rounded-card bg-surface p-3">
              <Text className="font-sans text-card font-ui-semibold text-brand-strong">{place.name}</Text>
              {meters !== null && <Text className="font-sans text-sm text-muted">{t('arNearby.distance', { meters: Math.round(meters) })}</Text>}
              <View className="flex-row flex-wrap gap-2">
                {headingReady && meters !== null && meters >= 1 && <Button variant="secondary" onPress={() => onShowInCamera(place.providerId)}>
                  <Button.Label>{t('arNearby.showInCamera')}</Button.Label>
                </Button>}
                <Button variant="secondary" onPress={() => { if (Date.now() - result.receivedAt < AR.nearbyReuseMs) openLink(googleMapsPlaceUrl(place)); }}>
                  <Button.Label>{t('destinationCleanup.openMaps')}</Button.Label>
                </Button>
              </View>
            </View>;
          })}
          <Image source={googleMapsAttribution} accessibilityLabel="Google Maps" style={{ height: 18, width: 98 }} resizeMode="contain" />
          <ProviderAttributions places={places} />
        </ScrollView>
        <View className="flex-row flex-wrap items-center justify-end gap-2">
          {selected && <Button variant="secondary" onPress={onShowAll}><Button.Label>{t('arNearby.results', { count: result.places.length })}</Button.Label></Button>}
          <Button accessibilityLabel={t('common.close')} onPress={onClose}><Button.Label>{t('common.close')}</Button.Label></Button>
        </View>
      </Dialog.Content>
    </Dialog.Portal>
  </Dialog>;
}
