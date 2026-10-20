import { Button } from 'heroui-native/button';
import { Input } from 'heroui-native/input';
import { Label } from 'heroui-native/label';
import { Slider } from 'heroui-native/slider';
import { TextField } from 'heroui-native/text-field';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';
import { ACTIVATION } from '@/config/limits';
import { activationRadiusSchema } from './preferences';

export function RadiusControl({ value, onChange, disabled = false }: {
  value: string; onChange(value: string): void; disabled?: boolean;
}) {
  const { t } = useTranslation();
  const initial = activationRadiusSchema.safeParse(value.trim() === '' ? NaN : Number(value));
  const [draft, setDraft] = useState({ source: value, text: value, lastValid: initial.success ? initial.data : ACTIVATION.defaultMeters });
  // Saved/restored drafts replace local interaction state before children render.
  if (draft.source !== value) setDraft({ source: value, text: value, lastValid: initial.success ? initial.data : draft.lastValid });
  const parsed = activationRadiusSchema.safeParse(draft.text.trim() === '' ? NaN : Number(draft.text));
  const validValue = parsed.success ? parsed.data : null;
  const current = validValue ?? draft.lastValid;
  function edit(next: string, commit: boolean) {
    if (disabled) return;
    const result = activationRadiusSchema.safeParse(next.trim() === '' ? NaN : Number(next));
    setDraft(previous => ({ ...previous, text: next, lastValid: result.success ? result.data : previous.lastValid }));
    if (commit) onChange(next);
  }
  function select(next: number, commit = true) {
    edit(String(Math.min(ACTIVATION.maxMeters, Math.max(ACTIVATION.minMeters, Math.round(next)))), commit);
  }
  return <View className="gap-4">
    <View className="flex-row flex-wrap items-center justify-between gap-2">
      <Text className="font-sans text-card font-semibold text-foreground">{t('settings.activationRadius')}</Text>
      <Text className="rounded-pill bg-accent px-3 py-1 font-sans text-sm font-semibold text-accent-foreground">{t('settings.meters', { count: current })}</Text>
    </View>
    <Text className="font-sans text-sm text-muted">{t('settings.radiusDescription')}</Text>
    <Slider value={current} minValue={ACTIVATION.minMeters} maxValue={ACTIVATION.maxMeters} step={10} isDisabled={disabled}
      onChange={next => { if (typeof next === 'number') select(next, false); }}
      onChangeEnd={next => { if (typeof next === 'number') select(next); }}>
      <Slider.Track><Slider.Fill /><Slider.Thumb accessibilityLabel={t('settings.activationRadius')}
        accessibilityValue={{ min: ACTIVATION.minMeters, max: ACTIVATION.maxMeters, now: current, text: t('settings.meters', { count: current }) }}
        accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
        onAccessibilityAction={event => {
          if (event.nativeEvent.actionName === 'increment') select((Math.floor(current / 10) + 1) * 10);
          if (event.nativeEvent.actionName === 'decrement') select((Math.ceil(current / 10) - 1) * 10);
        }} /></Slider.Track>
    </Slider>
    <View className="flex-row justify-between gap-2">
      <Text className="font-sans text-xs text-muted">{t('settings.meters', { count: ACTIVATION.minMeters })}</Text>
      <Text className="font-sans text-xs text-muted">{t('settings.meters', { count: ACTIVATION.maxMeters })}</Text>
    </View>
    <View className="flex-row flex-wrap gap-2">
      {[50, 100, 200, 500].map(preset => <Button key={preset} size="sm" className="min-w-20 grow" variant={validValue === preset ? 'primary' : 'secondary'} isDisabled={disabled}
        accessibilityLabel={t('settings.meters', { count: preset })} accessibilityState={{ selected: validValue === preset, disabled }} onPress={() => select(preset)}>
        <Button.Label>{t('settings.meters', { count: preset })}</Button.Label>
      </Button>)}
    </View>
    <TextField isDisabled={disabled} isInvalid={!parsed.success}>
      <Label><Label.Text className="font-sans text-sm font-semibold">{t('settings.radius')}</Label.Text></Label>
      <Input value={draft.text} keyboardType="number-pad" accessibilityLabel={t('settings.radius')} onChangeText={next => edit(next, true)}
        className="min-h-14 font-sans text-base" />
    </TextField>
    {!parsed.success && <Text accessibilityRole="alert" accessibilityLiveRegion="polite" className="font-sans text-sm text-danger">{t('settings.invalid')}</Text>}
  </View>;
}
