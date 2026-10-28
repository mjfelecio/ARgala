import { expect,it,vi } from 'vitest';
import { JournalRepository } from './repository';
import { emptyJournal,saveBookmark } from './model';
const ref={kind:'google' as const,id:'ChIJ_alpha'};
function setup(){const disk=new Map<string,string>();const storage={getItem:vi.fn(async(k:string)=>disk.get(k)??null),setItem:vi.fn(async(k:string,v:string)=>{disk.set(k,v);})};return {disk,storage,repo:new JournalRepository(storage)};}
it('upgrades existing v1 data and reuses a durable in-flight snapshot across retries and restarts',async()=>{
 const {repo,disk,storage}=setup();await repo.change('account',s=>saveBookmark(s,ref,true));const first=await repo.prepareSync('account');expect(first.flight.journal.bookmarks).toEqual([ref]);
 const restarted=new JournalRepository(storage);expect(await restarted.prepareSync('account')).toEqual(first);expect(JSON.parse(disk.get(repo.key('account'))!).version).toBe(2);
});
it('preserves offline deletion and other-device additions through a conflict',async()=>{
 const {repo}=setup();await repo.change('account',s=>saveBookmark(s,ref,true));let request=await repo.prepareSync('account');await repo.acceptSync('account',request,{status:'applied',sequence:request.flight.sequence,requestId:request.flight.requestId,revision:1,journal:request.flight.journal});
 await repo.change('account',s=>saveBookmark(s,ref,false));request=await repo.prepareSync('account');const remote=saveBookmark(request.flight.journal,{kind:'google',id:'ChIJ_beta'},true);
 const result=await repo.acceptSync('account',request,{status:'conflict',sequence:request.flight.sequence,requestId:request.flight.requestId,revision:2,journal:saveBookmark(remote,ref,true)});
 expect(result.journal.bookmarks).toEqual([{kind:'google',id:'ChIJ_beta'}]);expect(result.pending).toBe(true);
});
it('lost-response replay does not resurrect an add later removed by another device',async()=>{
 const {repo}=setup();await repo.change('account',s=>saveBookmark(s,ref,true));const request=await repo.prepareSync('account');
 const result=await repo.acceptSync('account',request,{status:'applied',sequence:request.flight.sequence,requestId:request.flight.requestId,revision:2,journal:emptyJournal()});expect(result.journal.bookmarks).toHaveLength(0);expect(result.pending).toBe(false);
});
it('preserves local edits made while the request was in flight',async()=>{
 const {repo}=setup();const request=await repo.prepareSync('account');await repo.change('account',s=>saveBookmark(s,ref,true));
 const result=await repo.acceptSync('account',request,{status:'applied',sequence:request.flight.sequence,requestId:request.flight.requestId,revision:0,journal:emptyJournal()});expect(result.journal.bookmarks).toEqual([ref]);expect(result.pending).toBe(true);
});
it('retains the flight and local work if acknowledgement persistence fails',async()=>{
 const {repo,storage}=setup();const request=await repo.prepareSync('account');storage.setItem.mockRejectedValueOnce(new Error('disk'));await expect(repo.acceptSync('account',request,{status:'applied',sequence:request.flight.sequence,requestId:request.flight.requestId,revision:0,journal:emptyJournal()})).rejects.toThrow();expect(await repo.prepareSync('account')).toEqual(request);
});
it('rejects guest sync, stale response identities and retired owners without changing disk',async()=>{
 const {repo,disk}=setup();await expect(repo.prepareSync('guest')).rejects.toThrow();const request=await repo.prepareSync('a');const before=disk.get(repo.key('a'));
 await expect(repo.acceptSync('a',request,{status:'applied',sequence:request.flight.sequence,requestId:'00000000-0000-4000-8000-000000000000',revision:0,journal:emptyJournal()})).rejects.toThrow();await expect(repo.acceptSync('a',request,{status:'applied',sequence:request.flight.sequence,requestId:request.flight.requestId,revision:0,journal:emptyJournal()},()=>false)).rejects.toThrow();expect(disk.get(repo.key('a'))).toBe(before);
});
it('rebases and rotates a restored client namespace without dropping local work',async()=>{
 const {repo}=setup();await repo.change('account',s=>saveBookmark(s,ref,true));const request=await repo.prepareSync('account');const result=await repo.acceptSync('account',request,{status:'reset',sequence:request.flight.sequence,requestId:request.flight.requestId,revision:4,journal:emptyJournal()});expect(result.journal.bookmarks).toEqual([ref]);const next=await repo.prepareSync('account');expect(next.clientId).not.toBe(request.clientId);expect(next.flight.sequence).toBe(1);
});
it('retains an explicit remove then re-add during flight even when the final value matches the submitted snapshot',async()=>{
 const {repo}=setup();await repo.change('account',s=>saveBookmark(s,ref,true));const request=await repo.prepareSync('account');await repo.change('account',s=>saveBookmark(s,ref,false));await repo.change('account',s=>saveBookmark(s,ref,true));
 const result=await repo.acceptSync('account',request,{status:'applied',sequence:request.flight.sequence,requestId:request.flight.requestId,revision:2,journal:emptyJournal()});expect(result.journal.bookmarks).toEqual([ref]);expect(result.pending).toBe(true);
});
it('treats a guest save as fresh intent even if the account still has an outdated copy of the same reference',async()=>{
 const {repo}=setup();await repo.change('account',s=>saveBookmark(s,ref,true));let request=await repo.prepareSync('account');await repo.acceptSync('account',request,{status:'applied',sequence:request.flight.sequence,requestId:request.flight.requestId,revision:1,journal:request.flight.journal});
 await repo.change('guest',s=>saveBookmark(s,ref,true));await repo.open('account');request=await repo.prepareSync('account');
 const result=await repo.acceptSync('account',request,{status:'conflict',sequence:request.flight.sequence,requestId:request.flight.requestId,revision:2,journal:emptyJournal()});expect(result.journal.bookmarks).toEqual([ref]);expect(result.pending).toBe(true);
});
it('validates the final reconciled capacity rather than a temporary add-before-remove overflow',async()=>{
 const {repo}=setup();const baseline={version:1 as const,bookmarks:Array.from({length:999},(_,i)=>({kind:'google' as const,id:`ChIJ_${i}`})),stamps:[]};await repo.change('account',()=>baseline);
 let request=await repo.prepareSync('account');await repo.acceptSync('account',request,{status:'applied',sequence:request.flight.sequence,requestId:request.flight.requestId,revision:1,journal:baseline});
 await repo.change('account',s=>saveBookmark(s,{kind:'google',id:'ChIJ_B'},true));await repo.change('account',s=>saveBookmark(s,baseline.bookmarks[0],false));request=await repo.prepareSync('account');
 const remote=saveBookmark(baseline,{kind:'google',id:'ChIJ_C'},true);const result=await repo.acceptSync('account',request,{status:'conflict',sequence:request.flight.sequence,requestId:request.flight.requestId,revision:2,journal:remote});expect(result.journal.bookmarks).toHaveLength(1000);expect(result.journal.bookmarks).toContainEqual({kind:'google',id:'ChIJ_B'});expect(result.journal.bookmarks).toContainEqual({kind:'google',id:'ChIJ_C'});expect(result.journal.bookmarks).not.toContainEqual(baseline.bookmarks[0]);
});
it('retains local data and the flight on genuine final reconciliation overflow',async()=>{
 const {repo}=setup();const baseline={version:1 as const,bookmarks:Array.from({length:999},(_,i)=>({kind:'google' as const,id:`ChIJ_${i}`})),stamps:[]};await repo.change('account',()=>baseline);let request=await repo.prepareSync('account');await repo.acceptSync('account',request,{status:'applied',sequence:request.flight.sequence,requestId:request.flight.requestId,revision:1,journal:baseline});
 await repo.change('account',s=>saveBookmark(s,{kind:'google',id:'ChIJ_B'},true));request=await repo.prepareSync('account');const remote=saveBookmark(baseline,{kind:'google',id:'ChIJ_C'},true);await expect(repo.acceptSync('account',request,{status:'conflict',sequence:request.flight.sequence,requestId:request.flight.requestId,revision:2,journal:remote})).rejects.toThrow();expect((await repo.open('account')).bookmarks).toHaveLength(1000);expect(await repo.prepareSync('account')).toEqual(request);
});
