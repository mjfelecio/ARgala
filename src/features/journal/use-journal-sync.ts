import { useCallback,useEffect,useRef,useState } from 'react';
import { useAppActive } from '@/lib/use-app-active';
import type { Journal } from './model';
import type { JournalRepository } from './repository';
import { JournalSyncController,type JournalSyncStatus } from './sync-controller';
import { journalSyncService,type JournalAccount } from './sync-service';
export function useJournalSync(repository:JournalRepository,principalId:string,account:JournalAccount|null,ready:boolean,editEpoch:number,publish:(journal:Journal)=>void){
 const active=useAppActive();const accountRef=useRef(account);const controller=useRef<JournalSyncController|null>(null);const debounce=useRef<ReturnType<typeof setTimeout>|undefined>(undefined);const scheduled=useRef(0);
 const [status,setStatus]=useState<JournalSyncStatus>({phase:principalId==='guest'?'local':'pending'});const hasToken=!!account?.accessToken;
 useEffect(()=>{accountRef.current=account;},[account]);
 useEffect(()=>{
  if(!active||!ready||!hasToken||!accountRef.current||principalId==='guest')return;
  let current=true;const owner=new JournalSyncController(repository,principalId,journalSyncService,value=>{if(current)publish(value);},value=>{if(current)setStatus(value);});controller.current=owner;void owner.run(accountRef.current);
  return()=>{current=false;clearTimeout(debounce.current);owner.close();if(controller.current===owner)controller.current=null;};
 },[repository,principalId,hasToken,active,ready,publish]);
 useEffect(()=>{
  if(!active||!ready||!editEpoch||editEpoch===scheduled.current||!controller.current)return;scheduled.current=editEpoch;
  setStatus(value=>value.phase==='synced'?{phase:'pending'}:value);
  debounce.current=setTimeout(()=>{if(accountRef.current)void controller.current?.localChanged(accountRef.current);},300);
  return()=>clearTimeout(debounce.current);
 },[editEpoch,active,ready]);
 const syncNow=useCallback(()=>{clearTimeout(debounce.current);if(active&&ready&&accountRef.current)void controller.current?.run(accountRef.current);},[active,ready]);
 return {status,syncNow};
}
