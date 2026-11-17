import { PassportSummary } from '@/features/journal/passport-summary';
import { ContentUpdates } from '@/features/destination-content/updates';
import { useQueryClient } from '@tanstack/react-query';
import { setFeaturedSelection } from './map-selection';
import { router } from 'expo-router';
import { useState } from 'react';
import { Image, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCSSVariable, withUniwind } from 'uniwind';
import { useTranslation } from 'react-i18next';
import { Button } from 'heroui-native/button';
import { useThemeColor } from 'heroui-native/hooks';
import Ionicons from '@expo/vector-icons/Ionicons';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { destinationIds, destinationName, listFeaturedDestinations, localizedContent, type Destination } from './catalog';
import { DestinationPhotoViewer } from './destination-photo-viewer';
import { useSettings } from '@/features/settings/provider';

const StyledSafeAreaView = withUniwind(SafeAreaView);
const StyledImage = withUniwind(Image);
export default function DestinationsScreen() {
  const { t } = useTranslation();
  const { language } = useSettings();
  const client = useQueryClient();
  const accent = useThemeColor('accent');
  const forest = useCSSVariable('--color-brand-strong') as string;
  const [viewing, setViewing] = useState<{ destination: Destination; initialId: string } | null>(null);
  const [failed, setFailed] = useState<ReadonlySet<string>>(() => new Set());
  function choose(destination: Destination) {
    if (destination.center) { setFeaturedSelection(client, destination.id); router.navigate({ pathname: '/', params: { featuredDestinationId: destination.id } }); }
    else router.navigate({ pathname: '/destinations/[destinationId]', params: { destinationId: destination.id } });
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
          accessibilityLabel={name} onPress={() => choose(destination)}>
          <View className="size-12 items-center justify-center rounded-pill bg-mint" accessible={false}><Ionicons name="location-outline" size={24} color={accent} /></View>
          <View className="min-w-0 flex-1 gap-1"><Text className="font-sans text-card font-ui-semibold text-brand-strong">{name}</Text></View>
          <Ionicons name="chevron-forward" size={20} color={accent} accessible={false} />
        </Button>;
        const caption = localizedContent(cover.caption, language);
        return <View key={destination.id} testID={`featured-photo-card:${destination.id}`} className="relative overflow-hidden rounded-card bg-brand-strong">
          {!failed.has(cover.id) && <StyledImage source={cover.source} accessible={false} className="absolute inset-0 h-full w-full" resizeMode="cover"
            onError={() => setFailed(previous => new Set([...previous, cover.id]))} />}
          <Svg pointerEvents="none" accessible={false} width="100%" height="100%" style={{ position: 'absolute' }}>
            <Defs><LinearGradient id={`featured-fade-${destination.id}`} x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={forest} stopOpacity="0" />
              <Stop offset="0.35" stopColor={forest} stopOpacity="0" />
              <Stop offset="0.6" stopColor={forest} stopOpacity="0.3" />
              <Stop offset="0.8" stopColor={forest} stopOpacity="0.85" />
              <Stop offset="1" stopColor={forest} stopOpacity="1" />
            </LinearGradient></Defs>
            <Rect width="100%" height="100%" fill={`url(#featured-fade-${destination.id})`} />
          </Svg>
          <Pressable className="min-h-56 active:opacity-80" accessibilityRole="button" accessibilityLabel={t('destinationCleanup.viewPhoto', { name })}
            accessibilityHint={[localizedContent(cover.alt, language)!.value, caption?.value, cover.credit].filter(Boolean).join('. ')}
            onPress={() => setViewing({ destination, initialId: cover.id })}>
            {failed.has(cover.id) && <View className="min-h-56 items-center justify-center gap-2 p-4">
              <Ionicons name="images-outline" size={32} color={accent} accessible={false} /><Text className="font-sans text-sm text-white">{t('destinations.imageFailed')}</Text>
            </View>}
          </Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel={name} onPress={() => choose(destination)}
            className="min-h-24 flex-row items-center gap-4 p-5 active:bg-brand-strong/80">
            <Text className="min-w-0 flex-1 font-sans text-section font-ui-semibold text-white">{name}</Text>
            <Ionicons name="chevron-forward" size={24} color="white" accessible={false} />
          </Pressable>
        </View>;
      })}
      <ContentUpdates />
    </ScrollView>
    {viewing && <DestinationPhotoViewer media={viewing.destination.media!} initialId={viewing.initialId} onClose={() => setViewing(null)} />}
  </StyledSafeAreaView>;
}
