import { createContext,useContext } from 'react';
import type { JournalSyncStatus } from './sync-controller';
import type { Journal,Bookmark } from './model';
import type { PreparedArEntry } from '@/features/destination-ar/admission-store';
export type JournalContextValue={state:Journal;ready:boolean;error:'journal.loadFailed'|'journal.saveFailed'|null;principalId:string;sync:JournalSyncStatus;syncNow():void;retry():void;save(ref:Bookmark,saved:boolean):Promise<boolean>;award(entry:PreparedArEntry):Promise<boolean>};
export const JournalContext=createContext<JournalContextValue|null>(null);
export const useJournal=()=>useContext(JournalContext);
