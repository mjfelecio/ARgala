import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { getSupabase } from '@/lib/supabase';
import { Action, Notice } from '@/ui/shared';

export function SignOutAction() {
  const { t } = useTranslation();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function logout() {
    setBusy(true); setError(null);
    try { const result = await getSupabase().auth.signOut(); if (result.error) throw result.error; }
    catch (failure) { setError(failure instanceof Error ? failure.message : t('auth.logoutFailed')); }
    finally { setBusy(false); }
  }
  return <>{error && <Notice>{error}</Notice>}<Action title={busy ? t('auth.signingOut') : t('auth.signOut')} onPress={() => void logout()} disabled={busy} /></>;
}
