import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Action, Notice, Screen } from '@/ui/shared';

/** Retain the legacy route without mounting camera, GPS or discovery. */
export function ImmersiveArScreen() {
  const { t } = useTranslation();
  return <Screen><Notice>{t('arrival.selectDestination')}</Notice>
    <Action title={t('destinations.title')} onPress={() => router.navigate('/destinations')} />
  </Screen>;
}
