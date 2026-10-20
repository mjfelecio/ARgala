import { Button } from 'heroui-native/button';
import { Surface } from 'heroui-native/surface';
import { useTranslation } from 'react-i18next';
import { ScrollView, Text, View } from 'react-native';
import { ACTIVATION, DISCOVERY } from '@/config/limits';
import { DeviceSettingsAction } from './device-settings-action';
import { AccountSummary } from './account-summary';
import { AboutSettings } from './about-settings';
import { SignOutAction } from '@/features/auth/sign-out-action';
import { LanguageControl } from './language-control';
import { RadiusControl } from './radius-control';
import { useSettingsDraft } from './use-settings-draft';

export default function SettingsForm() {
  const { t } = useTranslation();
  const { radius, language, changeRadius, changeLanguage, busy, message, dirty, valid, save, storageError } = useSettingsDraft();
  return <ScrollView className="flex-1" keyboardShouldPersistTaps="handled" contentContainerClassName="gap-6 px-5 pb-8 pt-2">
    <AccountSummary />
    <View className="gap-2">
      <Text accessibilityRole="header" className="font-sans text-section font-semibold text-foreground">{t('settings.language')}</Text>
      <Text className="font-sans text-sm text-muted">{t('settings.languageDescription')}</Text>
      <Surface className="p-2"><LanguageControl value={language} onChange={changeLanguage} disabled={busy} /></Surface>
    </View>
    <View className="gap-3">
      <Text accessibilityRole="header" className="font-sans text-section font-semibold text-foreground">{t('settings.arLocation')}</Text>
      <Surface className="gap-4 p-5">
        <RadiusControl value={radius} onChange={changeRadius} disabled={busy} />
        <Text className="rounded-input bg-mint p-4 font-sans text-sm text-brand-strong">{t('settings.deviceLocal')}</Text>
        <Text className="font-sans text-xs text-muted">{t('settings.radiusHelp', { meters: DISCOVERY.radiusMeters, min: ACTIVATION.minMeters, max: ACTIVATION.maxMeters })}</Text>
        <DeviceSettingsAction />
      </Surface>
    </View>
    <AboutSettings />
    {storageError && <Text accessibilityRole="alert" className="font-sans text-sm text-danger">{t(storageError)}</Text>}
    {message && <Text accessibilityLiveRegion="polite" className="font-sans text-sm text-foreground">{t(message)}</Text>}
    <Text accessibilityLiveRegion="polite" className="font-sans text-sm text-muted">{t(dirty ? 'settings.unsaved' : 'settings.unchanged')}</Text>
    <Button onPress={() => void save()} isDisabled={busy || !dirty || !valid} accessibilityState={{ busy, disabled: busy || !dirty || !valid }} accessibilityLabel={t(busy ? 'settings.saving' : 'common.save')}><Button.Label>{t(busy ? 'settings.saving' : 'common.save')}</Button.Label></Button>
    <SignOutAction appearance="settings" />
  </ScrollView>;
}
