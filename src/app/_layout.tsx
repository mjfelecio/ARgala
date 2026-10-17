import { QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { environment } from '@/config/env';
import { AuthProvider, useAuth } from '@/features/auth/provider';
import { queryClient } from '@/lib/query';
import { Action, Notice, Screen } from '@/ui/shared';

function Navigation() {
  const { session, loading, error, retry } = useAuth();
  if (loading) return <Screen><Notice busy>Restoring your session…</Notice></Screen>;
  if (error) return <Screen><Notice>{error}</Notice><Action title="Retry" onPress={retry} /></Screen>;
  return <Stack screenOptions={{ headerTitle: 'ARgala' }}>
    <Stack.Protected guard={!session}><Stack.Screen name="sign-in" options={{ headerShown: false }} /></Stack.Protected>
    <Stack.Protected guard={Boolean(session)}><Stack.Screen name="(app)" options={{ headerShown: false }} /></Stack.Protected>
  </Stack>;
}
export default function RootLayout() {
  return <SafeAreaProvider>{environment.success ? <QueryClientProvider client={queryClient}><AuthProvider><Navigation /></AuthProvider></QueryClientProvider> : <Screen><Notice>Application setup is required. Configure the Supabase project in .env.</Notice></Screen>}</SafeAreaProvider>;
}
