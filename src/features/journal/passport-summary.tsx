import { Text } from 'react-native';
import { Surface } from 'heroui-native/surface';
import { useTranslation } from 'react-i18next';
import { destinationIds,destinationName,getDestination } from '@/features/destinations/catalog';
import { useJournal } from './context';
import { JournalFeedback } from './actions';
export function PassportSummary(){const {t}=useTranslation();const journal=useJournal();if(!journal)return null;
 const count=journal.state.stamps.filter(x=>destinationIds.some(id=>id===x.destinationId)).length;
 return <Surface className="gap-3 rounded-card p-4"><Text accessibilityRole="header" className="font-sans text-card font-semibold text-foreground">{t('journal.passportTitle')}</Text><JournalFeedback/>
 {journal.ready&&<><Text className="font-sans text-base text-foreground">{t('journal.passportCount',{count,total:destinationIds.length})}</Text>
 {!journal.state.stamps.length&&<Text className="font-sans text-sm text-muted">{t('journal.passportEmpty')}</Text>}
 {journal.state.stamps.map(stamp=><Text key={stamp.destinationId} className="font-sans text-base text-brand-strong">{stamp.destinationId==='pilot-aclc'?t('journal.pilotVisited'):destinationName(getDestination(stamp.destinationId)!)}</Text>)}</>}
 <Text className="font-sans text-sm text-muted">{t('journal.localOnly')}</Text></Surface>;
}
