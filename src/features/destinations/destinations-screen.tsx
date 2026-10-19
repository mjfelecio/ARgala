import { router } from 'expo-router';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { withUniwind } from 'uniwind';
import { useTranslation } from 'react-i18next';
import { Button } from 'heroui-native/button';
import { Card } from 'heroui-native/card';
import { destinationName, listDestinations } from './catalog';

const StyledSafeAreaView = withUniwind(SafeAreaView);
export default function DestinationsScreen() {
  const { t } = useTranslation();
  return <StyledSafeAreaView className="flex-1 bg-page-mint" edges={['top', 'bottom', 'left', 'right']}>
    <View className="flex-row items-center gap-3 px-4 py-3">
      <Button variant="secondary" accessibilityLabel={t('placeDetails.back')} onPress={() => { if (router.canGoBack()) router.back(); else router.navigate('/'); }}><Button.Label>{t('placeDetails.back')}</Button.Label></Button>
      <Text accessibilityRole="header" className="shrink font-sans text-section font-semibold text-foreground">{t('destinations.title')}</Text>
    </View>
    <ScrollView contentContainerClassName="gap-4 px-4 pb-8">
      <Text className="font-sans text-base text-muted">{t('destinations.intro')}</Text>
      {listDestinations().map(destination => <Card key={destination.id} className="gap-3 p-4 shadow-none">
        <Text className="font-sans text-xs text-muted">{destination.id}{!destination.verifiedName ? ` · ${t('destinations.provisional')}` : ''}</Text>
        <Button variant="secondary" className="justify-start" accessibilityLabel={destinationName(destination)} onPress={() => router.navigate({ pathname: '/destinations/[destinationId]', params: { destinationId: destination.id } })}>
          <Button.Label className="shrink text-left">{destinationName(destination)}</Button.Label>
        </Button>
      </Card>)}
    </ScrollView>
  </StyledSafeAreaView>;
}
