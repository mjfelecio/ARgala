import Ionicons from '@expo/vector-icons/Ionicons';
import { useThemeColor } from 'heroui-native/hooks';
import { Text, View } from 'react-native';
import { Button } from 'heroui-native/button';
import { useTranslation } from 'react-i18next';
import { router, useIsFocused } from 'expo-router';
import { useAppActive } from '@/lib/use-app-active';
import { destinationName, listFeaturedDestinations, type Destination } from '@/features/destinations/catalog';
import { useArrivalReminders } from './provider';
import { reminderDestination, type ReminderSelection } from './model';

const reminderStatuses = {
  off: 'reminders.statusIncomplete',
  requested: 'reminders.statusActive',
  needsPermission: 'reminders.statusNeedsPermission',
  unavailable: 'reminders.statusUnavailable',
} as const;

function reminderLocale(resolvedLanguage: string | undefined): ReminderSelection['locale'] {
  return resolvedLanguage === 'ja' || resolvedLanguage === 'ko' ? resolvedLanguage : 'en';
}

function matchesReminder(selection: ReminderSelection, destination: Destination) {
  return selection.destinationId === destination.id ||
    (destination.id === 'D10' && selection.destinationId === 'pilot-aclc');
}

export function DestinationReminderAction({ destination }: { destination: Destination }) {
  const reminder = useArrivalReminders();
  const { t, i18n } = useTranslation();
  const accent = useThemeColor('accent');
  const active = useAppActive();
  const focused = useIsFocused();
  if (!reminder) return null;
  const { snapshot, controller } = reminder;
  const selected = snapshot.selections.find(selection => matchesReminder(selection, destination));
  const available = Boolean(reminderDestination(destination.id));
  const label = t(selected ? 'reminders.disable' : 'reminders.enable');

  return <View className="gap-3">
    <Text className="font-sans text-sm text-muted">{t('reminders.explanation')}</Text>
    {!available && <Text className="font-sans text-sm text-muted">{t('reminders.pointMissing')}</Text>}
    {selected?.claimed && <Text className="font-sans text-sm text-muted">{t('reminders.used')}</Text>}
    <Button variant="outline" accessibilityLabel={label}
      isDisabled={!snapshot.ready || (snapshot.busy && !selected) || !active || !focused || (!selected && !available)}
      onPress={() => {
        if (selected) void controller.disable(selected.destinationId);
        else void reminder.enable(destination, reminderLocale(i18n.resolvedLanguage));
      }}>
      <Ionicons name={selected ? 'notifications-off-outline' : 'notifications-outline'} size={22} color={accent} accessible={false} />
      <Button.Label>{label}</Button.Label>
    </Button>
    <ReminderFeedback />
  </View>;
}

function ReminderFeedback() {
  const reminder = useArrivalReminders();
  const { t } = useTranslation();
  if (!reminder) return null;
  const { snapshot, controller } = reminder;

  return <>
    {snapshot.error && <Text accessibilityLiveRegion="polite" className="font-sans text-sm text-danger">{t(snapshot.error)}</Text>}
    {snapshot.error === 'reminders.storageFailed' && <Button variant="secondary" accessibilityLabel={t('common.retry')} onPress={() => void controller.setPrincipal(snapshot.principalId)}>
      <Button.Label>{t('common.retry')}</Button.Label>
    </Button>}
    {snapshot.error === 'reminders.failed' && <Button variant="secondary" accessibilityLabel={t('reminders.retry')} onPress={() => void controller.refresh()}>
      <Button.Label>{t('reminders.retry')}</Button.Label>
    </Button>}
  </>;
}

export function ReminderSettings() {
  const reminder = useArrivalReminders();
  const { t, i18n } = useTranslation();
  const accent = useThemeColor('accent');
  const active = useAppActive();
  const focused = useIsFocused();
  if (!reminder) return null;
  const { snapshot, controller } = reminder;
  const locale = reminderLocale(i18n.resolvedLanguage);

  return <View className="gap-4 rounded-card bg-surface p-5">
    <View className="flex-row items-center gap-3">
      <View className="size-11 items-center justify-center rounded-pill bg-mint" accessible={false}>
        <Ionicons name="notifications-outline" size={24} color={accent} accessible={false} />
      </View>
      <Text accessibilityRole="header" className="min-w-0 flex-1 font-sans text-section font-ui-semibold text-brand-strong">{t('reminders.title')}</Text>
    </View>
    <Text className="font-sans text-sm text-muted">{t('reminders.sectionExplanation')}</Text>

    {snapshot.ready && snapshot.selections.length === 0 && <Button variant="secondary" className="h-auto min-h-12 py-3"
      accessibilityLabel={t('reminders.browse')} onPress={() => router.navigate('/destinations')}>
      <Ionicons name="compass-outline" size={22} color={accent} accessible={false} />
      <Button.Label className="shrink">{t('reminders.browse')}</Button.Label>
    </Button>}
    {listFeaturedDestinations().map(destination => {
      const selected = snapshot.selections.find(selection => matchesReminder(selection, destination));
      if (!selected) return null;
      const name = destinationName(destination, locale);
      const status = selected.claimed
        ? 'reminders.statusUsed'
        : reminderDestination(destination.id) ? reminderStatuses[snapshot.status] : 'reminders.statusUnavailable';

      return <View key={destination.id} className="gap-3 border-t border-outline pt-4">
        <View className="gap-1">
          <Text className="font-sans text-base font-ui-semibold text-brand-strong">{name}</Text>
          <Text className="font-sans text-sm text-muted">{t(status)}</Text>
        </View>
        <Button variant="outline" className="h-auto min-h-12 self-start py-3"
          isDisabled={!snapshot.ready || !active || !focused}
          accessibilityLabel={t('reminders.disableFor', { destination: name })}
          onPress={() => void controller.disable(selected.destinationId)}>
          <Ionicons name="notifications-off-outline" size={22} color={accent} accessible={false} />
          <Button.Label className="shrink">{t('reminders.disable')}</Button.Label>
        </Button>
      </View>;
    })}
    <ReminderFeedback />
  </View>;
}
