import { afterEach, expect, it, vi } from 'vitest';
import { JournalRepository } from './repository';
import { emptyJournal, saveBookmark } from './model';
import { beginSync } from './sync-protocol';
const ref={kind:'google' as const,id:'ChIJ_local'};
const DAY=86400000;
function setup(){const disk=new Map<string,string>();const storage={getItem:vi.fn(async(k:string)=>disk.get(k)??null),setItem:vi.fn(async(k:string,v:string)=>{disk.set(k,v);})};return {disk,storage,repo:new JournalRepository(storage)};}
afterEach(()=>vi.useRealTimers());
it('wraps existing journals atomically while retaining the cloud journal wire shape',async()=>{
 const {repo,disk}=setup();disk.set(repo.key('a'),JSON.stringify(saveBookmark(emptyJournal(),ref,true)));
 await repo.change('a',s=>s);
 expect(JSON.parse(disk.get(repo.key('a'))!)).toEqual({version:3,document:{version:1,bookmarks:[ref],stamps:[]},metadata:{}});
});
it('preserves a preexisting durable flight during the local envelope migration',async()=>{
 const {repo,disk}=setup();const original=beginSync(saveBookmark(emptyJournal(),ref,true));disk.set(repo.key('a'),JSON.stringify(original.document));
 expect(await repo.prepareSync('a')).toEqual(original.request);
 expect(JSON.parse(disk.get(repo.key('a'))!).document.cloud.flight).toEqual(original.request.flight);
});
it('stores a user label and original pin together or leaves both unchanged on failure',async()=>{
 const {repo,storage}=setup();const metadata={label:'My lunch stop',note:'Meet a friend',pin:{coordinates:{latitude:10,longitude:124},capturedAt:Date.now()}};
 storage.setItem.mockRejectedValueOnce(new Error('disk'));
 await expect(repo.save('guest',ref,true,metadata)).rejects.toThrow();expect(await repo.openLocal('guest')).toEqual({journal:emptyJournal(),metadata:{}});
 await repo.save('guest',ref,true,metadata);expect((await repo.openLocal('guest')).metadata['google:ChIJ_local']).toEqual(metadata);
 await repo.openLocal('a');const request=await repo.prepareSync('a');expect(JSON.stringify(request)).not.toMatch(/lunch|friend|latitude|capturedAt/);
});
it('expires only pins at the original 30-day deadline and rejects future/corrupt coordinates',async()=>{
 vi.useFakeTimers();vi.setSystemTime(new Date('2026-11-17T00:00:00Z'));const {repo,disk}=setup();const capturedAt=Date.now()-30*DAY;
 disk.set(repo.key('guest'),JSON.stringify({version:3,document:saveBookmark(emptyJournal(),ref,true),metadata:{'google:ChIJ_local':{label:'Keep my label',pin:{coordinates:{latitude:10,longitude:124},capturedAt}}}}));
 expect((await repo.openLocal('guest')).metadata['google:ChIJ_local']).toEqual({label:'Keep my label'});
 expect(disk.get(repo.key('guest'))).not.toContain('latitude');
 await expect(repo.save('guest',ref,true,{label:'Safe',pin:{coordinates:{latitude:999,longitude:124},capturedAt:Date.now()}})).rejects.toThrow();
 await expect(repo.save('guest',ref,true,{label:'Safe',pin:{coordinates:{latitude:10,longitude:124},capturedAt:Date.now()+1}})).rejects.toThrow();
});
it('keeps account writing first, merges missing guest text and newest original pin without renewing it',async()=>{
 const {repo,storage}=setup();const now=Date.now();const first={coordinates:{latitude:10,longitude:124},capturedAt:now-100};const next={coordinates:{latitude:11,longitude:124},capturedAt:now-50};
 await repo.save('a',ref,true,{label:'Account name',pin:first});await repo.save('guest',ref,true,{label:'Guest name',note:'Guest note',pin:next});
 const original=storage.setItem.getMockImplementation()!;storage.setItem.mockImplementationOnce(original).mockRejectedValueOnce(new Error('guest clear'));
 await expect(repo.openLocal('a')).rejects.toThrow();expect((await repo.openLocal('guest')).metadata['google:ChIJ_local'].label).toBe('Guest name');
 const merged=await repo.openLocal('a');expect(merged.metadata['google:ChIJ_local']).toEqual({label:'Account name',note:'Guest note',pin:next});expect((await repo.openLocal('b')).metadata).toEqual({});
 expect((await repo.openLocal('a')).metadata).toEqual(merged.metadata);
});
it('cleans metadata on explicit alias removal and cloud deletion while retaining in-flight local edits',async()=>{
 const {repo}=setup();await repo.save('a',ref,true,{label:'Mine'});const request=await repo.prepareSync('a');
 await repo.save('a',ref,true,{label:'Renamed'});
 await repo.acceptSync('a',request,{status:'applied',sequence:request.flight.sequence,requestId:request.flight.requestId,revision:1,journal:request.flight.journal});
 expect((await repo.openLocal('a')).metadata['google:ChIJ_local'].label).toBe('Renamed');
 const remove=await repo.prepareSync('a');await repo.acceptSync('a',remove,{status:'applied',sequence:remove.flight.sequence,requestId:remove.flight.requestId,revision:2,journal:emptyJournal()});expect((await repo.openLocal('a')).metadata).toEqual({});
 await repo.save('guest',ref,true,{label:'Alias'});await repo.save('guest',{kind:'featured',id:'D01'},true);await repo.save('guest',{kind:'featured',id:'D01'},false,undefined,[ref]);expect(await repo.openLocal('guest')).toEqual({journal:emptyJournal(),metadata:{}});
});
it('does not extend an existing pin on rename or a save of the same bookmark',async()=>{
 const {repo}=setup();const capturedAt=Date.now()-DAY;await repo.save('guest',ref,true,{label:'A',pin:{coordinates:{latitude:10,longitude:124},capturedAt}});
 await repo.save('guest',ref,true,{label:'B',pin:{coordinates:{latitude:10,longitude:124},capturedAt:Date.now()}});
 expect((await repo.openLocal('guest')).metadata['google:ChIJ_local'].pin?.capturedAt).toBe(capturedAt);
});
it('fences delayed local saves before writing into a retired principal',async()=>{
 const {repo,disk}=setup();await expect(repo.save('a',ref,true,{label:'A'},[],()=>false)).rejects.toThrow();expect(disk.size).toBe(0);
});
it('requires a user label on new Google saves but lets existing ID-only entries be removed',async()=>{
 const {repo}=setup();await expect(repo.save('guest',ref,true)).rejects.toThrow();expect((await repo.open('guest')).bookmarks).toEqual([]);
 await repo.change('guest',s=>saveBookmark(s,ref,true));await repo.save('guest',ref,false);expect((await repo.open('guest')).bookmarks).toEqual([]);
});
it('retains guest labels and original pin if the account target write fails',async()=>{
 const {repo,storage}=setup();const metadata={label:'Guest label',pin:{coordinates:{latitude:10,longitude:124},capturedAt:Date.now()-100}};
 await repo.save('guest',ref,true,metadata);storage.setItem.mockRejectedValueOnce(new Error('account disk full'));
 await expect(repo.openLocal('a')).rejects.toThrow();expect((await repo.openLocal('guest')).metadata['google:ChIJ_local']).toEqual(metadata);
 expect((await repo.openLocal('a')).metadata['google:ChIJ_local']).toEqual(metadata);
});
it('refuses a corrupted metadata envelope without replacing it with empty data or granting a pin',async()=>{
 const {repo,disk}=setup();const raw=JSON.stringify({version:3,document:saveBookmark(emptyJournal(),ref,true),metadata:{'google:ChIJ_local':{label:'Mine',pin:{coordinates:{latitude:999,longitude:124},capturedAt:Date.now()}}}});
 disk.set(repo.key('guest'),raw);await expect(repo.openLocal('guest')).rejects.toThrow();expect(disk.get(repo.key('guest'))).toBe(raw);
});
it('preserves an explicit label save made during a pending sync acknowledgement',async()=>{
 const {repo}=setup();await repo.save('a',ref,true,{label:'Before'});const request=await repo.prepareSync('a');await repo.save('a',ref,true,{label:'Edited while syncing'});
 const result=await repo.acceptSync('a',request,{status:'applied',sequence:request.flight.sequence,requestId:request.flight.requestId,revision:2,journal:emptyJournal()});
 expect(result.journal.bookmarks).toEqual([ref]);expect(result.pending).toBe(true);expect((await repo.openLocal('a')).metadata['google:ChIJ_local'].label).toBe('Edited while syncing');
});
