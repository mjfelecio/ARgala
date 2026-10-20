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
  return <View className="min-h-14 flex-row flex-wrap items-center justify-between gap-2 rounded-pill border border-white/20 bg-ink/95 px-2 py-1">
    <Button variant="secondary" className="min-h-12 px-3" accessibilityLabel={t('navigation.backToMap')} onPress={onMap}>
      <Ionicons name="map-outline" size={20} /><Button.Label>{t('ar.map')}</Button.Label>
    </Button>
    <View className="min-w-0 flex-1 items-center px-1">
      <Text accessibilityRole="header" numberOfLines={1} className="font-sans text-sm font-bold text-white">{t('ar.title')}</Text>
      <Text numberOfLines={1} className="font-sans text-xs font-semibold text-white">{headingDegrees === null ? t('ar.compassUnavailable') : t('ar.bearing', { degrees: Math.round(headingDegrees) % 360 })}</Text>
    </View>
    <Button className="min-h-12 px-3" accessibilityLabel={t('ar.scan')} isDisabled={scanDisabled}
        accessibilityState={{ disabled: scanDisabled, busy: scanBusy }} onPress={onScan}>
      {scanBusy ? <Spinner size="sm" color={onAccent} /> : <Ionicons name="scan-outline" size={18} color={onAccent} />}
      <Button.Label>{t('ar.scan')}</Button.Label>
    </Button>
  </View>;
}
