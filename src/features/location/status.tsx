import { useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Linking, Text } from 'react-native';
import { Action, Notice } from '@/ui/shared';
import type { useDeviceLocation } from './use-device-location';
import { locationErrorMessageKey } from './errors';
export function SystemSettingsAction({ renderAction }: { renderAction?: (onPress: () => void) => ReactNode }) {
  const { t } = useTranslation();
  const [failed, setFailed] = useState(false);
  function openSettings() {
    setFailed(false);
    void Linking.openSettings().catch(() => {
      if (renderAction) setFailed(true);
      else Alert.alert(t('common.settingsError'));
    });
  }
  if (renderAction) return <>
    {failed && <Text accessibilityRole="alert" accessibilityLiveRegion="polite" className="font-sans text-sm text-danger">{t('common.settingsError')}</Text>}
    {renderAction(openSettings)}
  </>;
  return <Action title={t('common.openSettings')} onPress={openSettings} />;
}
export function LocationStatus({ location }: { location: ReturnType<typeof useDeviceLocation> }) {
  const { t } = useTranslation();
  if (location.status === 'ready') return null;
  return <>
    <Notice busy={location.status === 'loading'}>{location.status === 'loading' ? t('location.loading') : location.status === 'denied' ? t('location.denied') : location.status === 'disabled' ? t('location.disabled') : t(locationErrorMessageKey(location.errorCode))}</Notice>
    {location.status !== 'loading' && <Action title={t('location.retry')} onPress={location.retry} />}
    {(location.status === 'denied' || location.status === 'disabled') && <SystemSettingsAction />}
  </>;
}
