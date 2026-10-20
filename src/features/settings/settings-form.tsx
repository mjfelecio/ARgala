import { useState } from 'react';
import { ScrollView, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { ACTIVATION, DISCOVERY } from '@/config/limits';
import { SignOutAction } from '@/features/auth/sign-out-action';
import { Action, Field, Notice } from '@/ui/shared';
import { preferencesSchema } from './preferences';
import { useSettings } from './provider';
type MessageKey = 'settings.invalid' | 'common.saved' | 'settings.saveFailed';
export default function SettingsScreen() {
  const settings = useSettings(); const { t } = useTranslation();
  const [radius, setRadius] = useState(String(settings.activationRadiusMeters));
  const [language, setLanguage] = useState(settings.language); const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<MessageKey | null>(null);
  async function save() {
    const parsed = preferencesSchema.safeParse({ activationRadiusMeters: Number(radius), language });
    if (!parsed.success) { setMessage('settings.invalid'); return; }
    setBusy(true); setMessage(null);
    try { await settings.save(parsed.data); setMessage('common.saved'); }
    catch { setMessage('settings.saveFailed'); } finally { setBusy(false); }
  }
  return <ScrollView keyboardShouldPersistTaps="handled" contentContainerClassName="gap-4 p-4">
    <Field label={t('settings.radius')} keyboardType="number-pad" value={radius} onChangeText={setRadius} editable={!busy} />
    <Notice>{t('settings.radiusHelp', { meters: DISCOVERY.radiusMeters, min: ACTIVATION.minMeters, max: ACTIVATION.maxMeters })}</Notice>
    <Text>{t('settings.language')}</Text>
    {(['en', 'ko', 'ja'] as const).map((code) => <Action key={code} title={`${language === code ? '✓ ' : ''}${({ en: 'English', ko: '한국어', ja: '日本語' })[code]}`} onPress={() => setLanguage(code)} disabled={busy} />)}
    {settings.storageError && <Notice>{t(settings.storageError)}</Notice>}{message && <Notice>{t(message)}</Notice>}
    <Action title={busy ? t('common.loading') : t('common.save')} onPress={() => void save()} disabled={busy} /><SignOutAction />
  </ScrollView>;
}
