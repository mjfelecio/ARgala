import { Button } from 'heroui-native/button';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Text } from 'react-native';
import { getSupabase } from '@/lib/supabase';
import { Screen } from '@/ui/shared';
import { CredentialsFields } from './credentials-fields';
import { registrationSchema, signInSchema } from './credentials';
import { authErrorMessageKey } from './errors';

type MessageKey = ReturnType<typeof authErrorMessageKey> | 'auth.invalid' | 'auth.invalidRegistration' | 'auth.confirm';

export default function SignInScreen() {
  const { t } = useTranslation();
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

  return <Screen>
    <Text accessibilityRole="header" className="font-sans text-hero font-bold text-foreground">{t(registering ? 'auth.create' : 'auth.title')}</Text>
    <CredentialsFields email={email} password={password} registering={registering} disabled={busy}
      invalidEmail={invalid.email} invalidPassword={invalid.password}
      onEmailChange={value => { setEmail(value); setInvalid(current => ({ ...current, email: false })); }}
      onPasswordChange={value => { setPassword(value); setInvalid(current => ({ ...current, password: false })); }} />
    {message && <Text accessibilityRole={message === 'auth.confirm' ? undefined : 'alert'} accessibilityLiveRegion="polite"
      className={`font-sans text-sm ${message === 'auth.confirm' ? 'text-brand-strong' : 'text-danger'}`}>{t(message)}</Text>}
    <Button size="lg" isDisabled={busy} accessibilityLabel={t(busy ? 'common.connecting' : registering ? 'auth.register' : 'auth.signIn')}
      accessibilityState={{ disabled: busy, busy }} onPress={() => { void submit(); }}>
      <Button.Label>{t(busy ? 'common.connecting' : registering ? 'auth.register' : 'auth.signIn')}</Button.Label>
    </Button>
    <Button variant="ghost" isDisabled={busy} accessibilityLabel={t(registering ? 'auth.existing' : 'auth.newAccount')}
      onPress={() => { if (!submitting.current) { setRegistering(value => !value); setMessage(null); setInvalid({ email: false, password: false }); } }}>
      <Button.Label>{t(registering ? 'auth.existing' : 'auth.newAccount')}</Button.Label>
    </Button>
  </Screen>;
}
