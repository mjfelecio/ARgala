import { useTranslation } from 'react-i18next';
import { Alert, Linking } from 'react-native';
import { Action, Notice } from '@/ui/shared';
import type { useDeviceLocation } from './use-device-location';
export function SystemSettingsAction() {
  const { t } = useTranslation();
  return <Action title={t('common.openSettings')} onPress={() => { void Linking.openSettings().catch(() => Alert.alert(t('common.settingsError'))); }} />;
}
export function LocationStatus({ location }: { location: ReturnType<typeof useDeviceLocation> }) {
  const { t } = useTranslation();
  if (location.status === 'ready') return null;
  return <>
    <Notice busy={location.status === 'loading'}>{location.status === 'loading' ? t('location.loading') : location.status === 'denied' ? t('location.denied') : location.status === 'disabled' ? t('location.disabled') : location.errorCode === 'timeout' ? t('location.timeout') : location.error ?? t('location.unavailable')}</Notice>
    {location.status !== 'loading' && <Action title={t('location.retry')} onPress={location.retry} />}
    {(location.status === 'denied' || location.status === 'disabled') && <SystemSettingsAction />}
  </>;
}
