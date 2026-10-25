import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Action, Notice } from '@/ui/shared';
import type { useArIntroduction } from './use-ar-introduction';
export function ArIntroductionNotice({ introduction }: { introduction: ReturnType<typeof useArIntroduction> }) {
  const { t } = useTranslation();
  return introduction.error ? <View className="gap-2 px-4"><Notice>{t(`destinationSession.intro.${introduction.error}`)}</Notice>
    <Action title={t('common.retry')} onPress={() => void introduction.retry()} disabled={introduction.pending} /></View> : null;
}
