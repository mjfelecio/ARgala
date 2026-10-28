import { ScrollView, View, type LayoutChangeEvent } from 'react-native';
import { useTranslation } from 'react-i18next';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Button } from 'heroui-native/button';
import { Input } from 'heroui-native/input';
import { TextField } from 'heroui-native/text-field';
import type { SearchCategory } from '../../../supabase/functions/_shared/contracts';
import { Spinner } from 'heroui-native/spinner';
import { useThemeColor } from 'heroui-native/hooks';

export type HomeMapControlsProps = {
  onSearchNearby(): void; onOpenAr?(): void; onOpenDestinations(): void;
  query?: string; onQueryChange?(query: string): void; category?: SearchCategory; onCategoryChange?(category: SearchCategory): void;
  onSearchArea?(): void; canSearchArea?: boolean; areaRadiusMeters?: number;
  canSearch: boolean; searching: boolean; onLayout?(event: LayoutChangeEvent): void;
};
export function HomeMapControls({ onSearchNearby, onOpenDestinations, canSearch, searching, onLayout, query, onQueryChange, category = 'all', onCategoryChange, onSearchArea, canSearchArea, areaRadiusMeters }: HomeMapControlsProps) {
  const { t } = useTranslation();
  const [ink, accent, onAccent] = useThemeColor(['default-foreground', 'accent', 'accent-foreground']);
  return <View testID="home-map-controls" className="gap-2 px-4 pb-2 pt-3" onLayout={onLayout} pointerEvents="box-none">
    {onQueryChange && <TextField><Input value={query ?? ''} onChangeText={onQueryChange} maxLength={256} returnKeyType="search" onSubmitEditing={onSearchNearby}
      accessibilityLabel={t('search.query')} placeholder={t('search.placeholder')} className="min-h-12 rounded-pill bg-surface px-4 font-sans shadow-sm" /></TextField>}
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
      {onCategoryChange && (['all', 'attractions', 'restaurants', 'hotels', 'shopping'] as const).map(value => <Button key={value} size="sm" variant={category === value ? 'primary' : 'secondary'}
        className="h-auto min-h-10 px-4 py-2 shadow-sm" accessibilityLabel={t(`search.categories.${value}`)} accessibilityState={{ selected: category === value }} onPress={() => onCategoryChange(value)}><Button.Label>{t(`search.categories.${value}`)}</Button.Label></Button>)}
    </ScrollView>
    {onSearchArea && <Button size="sm" variant="secondary" accessibilityLabel={t('search.thisArea')} isDisabled={!canSearchArea || searching} onPress={onSearchArea}><Button.Label>{areaRadiusMeters ? t('search.areaExtent', { meters: Math.round(areaRadiusMeters) }) : t('search.thisArea')}</Button.Label></Button>}
  </View>;
}
