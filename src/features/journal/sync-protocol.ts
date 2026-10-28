import { z } from 'zod';
import { bookmarkKey,bookmarkSchema,emptyJournal,journalSchema,mergeJournal,saveBookmark,type Journal } from './model';
const counter=z.number().int().min(0).max(Number.MAX_SAFE_INTEGER);
const editSchema=z.object({reference:bookmarkSchema,saved:z.boolean(),version:counter.min(1)}).strict();
const flightSchema=z.object({requestId:z.uuid(),sequence:counter.min(1),revision:counter,journal:journalSchema,editVersion:counter}).strict();
export const syncDocumentSchema=z.object({version:z.literal(2),journal:journalSchema,cloud:z.object({
 clientId:z.uuid(),sequence:counter.min(1),revision:counter,editVersion:counter,
 edits:z.array(editSchema).max(2000).refine(items=>new Set(items.map(x=>bookmarkKey(x.reference))).size===items.length),
 flight:flightSchema.nullable(),
}).strict()}).strict().refine(doc=>doc.cloud.edits.every(e=>e.version<=doc.cloud.editVersion) && (!doc.cloud.flight || doc.cloud.flight.sequence===doc.cloud.sequence && doc.cloud.flight.revision===doc.cloud.revision && doc.cloud.flight.editVersion<=doc.cloud.editVersion));
export type SyncDocument=z.infer<typeof syncDocumentSchema>;
export type JournalDocument=Journal|SyncDocument;
export const syncRequestSchema=z.object({clientId:z.uuid(),flight:flightSchema}).strict();
export type SyncRequest=z.infer<typeof syncRequestSchema>;
export const syncResponseSchema=z.object({status:z.enum(['applied','conflict','reset']),sequence:counter.min(1),requestId:z.uuid(),revision:counter,journal:journalSchema}).strict();
export type SyncResponse=z.infer<typeof syncResponseSchema>;
export const visibleJournal=(doc:JournalDocument):Journal=>doc.version===2?doc.journal:doc;
/** Non-credential namespace only. Account authority always comes from the captured bearer token. */
export function journalUuid(){return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g,c=>{const r=Math.floor(Math.random()*16);return(c==='x'?r:(r&3)|8).toString(16);});}
function diffBookmarks(base:Journal,local:Journal){
 const before=new Map(base.bookmarks.map(x=>[bookmarkKey(x),x]));const after=new Map(local.bookmarks.map(x=>[bookmarkKey(x),x]));
 return [...new Set([...before.keys(),...after.keys()])].filter(k=>before.has(k)!==after.has(k)).map(k=>({reference:(after.get(k)??before.get(k))!,saved:after.has(k)}));
}
export function replaceJournal(doc:JournalDocument,journal:Journal):JournalDocument{
 if(doc.version===1)return journal;
 let editVersion=doc.cloud.editVersion;const edits=new Map(doc.cloud.edits.map(e=>[bookmarkKey(e.reference),e]));
 for(const change of diffBookmarks(doc.journal,journal))edits.set(bookmarkKey(change.reference),{...change,version:++editVersion});
 return syncDocumentSchema.parse({...doc,journal,cloud:{...doc.cloud,editVersion,edits:[...edits.values()]}});
}
export function beginSync(doc:JournalDocument,makeId=journalUuid):{document:SyncDocument;request:SyncRequest}{
 let next:SyncDocument;
 if(doc.version===1){const initial={version:2 as const,journal:emptyJournal(),cloud:{clientId:makeId(),sequence:1,revision:0,editVersion:0,edits:[],flight:null}};next=replaceJournal(initial,doc) as SyncDocument;}
 else next=doc;
 const flight=next.cloud.flight??{requestId:makeId(),sequence:next.cloud.sequence,revision:next.cloud.revision,journal:next.journal,editVersion:next.cloud.editVersion};
 const document=syncDocumentSchema.parse({...next,cloud:{...next.cloud,flight}});
 return {document,request:{clientId:document.cloud.clientId,flight:document.cloud.flight!}};
}
function applyEdits(remote:Journal,local:Journal,edits:SyncDocument['cloud']['edits']):Journal{
 let result:Journal={...remote,stamps:mergeJournal({...remote,bookmarks:[]},{...local,bookmarks:[]}).stamps};
 for(const edit of edits)result=saveBookmark(result,edit.reference,edit.saved);
 return journalSchema.parse(result);
}
/** Public helper for pure snapshot differences; durable sync uses explicit latest edit intents. */
export function rebaseJournal(base:Journal,local:Journal,remote:Journal):Journal{return applyEdits(remote,local,diffBookmarks(base,local).map((e,i)=>({...e,version:i+1})));}
export function acceptSyncDocument(doc:SyncDocument,request:SyncRequest,input:unknown,makeId=journalUuid){
 const response=syncResponseSchema.parse(input);const flight=doc.cloud.flight;
 if(!flight||request.clientId!==doc.cloud.clientId||request.flight.requestId!==flight.requestId||response.requestId!==flight.requestId||response.sequence!==flight.sequence||response.revision<doc.cloud.revision)throw new Error('journal.invalidSyncResponse');
 const edits=response.status==='applied'?doc.cloud.edits.filter(e=>e.version>flight.editVersion):doc.cloud.edits;
 const journal=applyEdits(response.journal,doc.journal,edits);
 const rotate=response.status==='reset'||response.status==='applied'&&doc.cloud.sequence===Number.MAX_SAFE_INTEGER;
 const document=syncDocumentSchema.parse({...doc,journal,cloud:{...doc.cloud,edits,flight:null,revision:response.revision,clientId:rotate?makeId():doc.cloud.clientId,sequence:rotate?1:doc.cloud.sequence+(response.status==='applied'?1:0)}});
 const pending=edits.length>0||JSON.stringify([...journal.stamps].sort((a,b)=>a.destinationId.localeCompare(b.destinationId)))!==JSON.stringify([...response.journal.stamps].sort((a,b)=>a.destinationId.localeCompare(b.destinationId)));
 return {document,journal,pending};
}
