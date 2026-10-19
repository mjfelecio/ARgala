import { router, useLocalSearchParams } from 'expo-router';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { withUniwind } from 'uniwind';
import { useTranslation } from 'react-i18next';
import { Button } from 'heroui-native/button';
import { Card } from 'heroui-native/card';
import { useSettings } from '@/features/settings/provider';
import { destinationName, getDestination, localizedContent } from './catalog';
import { DaytimeGallery } from './daytime-gallery';

const StyledSafeAreaView = withUniwind(SafeAreaView);
export default function DestinationScreen() {
  const { destinationId } = useLocalSearchParams();
  const { t } = useTranslation();
  const { language } = useSettings();
  const destination = getDestination(destinationId);
  const overview = localizedContent({ en: destination?.copy?.en?.overview, ko: destination?.copy?.ko?.overview, ja: destination?.copy?.ja?.overview }, language);
  const highlights = localizedContent({ en: destination?.copy?.en?.highlights, ko: destination?.copy?.ko?.highlights, ja: destination?.copy?.ja?.highlights }, language);
  return <StyledSafeAreaView className="flex-1 bg-page-mint" edges={['top', 'bottom', 'left', 'right']}>
    <View className="flex-row items-center gap-3 px-4 py-3">
      <Button variant="secondary" accessibilityLabel={t('placeDetails.back')} onPress={() => { if (router.canGoBack()) router.back(); else router.navigate('/destinations'); }}><Button.Label>{t('placeDetails.back')}</Button.Label></Button>
      <Text accessibilityRole="header" className="shrink font-sans text-section font-semibold text-foreground">{t('destinations.title')}</Text>
    </View>
    <ScrollView contentContainerClassName="gap-5 px-4 pb-8">
      {destination ? <>
        <DaytimeGallery key={destination.id} media={destination.media ?? []}><Card className="gap-3 p-5 shadow-none">
          {!destination.verifiedName && <Text className="font-sans text-xs text-muted">{t('destinations.provisional')}</Text>}
          <Text selectable accessibilityRole="header" className="font-sans text-hero font-bold text-foreground">{destinationName(destination)}</Text>
        </Card></DaytimeGallery>
        <View className="gap-2">
          <Text accessibilityRole="header" className="font-sans text-section font-semibold text-foreground">{t('placeDetails.overview')}</Text>
          <Text selectable className="font-sans text-base text-muted">{overview?.value ?? t('destinations.contentPending')}</Text>
          {overview?.englishFallback && <Text className="font-sans text-xs text-muted">{t('destinations.englishFallback')}</Text>}
        </View>
        {highlights && <Card className="gap-3 p-5 shadow-none">
          <Text accessibilityRole="header" className="font-sans text-section font-semibold text-foreground">{t('destinations.highlights')}</Text>
          {highlights.value.map((highlight, index) => <Text selectable key={index} className="font-sans text-base text-muted">{highlight}</Text>)}
          {highlights.englishFallback && <Text className="font-sans text-xs text-muted">{t('destinations.englishFallback')}</Text>}
        </Card>}
        <Button isDisabled accessibilityLabel={t('placeDetails.directions')}><Button.Label>{t('placeDetails.directions')}</Button.Label></Button>
        <Text className="font-sans text-sm text-muted">{t('destinations.entranceMissing')}</Text>
        <Text className="font-sans text-sm text-muted">{t('destinations.centerMissing')}</Text>
      </> : <Text className="font-sans text-base text-muted">{t('destinations.unavailable')}</Text>}
    </ScrollView>
  </StyledSafeAreaView>;
}
