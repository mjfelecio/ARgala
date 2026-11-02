import { router } from 'expo-router';
import { Button } from 'heroui-native/button';
import { Text,View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useJournal } from './context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useThemeColor } from 'heroui-native/hooks';
export function JournalProfileEntry(){const {t}=useTranslation();const journal=useJournal();const accent=useThemeColor('accent');if(!journal)return null;
 return <View className="gap-3 border-t border-outline pt-3"><Button variant="ghost" className="justify-start" accessibilityLabel={t('journal.savedTitle')} onPress={()=>router.push('/saved-places')}><Ionicons name="bookmark-outline" size={24} color={accent} accessible={false}/><Button.Label className="min-w-0 flex-1 text-left">{t('journal.savedTitle')}</Button.Label><Ionicons name="chevron-forward" size={20} color={accent} accessible={false}/></Button>
 {journal.principalId==='guest'&&<><Text className="font-sans text-sm text-muted">{t('journal.guestNote')}</Text><Button variant="outline" accessibilityLabel={t('journal.signIn')} onPress={()=>router.push('/sign-in')}><Button.Label>{t('journal.signIn')}</Button.Label></Button></>}</View>;
}
