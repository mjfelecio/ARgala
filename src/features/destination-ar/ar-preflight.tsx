import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';
import { Action, Notice } from '@/ui/shared';
import { SystemSettingsAction } from '@/features/location/status';
import type { StartupError, StartupPhase } from './types';

export function ArPreflight({ phase, errorCode, pending, canAskAgain, onStart }: {
  phase: StartupPhase; errorCode: StartupError | null; pending: boolean; canAskAgain: boolean; onStart(prompt?: boolean): void;
}) {
  const { t } = useTranslation();
  if (phase === 'live') return null;
  return <View className="gap-3 p-4">
    <Text className="font-sans text-sm text-white">{t('destinationAr.prototype')}</Text>
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
