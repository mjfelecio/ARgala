import { z } from 'zod';
import { beginSync,acceptSyncDocument,syncDocumentSchema,visibleJournal,replaceJournal,type JournalDocument,type SyncRequest } from './sync-protocol';
import { emptyJournal, journalSchema, mergeJournal, type Journal } from './model';
export type JournalStorage = { getItem(key:string):Promise<string|null>; setItem(key:string,value:string):Promise<unknown> };
const maxBytes=1024*1024;
/** One process-wide queue also orders guest migration against overlapping UI saves. */
export class JournalRepository {
  private queue:Promise<unknown>=Promise.resolve();
  constructor(private storage:JournalStorage) {}
  key(principal:string) { if(!principal) throw new Error('journal.invalidOwner'); return `argala.journal.v1:${encodeURIComponent(principal)}`; }
  private serial<T>(work:()=>Promise<T>):Promise<T> { const result=this.queue.then(work); this.queue=result.catch(()=>{}); return result; }
  private async read(principal:string):Promise<JournalDocument> {
    const raw=await this.storage.getItem(this.key(principal)); if(raw===null) return emptyJournal();
    if(raw.length>maxBytes) throw new Error('journal.invalidStorage');
    return z.union([journalSchema,syncDocumentSchema]).parse(JSON.parse(raw));
  }
  private async write(principal:string,state:JournalDocument) {
    const raw=JSON.stringify(z.union([journalSchema,syncDocumentSchema]).parse(state)); if(raw.length>maxBytes) throw new Error('journal.capacity');
    await this.storage.setItem(this.key(principal),raw);
  }
  open(principal:string,isCurrent:()=>boolean=()=>true):Promise<Journal> { return this.serial(async()=>{
    const ownDocument=await this.read(principal); const own=visibleJournal(ownDocument); if(!isCurrent()) throw new Error('journal.ownerRetired'); if(principal==='guest') return own;
    const guest=visibleJournal(await this.read('guest')); if(!guest.bookmarks.length&&!guest.stamps.length) return own;
    const merged=mergeJournal(own,guest);
    // Claim immediately before the first durable target write, while this owner is current.
    // Once claimed, this serialized transfer belongs to that account, even after sign-out.
    if(!isCurrent()) throw new Error('journal.ownerRetired');
    await this.write(principal,replaceJournal(ownDocument,merged));
    // Never clear the source before account persistence. Retry is idempotent after either write fails.
    await this.write('guest',emptyJournal()); return merged;
  }); }
  change(principal:string,update:(state:Journal)=>Journal):Promise<Journal> { return this.serial(async()=>{
    const document=await this.read(principal); const state=journalSchema.parse(update(visibleJournal(document))); await this.write(principal,replaceJournal(document,state)); return state;
  }); }
  prepareSync(principal:string,isCurrent:()=>boolean=()=>true):Promise<SyncRequest>{return this.serial(async()=>{
    if(principal==='guest')throw new Error('journal.guestSync');
    const next=beginSync(await this.read(principal));if(!isCurrent())throw new Error('journal.ownerRetired');
    await this.write(principal,next.document);return next.request;
  });}
  acceptSync(principal:string,request:SyncRequest,response:unknown,isCurrent:()=>boolean=()=>true){return this.serial(async()=>{
    if(principal==='guest')throw new Error('journal.guestSync');const doc=await this.read(principal);
    if(doc.version!==2)throw new Error('journal.invalidSyncResponse');const result=acceptSyncDocument(doc,request,response);
    if(!isCurrent())throw new Error('journal.ownerRetired');await this.write(principal,result.document);return {journal:result.journal,pending:result.pending};
  });}

}
