import { ScrollView, View, type LayoutChangeEvent } from 'react-native';
import { useTranslation } from 'react-i18next';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Button } from 'heroui-native/button';
import { Spinner } from 'heroui-native/spinner';
import { useThemeColor } from 'heroui-native/hooks';

export type HomeMapControlsProps = {
  onSearchNearby(): void; onOpenAr?(): void; onOpenDestinations(): void;
  canSearch: boolean; searching: boolean; onLayout?(event: LayoutChangeEvent): void;
};
export function HomeMapControls({ onSearchNearby, onOpenDestinations, canSearch, searching, onLayout }: HomeMapControlsProps) {
  const { t } = useTranslation();
  const [ink, accent, onAccent] = useThemeColor(['default-foreground', 'accent', 'accent-foreground']);
  return <View testID="home-map-controls" className="gap-2 px-4 pb-2 pt-3" onLayout={onLayout} pointerEvents="box-none">
    <Button variant="secondary" className="h-auto min-h-12 justify-start rounded-pill bg-surface px-3 py-1 shadow-sm" accessibilityLabel={t('map.search')} isDisabled={!canSearch || searching}
      accessibilityState={{ disabled: !canSearch || searching, busy: searching }} onPress={onSearchNearby}>
      <View className="size-8 items-center justify-center rounded-xl bg-accent" accessible={false}>
        <Ionicons name="compass-outline" size={22} color={onAccent} />
      </View>
      <Button.Label className="flex-1 font-medium">{t('map.search')}</Button.Label>
      {searching ? <Spinner size="sm" color={accent} /> : <Ionicons name="search-outline" size={22} color={ink} />}
    </Button>
    <ScrollView className="grow-0" horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2 py-1">
      <Button size="sm" variant="secondary" className="h-auto min-h-10 bg-surface px-4 py-2 shadow-sm" hitSlop={4} accessibilityLabel={t('destinations.title')} onPress={onOpenDestinations}>
        <Ionicons name="library-outline" size={18} color={ink} accessible={false} /><Button.Label>{t('destinations.title')}</Button.Label>
      </Button>
    </ScrollView>
  </View>;
}
