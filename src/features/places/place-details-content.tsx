import { useState, type ReactNode } from 'react';
import { Image, Text, View, type ImageSourcePropType } from 'react-native';
import { withUniwind } from 'uniwind';
import { useTranslation } from 'react-i18next';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Button } from 'heroui-native/button';
import { useThemeColor } from 'heroui-native/hooks';
import googleMapsAttribution from '../../../assets/attribution/google-maps.png';
import { ProviderAttributions, useOpenProviderLink } from '@/features/map/attributions';
import type { Place } from './service';

const StyledImage = withUniwind(Image);
/** Presentation-only slot for future approved content; never inferred from Places. */
export type ApprovedPlaceImage = { source: ImageSourcePropType; accessibilityLabel: string; credit: string };
export function PlaceDetailsContent({ place, approvedImage, actions }: { place: Place; approvedImage?: ApprovedPlaceImage; actions?: ReactNode }) {
  const { t } = useTranslation();
  const color = useThemeColor('accent');
  const open = useOpenProviderLink();
  const [failedImage, setFailedImage] = useState<ImageSourcePropType | null>(null);
  const image = approvedImage && failedImage !== approvedImage.source ? approvedImage : null;
  return <View className="gap-6">
    {image ? <View className="gap-2">
      <StyledImage source={image.source} accessibilityLabel={image.accessibilityLabel} className="h-64 w-full rounded-card" resizeMode="cover" onError={() => setFailedImage(image.source)} />
      <Text className="font-sans text-xs text-muted">{image.credit}</Text>
    </View> : null}
    <View className="gap-3">
      <View testID={image ? undefined : 'place-media-fallback'} className="flex-row items-start gap-3">
        {!image && <View className="pt-2"><Ionicons name="location-outline" size={24} color={color} accessible={false} /></View>}
        <Text selectable accessibilityRole="header" className="min-w-0 flex-1 font-sans text-hero font-bold text-foreground">{place.name}</Text>
      </View>
      <Text className="font-sans text-sm text-muted">{t('placeDetails.distanceUnavailable')}</Text>
    </View>
    {actions}
    {place.description?.trim() && <View className="gap-2">
      <Heading>{t('placeDetails.overview')}</Heading>
      <Text selectable className="font-sans text-base text-muted">{place.description}</Text>
    </View>}
    <View className="gap-4 border-t border-outline pt-5">
      <Heading>{t('placeDetails.essentials')}</Heading>
      <View className="gap-5">
        {place.address?.trim() && <DataRow icon="location-outline" label={t('placeDetails.address')}>{place.address}</DataRow>}
        <DataRow icon="compass-outline" label={t('placeDetails.coordinates')}>{t('placeDetails.coordinateValue', { latitude: place.coordinates.latitude.toFixed(5), longitude: place.coordinates.longitude.toFixed(5) })}</DataRow>
      </View>
    </View>
    <View className="gap-3 border-t border-outline pt-5">
      <Heading>{t('placeDetails.source')}</Heading>
      {place.provider === 'google' && <StyledImage source={googleMapsAttribution} accessibilityLabel="Google Maps" className="h-[18px] w-[98px]" resizeMode="contain" />}
      <ProviderAttributions places={[place]} />
      {place.mapsUri && <Button variant="outline" accessibilityLabel={t('map.openGoogle')} onPress={() => open(place.mapsUri!)}><Button.Label>{t('map.openGoogle')}</Button.Label></Button>}
    </View>
  </View>;
}
function Heading({ children }: { children: ReactNode }) {
  return <Text accessibilityRole="header" className="font-sans text-section font-semibold text-foreground">{children}</Text>;
}
function DataRow({ icon, label, children }: { icon: React.ComponentProps<typeof Ionicons>['name']; label: string; children: ReactNode }) {
  const color = useThemeColor('accent');
  return <View className="flex-row items-start gap-3">
    <View className="pt-1"><Ionicons name={icon} size={20} color={color} /></View>
    <View className="flex-1 gap-1"><Text className="font-sans text-xs font-medium text-muted">{label}</Text><Text selectable className="font-sans text-base text-foreground">{children}</Text></View>
  </View>;
}
