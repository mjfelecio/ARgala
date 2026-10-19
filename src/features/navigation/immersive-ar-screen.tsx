import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { Button } from 'heroui-native/button';
import { useThemeColor } from 'heroui-native/hooks';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { withUniwind } from 'uniwind';
import ArScreen from '@/features/ar/ar-screen';

const StyledSafeAreaView = withUniwind(SafeAreaView);

export function ImmersiveArScreen() {
  const { t } = useTranslation();
  const foreground = useThemeColor('default-foreground');
  return <StyledSafeAreaView className="flex-1 bg-ink" edges={['top', 'left', 'right', 'bottom']}>
    <View className="items-start px-4 py-2">
      <Button variant="secondary" accessibilityLabel={t('navigation.backToMap')} onPress={() => router.navigate('/')}>
        <Ionicons name="arrow-back-outline" size={24} color={foreground} />
        <Button.Label>{t('navigation.backToMap')}</Button.Label>
      </Button>
    </View>
    <ArScreen />
  </StyledSafeAreaView>;
}
