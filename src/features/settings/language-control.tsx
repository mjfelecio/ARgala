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
  const options = [{ value: 'en', label: 'English' }, { value: 'ko', label: '한국어' }, { value: 'ja', label: '日本語' }] as const;
  return <RadioGroup value={value} isDisabled={disabled} variant="primary" accessibilityLabel={t('settings.language')} className="gap-0" onValueChange={next => {
    const parsed = languageSchema.safeParse(next);
    if (!disabled && parsed.success) onChange(parsed.data);
  }}>
    {options.map((option, index) =>
      <RadioGroup.Item key={option.value} value={option.value} accessibilityLabel={option.label}
        className={`min-h-16 py-3 ${index < options.length - 1 ? 'border-b border-outline' : ''}`}>
        <View className="shrink grow gap-1">
          <Label><Label.Text className="font-sans text-base font-semibold">{option.label}</Label.Text></Label>
          <Text className="font-sans text-xs text-muted">{t(`onboarding.languageNames.${option.value}`)}</Text>
        </View>
        <Radio />
      </RadioGroup.Item>)}
  </RadioGroup>;
}
