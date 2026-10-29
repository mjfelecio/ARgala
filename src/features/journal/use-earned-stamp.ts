import { useCallback,useRef } from 'react';
import type { PreparedArEntry } from '@/features/destination-ar/admission-store';
import { useJournal } from './context';
/** Capture only actual AR tracking-ready or the approved unsupported reader's fresh, visible establishment event. Retry cannot create one. */
export function useEarnedStamp(entry:PreparedArEntry){
 const journal=useJournal();const earned=useRef<PreparedArEntry|null>(null);const completed=useRef(false);const pending=useRef(false);
 const award=journal?.award;
 const retry=useCallback(()=>{const event=earned.current;if(!event||event!==entry||!award||completed.current||pending.current)return;pending.current=true;
  void award(event).then(saved=>{completed.current=saved;}).finally(()=>{pending.current=false;});
 },[award,entry]);
 const onEstablished=useCallback(()=>{earned.current=entry;retry();},[entry,retry]);
 return {onEstablished,retry};
}
