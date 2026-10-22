import { useQuery, useQueryClient } from '@tanstack/react-query';
import { router, useIsFocused, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useThemeColor } from 'heroui-native/hooks';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { withUniwind } from 'uniwind';
import { useTranslation } from 'react-i18next';
import { Button } from 'heroui-native/button';
import { Spinner } from 'heroui-native/spinner';
import { useSettings } from '@/features/settings/provider';
import { useAppActive } from '@/lib/use-app-active';
import { edgeErrorMessageKey } from '@/lib/edge-error';
import { detailsRequestSchema } from '../../../supabase/functions/_shared/contracts';
import { createRoutePreviewIntent } from '@/features/directions/route-preview-intent';
import { placeSelectionOptions, setPlaceSelection } from './selection';
import { availablePlaceDetails, placeDetailsOptions } from './details-cache';
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
  const options = placeDetailsOptions(client, providerId, language);
  // Neither observer can spend provider quota on mount, focus or invalidation.
  const details = useQuery({ ...options, enabled: false });
  const full = availablePlaceDetails(client, providerId, language);
  const place = full ?? (selection.data?.providerId === providerId ? selection.data : null);
  const canLoad = !!providerId && !full;
  const [requestedKey, setRequestedKey] = useState<string | null>(null);
  const requestKey = `${providerId}:${language}`;
  function load() {
    if (!canLoad || !active || !focused || details.isFetching) return;
    setRequestedKey(requestKey);
    void client.fetchQuery(options).catch(() => {});
  }
  function navigateTo(pathname: '/' | '/ar') {
    if (!place || !active || !focused || navigating.current) return;
    navigating.current = true;
    setPlaceSelection(client, place, full ? language : undefined, options.initialDataUpdatedAt);
    // Pop the details page back to the existing tab navigator, selecting its
    // destination tab. This also handles a direct link without duplicating tabs.
    router.dismissTo({ pathname, params: { placeId: place.providerId } });
  }
  function directions() {
    if (!place || !active || !focused || navigating.current) return;
    navigating.current = true;
    const token = createRoutePreviewIntent(client, place, undefined, 'details', language);
    router.push({ pathname: '/directions', params: { token } });
  }
  const recovery = <>
    {details.isFetching && <View accessibilityLiveRegion="polite" className="flex-row items-center gap-2"><Spinner size="sm" /><Text className="shrink font-sans text-sm text-muted">{t('placeDetails.loading')}</Text></View>}
    {details.error && !full && <Text accessibilityLiveRegion="polite" className="font-sans text-sm text-danger">{t(edgeErrorMessageKey(details.error))}</Text>}
    {requestedKey === requestKey && full && !details.isFetching && <Text accessibilityLiveRegion="polite" className="font-sans text-sm text-muted">{t('placeDetails.loaded')}</Text>}
    {canLoad && <Button variant="outline" accessibilityLabel={t('placeDetails.load')} onPress={load} isDisabled={details.isFetching || !active || !focused} accessibilityState={{ busy: details.isFetching }}><Button.Label>{t('placeDetails.load')}</Button.Label></Button>}
  </>;
  const actions = <View className="gap-2">
    <Button accessibilityLabel={t('placeDetails.directions')} onPress={directions}>
      <Ionicons name="navigate-outline" size={24} color={onAccent} /><Button.Label>{t('placeDetails.directions')}</Button.Label>
    </Button>
    <View className="flex-row flex-wrap gap-2">
      <Button variant="ghost" className="min-w-32 grow shrink" accessibilityLabel={t('placeDetails.map')} onPress={() => navigateTo('/')}>
        <Ionicons name="map-outline" size={24} color={accent} /><Button.Label>{t('placeDetails.map')}</Button.Label>
      </Button>
      <Button variant="ghost" className="min-w-32 grow shrink" accessibilityLabel={t('placeDetails.ar')} onPress={() => navigateTo('/ar')}>
        <Ionicons name="scan-outline" size={24} color={accent} /><Button.Label>{t('placeDetails.ar')}</Button.Label>
      </Button>
    </View>
    {recovery}
  </View>;
  return <StyledSafeAreaView className="flex-1 bg-surface" edges={['top', 'bottom', 'left', 'right']}>
    <View className="flex-row items-center gap-3 px-4 py-3">
      <Button isIconOnly variant="ghost" className="size-12" accessibilityLabel={t('placeDetails.back')} onPress={() => { if (router.canGoBack()) router.back(); else router.navigate('/'); }}><Ionicons name="arrow-back" size={24} color={accent} /></Button>
      <Text accessibilityRole="header" className="shrink font-sans text-section font-semibold text-foreground">{t('placeDetails.title')}</Text>
    </View>
    <ScrollView className="flex-1" contentContainerClassName="grow gap-4 px-4 pb-8">
      {place ? <PlaceDetailsContent place={place} actions={actions} />
        : <>{!details.isFetching && <Text className="font-sans text-base text-muted">{t('placeDetails.unavailable')}</Text>}{recovery}</>}
    </ScrollView>
  </StyledSafeAreaView>;
}
