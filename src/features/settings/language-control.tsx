import { Label } from 'heroui-native/label';
import { Radio } from 'heroui-native/radio';
import { RadioGroup } from 'heroui-native/radio-group';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';
import { languageSchema } from '../../../supabase/functions/_shared/contracts';
import type { Preferences } from './preferences';

export function LanguageControl({ value, onChange, disabled = false }: {
  value: Preferences['language']; onChange(value: Preferences['language']): void; disabled?: boolean;
}) {
  const { t } = useTranslation();
  return <RadioGroup value={value} isDisabled={disabled} variant="primary" accessibilityLabel={t('settings.language')} className="gap-2" onValueChange={next => {
    const parsed = languageSchema.safeParse(next);
    if (!disabled && parsed.success) onChange(parsed.data);
  }}>
    {([{ value: 'en', label: 'English' }, { value: 'ko', label: '한국어' }, { value: 'ja', label: '日本語' }] as const).map(option =>
      <RadioGroup.Item key={option.value} value={option.value} accessibilityLabel={option.label}
        className={`min-h-16 rounded-input px-4 py-3 ${value === option.value ? 'bg-mint' : 'bg-surface'}`}>
        <View className="shrink grow gap-1">
          <Label><Label.Text className="font-sans text-base font-semibold">{option.label}</Label.Text></Label>
          <Text className="font-sans text-xs text-muted">{t(`onboarding.languageNames.${option.value}`)}</Text>
        </View>
        <Radio />
      </RadioGroup.Item>)}
  </RadioGroup>;
}
