import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { Button } from 'heroui-native/button';
import { useThemeColor } from 'heroui-native/hooks';
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { withUniwind } from 'uniwind';

const StyledSafeAreaView = withUniwind(SafeAreaView);

export function AppHeader({ label }: { label: string }) {
  const { t } = useTranslation();
  const [accent, onAccent] = useThemeColor(['accent', 'accent-foreground']);
  return <StyledSafeAreaView className="bg-page-mint" edges={['top', 'left', 'right']}>
    <View className="min-h-16 flex-row items-center justify-between gap-3 px-4 py-2">
      <View className="shrink flex-row items-center gap-3" accessibilityRole="header">
        <View className="size-10 items-center justify-center rounded-xl bg-accent" accessible={false}>
          <Ionicons name="compass-outline" size={24} color={onAccent} />
        </View>
        <View className="shrink">
          <Text className="font-sans text-card font-bold text-brand-strong">ARgala</Text>
          <Text className="font-sans text-xs font-medium text-muted">{label}</Text>
        </View>
      </View>
      <Button variant="outline" className="bg-surface" isIconOnly accessibilityLabel={t('settings.title')} onPress={() => router.push('/settings')}>
        <Ionicons name="options-outline" size={24} color={accent} />
      </Button>
    </View>
  </StyledSafeAreaView>;
}
