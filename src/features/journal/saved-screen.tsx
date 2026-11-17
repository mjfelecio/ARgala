import { useCallback, useEffect, useLayoutEffect, useMemo, useReducer, useRef, useState, useSyncExternalStore } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { AR } from '@/config/limits';
import { useSettings } from '@/features/settings/provider';
import { useAppActive } from '@/lib/use-app-active';
import { availablePlaceDetailsSnapshot, placeDetailsOptions } from '@/features/places/details-cache';
import { ProviderAttributions } from '@/features/map/attributions';
import googleMapsAttribution from '../../../assets/attribution/google-maps.png';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useIsFocused } from 'expo-router';
import { Button } from 'heroui-native/button';
import { useThemeColor } from 'heroui-native/hooks';
import { Surface } from 'heroui-native/surface';
import { FlatList, Image, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { withUniwind } from 'uniwind';
import { matchedFeaturedDestination } from '@/features/destinations/map-selection';
import { destinationName, getDestination } from '@/features/destinations/catalog';
import { JournalFeedback, SavePlaceAction } from './actions';
import { useJournal } from './context';
import { bookmarkKey, type Bookmark } from './model';
import { JournalSyncStatusView } from './sync-status';
import { openGooglePlaceOnMap } from '@/features/places/map-navigation';
import { validBookmarkPin,type BookmarkMetadata } from './bookmark-metadata';
import { BookmarkEditor } from './bookmark-editor';

const SafeArea = withUniwind(SafeAreaView);
const StyledImage = withUniwind(Image);
const destinationForBookmark=(reference:Bookmark)=>reference.kind==='featured'?getDestination(reference.id):matchedFeaturedDestination({provider:'google',providerId:reference.id});
const logicalBookmarkKey=(reference:Bookmark)=>{const destination=destinationForBookmark(reference);return destination?`featured:${destination.id}`:bookmarkKey(reference);};
export default function SavedPlacesScreen() {
  const { t } = useTranslation();
  const journal = useJournal();
  const client = useQueryClient();
  const {language} = useSettings();
  const focused = useIsFocused();
  const active = useAppActive();
  const scope=useMemo(()=>({principalId:journal?.principalId,focused,active,ready:journal?.ready}),[journal?.principalId,focused,active,journal?.ready]);
  const committedScope=useRef<typeof scope|null>(null);
  useLayoutEffect(()=>{committedScope.current=scope;return()=>{committedScope.current=null;};},[scope]);
  const navigating = useRef(false);
  useEffect(()=>{if(focused)navigating.current=false;},[focused,journal?.principalId]);
  function open(reference:Bookmark) {
    if(committedScope.current!==scope || !scope.ready || !scope.focused || !scope.active || navigating.current)return;
    navigating.current=true;
    const destination=destinationForBookmark(reference);
    if(destination){router.push({pathname:'/destinations/[destinationId]',params:{destinationId:destination.id}});return;}
    if(reference.kind==='google') {
      const metadata=journal?.metadata[bookmarkKey(reference)];const pin=validBookmarkPin(metadata);
      const cached=availablePlaceDetailsSnapshot(client,reference.id,language);
      openGooglePlaceOnMap(client,{providerId:reference.id,principalId:journal?.principalId,name:metadata?.label,
        ...(pin?{coordinates:pin.coordinates,capturedAt:pin.capturedAt}:{}),language,
        ...(cached?{place:cached.place,updatedAt:cached.updatedAt}:{})});
    } else router.push({pathname:'/destinations/[destinationId]',params:{destinationId:reference.id}});
  }
  const visible=new Map<string,Bookmark>();const groups=new Map<string,Bookmark[]>();
  for(const reference of journal?.ready?journal.state.bookmarks:[]){const key=logicalBookmarkKey(reference);groups.set(key,[...(groups.get(key)??[]),reference]);if(!visible.has(key)||reference.kind==='featured')visible.set(key,reference);}
  const rows=[...visible.values()];
  const [accent, onAccent] = useThemeColor(['accent', 'accent-foreground']);
  return <SafeArea className="flex-1 bg-page" edges={['top', 'bottom', 'left', 'right']}>
    <View className="flex-row items-center gap-3 px-4 py-3">
      <Button isIconOnly variant="ghost" accessibilityLabel={t('common.back')} onPress={() => { if (router.canGoBack()) router.back(); else router.navigate('/'); }}>
        <Ionicons name="arrow-back" size={24} color={accent} accessible={false} />
      </Button>
      <Text accessibilityRole="header" className="shrink font-sans text-section font-ui-semibold text-brand-strong">{t('journal.savedTitle')}</Text>
    </View>
    <FlatList<Bookmark> className="flex-1" contentContainerClassName="px-4 pb-8" keyboardShouldPersistTaps="handled"
      data={rows} keyExtractor={bookmarkKey}
      ListHeaderComponent={<View className="gap-3 pb-4"><JournalSyncStatusView /><JournalFeedback />
        <View className="gap-1 pt-2">
          <Text accessibilityRole="header" className="font-sans text-title font-ui-bold text-brand-strong">{t('journal.savedHeading')}</Text>
          {journal?.ready && <Text className="font-sans text-sm text-muted">{t('journal.savedCount', {count: rows.length})}</Text>}
        </View></View>}
      ListEmptyComponent={journal?.ready ? <View className="items-start gap-3 py-8">
        <Ionicons name="bookmark-outline" size={28} color={accent} accessible={false} />
        <Text className="font-sans text-base text-muted">{t('journal.savedEmpty')}</Text>
      </View> : null}
      ItemSeparatorComponent={() => <View className="h-3" />}
      renderItem={({ item: reference }) => {
        const destination=destinationForBookmark(reference);
        const aliases=(groups.get(logicalBookmarkKey(reference))??[]).filter(item=>bookmarkKey(item)!==bookmarkKey(reference));
        const localMetadata=[reference,...aliases].map(item=>journal?.metadata[bookmarkKey(item)]).find(value=>value?.label||value?.note);
        return <Surface className="flex-row flex-wrap items-start gap-3 rounded-card p-4">
          <View className="size-12 items-center justify-center rounded-input bg-mint" accessible={false}><Ionicons name="location-outline" size={24} color={accent} /></View>
          <View className="min-w-32 flex-1 gap-1">
            {reference.kind==='google'&&!destination ? <SavedGoogleSummary providerId={reference.id} metadata={journal?.metadata[bookmarkKey(reference)]}/> : <>
              <Text className="font-sans text-card font-ui-semibold text-brand-strong">{destination ? destinationName(destination,language) : t('journal.savedTitle')}</Text>
              <Text className="font-sans text-sm text-muted">{t('journal.featuredMetadata')}</Text>
              {localMetadata?.label&&<Text className="font-sans text-sm text-muted">{localMetadata.label}</Text>}
              {localMetadata?.note&&<Text className="font-sans text-sm text-muted">{localMetadata.note}</Text>}
            </>}
          </View>
          <View className="gap-1">
            <Button accessibilityLabel={t('journal.open')} onPress={() => open(reference)}><Button.Label>{t('journal.openShort')}</Button.Label><Ionicons name="chevron-forward" size={18} color={onAccent} accessible={false} /></Button>
            <SavePlaceAction reference={reference} aliases={aliases} variant="ghost" compact />
          </View>
          {reference.kind==='google'&&!destination&&<View className="w-full"><SavedLabelEditor key={`${journal?.principalId}:${bookmarkKey(reference)}`} reference={reference}/></View>}
        </Surface>;
      }} />
  </SafeArea>;
}

/** Visible list rows only observe known, same-language data; they never fetch. */
function SavedGoogleSummary({providerId,metadata}:{providerId:string;metadata?:BookmarkMetadata}) {
  const {t}=useTranslation();const {language}=useSettings();const client=useQueryClient();
  const query=useQuery({...placeDetailsOptions(client,providerId,language),enabled:false});
  const [,refresh]=useReducer(value=>value+1,0);
  const previous=useRef<ReturnType<typeof availablePlaceDetailsSnapshot> | null>(null);
  const getSnapshot=useCallback(()=>{
    const next=availablePlaceDetailsSnapshot(client,providerId,language) ?? null;
    if(previous.current?.place===next?.place && previous.current?.updatedAt===next?.updatedAt)return previous.current;
    previous.current=next;return next;
  },[client,providerId,language]);
  const subscribe=useCallback((onChange:()=>void)=>client.getQueryCache().subscribe(event=>{
    if(event.type!=='updated' && event.type!=='removed' && event.type!=='added')return;
    const key=event.query.queryKey;
    if((key[0]==='places' && key[2]===language) || (key[0]==='place-details' && key[1]===providerId && key[2]===language))onChange();
  }),[client,providerId,language]);
  const cached=useSyncExternalStore(subscribe,getSnapshot,getSnapshot);
  const timestamp=cached?.updatedAt ?? query.dataUpdatedAt;
  useEffect(()=>{
    const now=Date.now();const remaining=AR.nearbyReuseMs-(now-timestamp);
    if(timestamp<=0 || timestamp>now || remaining<0)return;
    const timer=setTimeout(refresh,remaining+1);return()=>clearTimeout(timer);
  },[timestamp]);
  const place=cached?.place;
  return <>
    <Text className="font-sans text-card font-ui-semibold text-brand-strong">{metadata?.label ?? place?.name ?? t('journal.googlePlace')}</Text>
    {metadata?.note&&<Text className="font-sans text-sm text-muted">{metadata.note}</Text>}
    {!metadata?.label&&!place&&<Text className="font-sans text-sm text-muted">{t('journalCleanup.idOnly')}</Text>}
    {metadata?.label&&place&&place.name!==metadata.label&&<Text className="font-sans text-sm text-muted">{place.name}</Text>}
    {place?.address?.trim() && <Text className="font-sans text-sm text-muted">{place.address}</Text>}
    {place && <><StyledImage source={googleMapsAttribution} accessibilityLabel="Google Maps" className="mt-1 h-[18px] w-[98px]" resizeMode="contain"/><ProviderAttributions places={[place]}/></>}
  </>;
}

function SavedLabelEditor({reference}:{reference:Bookmark}) {
 const journal=useJournal();const {t}=useTranslation();const [editing,setEditing]=useState(false);
 if(!journal)return null;
 return <>{editing?<BookmarkEditor initial={journal.metadata[bookmarkKey(reference)]} save={metadata=>journal.save(reference,true,metadata)} onClose={()=>setEditing(false)}/>:<Button variant="ghost" accessibilityLabel={t('journalCleanup.rename')} onPress={()=>setEditing(true)}><Button.Label>{t('journalCleanup.rename')}</Button.Label></Button>}</>;
}
