import '@/i18n';
import { useTranslation } from 'react-i18next';
import { SettingsProvider } from '@/features/settings/provider';
import { QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { environment } from '@/config/env';
import { AuthProvider, useAuth } from '@/features/auth/provider';
import { queryClient } from '@/lib/query';
import { Action, Notice, Screen } from '@/ui/shared';

function Navigation() {
  const { t } = useTranslation();
  const { session, loading, error, retry } = useAuth();
  if (loading) return <Screen><Notice busy>{t('auth.restoring')}</Notice></Screen>;
  if (error) return <Screen><Notice>{error}</Notice><Action title={t('common.retry')} onPress={retry} /></Screen>;
  return <Stack screenOptions={{ headerTitle: 'ARgala' }}>
    <Stack.Protected guard={!session}><Stack.Screen name="sign-in" options={{ headerShown: false }} /></Stack.Protected>
    <Stack.Protected guard={Boolean(session)}><Stack.Screen name="(app)" options={{ headerShown: false }} /></Stack.Protected>
  </Stack>;
}
export default function RootLayout() {
  const { t } = useTranslation();
  return <SafeAreaProvider><SettingsProvider>{environment.success ? <QueryClientProvider client={queryClient}><AuthProvider><Navigation /></AuthProvider></QueryClientProvider> : <Screen><Notice>{t('auth.setup')}</Notice></Screen>}</SettingsProvider></SafeAreaProvider>;
}
