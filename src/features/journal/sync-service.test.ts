import { expect,it,vi } from 'vitest';
import { createJournalSyncService,JournalSyncError } from './sync-service';
import { beginSync } from './sync-protocol';
import { emptyJournal } from './model';
const request=beginSync(emptyJournal()).request;
const account={principalId:'user-a',accessToken:'test-token-a'};
const payload={status:'applied',sequence:request.flight.sequence,requestId:request.flight.requestId,revision:0,journal:emptyJournal()};
const config={url:'https://example.supabase.co',key:'sb_publishable_test'};
it('sends only identifier journal data with a captured bearer, not later auth state',async()=>{
 const network=vi.fn(async()=>new Response(JSON.stringify(payload)));const sync=createJournalSyncService(config,network);
 await sync(request,account,new AbortController().signal);const [url,init]=network.mock.calls[0] as unknown as [string,RequestInit];expect(url).toBe(config.url+'/rest/v1/rpc/sync_travel_journal');expect(init.headers).toMatchObject({Authorization:'Bearer test-token-a',apikey:config.key});expect(JSON.parse(init.body as string)).toEqual({p_client_id:request.clientId,p_request_id:request.flight.requestId,p_sequence:request.flight.sequence,p_revision:0,p_journal:emptyJournal()});expect(init.body).not.toMatch(/token|principal|latitude|name/);
});
it.each([[401,'journal.syncAuth'],[403,'journal.syncAuth'],[404,'journal.syncUnavailable'],[500,'journal.syncFailed']])('maps HTTP%s without displaying raw errors',async(status,code)=>{
 const sync=createJournalSyncService(config,async()=>new Response('PRIVATE provider error',{status:Number(status)}));await expect(sync(request,account,new AbortController().signal)).rejects.toMatchObject({code});
});
it('bounds invalid/oversized responses and rejects unknown fields',async()=>{
 for(const body of ['not-json',JSON.stringify({...payload,access_token:'private'}),'x'.repeat(1048577)]){const sync=createJournalSyncService(config,async()=>new Response(body));await expect(sync(request,account,new AbortController().signal)).rejects.toBeInstanceOf(JournalSyncError);}
});
it('bounds the entire request including a stalled response body',async()=>{
 vi.useFakeTimers();try{const sync=createJournalSyncService(config,async()=>({ok:true,status:200,headers:new Headers(),text:()=>new Promise<string>(()=>{})}) as Response);const pending=sync(request,account,new AbortController().signal);const assertion=expect(pending).rejects.toMatchObject({code:'journal.syncTimeout'});await vi.advanceTimersByTimeAsync(15000);await assertion;}finally{vi.useRealTimers();}
});
it('cancels a retired owner even if fetch ignores abort and never sends an already-aborted request',async()=>{
 const network=vi.fn(()=>new Promise<Response>(()=>{}));const sync=createJournalSyncService(config,network);const abort=new AbortController();const pending=sync(request,account,abort.signal);const assertion=expect(pending).rejects.toBeInstanceOf(JournalSyncError);abort.abort();await assertion;
 network.mockClear();await expect(sync(request,account,abort.signal)).rejects.toBeInstanceOf(JournalSyncError);expect(network).not.toHaveBeenCalled();
});
it('maps the bounded device-receipt capacity error without exposing SQL diagnostics',async()=>{
 const sync=createJournalSyncService(config,async()=>new Response(JSON.stringify({code:'54000',message:'PRIVATE SQL detail'}),{status:500}));await expect(sync(request,account,new AbortController().signal)).rejects.toMatchObject({code:'journal.syncDeviceLimit'});
});
