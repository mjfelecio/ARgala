import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { getSupabase } from '@/lib/supabase';
import { Action, Notice } from '@/ui/shared';
import { authErrorMessageKey } from './errors';

export function SignOutAction() {
  const { t } = useTranslation();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<ReturnType<typeof authErrorMessageKey> | null>(null);
  async function logout() {
    setBusy(true); setError(null);
    try { const result = await getSupabase().auth.signOut(); if (result.error) throw result.error; }
    catch (failure) { setError(authErrorMessageKey(failure, 'auth.logoutFailed')); }
    finally { setBusy(false); }
  }
  return <>{error && <Notice>{t(error)}</Notice>}<Action title={busy ? t('auth.signingOut') : t('auth.signOut')} onPress={() => void logout()} disabled={busy} /></>;
}
