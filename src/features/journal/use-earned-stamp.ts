import { useCallback,useRef } from 'react';
import type { PreparedArEntry } from '@/features/destination-ar/admission-store';
import { useJournal } from './context';
/** Called exclusively after the session's first tracking-ready notification. */
export function useEarnedStamp(entry:PreparedArEntry){
 const journal=useJournal();const completed=useRef(false);const pending=useRef(false);
 const award=journal?.award;
 return useCallback(()=>{if(!award||completed.current||pending.current)return;pending.current=true;
  void award(entry).then(saved=>{completed.current=saved;}).finally(()=>{pending.current=false;});
 },[award,entry]);
}
