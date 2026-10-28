import { router } from 'expo-router';
import { ScrollView,Text,View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Button } from 'heroui-native/button';
import { Surface } from 'heroui-native/surface';
import { SafeAreaView } from 'react-native-safe-area-context';
import { withUniwind } from 'uniwind';
import { useJournal } from './context';
import { JournalFeedback,SavePlaceAction } from './actions';
import { bookmarkKey } from './model';
import { destinationName,getDestination } from '@/features/destinations/catalog';
const SafeArea=withUniwind(SafeAreaView);
export default function SavedPlacesScreen(){
 const {t}=useTranslation();const journal=useJournal();
 return <SafeArea className="flex-1 bg-page-mint" edges={['top','bottom','left','right']}><View className="flex-row items-center gap-3 px-4 py-3">
  <Button variant="secondary" accessibilityLabel={t('common.back')} onPress={()=>{if(router.canGoBack())router.back();else router.navigate('/');}}><Button.Label>{t('common.back')}</Button.Label></Button>
  <Text accessibilityRole="header" className="shrink font-sans text-section font-semibold text-foreground">{t('journal.savedTitle')}</Text></View>
  <ScrollView contentContainerClassName="gap-4 px-4 pb-8"><Text className="font-sans text-sm text-muted">{t('journal.localOnly')}</Text><JournalFeedback/>
  {journal?.ready&&!journal.state.bookmarks.length&&<Text className="font-sans text-base text-muted">{t('journal.savedEmpty')}</Text>}
  {journal?.ready&&journal.state.bookmarks.map(ref=>{
   const destination=ref.kind==='featured'?getDestination(ref.id):null;
   return <Surface key={bookmarkKey(ref)} className="gap-3 rounded-card p-4"><Text className="font-sans text-card font-semibold text-foreground">{destination?destinationName(destination):t('journal.googlePlace')}</Text>
    {ref.kind==='google'&&<Text selectable className="font-sans text-xs text-muted">{ref.id}</Text>}
    <Button accessibilityLabel={t('journal.open')} onPress={()=>{if(ref.kind==='google')router.push({pathname:'/place/[providerId]',params:{providerId:ref.id}});else router.push({pathname:'/destinations/[destinationId]',params:{destinationId:ref.id}});}}><Button.Label>{t('journal.open')}</Button.Label></Button>
    <SavePlaceAction reference={ref}/></Surface>;
  })}</ScrollView></SafeArea>;
}
