import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useGuestAccess } from '@/features/auth/guest-context';
import { useAuth } from '@/features/auth/provider';
import { useOnboarding } from '@/features/onboarding/provider';
import { Action, Notice, Screen } from '@/ui/shared';

export default function RootNavigation() {
  const { t } = useTranslation();
  const { session, loading, error, retry } = useAuth();
  const onboarding = useOnboarding();
  const guest = useGuestAccess();
  if (loading && !guest.enabled) return <Screen><Notice busy>{t('auth.restoring')}</Notice></Screen>;
  if (error && !guest.enabled) return <Screen><Notice>{t(error)}</Notice><Action title={t('common.retry')} onPress={retry} /></Screen>;
  if (!session && (guest.loading || onboarding.status === 'loading')) return <Screen><Notice busy>{t('common.loading')}</Notice></Screen>;
  if (!session && onboarding.status === 'error') return <Screen><Notice>{t('onboarding.loadFailed')}</Notice><Action title={t('common.retry')} onPress={onboarding.retry} /></Screen>;
  return <Stack screenOptions={{ headerTitle: 'ARgala' }}>
    <Stack.Protected guard={!session && onboarding.status === 'required'}><Stack.Screen name="welcome" options={{ headerShown: false }} /></Stack.Protected>
    <Stack.Protected guard={!session && onboarding.status === 'completed'}><Stack.Screen name="sign-in" options={{ headerShown: false }} /></Stack.Protected>
    <Stack.Protected guard={Boolean(session) || guest.enabled && onboarding.status === 'completed'}><Stack.Screen name="(app)" options={{ headerShown: false }} /></Stack.Protected>
  </Stack>;
}
