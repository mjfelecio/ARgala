import { expect, it, vi } from 'vitest';
import { JournalRepository } from './repository';
import { emptyJournal, saveBookmark, stampDestination } from './model';
function setup() { const disk = new Map<string,string>(); const storage = { getItem: vi.fn(async (k:string) => disk.get(k) ?? null), setItem: vi.fn(async (k:string,v:string) => { disk.set(k,v); }) }; return { disk, storage, repo: new JournalRepository(storage) }; }
const ref = { kind: 'google' as const, id: 'ChIJ_test' };
it('persists identifiers only and serializes overlapping changes', async () => {
 const { repo, disk } = setup(); await repo.open('guest');
 await Promise.all([repo.change('guest', s => saveBookmark(s, ref, true)), repo.change('guest', s => saveBookmark(s, {kind:'featured',id:'D01'}, true))]);
 const saved = await repo.open('guest'); expect(saved.bookmarks).toHaveLength(2); expect([...disk.values()].join()).not.toMatch(/latitude|description|name|reviews/);
});
it('does not report or publish a failed write, and retries without losing existing state', async () => {
 const { repo, storage } = setup(); await repo.open('guest'); storage.setItem.mockRejectedValueOnce(new Error('private raw failure'));
 await expect(repo.change('guest', s => saveBookmark(s, ref,true))).rejects.toThrow(); expect((await repo.open('guest')).bookmarks).toHaveLength(0);
 await repo.change('guest', s => saveBookmark(s,ref,true)); expect((await repo.open('guest')).bookmarks).toHaveLength(1);
});
it('merges guest into the active account durably, isolates other accounts and is idempotent', async () => {
 const { repo } = setup(); await repo.change('guest', s => saveBookmark(s,ref,true));
 expect((await repo.open('user-a')).bookmarks).toHaveLength(1); expect((await repo.open('user-b')).bookmarks).toHaveLength(0);
 expect((await repo.open('user-a')).bookmarks).toHaveLength(1); expect((await repo.open('guest')).bookmarks).toHaveLength(0);
});
it('retains guest source if account persistence fails', async () => {
 const { repo, storage } = setup(); await repo.change('guest', s => saveBookmark(s,ref,true)); storage.setItem.mockRejectedValueOnce(new Error('disk full'));
 await expect(repo.open('user-a')).rejects.toThrow(); expect((await repo.open('guest')).bookmarks).toHaveLength(1);
 expect((await repo.open('user-a')).bookmarks).toHaveLength(1);
});
it('does not replace malformed stored data with an empty success', async () => {
 const { repo,disk } = setup(); disk.set(repo.key('guest'), '{broken'); await expect(repo.open('guest')).rejects.toThrow(); expect(disk.get(repo.key('guest'))).toBe('{broken');
});
it('stamps only a verified established event and keeps the first visit once', () => {
 const state=emptyJournal(); expect(stampDestination(state,'D01',100,'development')).toEqual(state);
 const first=stampDestination(state,'D01',100,'verified'); expect(stampDestination(first,'D01',200,'verified').stamps).toEqual([{destinationId:'D01',visitedAt:100}]);
});
it('preserves Google IDs exactly within the shared payload budget and rejects excess entries', () => {
 const id='ChIJ_'+ 'x'.repeat(600); expect(saveBookmark(emptyJournal(),{kind:'google',id},true).bookmarks[0].id).toBe(id);
 expect(() => saveBookmark(emptyJournal(),{kind:'google',id:'x'.repeat(5000)},true)).toThrow();
});
it('removal survives repeated guest merges rather than resurrecting a bookmark', async () => {
 const {repo}=setup(); await repo.change('guest', s=>saveBookmark(s,ref,true)); await repo.open('user-a');
 await repo.change('user-a',s=>saveBookmark(s,ref,false)); expect((await repo.open('user-a')).bookmarks).toHaveLength(0);
});

it('recovers idempotently when guest clearing fails after account persistence',async()=>{
 const {repo,storage}=setup();await repo.change('guest',s=>saveBookmark(s,ref,true));const original=storage.setItem.getMockImplementation()!;
 storage.setItem.mockImplementationOnce(original).mockRejectedValueOnce(new Error('clear failed'));
 await expect(repo.open('user-a')).rejects.toThrow();expect((await repo.open('guest')).bookmarks).toHaveLength(1);expect((await repo.open('user-a')).bookmarks).toHaveLength(1);expect((await repo.open('guest')).bookmarks).toHaveLength(0);
});
it('retires a stale migration after delayed reads before claiming any account write',async()=>{
 const {repo,storage,disk}=setup();await repo.change('guest',s=>saveBookmark(s,ref,true));const gate=Promise.withResolvers<void>();const original=storage.getItem.getMockImplementation()!;
 storage.getItem.mockImplementationOnce(async k=>{await gate.promise;return original(k);});let current=true;
 const retired=repo.open('user-a',()=>current);await Promise.resolve();current=false;const next=repo.open('user-b');gate.resolve();
 await expect(retired).rejects.toThrow();expect((await next).bookmarks).toHaveLength(1);expect(disk.has(repo.key('user-a'))).toBe(false);
});
it.each(['account-write','guest-clear'])('finishes an already-claimed %s for its original account, never another account',async phase=>{
 const {repo,storage}=setup();await repo.change('guest',s=>saveBookmark(s,ref,true));const gate=Promise.withResolvers<void>();const started=Promise.withResolvers<void>();const original=storage.setItem.getMockImplementation()!;let current=true;
 storage.setItem.mockImplementation(async(k,v)=>{if(k===repo.key(phase==='account-write'?'user-a':'guest')){started.resolve();await gate.promise;}return original(k,v);});
 const first=repo.open('user-a',()=>current);await started.promise;current=false;const next=repo.open('user-b');gate.resolve();await first;
 expect((await next).bookmarks).toHaveLength(0);expect((await repo.open('user-a')).bookmarks).toHaveLength(1);
});
