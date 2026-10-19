import { Text } from 'react-native';
import { useTranslation } from 'react-i18next';

export default function RoutePreviewScreen() {
  const { t } = useTranslation();
  return <Text>{t('map.start')}</Text>;
}
