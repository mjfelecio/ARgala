import Ionicons from '@expo/vector-icons/Ionicons';
import { useCSSVariable } from 'uniwind';
import { JournalSyncStatusView } from './sync-status';
import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { destinationIds, destinationName, getDestination } from '@/features/destinations/catalog';
import { useJournal } from './context';
import { JournalFeedback } from './actions';

export function PassportSummary() {
  const { t } = useTranslation();
  const journal = useJournal();
  const seafoam = useCSSVariable('--color-seafoam') as string;
  if (!journal) return null;
  const count = journal.state.stamps.filter(stamp => destinationIds.some(id => id === stamp.destinationId)).length;
  return <View className="gap-3">
    <View className="gap-3 rounded-card bg-brand-strong p-5">
      <View className="flex-row items-center gap-3">
        <Text accessibilityRole="header" className="min-w-0 flex-1 font-sans text-section font-semibold text-white">{t('journal.passportTitle')}</Text>
        <Ionicons name="earth-outline" size={32} color={seafoam} accessible={false} />
      </View>
      {journal.ready && <>
        <Text className="font-sans text-title font-bold text-white">{t('journal.passportCount', { count, total: destinationIds.length })}</Text>
        <View accessibilityRole="progressbar" accessibilityLabel={t('journal.passportTitle')} accessibilityValue={{ min: 0, max: destinationIds.length, now: count }} className="flex-row gap-1">
          {destinationIds.map(id => <View key={id} className={`h-2 flex-1 rounded-pill ${journal.state.stamps.some(stamp => stamp.destinationId === id) ? 'bg-seafoam' : 'bg-white/25'}`} />)}
        </View>
        {!journal.state.stamps.length && <Text className="font-sans text-sm text-white">{t('journal.passportEmpty')}</Text>}
        {journal.state.stamps.map(stamp => <Text key={stamp.destinationId} className="font-sans text-sm text-white">{stamp.destinationId === 'pilot-aclc' ? t('journal.pilotVisited') : destinationName(getDestination(stamp.destinationId)!)}</Text>)}
      </>}
    </View>
    <JournalFeedback />
    <JournalSyncStatusView />
  </View>;
}
