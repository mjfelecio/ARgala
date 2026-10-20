import { ScrollView, View, type LayoutChangeEvent } from 'react-native';
import { useTranslation } from 'react-i18next';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Button } from 'heroui-native/button';
import { Spinner } from 'heroui-native/spinner';
import { useThemeColor } from 'heroui-native/hooks';

export type HomeMapControlsProps = {
  onSearchNearby(): void; onRecenter(): void; onOpenAr(): void; onOpenDestinations(): void;
  canSearch: boolean; searching: boolean; onLayout?(event: LayoutChangeEvent): void;
};
export function HomeMapControls({ onSearchNearby, onRecenter, onOpenAr, onOpenDestinations, canSearch, searching, onLayout }: HomeMapControlsProps) {
  const { t } = useTranslation();
  const [ink, onAccent] = useThemeColor(['default-foreground', 'accent-foreground']);
  return <View testID="home-map-controls" className="max-h-[40%] shrink px-4 py-2" onLayout={onLayout} pointerEvents="box-none">
    <ScrollView className="grow-0" contentContainerClassName="gap-2">
      <View className="flex-row items-center gap-2">
        <Button className="h-auto min-h-12 flex-1 px-3 py-2" accessibilityLabel={t('map.search')} isDisabled={!canSearch || searching}
          accessibilityState={{ disabled: !canSearch || searching, busy: searching }} onPress={onSearchNearby}>
          {searching ? <Spinner size="sm" color={onAccent} /> : <Ionicons name="search-outline" size={20} color={onAccent} />}
          <Button.Label className="shrink text-center">{t('map.search')}</Button.Label>
        </Button>
        <Button variant="secondary" className="size-12" isIconOnly accessibilityLabel={t('map.recenter')} onPress={onRecenter}>
          <Ionicons name="locate-outline" size={24} color={ink} />
        </Button>
      </View>
      <View className="flex-row flex-wrap gap-2">
        <Button variant="outline" className="h-auto min-h-12 min-w-28 grow bg-surface px-3 py-2" accessibilityLabel={t('map.camera')} onPress={onOpenAr}>
          <Ionicons name="scan-outline" size={20} color={ink} /><Button.Label>{t('map.camera')}</Button.Label>
        </Button>
        <Button variant="outline" className="h-auto min-h-12 min-w-40 grow bg-surface px-3 py-2" accessibilityLabel={t('destinations.title')} onPress={onOpenDestinations}>
          <Button.Label className="shrink text-center">{t('destinations.title')}</Button.Label>
        </Button>
      </View>
    </ScrollView>
  </View>;
}
