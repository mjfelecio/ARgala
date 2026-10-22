import Ionicons from '@expo/vector-icons/Ionicons';
import { Button } from 'heroui-native/button';
import { useThemeColor } from 'heroui-native/hooks';
import { useTranslation } from 'react-i18next';
import { SystemSettingsAction } from '@/features/location/status';

export function DeviceSettingsAction() {
  const { t } = useTranslation();
  const accent = useThemeColor('accent');
  return <SystemSettingsAction renderAction={onPress => <Button variant="outline" accessibilityLabel={t('common.openSettings')} onPress={onPress}>
    <Ionicons name="settings-outline" size={22} color={accent} /><Button.Label>{t('common.openSettings')}</Button.Label>
    <Ionicons name="open-outline" size={18} color={accent} />
  </Button>} />;
}
