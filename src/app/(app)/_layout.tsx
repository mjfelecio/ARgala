import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useResolveClassNames } from 'uniwind';
import { useThemeColor } from 'heroui-native/hooks';

// Preserve an underlying map/tab navigator when Settings is opened directly.
export const unstable_settings = { initialRouteName: '(tabs)' };

export default function AppLayout() {
  const { t } = useTranslation();
  const headerStyle = useResolveClassNames('bg-page-mint');
  const headerTitleStyle = useResolveClassNames('font-sans text-card font-semibold text-foreground');
  const headerTintColor = useThemeColor('accent');
  return <Stack screenOptions={{ headerStyle, headerTitleStyle, headerTintColor, headerShadowVisible: false }}>
    <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    <Stack.Screen name="place/[providerId]" options={{ headerShown: false }} />
    <Stack.Screen name="directions" options={{ headerShown: false }} />
    <Stack.Screen name="destinations" options={{ headerShown: false }} />
    <Stack.Screen name="settings" options={{ title: t('settings.title') }} />
  </Stack>;
}
