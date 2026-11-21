import { Button } from 'heroui-native/button';
import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { destinationName, type Destination } from './catalog';
import type { useEntranceArrival } from './entrance-arrival-context';
import type { Language } from '../../../supabase/functions/_shared/contracts';

export function EntranceArrivalBanner({ show }: { show: boolean }) {
  const { t } = useTranslation();
  return show ? <View testID="entrance-arrival-banner" className="mx-4 mt-2 self-start rounded-card border border-outline bg-surface px-4 py-3 shadow-sm" pointerEvents="none">
    <Text accessibilityLiveRegion="polite" accessibilityRole="header" className="font-sans text-card font-ui-semibold text-brand-strong">{t('arrival.entranceReached')}</Text>
  </View> : null;
}

export function EntranceArrivalGuidance({ destination, language, arrival }: {
  destination: Destination | null; language: Language; arrival: ReturnType<typeof useEntranceArrival>;
}) {
  const { t } = useTranslation();
  const { snapshot, setEnabled, dismiss } = arrival;
  if (!destination || !snapshot) return null;
  const toggleKey = snapshot.enabled ? 'arrival.entranceDisable' : 'arrival.entranceEnable';
  return <View testID="entrance-arrival-guidance" className="gap-2 py-3">
    <Text accessibilityRole="header" className="font-sans text-card font-ui-semibold text-brand-strong">{t('arrival.entranceTitle')}</Text>
    {snapshot.distanceMeters !== null && <Text className="font-sans text-sm text-muted">{t('arrival.entranceDistance', { meters: snapshot.distanceMeters })}</Text>}
    {snapshot.status !== 'distance' && <Text className="font-sans text-sm text-muted">{t(`arrival.entranceStatus.${snapshot.status}`)}</Text>}
    {snapshot.showNotice && <View testID="entrance-arrival-notice" className="gap-2 rounded-card bg-mint p-4">
      <Text className="font-sans text-sm text-foreground">{t('arrival.entranceFollow', { destination: destinationName(destination, language) })}</Text>
      {destination.requiresGuide && <Text className="font-sans text-sm text-foreground">{t('arrival.entranceGuide')}</Text>}
      {destination.id === 'D10' && <Text className="font-sans text-sm text-foreground">{t('arrival.entranceSchool')}</Text>}
      <Button variant="ghost" className="min-h-12 self-start" accessibilityLabel={t('arrival.entranceDismiss')} onPress={dismiss}>
        <Button.Label className="shrink text-center">{t('arrival.entranceDismiss')}</Button.Label>
      </Button>
    </View>}
    {!snapshot.enabled && <Text className="font-sans text-sm text-muted">{t('arrival.entranceConsent')}</Text>}
    <Button variant="outline" className="min-h-12 self-start" accessibilityLabel={t(toggleKey)} onPress={() => setEnabled(!snapshot.enabled)}>
      <Button.Label className="shrink text-center">{t(toggleKey)}</Button.Label>
    </Button>
  </View>;
}
