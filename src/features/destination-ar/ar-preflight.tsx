import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';
import { Action, Notice } from '@/ui/shared';
import { SystemSettingsAction } from '@/features/location/status';
import type { StartupError, StartupPhase } from './types';

export function ArPreflight({ phase, errorCode, pending, canAskAgain, onStart, noticeKey = 'destinationAr.prototype', appearance = 'camera' }: {
  appearance?: 'page' | 'camera'; noticeKey?: string; phase: StartupPhase; errorCode: StartupError | null; pending: boolean; canAskAgain: boolean; onStart(prompt?: boolean): void;
}) {
  const { t } = useTranslation();
  if (phase === 'live') return null;
  const page = appearance === 'page';
  const ink = page ? 'text-brand-strong' : 'text-white';
  return <View className={page ? 'gap-4 rounded-card bg-surface p-5' : 'mx-4 mt-4 gap-3 rounded-card bg-ar-panel p-4'}>
    <Text accessibilityRole="header" className={`font-sans text-section font-ui-semibold ${ink}`}>{t('destinationStories.preflightTitle')}</Text>
    <Text className={`font-sans text-sm ${page ? 'text-foreground' : 'text-white'}`}>{t(noticeKey)}</Text>
    {errorCode ? <Notice>{t(`destinationAr.errors.${errorCode}`)}</Notice>
      : <Notice busy={phase === 'checking' || phase === 'initializing' || phase === 'prepared'}>{t(`destinationAr.${phase}`)}</Notice>}
    {phase === 'idle' && <Action title={t('destinationAr.start')} onPress={() => onStart()} disabled={pending} />}
    {(phase === 'failed' || phase === 'interrupted') && <Action title={t('common.retry')} onPress={() => onStart()} disabled={pending} />}
    {phase === 'permission' && <>
      {canAskAgain ? <Action title={t('camera.allow')} onPress={() => onStart(true)} disabled={pending} /> : <SystemSettingsAction />}
      <Action title={t('common.retry')} onPress={() => onStart()} disabled={pending} />
    </>}
  </View>;
}
