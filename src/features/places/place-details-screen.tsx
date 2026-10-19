import { useQuery, useQueryClient } from '@tanstack/react-query';
import { router, useIsFocused, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef } from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useThemeColor } from 'heroui-native/hooks';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { withUniwind } from 'uniwind';
import { useTranslation } from 'react-i18next';
import { Button } from 'heroui-native/button';
import { Spinner } from 'heroui-native/spinner';
import { AR } from '@/config/limits';
import { useSettings } from '@/features/settings/provider';
import { useAppActive } from '@/lib/use-app-active';
import { edgeErrorMessageKey } from '@/lib/edge-error';
import { detailsRequestSchema } from '../../../supabase/functions/_shared/contracts';
import { createRoutePreviewIntent } from '@/features/directions/route-preview-intent';
import { placeSelectionOptions } from './selection';
import { placesService } from './service';
import { PlaceDetailsContent } from './place-details-content';

const StyledSafeAreaView = withUniwind(SafeAreaView);
export default function PlaceDetailsScreen() {
  const { t } = useTranslation();
  const { language } = useSettings();
  const params = useLocalSearchParams();
  const parsed = detailsRequestSchema.safeParse({ providerId: params.providerId, language });
  const providerId = parsed.success ? parsed.data.providerId : null;
  const client = useQueryClient();
  const active = useAppActive();
  const focused = useIsFocused();
  const navigating = useRef(false);
  useEffect(() => { if (focused) navigating.current = false; }, [focused]);
  const [onAccent, accent] = useThemeColor(['accent-foreground', 'accent']);
  const selection = useQuery(placeSelectionOptions(providerId));
  const options = { queryKey: ['place-details', providerId, language],
    queryFn: () => placesService.details(providerId!, language), gcTime: AR.nearbyReuseMs };
  // Neither observer can spend provider quota on mount, focus or invalidation.
  const details = useQuery({ ...options, enabled: false });
  const full = details.data?.providerId === providerId ? details.data : null;
  const place = full ?? (selection.data?.providerId === providerId ? selection.data : null);
  const canLoad = !!providerId && !full;
  function load() {
    if (!canLoad || !active || !focused || details.isFetching) return;
    void client.fetchQuery(options).catch(() => {});
  }
  function navigateTo(pathname: '/' | '/ar') {
    if (!place || !active || !focused || navigating.current) return;
    navigating.current = true;
    client.setQueryData(placeSelectionOptions(place.providerId).queryKey, place);
    // Pop the details page back to the existing tab navigator, selecting its
    // destination tab. This also handles a direct link without duplicating tabs.
    router.dismissTo({ pathname, params: { placeId: place.providerId } });
  }
  function directions() {
    if (!place || !active || !focused || navigating.current) return;
    navigating.current = true;
    const token = createRoutePreviewIntent(client, place);
    router.push({ pathname: '/directions', params: { token } });
  }
  const actions = <View className="gap-2">
    <Button size="lg" accessibilityLabel={t('placeDetails.directions')} onPress={directions}>
      <Ionicons name="navigate-outline" size={24} color={onAccent} /><Button.Label>{t('placeDetails.directions')}</Button.Label>
    </Button>
    <View className="flex-row flex-wrap gap-2">
      <Button variant="secondary" className="min-w-40 grow shrink" accessibilityLabel={t('placeDetails.map')} onPress={() => navigateTo('/')}>
        <Ionicons name="map-outline" size={24} color={accent} /><Button.Label>{t('placeDetails.map')}</Button.Label>
      </Button>
      <Button variant="secondary" className="min-w-40 grow shrink" accessibilityLabel={t('placeDetails.ar')} onPress={() => navigateTo('/ar')}>
        <Ionicons name="scan-outline" size={24} color={accent} /><Button.Label>{t('placeDetails.ar')}</Button.Label>
      </Button>
    </View>
  </View>;
  return <StyledSafeAreaView className="flex-1 bg-page-mint" edges={['top', 'bottom', 'left', 'right']}>
    <View className="flex-row items-center gap-3 px-4 py-3">
      <Button variant="secondary" accessibilityLabel={t('placeDetails.back')} onPress={() => { if (router.canGoBack()) router.back(); else router.navigate('/'); }}><Button.Label>{t('placeDetails.back')}</Button.Label></Button>
      <Text accessibilityRole="header" className="shrink font-sans text-section font-semibold text-foreground">{t('placeDetails.title')}</Text>
    </View>
    <ScrollView className="flex-1" contentContainerClassName="grow gap-4 px-4 pb-8">
      {place ? <PlaceDetailsContent place={place} actions={actions} />
        : !details.isFetching && <Text className="font-sans text-base text-muted">{t('placeDetails.unavailable')}</Text>}
      {details.isFetching && <View accessibilityLiveRegion="polite" className="gap-2"><Spinner /><Text className="font-sans text-sm text-muted">{t('placeDetails.loading')}</Text></View>}
      {details.error && <Text accessibilityLiveRegion="polite" className="font-sans text-sm text-danger">{t(edgeErrorMessageKey(details.error))}</Text>}
      {canLoad && <Button variant="outline" accessibilityLabel={t('placeDetails.load')} onPress={load} isDisabled={details.isFetching || !active || !focused} accessibilityState={{ busy: details.isFetching }}><Button.Label>{t('placeDetails.load')}</Button.Label></Button>}
    </ScrollView>
  </StyledSafeAreaView>;
}
