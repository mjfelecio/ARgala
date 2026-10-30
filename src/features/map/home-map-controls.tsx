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
  const searchDisabled = !canSearch || searching;
  const searchLabel = t(query?.trim() ? 'search.submit' : 'map.search');
  const submitSearch = () => { if (!searchDisabled) onSearchNearby(); };

  return <View testID="home-map-controls" className="gap-2 px-4 pb-2 pt-3" onLayout={onLayout} pointerEvents="box-none">
    <View className="min-h-12 flex-row items-center gap-1 rounded-pill bg-surface px-2 py-1 shadow-sm">
      <View className="size-8 items-center justify-center rounded-xl bg-accent" accessible={false} pointerEvents="none">
        <Ionicons name="compass-outline" size={22} color={onAccent} />
      </View>
      {onQueryChange && <TextField className="min-w-0 flex-1">
        <Input value={query ?? ''} onChangeText={onQueryChange} maxLength={256} returnKeyType="search" onSubmitEditing={submitSearch}
          accessibilityLabel={t('search.query')} placeholder={t('search.placeholder')} variant="secondary"
          className="min-h-12 rounded-pill bg-transparent px-2 py-2 font-sans" />
      </TextField>}
      <Button variant="ghost" isIconOnly={!!onQueryChange} className={onQueryChange ? 'min-h-11 min-w-11 rounded-pill' : 'h-auto min-h-11 flex-1 rounded-pill py-2'}
        accessibilityLabel={searchLabel} isDisabled={searchDisabled} accessibilityState={{ disabled: searchDisabled, busy: searching }} onPress={submitSearch}>
        {!onQueryChange && <Button.Label className="flex-1 font-medium">{searchLabel}</Button.Label>}
        {searching ? <Spinner size="sm" color={accent} /> : <Ionicons name="search-outline" size={22} color={ink} accessible={false} />}
      </Button>
    </View>
    <View className="flex-row items-center gap-2">
      <Button size="sm" variant="secondary" className="h-auto min-h-11 shrink-0 rounded-pill bg-surface px-3 py-2" accessibilityLabel={t('destinations.title')} onPress={onOpenDestinations}>
        <Ionicons name="library-outline" size={18} color={ink} accessible={false} /><Button.Label>{t('destinations.shortTitle')}</Button.Label>
      </Button>
      {onCategoryChange && <ScrollView className="min-w-0 flex-1" horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2 py-1" keyboardShouldPersistTaps="handled">
        {(['all', 'attractions', 'restaurants', 'hotels', 'shopping'] as const).map(value => <Button key={value} size="sm" variant={category === value ? 'primary' : 'secondary'}
          className="h-auto min-h-11 rounded-pill px-3 py-2" accessibilityLabel={t(`search.categories.${value}`)} accessibilityState={{ selected: category === value }} onPress={() => onCategoryChange(value)}>
          <Button.Label>{t(`search.categories.${value}`)}</Button.Label>
        </Button>)}
      </ScrollView>}
    </View>
    {onSearchArea && <Button size="sm" variant="secondary" className="h-auto min-h-11 self-center rounded-pill bg-surface px-4 py-2"
      accessibilityLabel={t('search.thisArea')} accessibilityHint={areaRadiusMeters ? t('search.areaExtent', { meters: Math.round(areaRadiusMeters) }) : undefined}
      isDisabled={!canSearchArea || searching} onPress={onSearchArea}>
      <Button.Label>{t('search.thisArea')}</Button.Label>
    </Button>}
  </View>;
}
