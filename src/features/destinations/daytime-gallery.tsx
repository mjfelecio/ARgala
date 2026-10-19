import { useState, type ReactNode } from 'react';
import { Image, Modal, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { withUniwind } from 'uniwind';
import { useTranslation } from 'react-i18next';
import { Button } from 'heroui-native/button';
import { useSettings } from '@/features/settings/provider';
import { localizedContent, type DestinationMedia } from './catalog';

const StyledImage = withUniwind(Image);
const StyledSafeAreaView = withUniwind(SafeAreaView);
/** Bundled daytime photos only. No clock, camera, GPS or network ownership. */
export function DaytimeGallery({ media, children }: { media: readonly DestinationMedia[]; children?: ReactNode }) {
  const { t } = useTranslation();
  const { language } = useSettings();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [fullscreen, setFullscreen] = useState(false);
  const [failed, setFailed] = useState<ReadonlySet<string>>(() => new Set());
  const selected = media.find(item => item.id === selectedId) ?? media[0];
  const alt = selected ? localizedContent(selected.alt, language)! : null;
  const caption = selected ? localizedContent(selected.caption, language) : null;
  function photo(full = false) {
    return selected && !failed.has(selected.id) ? <StyledImage source={selected.source} accessibilityLabel={alt!.value}
      className={full ? 'h-80 w-full rounded-card' : 'h-64 w-full rounded-card'} resizeMode={full ? 'contain' : 'cover'}
      onError={() => setFailed(previous => new Set([...previous, selected.id]))} />
      : <View testID="destination-media-fallback" className="min-h-48 items-center justify-center rounded-card bg-mint p-6">
        <Text className="font-sans text-base text-muted">{t(selected ? 'destinations.imageFailed' : 'destinations.previewMissing')}</Text>
      </View>;
  }
  return <View className="gap-4">
    <View className="gap-2">
      <Text accessibilityRole="header" className="font-sans text-section font-semibold text-foreground">{t('destinations.daytime')}</Text>
      <Text className="font-sans text-sm text-muted">{t('destinations.notLive')}</Text>
      {photo()}
      {selected && <>
        {caption && <Text selectable className="font-sans text-base text-foreground">{caption.value}</Text>}
        {(caption?.englishFallback || alt?.englishFallback) && <Text className="font-sans text-xs text-muted">{t('destinations.englishFallback')}</Text>}
        <Text selectable className="font-sans text-xs text-muted">{selected.credit}</Text>
      </>}
      <Text className="font-sans text-sm text-muted">{t('destinations.photoCount', { count: media.length })}</Text>
    </View>
    {children}
    {media.length > 0 && <ScrollView horizontal contentContainerClassName="gap-3" showsHorizontalScrollIndicator={false}>
      {media.map(item => {
        const itemAlt = localizedContent(item.alt, language)!;
        const itemCaption = localizedContent(item.caption, language);
        return <Button key={item.id} variant="secondary" className="h-auto w-44 flex-col items-stretch p-3" accessibilityLabel={itemAlt.value}
          onPress={() => { setSelectedId(item.id); setFullscreen(true); }}>
          {!failed.has(item.id) && <StyledImage source={item.source} accessibilityLabel={itemAlt.value} className="h-24 w-full rounded-card" resizeMode="cover" onError={() => setFailed(previous => new Set([...previous, item.id]))} />}
          <Button.Label className="shrink text-left">{failed.has(item.id) ? t('destinations.imageFailed') : itemCaption?.value ?? itemAlt.value}</Button.Label>
        </Button>;
      })}
    </ScrollView>}
    {fullscreen && selected && <Modal visible onRequestClose={() => setFullscreen(false)}>
      <StyledSafeAreaView className="flex-1 bg-surface" edges={['top', 'bottom', 'left', 'right']}>
        <View className="p-4"><Button variant="secondary" accessibilityLabel={t('common.close')} onPress={() => setFullscreen(false)}><Button.Label>{t('common.close')}</Button.Label></Button></View>
        <ScrollView contentContainerClassName="gap-3 p-4">
          <Text className="font-sans text-base text-foreground">{t('destinations.daytime')}</Text>
          <Text className="font-sans text-sm text-muted">{t('destinations.notLive')}</Text>
          {photo(true)}
          {caption && <Text selectable className="font-sans text-base text-foreground">{caption.value}</Text>}
          {(caption?.englishFallback || alt?.englishFallback) && <Text className="font-sans text-xs text-muted">{t('destinations.englishFallback')}</Text>}
          <Text selectable className="font-sans text-sm text-muted">{selected.credit}</Text>
        </ScrollView>
      </StyledSafeAreaView>
    </Modal>}
  </View>;
}
