import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { Button } from 'heroui-native/button';
import { useThemeColor } from 'heroui-native/hooks';
import { Surface } from 'heroui-native/surface';
import { FlatList, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { withUniwind } from 'uniwind';
import { destinationName, getDestination } from '@/features/destinations/catalog';
import { JournalFeedback, SavePlaceAction } from './actions';
import { useJournal } from './context';
import { bookmarkKey, type Bookmark } from './model';
import { JournalSyncStatusView } from './sync-status';

const SafeArea = withUniwind(SafeAreaView);
export default function SavedPlacesScreen() {
  const { t } = useTranslation();
  const journal = useJournal();
  const accent = useThemeColor('accent');
  return <SafeArea className="flex-1 bg-page-mint" edges={['top', 'bottom', 'left', 'right']}>
    <View className="flex-row items-center gap-3 px-4 py-3">
      <Button isIconOnly variant="ghost" accessibilityLabel={t('common.back')} onPress={() => { if (router.canGoBack()) router.back(); else router.navigate('/'); }}>
        <Ionicons name="arrow-back" size={24} color={accent} accessible={false} />
      </Button>
      <Text accessibilityRole="header" className="shrink font-sans text-section font-semibold text-foreground">{t('journal.savedTitle')}</Text>
    </View>
    <FlatList<Bookmark> className="flex-1" contentContainerClassName="px-4 pb-8"
      data={journal?.ready ? journal.state.bookmarks : []} keyExtractor={bookmarkKey}
      ListHeaderComponent={<View className="gap-3 pb-4"><JournalSyncStatusView /><JournalFeedback /></View>}
      ListEmptyComponent={journal?.ready ? <View className="items-start gap-3 py-8">
        <Ionicons name="bookmark-outline" size={28} color={accent} accessible={false} />
        <Text className="font-sans text-base text-muted">{t('journal.savedEmpty')}</Text>
      </View> : null}
      ItemSeparatorComponent={() => <View className="h-3" />}
      renderItem={({ item: reference }) => {
        const destination = reference.kind === 'featured' ? getDestination(reference.id) : null;
        return <Surface className="gap-3 rounded-card p-4">
          <Text className="font-sans text-card font-semibold text-foreground">{destination ? destinationName(destination) : t('journal.googlePlace')}</Text>
          {reference.kind === 'google' && <Text selectable numberOfLines={2} ellipsizeMode="tail" accessibilityLabel={reference.id} className="font-sans text-xs text-muted">{reference.id}</Text>}
          <Button accessibilityLabel={t('journal.open')} onPress={() => {
            if (reference.kind === 'google') router.push({ pathname: '/place/[providerId]', params: { providerId: reference.id } });
            else router.push({ pathname: '/destinations/[destinationId]', params: { destinationId: reference.id } });
          }}><Button.Label>{t('journal.open')}</Button.Label></Button>
          <SavePlaceAction reference={reference} variant="ghost" />
        </Surface>;
      }} />
  </SafeArea>;
}
