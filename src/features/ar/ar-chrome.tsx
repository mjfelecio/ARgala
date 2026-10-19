import Ionicons from '@expo/vector-icons/Ionicons';
import { Button } from 'heroui-native/button';
import { useThemeColor } from 'heroui-native/hooks';
import { Spinner } from 'heroui-native/spinner';
import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

type Props = {
  headingDegrees: number | null; onMap(): void; onScan(): void;
  scanDisabled: boolean; scanBusy: boolean;
};
/** Presentation only: the controller supplies a freshness-checked true heading. */
export function ArChrome({ headingDegrees, onMap, onScan, scanDisabled, scanBusy }: Props) {
  const { t } = useTranslation();
  const onAccent = useThemeColor('accent-foreground');
  return <View className="gap-2 rounded-card bg-ink/95 p-3">
    <View className="flex-row flex-wrap items-center justify-between gap-2">
      <Text accessibilityRole="header" className="shrink font-sans text-card font-bold text-white">{t('ar.title')}</Text>
      <Button variant="secondary" accessibilityLabel={t('navigation.backToMap')} onPress={onMap}>
        <Ionicons name="map-outline" size={20} /><Button.Label>{t('ar.map')}</Button.Label>
      </Button>
    </View>
    <View className="flex-row flex-wrap items-center justify-between gap-2">
      <Text className="shrink font-sans text-sm text-white">{headingDegrees === null ? t('ar.compassUnavailable') : t('ar.bearing', { degrees: Math.round(headingDegrees) % 360 })}</Text>
      <Button size="sm" accessibilityLabel={t('ar.scan')} isDisabled={scanDisabled}
        accessibilityState={{ disabled: scanDisabled, busy: scanBusy }} onPress={onScan}>
        {scanBusy && <Spinner size="sm" color={onAccent} />}<Button.Label>{t('ar.scan')}</Button.Label>
      </Button>
    </View>
  </View>;
}
