import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback,useEffect,useRef,useState,type PropsWithChildren } from 'react';
import { useAuth } from '@/features/auth/provider';
import { useGuestAccess } from '@/features/auth/guest-context';
import { useJournalSync } from './use-journal-sync';
import type { JournalAccount } from './sync-service';
import { JournalRepository } from './repository';
import { emptyJournal,saveBookmark,stampDestination,type Bookmark,type Journal } from './model';
import type { PreparedArEntry } from '@/features/destination-ar/admission-store';
import { JournalContext,type JournalContextValue } from './context';
const repository=new JournalRepository(AsyncStorage);
export { useJournal } from './context';
export function JournalProvider({children}:PropsWithChildren){
 const {session}=useAuth();const guest=useGuestAccess();const principal=session?.user.id??(guest.enabled?'guest':null);
 return principal?<JournalOwner key={principal} principalId={principal} account={session?{principalId:session.user.id,accessToken:session.access_token}:null}>{children}</JournalOwner>:<JournalContext.Provider value={null}>{children}</JournalContext.Provider>;
}
function JournalOwner({principalId,account,children}:PropsWithChildren<{principalId:string;account:JournalAccount|null}>){
 const [state,setState]=useState(emptyJournal);const [ready,setReady]=useState(false);const [error,setError]=useState<JournalContextValue['error']>(null);const [attempt,setAttempt]=useState(0);const live=useRef(false);const [editEpoch,setEditEpoch]=useState(0);
 const sync=useJournalSync(repository,principalId,account,ready,editEpoch,setState);
 useEffect(()=>{live.current=true;let current=true;void repository.open(principalId,()=>current).then(s=>{if(current){setState(s);setError(null);setReady(true);}}).catch(()=>{if(current){setError('journal.loadFailed');setReady(false);}});return()=>{current=false;live.current=false;};},[principalId,attempt]);
 const change=useCallback(async(update:(s:Journal)=>Journal)=>{if(!live.current||!ready)return false;try{const s=await repository.change(principalId,update);if(live.current){setState(s);setError(null);setEditEpoch(e=>e+1);}return true;}catch{if(live.current)setError('journal.saveFailed');return false;}},[principalId,ready]);
 const save=useCallback((ref:Bookmark,saved:boolean)=>change(s=>saveBookmark(s,ref,saved)),[change]);
 const award=useCallback(async(entry:PreparedArEntry)=>{
  if(entry.simulated||entry.kind!=='approved'||entry.identity.provenance!=='verified'||entry.identity.principalId!==principalId)return false;
  return change(s=>stampDestination(s,entry.destination.id,Date.now(),'verified'));
 },[change,principalId]);
 return <JournalContext.Provider value={{state,ready,error,principalId,sync:sync.status,syncNow:sync.syncNow,retry:()=>setAttempt(x=>x+1),save,award}}>{children}</JournalContext.Provider>;
}
