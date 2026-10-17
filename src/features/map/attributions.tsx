import { Alert, Linking, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { Place } from '@/features/places/service';
export function useOpenProviderLink() {
  const { t } = useTranslation();
  return (uri: string) => { void Linking.openURL(uri).catch(() => Alert.alert(t('map.linkFailed'))); };
}
export function ProviderAttributions({ places }: { places: Place[] }) {
  const open = useOpenProviderLink();
  const providers = [...new Map(places.flatMap((place) => place.attributions).map((item) => [`${item.name}|${item.uri ?? ''}`, item])).values()];
  return <View>{providers.map((item) => item.uri ? <Text key={`${item.name}|${item.uri}`} accessibilityRole="link" onPress={() => open(item.uri!)} style={{ color: '#125fac', paddingVertical: 4 }}>{item.name}</Text> : <Text key={item.name}>{item.name}</Text>)}</View>;
}
