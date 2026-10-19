import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { Button } from 'heroui-native/button';
import { Surface } from 'heroui-native/surface';
import { useThemeColor } from 'heroui-native/hooks';
import { ScrollView, Text } from 'react-native';
import { useTranslation } from 'react-i18next';

export default function ProfileScreen() {
  const { t } = useTranslation();
  const onAccent = useThemeColor('accent-foreground');
  return <ScrollView className="flex-1 bg-background" contentContainerClassName="gap-4 p-4">
    <Surface className="gap-4 p-5">
      <Text className="font-sans text-section font-semibold text-foreground">{t('navigation.profile')}</Text>
      <Text className="font-sans text-base text-muted">{t('navigation.profilePlaceholder')}</Text>
      <Button accessibilityLabel={t('navigation.openSettings')} onPress={() => router.push('/settings')}>
        <Ionicons name="options-outline" size={24} color={onAccent} />
        <Button.Label>{t('navigation.openSettings')}</Button.Label>
      </Button>
    </Surface>
  </ScrollView>;
}
