import { useState } from 'react';
import { Text, View } from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useIsFocused } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Input } from 'heroui-native/input';
import { TextField } from 'heroui-native/text-field';
import { Button } from 'heroui-native/button';
import { AR } from '@/config/limits';
import { placesService, type Place } from '@/features/places/service';
import { useSettings } from '@/features/settings/provider';
import { useAppActive } from '@/lib/use-app-active';
import { edgeErrorMessageKey } from '@/lib/edge-error';
import type { Language } from '../../../supabase/functions/_shared/contracts';

/** No invented map center, native location owner or per-keystroke request. */
export function ManualPlaceSearch({ onSelect }: { onSelect(place: Place, language: Language, updatedAt: number): void }) {
  const { t } = useTranslation(); const { language } = useSettings(); const client = useQueryClient();
  const active = useAppActive(); const focused = useIsFocused();
  const [draft, setDraft] = useState(''); const [committed, setCommitted] = useState('');
  const options = (query: string) => ({ queryKey: ['places', { query, category: 'all' }, language], gcTime: AR.nearbyReuseMs,
    queryFn: () => placesService.search({ query, category: 'all', language }) });
  const result = useQuery({ ...options(committed), enabled: false });
  function search() {
    const query = draft.trim();
    if (!query || !active || !focused || result.isFetching) return;
    setCommitted(query); void client.fetchQuery(options(query)).catch(() => {});
  }
  return <View className="gap-3">
    <Text className="font-sans text-base text-muted">{t('search.noArea')}</Text>
    <TextField><Input value={draft} onChangeText={setDraft} maxLength={256} returnKeyType="search" onSubmitEditing={search}
      accessibilityLabel={t('search.query')} placeholder={t('search.placeholder')} className="min-h-12 bg-surface font-sans" /></TextField>
    <Button accessibilityLabel={t('map.search')} isDisabled={!draft.trim() || !active || !focused || result.isFetching} onPress={search}><Button.Label>{t('map.search')}</Button.Label></Button>
    {result.error && <Text className="font-sans text-sm text-danger">{t(edgeErrorMessageKey(result.error))}</Text>}
    {result.isSuccess && result.data.length === 0 && <Text className="font-sans text-sm text-muted">{t('map.empty')}</Text>}
    {result.data?.map(place => <Button key={place.id} variant="secondary" accessibilityLabel={place.name} onPress={() => onSelect(place, language, result.dataUpdatedAt)}><Button.Label>{place.name}</Button.Label></Button>)}
  </View>;
}
