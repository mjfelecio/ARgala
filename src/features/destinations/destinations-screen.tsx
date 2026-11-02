import { PassportSummary } from '@/features/journal/passport-summary';
import { ContentUpdates } from '@/features/destination-content/updates';
import { useQueryClient } from '@tanstack/react-query';
import { setFeaturedSelection } from './map-selection';
import { router } from 'expo-router';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { withUniwind } from 'uniwind';
import { useTranslation } from 'react-i18next';
import { Button } from 'heroui-native/button';
import { useThemeColor } from 'heroui-native/hooks';
import Ionicons from '@expo/vector-icons/Ionicons';
import { destinationIds, destinationName, listFeaturedDestinations } from './catalog';

const StyledSafeAreaView = withUniwind(SafeAreaView);
export default function DestinationsScreen() {
  const { t } = useTranslation();
  const client = useQueryClient();
  const accent = useThemeColor('accent');
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
      {listFeaturedDestinations().map(destination => <Button key={destination.id} variant="ghost" className="h-auto min-h-16! justify-start gap-3 rounded-card! bg-surface! p-4"
        accessibilityLabel={destinationName(destination)} accessibilityHint={!destination.verifiedName ? t('destinations.provisional') : undefined} onPress={() => {
          if (destination.center) { setFeaturedSelection(client, destination.id); router.navigate({ pathname: '/', params: { featuredDestinationId: destination.id } }); }
          else router.navigate({ pathname: '/destinations/[destinationId]', params: { destinationId: destination.id } });
        }}>
        <View className="size-12 items-center justify-center rounded-pill bg-mint" accessible={false}>
          <Ionicons name="location-outline" size={24} color={accent} />
        </View>
        <View className="min-w-0 flex-1 gap-1">
          <Text className="font-sans text-card font-ui-semibold text-brand-strong">{destinationName(destination)}</Text>
          <View className="flex-row flex-wrap gap-x-2 gap-y-1">
            <Text className="font-sans text-xs text-muted">{destination.id}</Text>
            {!destination.verifiedName && <Text className="shrink font-sans text-xs text-muted">{t('destinations.provisional')}</Text>}
          </View>
        </View>
        <Ionicons name="chevron-forward" size={20} color={accent} accessible={false} />
      </Button>)}
      <ContentUpdates />
    </ScrollView>
  </StyledSafeAreaView>;
}
