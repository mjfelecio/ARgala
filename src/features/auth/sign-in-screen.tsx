import Ionicons from '@expo/vector-icons/Ionicons';
import { Button } from 'heroui-native/button';
import { useThemeColor } from 'heroui-native/hooks';
import { Surface } from 'heroui-native/surface';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, KeyboardAvoidingView, ScrollView, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { withUniwind } from 'uniwind';
import { getSupabase } from '@/lib/supabase';
import { ScenicLandscape } from '@/ui/scenic-landscape';
import { CredentialsFields } from './credentials-fields';
import { registrationSchema, signInSchema } from './credentials';
import { authErrorMessageKey } from './errors';

const StyledSafeAreaView = withUniwind(SafeAreaView);

type MessageKey = ReturnType<typeof authErrorMessageKey> | 'auth.invalid' | 'auth.invalidRegistration' | 'auth.confirm';

export default function SignInScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [accent, onAccent] = useThemeColor(['accent', 'accent-foreground']);
  const [registering, setRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const submitting = useRef(false);
  const [invalid, setInvalid] = useState({ email: false, password: false });
  const [message, setMessage] = useState<MessageKey | null>(null);

  async function submit() {
    // React may batch multiple presses before disabled props reach native.
    if (submitting.current) return;
    const parsed = (registering ? registrationSchema : signInSchema).safeParse({ email, password });
    if (!parsed.success) {
      setInvalid({ email: parsed.error.issues.some(issue => issue.path[0] === 'email'), password: parsed.error.issues.some(issue => issue.path[0] === 'password') });
      setMessage(registering ? 'auth.invalidRegistration' : 'auth.invalid');
      return;
    }
    submitting.current = true;
    setBusy(true); setMessage(null); setInvalid({ email: false, password: false });
    try {
      const { data, error } = registering ? await getSupabase().auth.signUp(parsed.data) : await getSupabase().auth.signInWithPassword(parsed.data);
      if (error) throw error;
      setPassword('');
      if (registering && !data.session) setMessage('auth.confirm');
    } catch (error) { setMessage(authErrorMessageKey(error)); }
    finally { submitting.current = false; setBusy(false); }
  }

  return <KeyboardAvoidingView behavior="height" className="flex-1 bg-surface">
    <ScrollView className="flex-1" contentContainerClassName="grow" keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag" showsVerticalScrollIndicator={false}>
      <View className="bg-mint" style={{ paddingTop: insets.top, paddingLeft: insets.left, paddingRight: insets.right }}>
        <View className="min-h-56 items-end overflow-hidden px-6 pb-10 pt-4">
          <ScenicLandscape />
          <View className="flex-row items-center gap-2 rounded-pill bg-surface px-4 py-2">
            <Ionicons name="compass-outline" size={20} color={accent} accessible={false} />
            <Text className="font-sans text-base font-semibold text-brand-strong">ARgala</Text>
          </View>
        </View>
      </View>
      <Surface className="-mt-6 grow rounded-b-none rounded-t-page p-0">
        <StyledSafeAreaView className="grow px-6 pb-6 pt-8" edges={['bottom', 'left', 'right']}>
          <View className="mx-auto w-full max-w-xl grow gap-6">
            <View className="gap-2">
              <Text accessibilityRole="header" className="font-sans text-hero font-bold text-foreground">{t(registering ? 'auth.startExploring' : 'auth.welcomeBack')}</Text>
              <Text className="font-sans text-base text-muted">{t(registering ? 'auth.registerSubtitle' : 'auth.signInSubtitle')}</Text>
            </View>
            <CredentialsFields email={email} password={password} registering={registering} disabled={busy}
              invalidEmail={invalid.email} invalidPassword={invalid.password}
              onEmailChange={value => { setEmail(value); setInvalid(current => ({ ...current, email: false })); }}
              onPasswordChange={value => { setPassword(value); setInvalid(current => ({ ...current, password: false })); }} />
            {message && <Text accessibilityRole={message === 'auth.confirm' ? undefined : 'alert'} accessibilityLiveRegion="polite"
              className={`font-sans text-sm ${message === 'auth.confirm' ? 'text-brand-strong' : 'text-danger'}`}>{t(message)}</Text>}
            <Button size="lg" isDisabled={busy} accessibilityLabel={t(busy ? 'common.connecting' : registering ? 'auth.register' : 'auth.signIn')}
              accessibilityState={{ disabled: busy, busy }} onPress={() => { void submit(); }}>
              {busy && <ActivityIndicator color={onAccent} />}
              <Button.Label>{t(busy ? 'common.connecting' : registering ? 'auth.register' : 'auth.signIn')}</Button.Label>
              {!busy && <Ionicons name="arrow-forward" size={20} color={onAccent} accessible={false} />}
            </Button>
            <View className="grow flex-row flex-wrap items-end justify-center pt-6">
              <View className="flex-row flex-wrap items-center justify-center gap-x-1">
                <Text className="text-center font-sans text-sm text-muted">{t(registering ? 'auth.alreadyMember' : 'auth.newHere')}</Text>
                <Button variant="ghost" className="min-w-0 shrink px-1" isDisabled={busy} accessibilityLabel={t(registering ? 'auth.existing' : 'auth.newAccount')}
                  onPress={() => {
                    if (submitting.current) return;
                    setRegistering(value => !value); setMessage(null); setInvalid({ email: false, password: false });
                  }}>
                  <Button.Label>{t(registering ? 'auth.existing' : 'auth.newAccount')}</Button.Label>
                </Button>
              </View>
            </View>
          </View>
        </StyledSafeAreaView>
      </Surface>
    </ScrollView>
  </KeyboardAvoidingView>;
}
