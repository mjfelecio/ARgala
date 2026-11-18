import Ionicons from '@expo/vector-icons/Ionicons';
import { Text, View } from 'react-native';
import { Button } from 'heroui-native/button';
import { useThemeColor } from 'heroui-native/hooks';
import { useTranslation } from 'react-i18next';
import { StatusRow } from '@/ui/status-row';
import type { ArrivalSnapshot } from './proximity';

/** Foreground utility guidance only; camera entry always requires an explicit action. */
export function ArrivalInvitation({ state, contentReady, draft = false, keepInline = false, chapterCount = 0, onLaunch, onDismiss }: {
  state: ArrivalSnapshot | null; contentReady: boolean; draft?: boolean; keepInline?: boolean; destinationTitle?: string; chapterCount?: number; onLaunch?(): void; onDismiss(): void;
}) {
  const { t } = useTranslation();
  const accent = useThemeColor('accent');
  if (!state) return null;
  const hasLaunch = !!((contentReady || draft) && onLaunch);
  const ready = state.showInvitation && state.eligible && hasLaunch;
  const actionKey = keepInline ? 'arrival.unlockStart' : draft ? 'destinationCleanup.launchPreview' : 'arrival.launch';
  return <View testID="arrival-invitation" className="gap-3 py-3">
    <View className="flex-row items-start gap-3">
      <View testID="arrival-status-medallion" className="size-10 shrink-0 items-center justify-center rounded-pill bg-mint" accessible={false} importantForAccessibility="no-hide-descendants">
        <Ionicons name={ready ? 'cube-outline' : 'location-outline'} size={22} color={accent} accessible={false} />
      </View>
      <View className="min-w-0 flex-1 gap-1">
        <Text accessibilityRole="header" className="font-sans text-card font-ui-semibold text-brand-strong">{t(ready ? draft ? 'destinationCleanup.arPreview' : 'destinationCleanup.arReady' : 'destinationCleanup.arTitle')}</Text>
        <StatusRow busy={state.status === 'checking'}>{t(`arrival.${state.status}`)}</StatusRow>
        {state.showInvitation && <>
          {!hasLaunch && <Text className="font-sans text-sm text-muted">{t('arrival.contentPending')}</Text>}
          {draft && onLaunch && <Text className="font-sans text-sm text-muted">{t('destinationCleanup.arPreviewHint')}</Text>}
          {contentReady && chapterCount > 0 && <Text className="font-sans text-sm text-muted">{t('destinationStories.available', { count: chapterCount })}</Text>}
        </>}
      </View>
    </View>
    {state.showInvitation && <>
      {hasLaunch && <Button className="w-full" accessibilityLabel={t(actionKey)} onPress={onLaunch} isDisabled={!state.eligible}>
        <Button.Label>{t(actionKey)}</Button.Label>
      </Button>}
      {!keepInline && <Button variant="ghost" className="self-start" accessibilityLabel={t('arrival.dismiss')} onPress={onDismiss}><Button.Label>{t('arrival.dismiss')}</Button.Label></Button>}
    </>}
  </View>;
}
