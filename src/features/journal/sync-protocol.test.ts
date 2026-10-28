import { expect,it } from 'vitest';
import { emptyJournal,saveBookmark,stampDestination } from './model';
import { rebaseJournal } from './sync-protocol';
const ref={kind:'google' as const,id:'ChIJ_alpha'};
it('rebases offline removal while preserving another device addition',()=>{
 const base=saveBookmark(emptyJournal(),ref,true);const local=saveBookmark(base,ref,false);const remote=saveBookmark(base,{kind:'google',id:'ChIJ_beta'},true);
 expect(rebaseJournal(base,local,remote).bookmarks).toEqual([{kind:'google',id:'ChIJ_beta'}]);
});
it('does not resurrect an acknowledged add after a lost response and remote deletion',()=>{
 const submitted=saveBookmark(emptyJournal(),ref,true);
 expect(rebaseJournal(submitted,submitted,emptyJournal()).bookmarks).toHaveLength(0);
});
it('preserves edits made during flight and earliest Passport visits',()=>{
 const submitted=stampDestination(saveBookmark(emptyJournal(),ref,true),'D01',200,'verified');
 const local=saveBookmark(submitted,ref,false);const remote=stampDestination(submitted,'D01',100,'verified');
 // Existing destination remains earliest even when merging independent source records.
 const earlier=stampDestination(emptyJournal(),'D01',100,'verified');
 expect(rebaseJournal(submitted,local,earlier)).toEqual({version:1,bookmarks:[],stamps:[{destinationId:'D01',visitedAt:100}]});expect(remote.stamps).toHaveLength(1);
});
