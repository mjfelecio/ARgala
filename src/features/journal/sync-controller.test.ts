import { expect,it,vi } from 'vitest';
import { JournalRepository } from './repository';
import { emptyJournal,saveBookmark } from './model';
import { JournalSyncController } from './sync-controller';
import { JournalSyncError,type JournalSyncTransport } from './sync-service';
import type { SyncRequest } from './sync-protocol';
const account={principalId:'user-a',accessToken:'test-token'};
function setup(){const disk=new Map<string,string>();const repo=new JournalRepository({getItem:async k=>disk.get(k)??null,setItem:async(k,v)=>{disk.set(k,v);}});const status=vi.fn(),publish=vi.fn();return {repo,status,publish};}
const applied=(r:SyncRequest)=>({status:'applied' as const,sequence:r.flight.sequence,requestId:r.flight.requestId,revision:r.flight.revision,journal:r.flight.journal});
it('coalesces duplicate starts and never mixes account tokens',async()=>{
 const {repo,status,publish}=setup();const gate=Promise.withResolvers<void>();const transport=vi.fn<JournalSyncTransport>(async(r:SyncRequest)=>{await gate.promise;return applied(r);});const owner=new JournalSyncController(repo,account.principalId,transport,publish,status);
 const one=owner.run(account),two=owner.run(account);gate.resolve();await Promise.all([one,two]);expect(transport).toHaveBeenCalledOnce();expect(transport.mock.calls[0][1]).toEqual(account);expect(status).toHaveBeenLastCalledWith({phase:'synced'});
});
it('keeps local edits after failure and explicitly retries the same durable request',async()=>{
 const {repo,status,publish}=setup();await repo.change('user-a',s=>saveBookmark(s,{kind:'google',id:'ChIJ_offline'},true));const transport=vi.fn().mockRejectedValueOnce(new JournalSyncError('journal.syncFailed')).mockImplementation(async r=>applied(r));const owner=new JournalSyncController(repo,'user-a',transport,publish,status);
 await owner.run(account);expect((await repo.open('user-a')).bookmarks).toHaveLength(1);expect(status).toHaveBeenLastCalledWith({phase:'failed',error:'journal.syncFailed'});await owner.run(account);expect(transport.mock.calls[1][0]).toEqual(transport.mock.calls[0][0]);expect(status).toHaveBeenLastCalledWith({phase:'synced'});
});
it('reconciles edits made while a sync is in flight',async()=>{
 const {repo,status,publish}=setup();const gate=Promise.withResolvers<void>();let calls=0;const transport=vi.fn<JournalSyncTransport>(async(r:SyncRequest)=>{if(++calls===1)await gate.promise;return applied(r);});const owner=new JournalSyncController(repo,'user-a',transport,publish,status);const pending=owner.run(account);
 await repo.change('user-a',s=>saveBookmark(s,{kind:'google',id:'ChIJ_later'},true));owner.localChanged(account);gate.resolve();await pending;expect((await repo.open('user-a')).bookmarks).toHaveLength(1);expect(status).toHaveBeenLastCalledWith({phase:'synced'});expect(transport.mock.calls.length).toBeGreaterThanOrEqual(2);
});
it('discards retired results and leaves the account flight for its next authenticated owner',async()=>{
 const {repo,status,publish}=setup();const gate=Promise.withResolvers<void>();const transport=vi.fn<JournalSyncTransport>(async(r:SyncRequest)=>{await gate.promise;return applied(r);});const owner=new JournalSyncController(repo,'user-a',transport,publish,status);const pending=owner.run(account);await new Promise(resolve=>setTimeout(resolve,0));owner.close();gate.resolve();await pending;expect(publish).not.toHaveBeenCalled();expect(status).not.toHaveBeenLastCalledWith({phase:'synced'});expect(await repo.prepareSync('user-a')).toEqual(transport.mock.calls[0][0]);
});
it('bounds persistent conflicts and rejects guest or another principal',async()=>{
 const {repo,status,publish}=setup();const transport=vi.fn<JournalSyncTransport>(async(r:SyncRequest)=>({...applied(r),status:'conflict' as const,revision:r.flight.revision+1,journal:emptyJournal()}));await repo.change('user-a',s=>saveBookmark(s,{kind:'google',id:'ChIJ_pending'},true));const owner=new JournalSyncController(repo,'user-a',transport,publish,status);await owner.run({...account,principalId:'user-b'});expect(transport).not.toHaveBeenCalled();await owner.run(account);expect(transport).toHaveBeenCalledTimes(4);expect(status).toHaveBeenLastCalledWith({phase:'failed',error:'journal.syncConflict'});
 const guest=new JournalSyncController(repo,'guest',transport,publish,status);await guest.run({principalId:'guest',accessToken:''});expect(transport).toHaveBeenCalledTimes(4);
});
