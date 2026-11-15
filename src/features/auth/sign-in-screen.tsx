import { Button } from 'heroui-native/button';
import { Surface } from 'heroui-native/surface';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { withUniwind } from 'uniwind';
import { router } from 'expo-router';
import { useGuestAccess } from './guest-context';
import { GoogleBrowserUnavailable, signInWithGoogle } from './google-sign-in';
import { JourneyMotif } from '@/ui/journey-motif';
import { BrandLogo } from '@/ui/brand-logo';

const StyledSafeAreaView = withUniwind(SafeAreaView);

export default function SignInScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const guest = useGuestAccess();
  const [guestRequested, setGuestRequested] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<'auth.failed' | 'auth.googleUnavailable' | null>(null);
  const submitting = useRef(false);
  const alive = useRef(false);
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);
  useEffect(() => { if (guestRequested && guest.enabled) router.replace('/'); }, [guestRequested, guest.enabled]);

  async function submit() {
    if (submitting.current) return;
    submitting.current = true; setBusy(true); setError(null);
    try { await signInWithGoogle(() => alive.current); }
    catch (failure) { if (alive.current) setError(failure instanceof GoogleBrowserUnavailable ? 'auth.googleUnavailable' : 'auth.failed'); }
    finally { submitting.current = false; if (alive.current) setBusy(false); }
  }

  async function enterGuest() {
    if (submitting.current) return;
    submitting.current = true; setBusy(true); setGuestRequested(true);
    try { if (!await guest.enter() && alive.current) setGuestRequested(false); }
    finally { submitting.current = false; if (alive.current) setBusy(false); }
  }

  return <ScrollView className="flex-1 bg-surface" contentContainerClassName="grow" showsVerticalScrollIndicator={false}>
    <View className="bg-mint" style={{ paddingTop: insets.top, paddingLeft: insets.left, paddingRight: insets.right }}>
      <View className="min-h-56 items-center overflow-hidden px-6 pb-10 pt-4">
        <JourneyMotif />
        <View className="flex-row items-center gap-2 rounded-pill bg-surface px-4 py-2"><BrandLogo variant="horizontal" width={160} /></View>
      </View>
    </View>
    <Surface className="-mt-6 grow rounded-b-none rounded-t-page p-0">
      <StyledSafeAreaView className="grow px-6 pb-6 pt-8" edges={['bottom', 'left', 'right']}>
        <View className="mx-auto w-full max-w-xl grow gap-6">
          <View className="gap-2"><Text accessibilityRole="header" className="font-sans text-hero font-ui-bold text-foreground">{t('auth.welcomeBack')}</Text><Text className="font-sans text-base text-muted">{t('auth.signInSubtitle')}</Text></View>
          {error && <Text accessibilityRole="alert" accessibilityLiveRegion="polite" className="font-sans text-sm text-danger">{t(error)}</Text>}
          <Button size="lg" isDisabled={busy || guest.loading} accessibilityLabel={t(busy ? 'common.connecting' : 'auth.googleSignIn')} accessibilityState={{ disabled: busy || guest.loading, busy }} onPress={() => { void submit(); }}>
            {busy && <ActivityIndicator />}
            <Button.Label>{t(busy ? 'common.connecting' : 'auth.googleSignIn')}</Button.Label>
          </Button>
          {guest.error && <Text accessibilityRole="alert" className="font-sans text-sm text-danger">{t(guest.error)}</Text>}
          {guest.error === 'journal.loadFailed' ? <Button variant="secondary" onPress={guest.retry}><Button.Label>{t('common.retry')}</Button.Label></Button> : <Button variant="secondary" isDisabled={busy || guest.loading} accessibilityLabel={t('journal.continueGuest')} onPress={() => { void enterGuest(); }}><Button.Label>{t('journal.continueGuest')}</Button.Label></Button>}
        </View>
      </StyledSafeAreaView>
    </Surface>
  </ScrollView>;
}
