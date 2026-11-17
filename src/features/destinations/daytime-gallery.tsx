import Ionicons from '@expo/vector-icons/Ionicons';
import { useThemeColor } from 'heroui-native/hooks';
import { useState, type ReactNode } from 'react';
import { Image, Pressable, ScrollView, Text, View, useWindowDimensions } from 'react-native';
import { withUniwind } from 'uniwind';
import { useTranslation } from 'react-i18next';
import { useSettings } from '@/features/settings/provider';
import { localizedContent, type DestinationMedia } from './catalog';
import { DestinationPhotoViewer } from './destination-photo-viewer';

const StyledImage = withUniwind(Image);
export { DestinationPhotoViewer } from './destination-photo-viewer';
/** Bundled photography only. Keeping the strip mounted preserves its native scroll position. */
export function DaytimeGallery({ media, variant = 'page', children }: {
  media: readonly DestinationMedia[];
  variant?: 'page' | 'sheet';
  children?: ReactNode;
}) {
  const { t } = useTranslation();
  const accent = useThemeColor('accent');
  const { language } = useSettings();
  const { width } = useWindowDimensions();
  const cardWidth = Math.max(160, Math.min(width - (variant === 'sheet' ? 64 : 48), 440));
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [failed, setFailed] = useState<ReadonlySet<string>>(() => new Set());
  return <View className="gap-3">
    <View className="gap-1">
      <Text accessibilityRole="header" className="font-sans text-section font-ui-semibold text-brand-strong">{t('destinations.daytime')}</Text>
      <Text className="font-sans text-sm text-muted">{t('destinationCleanup.photoCount', { count: media.length })}</Text>
      <Text className="font-sans text-xs text-muted">{t('destinations.notLive')}</Text>
    </View>
    {children}
    {media.length ? <ScrollView testID="destination-photo-strip" horizontal contentContainerClassName="gap-3" showsHorizontalScrollIndicator={false}>
      {media.map(item => {
        const alt = localizedContent(item.alt, language)!;
        const caption = localizedContent(item.caption, language);
        return <Pressable key={item.id} accessibilityRole="button" accessibilityLabel={alt.value}
          accessibilityHint={[caption?.value, item.credit, (alt.englishFallback || caption?.englishFallback) && t('destinations.englishFallback')].filter(Boolean).join('. ')}
          className="overflow-hidden rounded-xl bg-mint active:opacity-80" style={{ width: cardWidth, height: cardWidth * 0.66 }}
          onPress={() => setSelectedId(item.id)}>
          {failed.has(item.id) ? <View className="flex-1 items-center justify-center gap-3 p-4">
            <Ionicons name="images-outline" size={28} color={accent} accessible={false} />
            <Text className="text-center font-sans text-sm text-muted">{t('destinations.imageFailed')}</Text>
          </View> : <StyledImage source={item.source} accessible={false} className="h-full w-full" resizeMode="cover"
            onError={() => setFailed(previous => new Set([...previous, item.id]))} />}
        </Pressable>;
      })}
    </ScrollView> : <View testID="destination-media-fallback" className="min-h-48 items-center justify-center gap-3 rounded-xl bg-mint p-6">
      <Ionicons name="images-outline" size={28} color={accent} accessible={false} />
      <Text className="text-center font-sans text-base text-muted">{t('destinations.previewMissing')}</Text>
    </View>}
    {selectedId && <DestinationPhotoViewer key={selectedId} media={media} initialId={selectedId} onClose={() => setSelectedId(null)} />}
  </View>;
}
