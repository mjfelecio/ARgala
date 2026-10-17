import { useState } from 'react';
import { Text } from 'react-native';
import { getSupabase } from '@/lib/supabase';
import { Action, Field, Notice, Screen, styles } from '@/ui/shared';
import { registrationSchema, signInSchema } from './credentials';

export default function SignInScreen() {
  const [registering, setRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  async function submit() {
    const parsed = (registering ? registrationSchema : signInSchema).safeParse({ email, password });
    if (!parsed.success) { setMessage(registering ? 'Enter a valid email and a password of at least eight characters.' : 'Enter a valid email and password.'); return; }
    setBusy(true); setMessage(null);
    try {
      const { data, error } = registering ? await getSupabase().auth.signUp(parsed.data) : await getSupabase().auth.signInWithPassword(parsed.data);
      if (error) throw error;
      setPassword('');
      if (registering && !data.session) setMessage('Check your email to confirm your account, then sign in.');
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Authentication failed. Please try again.'); }
    finally { setBusy(false); }
  }
  return <Screen><Text style={styles.title}>{registering ? 'Create account' : 'Sign in to ARgala'}</Text>
    <Field label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" autoCorrect={false} keyboardType="email-address" autoComplete="email" editable={!busy} />
    <Field label="Password" value={password} onChangeText={setPassword} secureTextEntry autoCapitalize="none" autoCorrect={false} autoComplete={registering ? 'new-password' : 'current-password'} editable={!busy} />
    {message && <Notice>{message}</Notice>}{busy && <Notice busy>Connecting…</Notice>}
    <Action title={registering ? 'Register' : 'Sign in'} onPress={() => void submit()} disabled={busy} />
    <Action title={registering ? 'Use an existing account' : 'Create an account'} onPress={() => { setRegistering(!registering); setMessage(null); }} disabled={busy} />
  </Screen>;
}
