import { useLayoutEffect,useMemo,useRef,useState } from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useThemeColor } from 'heroui-native/hooks';
import { Text,View } from 'react-native';
import { Button } from 'heroui-native/button';
import { useTranslation } from 'react-i18next';
import { useJournal,type JournalContextValue } from './context';
import type { BookmarkMetadata } from './bookmark-metadata';
import { BookmarkSaveOverlay } from './bookmark-save-overlay';
import { useIsFocused } from 'expo-router';
import { useAppActive } from '@/lib/use-app-active';
import { bookmarkKey,type Bookmark } from './model';
export function SavePlaceAction({reference,variant='secondary',compact=false,className,pin,placeName,aliases=[]}:{reference:Bookmark;variant?:'secondary'|'ghost'|'outline';compact?:boolean;className?:string;pin?:BookmarkMetadata['pin'];placeName?:string;aliases?:Bookmark[]}){
 const journal=useJournal();
 if(!journal)return null;
 return <SavePlaceOwner key={`${journal.principalId}:${bookmarkKey(reference)}`} journal={journal} reference={reference} variant={variant} compact={compact} className={className} pin={pin} placeName={placeName} aliases={aliases}/>;
}
function SavePlaceOwner({journal,reference,variant,compact,className,pin,placeName,aliases}:{journal:JournalContextValue;reference:Bookmark;variant:'secondary'|'ghost'|'outline';compact:boolean;className?:string;pin?:BookmarkMetadata['pin'];placeName?:string;aliases:Bookmark[]}) {
 const {t}=useTranslation();const accent=useThemeColor('accent');const pending=useRef(false);const [busy,setBusy]=useState(false);const [editing,setEditing]=useState<object|null>(null);
 const focused=useIsFocused();const active=useAppActive();
 const scope=useMemo(()=>({principalId:journal.principalId,focused,active}),[journal.principalId,focused,active]);
 const currentScope=useRef<typeof scope|null>(null);
 useLayoutEffect(()=>{currentScope.current=scope;return()=>{currentScope.current=null;};},[scope]);
 const isCurrent=()=>currentScope.current===scope&&scope.focused&&scope.active;
 const keys=new Set([reference,...aliases].map(bookmarkKey));const saved=journal.state.bookmarks.some(x=>keys.has(bookmarkKey(x)));const label=t(saved?'journal.remove':'journal.save');
 return <View>
 <Button variant={variant} className={className} accessibilityLabel={label} isDisabled={!journal.ready||busy} accessibilityState={{busy,disabled:!journal.ready||busy}} onPress={async()=>{
  if(!isCurrent()||pending.current||!journal.ready)return;
  if(!saved&&reference.kind==='google'){setEditing(scope);return;}
  pending.current=true;setBusy(true);try{if(aliases.length)await journal.save(reference,!saved,undefined,aliases);else await journal.save(reference,!saved);}finally{pending.current=false;if(currentScope.current)setBusy(false);}
 }}><Ionicons name={compact&&saved?'trash-outline':saved?'bookmark':'bookmark-outline'} size={20} color={accent} accessible={false} /><Button.Label>{t(compact&&saved?'journal.removeShort':saved?'journal.savedShort':'journal.saveShort')}</Button.Label>{saved&&!compact&&<Ionicons name="checkmark" size={18} color={accent} accessible={false} />}</Button>
 {editing===scope&&!saved&&active&&focused&&<BookmarkSaveOverlay placeName={placeName} pending={pending} onPendingChange={value=>{pending.current=value;}} isCurrent={isCurrent} save={metadata=>isCurrent()?journal.save(reference,true,{...metadata,...(pin?{pin}: {})}):Promise.resolve(false)} onClose={()=>{if(isCurrent()&&!pending.current)setEditing(null);}}/>}
 </View>;
}
export function JournalFeedback({onRetrySave}:{onRetrySave?:()=>void}={}){const journal=useJournal();const {t}=useTranslation();if(!journal)return null;
 return <>{!journal.ready&&!journal.error&&<Text className="font-sans text-sm text-muted">{t('common.loading')}</Text>}{journal.error&&<Text accessibilityLiveRegion="polite" className="font-sans text-sm text-danger">{t(journal.error)}</Text>}{journal.error==='journal.saveFailed'&&onRetrySave&&<Button variant="secondary" accessibilityLabel={t('common.retry')} onPress={onRetrySave}><Button.Label>{t('common.retry')}</Button.Label></Button>}{journal.error==='journal.loadFailed'&&<Button variant="secondary" accessibilityLabel={t('common.retry')} onPress={journal.retry}><Button.Label>{t('common.retry')}</Button.Label></Button>}</>;
}
