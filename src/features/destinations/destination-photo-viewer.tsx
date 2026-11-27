import Ionicons from '@expo/vector-icons/Ionicons';
import { Button } from 'heroui-native/button';
import { StatusBar } from 'expo-status-bar';
import { useThemeColor } from 'heroui-native/hooks';
import { useEffect, useRef, useState } from 'react';
import { Image, Modal, ScrollView, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { withUniwind } from 'uniwind';
import { useOpenProviderLink } from '@/features/map/attributions';
import { useSettings } from '@/features/settings/provider';
import { localizedContent, type DestinationMedia } from './catalog';

const StyledImage = withUniwind(Image);
const StyledSafeAreaView = withUniwind(SafeAreaView);

/** Session-only photo browsing. It owns no chapter, Passport or admission state. */
export function DestinationPhotoViewer({ media, initialId, onClose, creditDetails }: {
  media: readonly DestinationMedia[];
  initialId: string;
  onClose(): void;
  creditDetails?: { scope: string; locator: string; license?: { label: string; url: string } };
}) {
  const { t } = useTranslation();
  const openLink = useOpenProviderLink();
  const { language } = useSettings();
  const accent = useThemeColor('accent');
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [pageWidth, setPageWidth] = useState(width - insets.left - insets.right);
  const [selectedId, setSelectedId] = useState(initialId);
  const [failed, setFailed] = useState<ReadonlySet<string>>(() => new Set());
  const pages = useRef<ScrollView>(null);
  const index = Math.max(0, media.findIndex(item => item.id === selectedId));
  const selected = media[index];
  const hasNonPhotoMedia = media.some(item => item.kind);
  const caption = selected ? localizedContent(selected.caption, language) : null;
  const alt = selected ? localizedContent(selected.alt, language) : null;
  useEffect(() => { pages.current?.scrollTo({ x: index * pageWidth, animated: false }); }, [index, pageWidth]);
  if (!selected) return null;
  function move(offset: number) {
    const item = media[index + offset];
    if (item) setSelectedId(item.id);
  }
  return <Modal visible presentationStyle="fullScreen" onRequestClose={onClose}>
    <StatusBar style="light" />
    <StyledSafeAreaView className="flex-1 bg-ink" edges={['top', 'bottom', 'left', 'right']}>
      <View className="min-h-0 flex-1" onLayout={event => {
        const next = event.nativeEvent.layout.width;
        if (next > 0) setPageWidth(next);
      }}>
        <ScrollView ref={pages} testID="destination-photo-pages" horizontal pagingEnabled className="flex-1"
          showsHorizontalScrollIndicator={false} contentOffset={{ x: index * pageWidth, y: 0 }}
          onMomentumScrollEnd={event => {
            const next = Math.round(event.nativeEvent.contentOffset.x / pageWidth);
            if (media[next]) setSelectedId(media[next].id);
          }}>
          {media.map((item, itemIndex) => <View key={item.id} className="h-full items-center justify-center"
            style={{ width: pageWidth }} accessibilityElementsHidden={itemIndex !== index}
            importantForAccessibility={itemIndex === index ? 'auto' : 'no-hide-descendants'}>
            {Math.abs(itemIndex - index) <= 1 && (failed.has(item.id) ? <View className="items-center gap-3 p-4">
              <Ionicons name="images-outline" size={32} color={accent} accessible={false} />
              <Text className="font-sans text-base text-white/80">{t('destinations.imageFailed')}</Text>
              <Button variant="secondary" accessibilityLabel={t('common.retry')} onPress={() => setFailed(previous => {
                const next = new Set(previous); next.delete(item.id); return next;
              })}><Button.Label>{t('common.retry')}</Button.Label></Button>
            </View> : <StyledImage testID={`viewer-photo:${item.id}`} source={item.source}
              className="h-full w-full" resizeMode="contain" accessibilityLabel={localizedContent(item.alt, language)!.value}
              onError={() => setFailed(previous => new Set([...previous, item.id]))} />)}
          </View>)}
        </ScrollView>
      </View>
      <ScrollView key={selected.id} testID="destination-photo-caption" className="shrink-0"
        style={{ maxHeight: height * 0.28 }} contentContainerClassName="gap-2 px-4 pt-3 pb-2">
        <Text accessibilityLiveRegion="polite" className="font-sans text-sm text-white/80">{t(hasNonPhotoMedia ? 'destinations.imagePosition' : 'destinationCleanup.photoPosition', { current: index + 1, total: media.length })}</Text>
        {caption && <Text selectable className="font-sans text-base text-white">{caption.value}</Text>}
        {(caption?.englishFallback || alt?.englishFallback) && <Text className="font-sans text-xs text-white/80">{t('destinations.englishFallback')}</Text>}
        <Text selectable className="font-sans text-sm text-white/80">{selected.credit}</Text>
        {selected.kind && <Button variant="secondary" accessibilityRole="link" className="h-auto min-h-12 self-start py-3"
          accessibilityLabel={t('destinations.openImageSource')} onPress={() => openLink(selected.rightsReference)}>
          <Button.Label className="shrink">{t('destinations.openImageSource')}</Button.Label>
        </Button>}
        {creditDetails && <>
          <Text selectable className="font-sans text-sm text-white/80">{creditDetails.locator}</Text>
          <Text className="font-sans text-sm text-white/80">{creditDetails.scope}</Text>
          {creditDetails.license && <Button variant="secondary" accessibilityRole="link" className="h-auto min-h-12 self-start py-3"
            accessibilityLabel={creditDetails.license.label} onPress={() => openLink(creditDetails.license!.url)}>
            <Button.Label className="shrink">{creditDetails.license.label}</Button.Label>
          </Button>}
        </>}
      </ScrollView>
      <View testID="destination-photo-controls" className="flex-row items-center justify-between gap-3 px-4 py-3">
        <Button isIconOnly variant="secondary" isDisabled={index === 0} accessibilityLabel={t(hasNonPhotoMedia ? 'destinations.previousImage' : 'destinationCleanup.previousPhoto')} onPress={() => move(-1)}>
          <Ionicons name="chevron-back" size={24} color={accent} accessible={false} />
        </Button>
        <Button variant="secondary" className="min-w-0 flex-1" accessibilityLabel={t('common.close')} onPress={onClose}><Button.Label>{t('common.close')}</Button.Label></Button>
        <Button isIconOnly variant="secondary" isDisabled={index === media.length - 1} accessibilityLabel={t(hasNonPhotoMedia ? 'destinations.nextImage' : 'destinationCleanup.nextPhoto')} onPress={() => move(1)}>
          <Ionicons name="chevron-forward" size={24} color={accent} accessible={false} />
        </Button>
      </View>
    </StyledSafeAreaView>
  </Modal>;
}
