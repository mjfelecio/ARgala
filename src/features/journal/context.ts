import { createContext,useContext } from 'react';
import type { Journal,Bookmark } from './model';
import type { PreparedArEntry } from '@/features/destination-ar/admission-store';
export type JournalContextValue={state:Journal;ready:boolean;error:'journal.loadFailed'|'journal.saveFailed'|null;principalId:string;retry():void;save(ref:Bookmark,saved:boolean):Promise<boolean>;award(entry:PreparedArEntry):Promise<boolean>};
export const JournalContext=createContext<JournalContextValue|null>(null);
export const useJournal=()=>useContext(JournalContext);
