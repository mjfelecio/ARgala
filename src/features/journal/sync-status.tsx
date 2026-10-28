import { Text,View } from 'react-native';
import { Button } from 'heroui-native/button';
import { useTranslation } from 'react-i18next';
import { useJournal } from './context';
export function JournalSyncStatusView(){const {t}=useTranslation();const journal=useJournal();if(!journal?.ready)return null;const status=journal.sync;
 const key=journal.principalId==='guest'?'journal.localOnly':status.error??({local:'journal.localOnly',pending:'journal.syncPending',syncing:'journal.syncing',synced:'journal.synced',failed:'journal.syncFailed'} as const)[status.phase];
 return <View className="gap-2"><Text accessibilityLiveRegion="polite" className={status.phase==='failed'?'font-sans text-sm text-danger':'font-sans text-sm text-muted'}>{t(key)}</Text>
 {journal.principalId!=='guest'&&<Button variant="ghost" accessibilityLabel={t(status.phase==='failed'?'journal.retrySync':'journal.syncNow')} isDisabled={status.phase==='syncing'} accessibilityState={{busy:status.phase==='syncing',disabled:status.phase==='syncing'}} onPress={journal.syncNow}><Button.Label>{t(status.phase==='failed'?'journal.retrySync':'journal.syncNow')}</Button.Label></Button>}</View>;
}
