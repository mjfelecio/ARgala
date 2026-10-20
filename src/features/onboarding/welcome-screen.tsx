import Ionicons from '@expo/vector-icons/Ionicons';
import { Button } from 'heroui-native/button';
import { useThemeColor } from 'heroui-native/hooks';
import { Label } from 'heroui-native/label';
import { Radio } from 'heroui-native/radio';
import { RadioGroup } from 'heroui-native/radio-group';
import { Surface } from 'heroui-native/surface';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path, Circle } from 'react-native-svg';
import { withUniwind } from 'uniwind';
import { useSettings } from '@/features/settings/provider';
import { languageSchema } from '../../../supabase/functions/_shared/contracts';
import { useOnboarding } from './provider';

const StyledSafeAreaView = withUniwind(SafeAreaView);
const languages = [
  { value: 'en', label: 'English' },
  { value: 'ko', label: '한국어' },
  { value: 'ja', label: '日本語' },
] as const;

// Original abstract scenery, drawn from existing theme colors. It makes no
// claim about a real destination and needs no remote or unlicensed photograph.
function WelcomeLandscape() {
  const [mint, primary, strong] = useThemeColor(['surface-secondary', 'accent', 'surface-secondary-foreground']);
  return <View className="absolute inset-0" pointerEvents="none" accessible={false} importantForAccessibility="no-hide-descendants">
    <Svg width="100%" height="100%" viewBox="0 0 400 320" preserveAspectRatio="xMidYMax slice">
      <Circle cx="325" cy="75" r="42" fill={mint} />
      <Path d="M0 230 Q65 110 145 204 Q220 100 305 180 Q355 128 400 180 L400 320 L0 320Z" fill={primary} opacity={0.12} />
      <Path d="M0 275 Q90 210 160 255 Q270 178 400 245 L400 320 L0 320Z" fill={strong} opacity={0.1} />
      <Path d="M0 300 Q140 265 230 290 Q330 270 400 290 L400 320 L0 320Z" fill={primary} opacity={0.1} />
    </Svg>
  </View>;
}

export default function WelcomeScreen() {
  const settings = useSettings();
  const { complete } = useOnboarding();
  const { t: translate } = useTranslation();
  const [language, setLanguage] = useState(settings.language);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<'onboarding.saveFailed' | null>(null);
  const submitting = useRef(false);
  const alive = useRef(true);
  const insets = useSafeAreaInsets();
  const [accent, onAccent] = useThemeColor(['accent', 'accent-foreground']);
  // Preview this screen without changing or persisting the global language.
  const t = (key: string) => translate(key, { lng: language });
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);

  async function onContinue() {
    if (submitting.current) return;
    submitting.current = true;
    setBusy(true); setError(null);
    try { await complete(language); }
    catch { if (alive.current) setError('onboarding.saveFailed'); }
    finally { submitting.current = false; if (alive.current) setBusy(false); }
  }

  return <View className="flex-1 bg-surface">
    <ScrollView className="flex-1" contentContainerClassName="grow" showsVerticalScrollIndicator={false}>
      <View className="bg-mint" style={{ paddingTop: insets.top }}>
        <View className="min-h-72 items-center justify-center gap-3 overflow-hidden px-6 pb-12 pt-8">
          <WelcomeLandscape />
          <View className="size-14 items-center justify-center rounded-input bg-surface" accessible={false}>
            <Ionicons name="compass-outline" size={32} color={accent} />
          </View>
          <Text accessibilityRole="header" className="text-center font-sans text-hero font-bold text-brand-strong">ARgala</Text>
          <Text className="text-center font-sans text-base text-brand-strong">{t('onboarding.tagline')}</Text>
        </View>
      </View>
      <Surface className="-mt-6 grow rounded-b-none rounded-t-page p-0">
        <StyledSafeAreaView className="grow px-6 pb-6 pt-8" edges={['bottom', 'left', 'right']}>
          <View className="gap-1 pb-5">
            <Text accessibilityRole="header" className="font-sans text-section font-semibold text-foreground">{t('onboarding.title')}</Text>
            <Text className="font-sans text-sm text-muted">{t('onboarding.description')}</Text>
          </View>
          <RadioGroup value={language} onValueChange={value => {
            const selected = languageSchema.safeParse(value);
            if (!submitting.current && selected.success) setLanguage(selected.data);
          }} isDisabled={busy} variant="primary" accessibilityLabel={t('onboarding.languageLabel')} className="gap-3">
            {languages.map(option => <RadioGroup.Item key={option.value} value={option.value} accessibilityLabel={option.label}
              className={`min-h-16 rounded-input border px-4 py-3 ${language === option.value ? 'border-accent bg-mint' : 'border-transparent bg-surface-tertiary'}`}>
              <View className="shrink grow gap-1">
                <Label className={`text-base font-semibold ${language === option.value ? 'text-brand-strong' : 'text-foreground'}`}>{option.label}</Label>
                <Text className="font-sans text-xs text-muted">{t(`onboarding.languageNames.${option.value}`)}</Text>
              </View>
              <Radio />
            </RadioGroup.Item>)}
          </RadioGroup>
          <View className="grow justify-end gap-3 pt-6">
            {error && <Text accessibilityRole="alert" accessibilityLiveRegion="polite" className="font-sans text-sm text-danger">{t(error)}</Text>}
            <Button size="lg" className="w-full" isDisabled={busy} onPress={() => { void onContinue(); }}
              accessibilityLabel={t(busy ? 'onboarding.saving' : 'onboarding.continue')} accessibilityState={{ disabled: busy, busy }}>
              {busy && <ActivityIndicator color={onAccent} />}
              <Button.Label>{t(busy ? 'onboarding.saving' : 'onboarding.continue')}</Button.Label>
              {!busy && <Ionicons name="arrow-forward" size={20} color={onAccent} />}
            </Button>
            <Text className="text-center font-sans text-xs text-muted">{t('onboarding.settingsNote')}</Text>
          </View>
        </StyledSafeAreaView>
      </Surface>
    </ScrollView>
  </View>;
}
