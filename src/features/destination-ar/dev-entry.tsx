import { lazy, Suspense } from 'react';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Button } from 'heroui-native/button';
import { Action, Notice, Screen } from '@/ui/shared';

const Spike = lazy(() => import('./destination-ar-screen'));
export function isViroSpikeEnabled() {
  return __DEV__ && process.env.EXPO_PUBLIC_VIRO_SPIKE === '1';
}
export function ViroSpikeLaunch() {
  const { t } = useTranslation();
  return isViroSpikeEnabled() ? <Button variant="secondary" accessibilityLabel={t('destinationAr.title')} onPress={() => router.push('/viro-spike')}>
    <Button.Label>{t('destinationAr.title')}</Button.Label>
  </Button> : null;
}
export function ViroSpikeRoute() { return <DevelopmentArRoute variant="square" />; }
export function ViroRingRoute() { return <DevelopmentArRoute variant="ring" />; }
export function ViroRingLaunch() {
  const { t } = useTranslation();
  return isViroSpikeEnabled() ? <Button variant="secondary" className="mx-4 mb-2" accessibilityLabel={t('destinationRing.title')} onPress={() => router.push('/viro-ring')}>
    <Button.Label>{t('destinationRing.title')}</Button.Label>
  </Button> : null;
}
function DevelopmentArRoute({ variant }: { variant: 'square' | 'ring' }) {
  const { t } = useTranslation();
  // Neither a URL nor an environment flag can enable this in a release build.
  if (!isViroSpikeEnabled()) return <Screen><Notice>{t('destinationAr.unavailable')}</Notice>
    <Action title={t('common.back')} onPress={() => { if (router.canGoBack()) router.back(); else router.navigate('/'); }} /></Screen>;
  return <Suspense fallback={<Screen><Notice busy>{t('common.loading')}</Notice></Screen>}><Spike variant={variant} /></Suspense>;
}
