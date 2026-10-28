import { createContext,useContext } from 'react';
export type GuestAccess={enabled:boolean;loading:boolean;error:'journal.loadFailed'|'journal.saveFailed'|null;enter():Promise<boolean>;retry():void};
export const GuestContext=createContext<GuestAccess>({enabled:false,loading:false,error:null,enter:async()=>false,retry:()=>{}});
export const useGuestAccess=()=>useContext(GuestContext);
