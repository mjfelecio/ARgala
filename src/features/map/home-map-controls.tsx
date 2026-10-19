import { ScrollView, Text, View, type LayoutChangeEvent } from 'react-native';
import { useTranslation } from 'react-i18next';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Button } from 'heroui-native/button';
import { Surface } from 'heroui-native/surface';
import { Spinner } from 'heroui-native/spinner';
import { useThemeColor } from 'heroui-native/hooks';

export type HomeMapControlsProps = {
  onSearchNearby(): void; onRecenter(): void; onOpenAr(): void; onOpenSettings(): void;
  canSearch: boolean; searching: boolean; onLayout?(event: LayoutChangeEvent): void;
};
export function HomeMapControls({ onSearchNearby, onRecenter, onOpenAr, onOpenSettings, canSearch, searching, onLayout }: HomeMapControlsProps) {
  const { t } = useTranslation();
  const [ink, onAccent] = useThemeColor(['default-foreground', 'accent-foreground']);
  return <View testID="home-map-controls" className="max-h-[40%] shrink px-4 py-2" onLayout={onLayout} pointerEvents="box-none">
    <ScrollView className="grow-0" contentContainerClassName="gap-2">
      <View className="flex-row flex-wrap items-center justify-between gap-2">
        <Surface className="shrink px-4 py-2">
          <Text className="font-sans text-section font-semibold text-brand-strong">ARgala</Text>
          <Text className="font-sans text-xs font-medium text-muted">{t('map.explore')}</Text>
        </Surface>
        <Button variant="secondary" isIconOnly accessibilityLabel={t('map.settings')} onPress={onOpenSettings}>
          <Ionicons name="options-outline" size={24} color={ink} />
        </Button>
      </View>
      <Button variant="outline" className="bg-surface" accessibilityLabel={t('map.search')} isDisabled={!canSearch || searching}
        accessibilityState={{ disabled: !canSearch || searching, busy: searching }} onPress={onSearchNearby}>
        {searching ? <Spinner size="sm" color={ink} /> : <Ionicons name="search-outline" size={24} color={ink} />}
        <Button.Label>{t('map.search')}</Button.Label>
      </Button>
      <View className="flex-row flex-wrap items-center justify-between gap-2">
        <Button className="grow shrink" accessibilityLabel={t('map.camera')} onPress={onOpenAr}>
          <Ionicons name="scan-outline" size={24} color={onAccent} /><Button.Label>{t('map.camera')}</Button.Label>
        </Button>
        <Button variant="secondary" accessibilityLabel={t('map.recenter')} onPress={onRecenter}>
          <Ionicons name="locate-outline" size={24} color={ink} /><Button.Label>{t('map.recenter')}</Button.Label>
        </Button>
      </View>
    </ScrollView>
  </View>;
}
