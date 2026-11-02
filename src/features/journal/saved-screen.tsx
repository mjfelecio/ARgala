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
  const [accent, onAccent] = useThemeColor(['accent', 'accent-foreground']);
  return <SafeArea className="flex-1 bg-page" edges={['top', 'bottom', 'left', 'right']}>
    <View className="flex-row items-center gap-3 px-4 py-3">
      <Button isIconOnly variant="ghost" accessibilityLabel={t('common.back')} onPress={() => { if (router.canGoBack()) router.back(); else router.navigate('/'); }}>
        <Ionicons name="arrow-back" size={24} color={accent} accessible={false} />
      </Button>
      <Text accessibilityRole="header" className="shrink font-sans text-section font-ui-semibold text-brand-strong">{t('journal.savedTitle')}</Text>
    </View>
    <FlatList<Bookmark> className="flex-1" contentContainerClassName="px-4 pb-8"
      data={journal?.ready ? journal.state.bookmarks : []} keyExtractor={bookmarkKey}
      ListHeaderComponent={<View className="gap-3 pb-4"><JournalSyncStatusView /><JournalFeedback />
        <View className="gap-1 pt-2">
          <Text accessibilityRole="header" className="font-sans text-title font-ui-bold text-brand-strong">{t('journal.savedHeading')}</Text>
          {journal?.ready && <Text className="font-sans text-sm text-muted">{t('journal.savedCount', {count: journal.state.bookmarks.length})}</Text>}
        </View></View>}
      ListEmptyComponent={journal?.ready ? <View className="items-start gap-3 py-8">
        <Ionicons name="bookmark-outline" size={28} color={accent} accessible={false} />
        <Text className="font-sans text-base text-muted">{t('journal.savedEmpty')}</Text>
      </View> : null}
      ItemSeparatorComponent={() => <View className="h-3" />}
      renderItem={({ item: reference }) => {
        const destination = reference.kind === 'featured' ? getDestination(reference.id) : null;
        return <Surface className="flex-row flex-wrap items-center gap-3 rounded-card p-4">
          <View className="size-12 items-center justify-center rounded-input bg-mint" accessible={false}><Ionicons name="location-outline" size={24} color={accent} /></View>
          <View className="min-w-32 flex-1 gap-1">
            <Text className="font-sans text-card font-ui-semibold text-brand-strong">{destination ? destinationName(destination) : t('journal.googlePlace')}</Text>
            <Text className="font-sans text-sm text-muted">{t(reference.kind === 'google' ? 'journal.googleMetadata' : destination?.verifiedName ? 'journal.featuredMetadata' : 'destinations.provisional')}</Text>
          </View>
          <View className="gap-1">
            <Button accessibilityLabel={t('journal.open')} onPress={() => {
            if (reference.kind === 'google') router.push({ pathname: '/place/[providerId]', params: { providerId: reference.id } });
            else router.push({ pathname: '/destinations/[destinationId]', params: { destinationId: reference.id } });
          }}><Button.Label>{t('journal.openShort')}</Button.Label><Ionicons name="chevron-forward" size={18} color={onAccent} accessible={false} /></Button>
            <SavePlaceAction reference={reference} variant="ghost" compact />
          </View>
        </Surface>;
      }} />
  </SafeArea>;
}
