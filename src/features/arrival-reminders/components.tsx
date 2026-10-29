import { Text, View } from 'react-native';
import { Button } from 'heroui-native/button';
import { useTranslation } from 'react-i18next';
import { useIsFocused } from 'expo-router';
import { useAppActive } from '@/lib/use-app-active';
import { listFeaturedDestinations, destinationName, type Destination } from '@/features/destinations/catalog';
import { useArrivalReminders } from './provider';
import { reminderDestination, type ReminderSelection } from './model';
export function DestinationReminderAction({destination}:{destination:Destination}){
 const reminder=useArrivalReminders();const {t,i18n}=useTranslation();const active=useAppActive();const focused=useIsFocused();if(!reminder)return null;
 const {snapshot,controller}=reminder;const selected=snapshot.selections.find(s=>s.destinationId===destination.id);const available=!!reminderDestination(destination.id);const label=t(selected?'reminders.disable':'reminders.enable');
 const locale:ReminderSelection['locale']=i18n.resolvedLanguage==='ja'?'ja':i18n.resolvedLanguage==='ko'?'ko':'en';
 return <View className="gap-3"><Text className="font-sans text-sm text-muted">{t('reminders.explanation')}</Text>
  {!available&&<Text className="font-sans text-sm text-muted">{t('reminders.pointMissing')}</Text>}
  {selected?.claimed&&<Text className="font-sans text-sm text-muted">{t('reminders.used')}</Text>}
  <Button variant="secondary" accessibilityLabel={label} isDisabled={!snapshot.ready||(snapshot.busy&&!selected)||!active||!focused||(!selected&&!available)} onPress={()=>{if(selected)void controller.disable(destination.id);else void reminder.enable(destination,locale);}}><Button.Label>{label}</Button.Label></Button>
  <ReminderFeedback/>
 </View>;
}
export function ReminderFeedback(){const reminder=useArrivalReminders();const {t}=useTranslation();if(!reminder)return null;const {snapshot,controller}=reminder;
 return <>{snapshot.error&&<Text accessibilityLiveRegion="polite" className="font-sans text-sm text-danger">{t(snapshot.error)}</Text>}{snapshot.status==='requested'&&<Text className="font-sans text-sm text-muted">{t('reminders.requested')}</Text>}{snapshot.error==='reminders.storageFailed'&&<Button variant="secondary" accessibilityLabel={t('common.retry')} onPress={()=>void controller.setPrincipal(snapshot.principalId)}><Button.Label>{t('common.retry')}</Button.Label></Button>}{snapshot.error==='reminders.failed'&&<Button variant="secondary" accessibilityLabel={t('reminders.retry')} onPress={()=>void controller.refresh()}><Button.Label>{t('reminders.retry')}</Button.Label></Button>}</>;
}
export function ReminderSettings(){const reminder=useArrivalReminders();const {t}=useTranslation();if(!reminder)return null;const selections=reminder.snapshot.selections;return <View className="gap-3"><Text accessibilityRole="header" className="font-sans text-section font-semibold text-foreground">{t('reminders.title')}</Text><Text className="font-sans text-sm text-muted">{t('reminders.off')}</Text>{listFeaturedDestinations().filter(d=>selections.some(s=>s.destinationId===d.id)).map(destination=><View key={destination.id} className="gap-2"><Text className="font-sans text-base text-foreground">{destinationName(destination)}</Text><DestinationReminderAction destination={destination}/></View>)}{!selections.length&&<ReminderFeedback/>}</View>;}
