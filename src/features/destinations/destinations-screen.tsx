import { PassportSummary } from '@/features/journal/passport-summary';
import { ContentUpdates } from '@/features/destination-content/updates';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { withUniwind } from 'uniwind';
import { useTranslation } from 'react-i18next';
import { Button } from 'heroui-native/button';
import { useThemeColor } from 'heroui-native/hooks';
import Ionicons from '@expo/vector-icons/Ionicons';
import { DestinationPhotoCard } from './destination-photo-card';
import { destinationIds, destinationName, listFeaturedDestinations, type FeaturedDestinationId } from './catalog';
import { useSettings } from '@/features/settings/provider';

const StyledSafeAreaView = withUniwind(SafeAreaView);
export default function DestinationsScreen() {
  const { t } = useTranslation();
  const { language } = useSettings();
  const accent = useThemeColor('accent');
  const [failed, setFailed] = useState<ReadonlySet<string>>(() => new Set());
  function openDestination(destinationId: FeaturedDestinationId) {
    router.navigate({ pathname: '/destinations/[destinationId]', params: { destinationId } });
  }
  return <StyledSafeAreaView className="flex-1 bg-page" edges={['top', 'bottom', 'left', 'right']}>
    <View className="flex-row items-center gap-3 px-4 py-3">
      <Button isIconOnly variant="ghost" accessibilityLabel={t('placeDetails.back')} onPress={() => { if (router.canGoBack()) router.back(); else router.navigate('/'); }}><Ionicons name="arrow-back" size={24} color={accent} accessible={false} /></Button>
      <Text accessibilityRole="header" className="shrink font-sans text-section font-ui-semibold text-brand-strong">{t('destinations.title')}</Text>
    </View>
    <ScrollView className="flex-1" contentContainerClassName="gap-4 px-4 pb-8">
      <PassportSummary/>
      <View className="gap-2">
        <Text accessibilityRole="header" className="font-sans text-section font-ui-bold text-brand-strong">{t('destinations.exploreCount', { count: destinationIds.length })}</Text>
        <Text className="font-sans text-sm text-muted">{t('destinations.intro')}</Text>
      </View>
      {listFeaturedDestinations().map(destination => {
        const name = destinationName(destination, language);
        const cover = destination.media?.find(item => item.id === destination.coverMediaId) ?? destination.media?.[0];
        // The separate development pilot has no supplied photography.
        if (!cover) return <Button key={destination.id} variant="ghost" className="h-auto min-h-16! justify-start gap-3 rounded-card! bg-surface! p-4"
          accessibilityLabel={name} onPress={() => openDestination(destination.id)}>
          <View className="size-12 items-center justify-center rounded-pill bg-mint" accessible={false}><Ionicons name="location-outline" size={24} color={accent} /></View>
          <View className="min-w-0 flex-1 gap-1"><Text className="font-sans text-card font-ui-semibold text-brand-strong">{name}</Text></View>
          <Ionicons name="chevron-forward" size={20} color={accent} accessible={false} />
        </Button>;
        return <DestinationPhotoCard key={destination.id} id={`featured-${destination.id}`} testID={`featured-photo-card:${destination.id}`} source={cover.source}
          failed={failed.has(cover.id)} onImageError={() => setFailed(previous => new Set([...previous, cover.id]))}>
          <Pressable accessibilityRole="button" accessibilityLabel={name} onPress={() => openDestination(destination.id)}
            className="justify-end active:opacity-80">
            <View className="min-h-56 items-center justify-center gap-2 p-4">
              {failed.has(cover.id) && <>
                <Ionicons name="images-outline" size={32} color={accent} accessible={false} />
                <Text className="font-sans text-sm text-white">{t('destinations.imageFailed')}</Text>
              </>}
            </View>
            <View className="min-h-24 flex-row items-center gap-4 p-5">
              <Text className="min-w-0 flex-1 font-sans text-section font-ui-semibold text-white">{name}</Text>
              <Ionicons name="chevron-forward" size={24} color="white" accessible={false} />
            </View>
          </Pressable>
        </DestinationPhotoCard>;
      })}
      <ContentUpdates />
    </ScrollView>
  </StyledSafeAreaView>;
}
