import { useJournal } from '@/features/journal/context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Button } from 'heroui-native/button';
import { useThemeColor } from 'heroui-native/hooks';
import { useTranslation } from 'react-i18next';
import { useRef, useState } from 'react';
import { Text } from 'react-native';
import { getSupabase } from '@/lib/supabase';
import { Action, Notice } from '@/ui/shared';
import { authErrorMessageKey } from './errors';

export function SignOutAction({ appearance = 'default' }: { appearance?: 'default' | 'settings' }) {
  const { t } = useTranslation();
  const danger = useThemeColor('danger');
  const journal=useJournal();
  const [busy, setBusy] = useState(false);
  const submitting = useRef(false);
  const [error, setError] = useState<ReturnType<typeof authErrorMessageKey> | null>(null);
  async function logout() {
    if (submitting.current) return;
    submitting.current = true; setBusy(true); setError(null);
    try { const result = await getSupabase().auth.signOut(); if (result.error) throw result.error; }
    catch (failure) { setError(authErrorMessageKey(failure, 'auth.logoutFailed')); }
    finally { submitting.current = false; setBusy(false); }
  }
  if(journal?.principalId==='guest') return null;
  const title = t(busy ? 'auth.signingOut' : 'auth.signOut');
  if (appearance === 'settings') return <>
    {error && <Text accessibilityRole="alert" accessibilityLiveRegion="polite" className="font-sans text-sm text-danger">{t(error)}</Text>}
    <Button variant="ghost" accessibilityLabel={title} accessibilityState={{ disabled: busy, busy }} isDisabled={busy} onPress={() => void logout()}>
      <Ionicons name="log-out-outline" color={danger} size={22} /><Button.Label className="text-danger">{title}</Button.Label>
    </Button>
  </>;
  return <>{error && <Notice>{t(error)}</Notice>}<Action title={title} onPress={() => void logout()} disabled={busy} /></>;
}
