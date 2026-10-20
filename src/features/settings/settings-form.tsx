import { Button } from 'heroui-native/button';
import { Surface } from 'heroui-native/surface';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, Text, View } from 'react-native';
import { ACTIVATION, DISCOVERY } from '@/config/limits';
import { SignOutAction } from '@/features/auth/sign-out-action';
import { LanguageControl } from './language-control';
import { RadiusControl } from './radius-control';
import { preferencesSchema } from './preferences';
import { useSettings } from './provider';

type MessageKey = 'settings.invalid' | 'common.saved' | 'settings.saveFailed';
export default function SettingsForm() {
  const settings = useSettings();
  const { t } = useTranslation();
  const [radius, setRadius] = useState(String(settings.activationRadiusMeters));
  const [language, setLanguage] = useState(settings.language);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<MessageKey | null>(null);
  async function save() {
    const parsed = preferencesSchema.safeParse({ activationRadiusMeters: Number(radius), language });
    if (!parsed.success) { setMessage('settings.invalid'); return; }
    setBusy(true); setMessage(null);
    try { await settings.save(parsed.data); setMessage('common.saved'); }
    catch { setMessage('settings.saveFailed'); } finally { setBusy(false); }
  }
  return <ScrollView className="flex-1" keyboardShouldPersistTaps="handled" contentContainerClassName="gap-6 px-5 pb-8 pt-2">
    <View className="gap-2">
      <Text accessibilityRole="header" className="font-sans text-section font-semibold text-foreground">{t('settings.language')}</Text>
      <Text className="font-sans text-sm text-muted">{t('settings.languageDescription')}</Text>
      <Surface className="p-2"><LanguageControl value={language} onChange={setLanguage} disabled={busy} /></Surface>
    </View>
    <View className="gap-3">
      <Text accessibilityRole="header" className="font-sans text-section font-semibold text-foreground">{t('settings.arLocation')}</Text>
      <Surface className="gap-4 p-5">
        <RadiusControl value={radius} onChange={setRadius} disabled={busy} />
        <Text className="rounded-input bg-mint p-4 font-sans text-sm text-brand-strong">{t('settings.deviceLocal')}</Text>
        <Text className="font-sans text-xs text-muted">{t('settings.radiusHelp', { meters: DISCOVERY.radiusMeters, min: ACTIVATION.minMeters, max: ACTIVATION.maxMeters })}</Text>
      </Surface>
    </View>
    {settings.storageError && <Text accessibilityRole="alert" className="font-sans text-sm text-danger">{t(settings.storageError)}</Text>}
    {message && <Text accessibilityLiveRegion="polite" className="font-sans text-sm text-foreground">{t(message)}</Text>}
    <Button onPress={() => void save()} isDisabled={busy} accessibilityLabel={t(busy ? 'settings.saving' : 'common.save')}><Button.Label>{t(busy ? 'settings.saving' : 'common.save')}</Button.Label></Button>
    <SignOutAction />
  </ScrollView>;
}
