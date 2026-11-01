import { Text, View } from 'react-native';
import { Button } from 'heroui-native/button';
import { useTranslation } from 'react-i18next';
import type { ArrivalSnapshot } from './proximity';

/** Foreground utility guidance only; camera entry always requires an explicit action. */
export function ArrivalInvitation({ state, contentReady, draft = false, destinationTitle, chapterCount = 0, onLaunch, onDismiss }: {
  state: ArrivalSnapshot | null; contentReady: boolean; draft?: boolean; destinationTitle?: string; chapterCount?: number; onLaunch?(): void; onDismiss(): void;
}) {
  const { t } = useTranslation();
  if (!state) return null;
  return <View className="gap-3 rounded-card bg-mint p-4">
    {destinationTitle && <Text accessibilityRole="header" className="font-sans text-card font-semibold text-foreground">{destinationTitle}</Text>}
    <Text accessibilityLiveRegion="polite" className="font-sans text-sm text-muted">{t(`arrival.${state.status}`)}</Text>
    {state.showInvitation && <>
      {(contentReady || draft) && onLaunch && <Text className="font-sans text-section font-semibold text-brand-strong">{t('destinationStories.unlocked')}</Text>}
      <Text className="font-sans text-sm text-foreground">{t(draft && onLaunch ? 'arrival.draftInvitation' : contentReady && onLaunch ? 'arrival.invitation' : 'arrival.contentPending')}</Text>
      {contentReady && chapterCount > 0 && <Text className="font-sans text-sm text-muted">{t('destinationStories.available', { count: chapterCount })}</Text>}
      {(contentReady || draft) && onLaunch && <Button accessibilityLabel={t(draft ? 'arrival.launchDraft' : 'arrival.launch')} onPress={onLaunch} isDisabled={!state.eligible}><Button.Label>{t(draft ? 'arrival.launchDraft' : 'arrival.launch')}</Button.Label></Button>}
      <Button variant="ghost" accessibilityLabel={t('arrival.dismiss')} onPress={onDismiss}><Button.Label>{t('arrival.dismiss')}</Button.Label></Button>
    </>}
  </View>;
}
