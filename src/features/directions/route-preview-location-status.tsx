import { Alert, Linking, Text } from 'react-native';
import { Button } from 'heroui-native/button';
import { useTranslation } from 'react-i18next';
import { locationErrorMessageKey } from '@/features/location/errors';
import type { useDeviceLocation } from '@/features/location/use-device-location';

export function RoutePreviewLocationStatus({ location }: { location: ReturnType<typeof useDeviceLocation> }) {
  const { t } = useTranslation();
  if (location.status === 'ready') return null;
  const key = location.status === 'loading' ? 'location.loading' : location.status === 'denied' ? 'location.denied'
    : location.status === 'disabled' ? 'location.disabled' : locationErrorMessageKey(location.errorCode);
  return <>
    <Text accessibilityLiveRegion="polite" className="font-sans text-sm text-muted">{t(key)}</Text>
    {location.status !== 'loading' && <Button variant="outline" accessibilityLabel={t('location.retry')} onPress={location.retry}><Button.Label>{t('location.retry')}</Button.Label></Button>}
    {(location.status === 'denied' || location.status === 'disabled') && <Button variant="outline" accessibilityLabel={t('common.openSettings')}
      onPress={() => { void Linking.openSettings().catch(() => Alert.alert(t('common.settingsError'))); }}><Button.Label>{t('common.openSettings')}</Button.Label></Button>}
  </>;
}
