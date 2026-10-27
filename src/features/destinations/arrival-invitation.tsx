import { Text, View } from 'react-native';
import { Button } from 'heroui-native/button';
import { useTranslation } from 'react-i18next';
import type { ArrivalSnapshot } from './proximity';

/** Foreground utility guidance only; camera entry always requires an explicit action. */
export function ArrivalInvitation({ state, contentReady, onLaunch, onDismiss }: {
  state: ArrivalSnapshot | null; contentReady: boolean; onLaunch(): void; onDismiss(): void;
}) {
  const { t } = useTranslation();
  if (!state) return null;
  return <View className="gap-3 rounded-xl bg-surface-secondary p-3">
    <Text accessibilityLiveRegion="polite" className="font-sans text-sm text-muted">{t(`arrival.${state.status}`)}</Text>
    {state.showInvitation && <>
      <Text className="font-sans text-sm text-foreground">{t(contentReady ? 'arrival.invitation' : 'arrival.contentPending')}</Text>
      {contentReady && <Button accessibilityLabel={t('arrival.launch')} onPress={onLaunch} isDisabled={!state.eligible}><Button.Label>{t('arrival.launch')}</Button.Label></Button>}
      <Button variant="ghost" accessibilityLabel={t('arrival.dismiss')} onPress={onDismiss}><Button.Label>{t('arrival.dismiss')}</Button.Label></Button>
    </>}
  </View>;
}
