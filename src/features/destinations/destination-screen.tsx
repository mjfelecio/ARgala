import Ionicons from '@expo/vector-icons/Ionicons';
import { useThemeColor } from 'heroui-native/hooks';
import { useDestinationLookup } from '@/features/destination-content/context';
import { approvedArContent } from './ar-content';
import { router, useIsFocused, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { withUniwind, useCSSVariable } from 'uniwind';
import { useTranslation } from 'react-i18next';
import { Button } from 'heroui-native/button';
import { useSettings } from '@/features/settings/provider';
import { useAppActive } from '@/lib/use-app-active';
import { createRoutePreviewIntent } from '@/features/directions/route-preview-intent';
import { destinationName, getDestination } from './catalog';
import { DaytimeGallery } from './daytime-gallery';
import { NearbyEstablishments } from './nearby-establishments';
import { destinationToRoutePlace } from './routing';
import { DestinationReminderAction } from '@/features/arrival-reminders/components';

const StyledSafeAreaView = withUniwind(SafeAreaView);
export default function DestinationScreen() {
  const { destinationId } = useLocalSearchParams();
  const { t } = useTranslation();
  const { language } = useSettings();
  const [accent, onAccent] = useThemeColor(['accent', 'accent-foreground']);
  const warning = useCSSVariable('--color-warning-foreground') as string;
  const client = useQueryClient();
  const active = useAppActive(); const focused = useIsFocused();
  const navigating = useRef(false);
  const destination = getDestination(destinationId);
  const lookupContent = useDestinationLookup();
  const storyDestination = lookupContent(destinationId);
  useEffect(() => { if (focused) navigating.current = false; }, [focused, destination?.id]);
  const routePlace = destination ? destinationToRoutePlace(destination) : null;
  function directions() {
    if (!routePlace || !active || !focused || navigating.current) return;
    navigating.current = true;
    const token = createRoutePreviewIntent(client, routePlace, undefined, 'details', language, destination?.id);
    router.push({ pathname: '/directions', params: { token } });
  }
  return <StyledSafeAreaView className="flex-1 bg-page" edges={['top', 'bottom', 'left', 'right']}>
    <View className="flex-row items-center gap-3 px-4 py-3">
      <Button isIconOnly variant="ghost" accessibilityLabel={t('placeDetails.back')} onPress={() => { if (router.canGoBack()) router.back(); else router.navigate('/destinations'); }}><Ionicons name="arrow-back" size={24} color={accent} accessible={false} /></Button>
      <Text accessibilityRole="header" className="shrink font-sans text-section font-ui-semibold text-brand-strong">{t('destinations.title')}</Text>
    </View>
    <ScrollView contentContainerClassName="gap-5 px-4 pb-8">
      {destination ? <>
        <View className="gap-3">
          <Text selectable accessibilityRole="header" className="font-sans text-hero font-ui-bold text-brand-strong">{destinationName(destination)}</Text>
          {!destination.verifiedName && <View className="flex-row items-center gap-2 self-start rounded-pill bg-warning-surface px-3 py-2">
            <Ionicons name="time-outline" size={20} color={warning} accessible={false} /><Text className="shrink font-sans text-sm text-warning-foreground">{t('destinations.provisional')}</Text>
          </View>}
          <Text className="font-sans text-base text-brand-strong">{t('arrival.teaser')}</Text>
        </View>
        <DaytimeGallery key={`gallery:${destination.id}`} media={destination.media ?? []} />
        <View testID="destination-information" className="gap-4">
          <View className="flex-row flex-wrap gap-3">
            <View className="min-w-40 flex-1 gap-2 rounded-card bg-surface p-4">
              <Ionicons name="book-outline" size={28} color={accent} accessible={false} />
              <Text accessibilityRole="header" className="font-sans text-card font-ui-bold text-brand-strong">{t('destinations.storiesHeading')}</Text>
              <Text className="font-sans text-sm text-muted">{t(approvedArContent(storyDestination, language).length ? 'destinations.storiesOnSite' : 'destinations.storiesPending')}</Text>
            </View>
            <View className="min-w-40 flex-1 gap-2 rounded-card bg-surface p-4">
              <Ionicons name="location-outline" size={28} color={accent} accessible={false} />
              <Text accessibilityRole="header" className="font-sans text-card font-ui-bold text-brand-strong">{t('destinations.visitForAr')}</Text>
              <Text className="font-sans text-sm text-muted">{t('destinations.arrivalRequired')}</Text>
            </View>
          </View>
          <View className="flex-row items-start gap-3 rounded-card bg-mint p-4">
            <Ionicons name="information-circle-outline" size={24} color={accent} accessible={false} /><Text className="min-w-0 flex-1 font-sans text-sm text-brand-strong">{t('destinations.contentPending')}</Text>
          </View>
        </View>
        <DestinationReminderAction destination={destination} />
        <Button isDisabled={!routePlace || !active || !focused} accessibilityLabel={t('placeDetails.directions')} onPress={directions}><Ionicons name="navigate-outline" size={22} color={onAccent} accessible={false} /><Button.Label>{t('placeDetails.directions')}</Button.Label></Button>
        {!routePlace && <Text className="font-sans text-sm text-muted">{t('destinations.entranceMissing')}</Text>}
        <NearbyEstablishments key={`nearby:${destination.id}`} destination={destination} />
      </> : <Text className="font-sans text-base text-muted">{t('destinations.unavailable')}</Text>}
    </ScrollView>
  </StyledSafeAreaView>;
}
