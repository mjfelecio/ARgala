import { router } from 'expo-router';
import { Button } from 'heroui-native/button';
import { Text,View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useJournal } from './context';
export function JournalProfileEntry(){const {t}=useTranslation();const journal=useJournal();if(!journal)return null;
 return <View className="gap-2 px-4 pb-4"><Button variant="secondary" accessibilityLabel={t('journal.savedTitle')} onPress={()=>router.push('/saved-places')}><Button.Label>{t('journal.savedTitle')}</Button.Label></Button>
 {journal.principalId==='guest'&&<><Text className="font-sans text-sm text-muted">{t('journal.guestNote')}</Text><Button variant="outline" accessibilityLabel={t('journal.signIn')} onPress={()=>router.push('/sign-in')}><Button.Label>{t('journal.signIn')}</Button.Label></Button></>}</View>;
}
