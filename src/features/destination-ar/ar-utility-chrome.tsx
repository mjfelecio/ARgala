import { router } from 'expo-router';
import { Button } from 'heroui-native/button';
import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { withUniwind } from 'uniwind';

const SafeOverlay = withUniwind(SafeAreaView);
export function ArUtilityChrome({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation();
  return <SafeOverlay className="absolute inset-0" pointerEvents="box-none">
    <View className="flex-row flex-wrap items-center gap-3 px-4 pt-2">
      <Button variant="secondary" accessibilityLabel={t('destinationAr.exit')} onPress={() => { if (router.canGoBack()) router.back(); else router.navigate('/profile'); }}>
        <Button.Label>{t('destinationAr.exit')}</Button.Label>
      </Button>
      <Text accessibilityRole="header" className="shrink font-sans text-card font-semibold text-white">{t('destinationAr.title')}</Text>
    </View>
    {children}
  </SafeOverlay>;
}
