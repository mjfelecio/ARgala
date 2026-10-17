import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';
export default function AppLayout() {
  const { t } = useTranslation();
  return <Stack><Stack.Screen name="index" options={{ title: t('map.title') }} /><Stack.Screen name="ar" options={{ title: t('camera.title') }} /><Stack.Screen name="settings" options={{ title: t('settings.title') }} /></Stack>;
}
