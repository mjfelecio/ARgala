import { expect,it } from 'vitest';
import { emptyJournal,saveBookmark,stampDestination } from './model';
import { acceptSyncDocument,beginSync,replaceJournal,syncDocumentSchema } from './sync-protocol';
const ref={kind:'google' as const,id:'ChIJ_alpha'};
it('rejects corrupt envelope counters, duplicate intents and provider display content',()=>{
 const {document}=beginSync(saveBookmark(emptyJournal(),ref,true));
 expect(syncDocumentSchema.safeParse({...document,cloud:{...document.cloud,editVersion:0}}).success).toBe(false);
 expect(syncDocumentSchema.safeParse({...document,cloud:{...document.cloud,sequence:2}}).success).toBe(false);
 expect(syncDocumentSchema.safeParse({...document,cloud:{...document.cloud,edits:[...document.cloud.edits,...document.cloud.edits]}}).success).toBe(false);
 expect(syncDocumentSchema.safeParse({...document,journal:{...document.journal,bookmarks:[{...ref,name:'provider content'}]}}).success).toBe(false);
});
it('coalesces latest intentions without mutating a durable submitted snapshot',()=>{
 const {document,request}=beginSync(saveBookmark(emptyJournal(),ref,true));const removed=replaceJournal(document,saveBookmark(document.journal,ref,false));const restored=replaceJournal(removed,saveBookmark(removed.version===2?removed.journal:removed,ref,true));
 expect(request.flight.journal.bookmarks).toEqual([ref]);expect(document.cloud.edits[0].version).toBe(1);expect(restored.version).toBe(2);
 if(restored.version===2){expect(restored.cloud.edits).toHaveLength(1);expect(restored.cloud.edits[0]).toMatchObject({saved:true,version:3});}
});
it('unions first visits without allowing a cloud snapshot to erase earned progress',()=>{
 const local=stampDestination(emptyJournal(),'D01',200,'verified');const {document,request}=beginSync(local);const remote=stampDestination(emptyJournal(),'D01',100,'verified');
 const {journal}=acceptSyncDocument(document,request,{status:'applied',sequence:request.flight.sequence,requestId:request.flight.requestId,revision:1,journal:remote});
 expect(journal.stamps).toEqual([{destinationId:'D01',visitedAt:100}]);
});
