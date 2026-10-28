import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect,useRef,useState,type PropsWithChildren } from 'react';
import { queryClient } from '@/lib/query';
import { GuestContext,type GuestAccess } from './guest-context';
export { useGuestAccess } from './guest-context';
const key='argala.guest.v1';
export function GuestAccessProvider({children}:PropsWithChildren){
 const [state,setState]=useState({enabled:false,loading:true,error:null as GuestAccess['error']});const [attempt,setAttempt]=useState(0);const pending=useRef(false);const alive=useRef(false);
 useEffect(()=>{alive.current=true;let current=true;void AsyncStorage.getItem(key).then(raw=>{if(current)setState({enabled:raw==='enabled',loading:false,error:null});}).catch(()=>{if(current)setState({enabled:false,loading:false,error:'journal.loadFailed'});});return()=>{current=false;alive.current=false;};},[attempt]);
 async function enter(){if(pending.current||state.loading)return false;pending.current=true;try{await AsyncStorage.setItem(key,'enabled');if(alive.current){queryClient.clear();setState({enabled:true,loading:false,error:null});}return true;}catch{if(alive.current)setState(s=>({...s,error:'journal.saveFailed'}));return false;}finally{pending.current=false;}}
 return <GuestContext.Provider value={{...state,enter,retry:()=>{setState(s=>({...s,loading:true}));setAttempt(x=>x+1);}}}>{children}</GuestContext.Provider>;
}
