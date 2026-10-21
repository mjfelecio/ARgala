import Constants from 'expo-constants';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';

export function AboutSettings() {
  const { t } = useTranslation();
  const version = Constants.expoConfig?.version?.trim();
  return <View className="gap-3 border-t border-outline pt-5">
    <Text accessibilityRole="header" className="font-sans text-section font-semibold text-foreground">{t('settings.about')}</Text>
    <View className="gap-4">
      <Text className="font-sans text-sm text-muted">{t('settings.aboutDescription')}</Text>
      <View className="flex-row flex-wrap justify-between gap-2 border-t border-outline pt-4">
        <Text className="font-sans text-base text-foreground">{t('settings.version')}</Text>
        <Text selectable className="font-sans text-sm text-muted">{version || t('settings.versionUnavailable')}</Text>
      </View>
    </View>
  </View>;
}
