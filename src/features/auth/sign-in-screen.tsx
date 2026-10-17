import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { Text } from 'react-native';
import { getSupabase } from '@/lib/supabase';
import { Action, Field, Notice, Screen, styles } from '@/ui/shared';
import { registrationSchema, signInSchema } from './credentials';

export default function SignInScreen() {
  const { t } = useTranslation();
  const [registering, setRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  async function submit() {
    const parsed = (registering ? registrationSchema : signInSchema).safeParse({ email, password });
    if (!parsed.success) { setMessage(registering ? t('auth.invalidRegistration') : t('auth.invalid')); return; }
    setBusy(true); setMessage(null);
    try {
      const { data, error } = registering ? await getSupabase().auth.signUp(parsed.data) : await getSupabase().auth.signInWithPassword(parsed.data);
      if (error) throw error;
      setPassword('');
      if (registering && !data.session) setMessage(t('auth.confirm'));
    } catch (error) { setMessage(error instanceof Error ? error.message : t('auth.failed')); }
    finally { setBusy(false); }
  }
  return <Screen><Text style={styles.title}>{registering ? t('auth.create') : t('auth.title')}</Text>
    <Field label={t('auth.email')} value={email} onChangeText={setEmail} autoCapitalize="none" autoCorrect={false} keyboardType="email-address" autoComplete="email" editable={!busy} />
    <Field label={t('auth.password')} value={password} onChangeText={setPassword} secureTextEntry autoCapitalize="none" autoCorrect={false} autoComplete={registering ? 'new-password' : 'current-password'} editable={!busy} />
    {message && <Notice>{message}</Notice>}{busy && <Notice busy>{t('common.connecting')}</Notice>}
    <Action title={registering ? t('auth.register') : t('auth.signIn')} onPress={() => void submit()} disabled={busy} />
    <Action title={registering ? t('auth.existing') : t('auth.newAccount')} onPress={() => { setRegistering(!registering); setMessage(null); }} disabled={busy} />
  </Screen>;
}
