import { environment } from '@/config/env';
import { syncRequestSchema,syncResponseSchema,type SyncRequest,type SyncResponse } from './sync-protocol';
export type JournalAccount=Readonly<{principalId:string;accessToken:string}>;
export type SyncErrorCode='journal.syncFailed'|'journal.syncTimeout'|'journal.syncAuth'|'journal.syncUnavailable'|'journal.syncConflict'|'journal.syncDeviceLimit';
export class JournalSyncError extends Error {constructor(readonly code:SyncErrorCode){super(code);}}
export type JournalSyncTransport=(request:SyncRequest,account:JournalAccount,signal:AbortSignal)=>Promise<SyncResponse>;
const maxBytes=1024*1024;
function utf8Length(value:string){let bytes=0;for(let i=0;i<value.length;i++){const code=value.charCodeAt(i);if(code<=127)bytes++;else if(code<=2047)bytes+=2;else if(code>=0xd800&&code<=0xdbff&&i+1<value.length&&value.charCodeAt(i+1)>=0xdc00&&value.charCodeAt(i+1)<=0xdfff){bytes+=4;i++;}else bytes+=3;}return bytes;}
/** A captured token, never the mutable SDK client's later session, owns this request. */
export function createJournalSyncService(config:{url:string;key:string},network:typeof fetch=(input,init)=>fetch(input,init)):JournalSyncTransport{
 return async(request,account,parentSignal)=>{
  if(parentSignal.aborted)throw new JournalSyncError('journal.syncFailed');
  if(account.principalId==='guest'||!account.accessToken)throw new JournalSyncError('journal.syncAuth');
  const {clientId,flight}=syncRequestSchema.parse(request);const token=account.accessToken;
  if(new URL(config.url).protocol!=='https:')throw new JournalSyncError('journal.syncUnavailable');
  const body=JSON.stringify({p_client_id:clientId,p_request_id:flight.requestId,p_sequence:flight.sequence,p_revision:flight.revision,p_journal:flight.journal});
  if(utf8Length(body)>maxBytes)throw new JournalSyncError('journal.syncFailed');
  const abort=new AbortController();let rejectStop!:(error:JournalSyncError)=>void;
  const stopped=new Promise<never>((_,reject)=>{rejectStop=reject;});
  const stop=()=>{abort.abort();rejectStop(new JournalSyncError('journal.syncFailed'));};parentSignal.addEventListener('abort',stop,{once:true});
  const timer=setTimeout(()=>{rejectStop(new JournalSyncError('journal.syncTimeout'));abort.abort();},15000);
  try{
   const operation=async()=>{
    const response=await network(config.url.replace(/\/$/,'')+'/rest/v1/rpc/sync_travel_journal',{method:'POST',headers:{'Content-Type':'application/json',apikey:config.key,Authorization:`Bearer ${token}`},body,signal:abort.signal});
    if(response.status===401||response.status===403)throw new JournalSyncError('journal.syncAuth');
    if(response.status===404)throw new JournalSyncError('journal.syncUnavailable');
    const length=response.headers.get('content-length');if(length!==null&&(!Number.isFinite(Number(length))||Number(length)<0||Number(length)>maxBytes))throw new JournalSyncError('journal.syncFailed');
    const text=await response.text();if(utf8Length(text)>maxBytes)throw new JournalSyncError('journal.syncFailed');
    if(!response.ok){let code:unknown;try{code=(JSON.parse(text) as {code?:unknown})?.code;}catch{}throw new JournalSyncError(code==='54000'?'journal.syncDeviceLimit':'journal.syncFailed');}
    return syncResponseSchema.parse(JSON.parse(text));
   };
   return await Promise.race([operation(),stopped]);
  }catch(error){throw error instanceof JournalSyncError?error:new JournalSyncError('journal.syncFailed');}
  finally{clearTimeout(timer);parentSignal.removeEventListener('abort',stop);}
 };
}
export const journalSyncService:JournalSyncTransport=(request,account,signal)=>{
 if(!environment.success)return Promise.reject(new JournalSyncError('journal.syncUnavailable'));
 return createJournalSyncService(environment.data)(request,account,signal);
};
