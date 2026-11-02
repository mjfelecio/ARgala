import Ionicons from '@expo/vector-icons/Ionicons';
import { Text, View } from 'react-native';
import { Button } from 'heroui-native/button';
import { useCSSVariable } from 'uniwind';
import { useTranslation } from 'react-i18next';
import { useJournal } from './context';

export function JournalSyncStatusView({ dark = false }: { dark?: boolean }) {
  const { t } = useTranslation();
  const journal = useJournal();
  const [warning, seafoam, muted] = useCSSVariable(['--color-warning-foreground', '--color-seafoam', '--color-ink-secondary']) as string[];
  if (!journal?.ready) return null;
  const { sync: status } = journal;
  const guest = journal.principalId === 'guest';
  const failed = !guest && status.phase === 'failed';
  const key = guest ? 'journal.localOnly' : status.error ?? ({
    local: 'journal.localOnly', pending: 'journal.syncPending', syncing: 'journal.syncing',
    synced: 'journal.synced', failed: 'journal.syncFailed',
  } as const)[status.phase];
  return <View testID={failed ? 'journal-sync-warning' : 'journal-sync-status'}
    className={failed ? 'gap-3 rounded-card border border-warning-border bg-warning-surface p-4' : 'flex-row flex-wrap items-center justify-between gap-2'}>
    <View className={failed ? "flex-row items-start gap-3" : "min-w-40 flex-1 flex-row items-start gap-2"}>
      <Ionicons name={failed ? 'alert-circle-outline' : status.phase === 'synced' && !guest ? 'checkmark-circle-outline' : 'cloud-outline'}
        size={22} color={failed ? warning : dark ? seafoam : muted} accessible={false} />
      <View className="min-w-0 flex-1 gap-1">
        {failed && <Text accessibilityRole="header" className="font-sans text-card font-ui-bold text-warning-foreground">{t('journal.syncAttention')}</Text>}
        <Text accessibilityLiveRegion="polite" className={failed ? 'font-sans text-sm text-warning-foreground' : dark ? 'font-sans text-sm text-white' : 'font-sans text-sm text-muted'}>{t(key)}</Text>
      </View>
    </View>
    {!guest && <Button variant={failed ? 'outline' : 'ghost'}
      className={failed ? 'self-start border-warning-foreground' : 'self-end'}
      accessibilityLabel={t(failed ? 'journal.retrySync' : 'journal.syncNow')}
      isDisabled={status.phase === 'syncing'} accessibilityState={{ busy: status.phase === 'syncing', disabled: status.phase === 'syncing' }} onPress={journal.syncNow}>
      <Button.Label className={failed ? 'text-warning-foreground' : dark ? 'text-seafoam' : 'text-accent'}>{t(failed ? 'journal.retrySync' : 'journal.syncNow')}</Button.Label>
      <Ionicons name={failed ? 'refresh-outline' : 'chevron-forward'} size={18} color={failed ? warning : dark ? seafoam : muted} accessible={false} />
    </Button>}
  </View>;
}
