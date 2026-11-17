import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback,useEffect,useRef,useState,type PropsWithChildren } from 'react';
import { useAuth } from '@/features/auth/provider';
import { useGuestAccess } from '@/features/auth/guest-context';
import { useJournalSync } from './use-journal-sync';
import type { JournalAccount } from './sync-service';
import { JournalRepository } from './repository';
import { emptyJournal,stampDestination,type Bookmark,type Journal } from './model';
import type { PreparedArEntry } from '@/features/destination-ar/admission-store';
import { JournalContext,type JournalContextValue } from './context';
import { useAppActive } from '@/lib/use-app-active';
import { BOOKMARK_PIN_MAX_AGE_MS,cleanBookmarkMetadata,type BookmarkMetadata,type BookmarkMetadataMap } from './bookmark-metadata';
const repository=new JournalRepository(AsyncStorage);
export { useJournal } from './context';
export function JournalProvider({children}:PropsWithChildren){
 const {session}=useAuth();const guest=useGuestAccess();const principal=session?.user.id??(guest.enabled?'guest':null);
 return principal?<JournalOwner key={principal} principalId={principal} account={session?{principalId:session.user.id,accessToken:session.access_token}:null}>{children}</JournalOwner>:<JournalContext.Provider value={null}>{children}</JournalContext.Provider>;
}
function JournalOwner({principalId,account,children}:PropsWithChildren<{principalId:string;account:JournalAccount|null}>){
 const [state,setState]=useState(emptyJournal);const [metadata,setMetadata]=useState<BookmarkMetadataMap>({});const [ready,setReady]=useState(false);const [error,setError]=useState<JournalContextValue['error']>(null);const [attempt,setAttempt]=useState(0);const live=useRef(false);const [editEpoch,setEditEpoch]=useState(0);
 const active=useAppActive();
 const publish=useCallback((journal:Journal)=>{setState(journal);setMetadata(value=>cleanBookmarkMetadata(journal,value));},[]);
 const sync=useJournalSync(repository,principalId,account,ready,editEpoch,publish);
 useEffect(()=>{live.current=true;let current=true;void repository.openLocal(principalId,()=>current).then(s=>{if(current){setState(s.journal);setMetadata(s.metadata);setError(null);setReady(true);}}).catch(()=>{if(current){setError('journal.loadFailed');setReady(false);}});return()=>{current=false;live.current=false;};},[principalId,attempt]);
 const change=useCallback(async(update:(s:Journal)=>Journal)=>{if(!live.current||!ready)return false;try{const s=await repository.changeLocal(principalId,update,()=>live.current);if(live.current){setState(s.journal);setMetadata(s.metadata);setError(null);setEditEpoch(e=>e+1);}return live.current;}catch{if(live.current)setError('journal.saveFailed');return false;}},[principalId,ready]);
 const save=useCallback(async(ref:Bookmark,saved:boolean,nextMetadata?:BookmarkMetadata,aliases?:Bookmark[])=>{
  if(!live.current||!ready)return false;
  try{const result=await repository.save(principalId,ref,saved,nextMetadata,aliases,()=>live.current);if(!live.current)return false;setState(result.journal);setMetadata(result.metadata);setError(null);setEditEpoch(e=>e+1);return true;}catch{if(live.current)setError('journal.saveFailed');return false;}
 },[principalId,ready]);
 // Expiry removes coordinates from the durable envelope even when no further save occurs.
 useEffect(()=>{
  if(!ready||!active)return;
  const deadlines=Object.values(metadata).flatMap(value=>value.pin?[value.pin.capturedAt+BOOKMARK_PIN_MAX_AGE_MS]:[]);
  if(!deadlines.length)return;
  let current=true;let timer:ReturnType<typeof setTimeout>;
  const schedule=()=>{const remaining=Math.min(...deadlines)-Date.now();timer=setTimeout(()=>{
   if(!current)return;if(remaining>86400000){schedule();return;}
   void repository.changeLocal(principalId,value=>value,()=>current&&live.current).then(result=>{if(current&&live.current)setMetadata(result.metadata);}).catch(()=>{if(current&&live.current){setError('journal.saveFailed');timer=setTimeout(schedule,30000);}});
  },Math.max(0,Math.min(remaining,86400000)));};
  schedule();return()=>{current=false;clearTimeout(timer);};
 },[metadata,ready,active,principalId]);
 const award=useCallback(async(entry:PreparedArEntry)=>{
  if(entry.simulated||entry.kind!=='approved'||entry.identity.provenance!=='verified'||entry.identity.principalId!==principalId)return false;
  return change(s=>stampDestination(s,entry.destination.id,Date.now(),'verified'));
 },[change,principalId]);
 return <JournalContext.Provider value={{state,metadata,ready,error,principalId,sync:sync.status,syncNow:sync.syncNow,retry:()=>setAttempt(x=>x+1),save,award}}>{children}</JournalContext.Provider>;
}
