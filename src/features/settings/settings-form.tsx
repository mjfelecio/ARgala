import { Switch } from 'heroui-native/switch';
import { Button } from 'heroui-native/button';
import { useTranslation } from 'react-i18next';
import { ScrollView, Text, View } from 'react-native';
import { DeviceSettingsAction } from './device-settings-action';
import { AccountSummary } from './account-summary';
import { AboutSettings } from './about-settings';
import { SignOutAction } from '@/features/auth/sign-out-action';
import { LanguageControl } from './language-control';
import { RadiusControl } from './radius-control';
import { useSettingsDraft } from './use-settings-draft';
import { ReminderSettings } from '@/features/arrival-reminders/components';
import { useCallback, useRef, useState, type PropsWithChildren, type ReactNode } from 'react';

export default function SettingsForm({ children, identityChildren }: PropsWithChildren<{ identityChildren?: ReactNode }>) {
  const { t } = useTranslation();
  const { focused, radius, language, changeRadius, changeLanguage, systemVoice, soundEffects, changeAudio, busy, message, dirty, valid, save, undo, undoEpoch, storageError } = useSettingsDraft();
  const viewport = useRef(0);
  const offset = useRef(0);
  const saveBox = useRef<{y:number;height:number}|null>(null);
  const [saveVisible, setSaveVisible] = useState(true);
  const [stickyHeight, setStickyHeight] = useState(0);
  const updateVisibility = useCallback(() => {
    const box = saveBox.current;
    if (!box || viewport.current <= 0) return;
    const visible = box.y + box.height > offset.current && box.y < offset.current + viewport.current;
    setSaveVisible(previous => previous === visible ? previous : visible);
  }, []);
  const sticky = focused && dirty && !saveVisible;
  return <View className="flex-1">
  <ScrollView className="flex-1" keyboardShouldPersistTaps="handled" contentContainerClassName="gap-6 px-5 pt-2"
    contentContainerStyle={{paddingBottom:32 + stickyHeight}}
    scrollEventThrottle={16}
    onLayout={event => {
      const height=event.nativeEvent.layout.height;
      if(Number.isFinite(height) && height>0){viewport.current=height;updateVisibility();}
    }}
    onScroll={event => {
      const {contentOffset,layoutMeasurement}=event.nativeEvent;
      if(Number.isFinite(contentOffset.y))offset.current=contentOffset.y;
      if(Number.isFinite(layoutMeasurement.height) && layoutMeasurement.height>0)viewport.current=layoutMeasurement.height;
      updateVisibility();
    }}>
    <View testID="profile-identity-group" className="gap-4 rounded-card bg-surface p-4">
      <AccountSummary />
      {identityChildren}
    </View>
    {children}
    <View className="gap-2 rounded-card bg-surface p-5">
      <Text accessibilityRole="header" className="font-sans text-section font-ui-semibold text-brand-strong">{t('settings.language')}</Text>
      <Text className="font-sans text-sm text-muted">{t('settings.languageDescription')}</Text>
      <LanguageControl value={language} onChange={changeLanguage} disabled={busy} />
    </View>
    <View className="gap-3 rounded-card bg-surface p-5">
      <Text accessibilityRole="header" className="font-sans text-section font-ui-semibold text-brand-strong">{t('settings.arLocation')}</Text>
      {/* Discard an unfinished local drag when leaving this screen. */}
      <RadiusControl key={`${focused}:${undoEpoch}`} value={radius} onChange={changeRadius} disabled={busy} />
      <Text className="font-sans text-sm text-foreground">{t('settings.deviceLocal')}</Text>
      <DeviceSettingsAction />
    </View>
    <View className="gap-3 rounded-card bg-surface p-5">
      <Text accessibilityRole="header" className="font-sans text-section font-ui-semibold text-brand-strong">{t('settings.arAudio')}</Text>
      {(['systemVoice', 'soundEffects'] as const).map(key => <View key={key} className="min-h-12 flex-row items-center gap-5">
        <Text className="flex-1 font-sans text-base text-foreground">{t(`settings.${key}`)}</Text>
        <Switch accessibilityLabel={t(`settings.${key}`)} hitSlop={10} isSelected={key === 'systemVoice' ? systemVoice : soundEffects} isDisabled={busy} onSelectedChange={value => changeAudio(key, value)} />
      </View>)}
    </View>
    <ReminderSettings />
    <AboutSettings />
    {storageError && <Text accessibilityRole="alert" className="font-sans text-sm text-danger">{t(storageError)}</Text>}
    {message && <Text accessibilityLiveRegion="polite" className="font-sans text-sm text-foreground">{t(message)}</Text>}
    <Text accessibilityLiveRegion="polite" className="font-sans text-sm text-muted">{t(dirty ? 'settings.unsaved' : 'settings.unchanged')}</Text>
    <View testID="settings-save-action" onLayout={event => {
      const {y,height}=event.nativeEvent.layout;
      if(Number.isFinite(y) && Number.isFinite(height) && height>0){saveBox.current={y,height};updateVisibility();}
    }}>
    <Button onPress={() => void save()} isDisabled={busy || !dirty || !valid} accessibilityState={{ busy, disabled: busy || !dirty || !valid }} accessibilityLabel={t(busy ? 'settings.saving' : 'common.save')}><Button.Label>{t(busy ? 'settings.saving' : 'common.save')}</Button.Label></Button>
    </View>
    <SignOutAction appearance="settings" />
  </ScrollView>
  {sticky && <View testID="settings-draft-actions" className="absolute inset-x-0 bottom-0 flex-row flex-wrap gap-3 border-t border-outline bg-page px-5 py-3"
    onLayout={event=>{const height=event.nativeEvent.layout.height;if(Number.isFinite(height)&&height>0)setStickyHeight(previous=>previous===height?previous:height);}}>
    {storageError && <Text accessibilityRole="alert" className="w-full font-sans text-sm text-danger">{t(storageError)}</Text>}
    {message==='settings.saveFailed' && <Text accessibilityRole="alert" accessibilityLiveRegion="polite" className="w-full font-sans text-sm text-danger">{t(message)}</Text>}
    <Button variant="outline" className="min-w-24 flex-1" accessibilityLabel={t('settings.undoChanges')} isDisabled={busy} accessibilityState={{disabled:busy}} onPress={undo}>
      <Button.Label>{t('settings.undo')}</Button.Label>
    </Button>
    <Button className="min-w-24 flex-1" accessibilityLabel={t(busy?'settings.saving':'common.save')} isDisabled={busy || !valid}
      accessibilityState={{busy,disabled:busy || !valid}} onPress={()=>void save()}>
      <Button.Label>{t(busy?'settings.saving':'settings.saveShort')}</Button.Label>
    </Button>
  </View>}
  </View>;
}
