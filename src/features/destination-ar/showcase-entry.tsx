import { Text, View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Button } from 'heroui-native/button';
import { useThemeColor } from 'heroui-native/hooks';
import Ionicons from '@expo/vector-icons/Ionicons';

export function ShowcaseEntry() {
  const { t } = useTranslation(); const accent = useThemeColor('accent');
  return <Button variant="ghost" className="h-auto min-h-16! justify-start gap-3 rounded-card! bg-surface! px-4 py-3" accessibilityLabel={t('arShowcase.title')} onPress={() => router.push('/ar-showcase')}>
    <View className="size-12 items-center justify-center rounded-pill bg-mint" accessible={false}><Ionicons name="cube-outline" color={accent} size={24} /></View>
    <View className="min-w-0 flex-1 gap-1">
      <Text className="font-sans text-card font-ui-semibold text-brand-strong">{t('arShowcase.title')}</Text>
      <Text className="font-sans text-sm text-muted">{t('arShowcase.entryHint')}</Text>
    </View>
    <Ionicons name="chevron-forward" size={20} color={accent} accessible={false} />
  </Button>;
}
