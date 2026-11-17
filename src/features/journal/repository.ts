import { z } from 'zod';
import { beginSync, acceptSyncDocument, syncDocumentSchema, visibleJournal, replaceJournal, type SyncRequest } from './sync-protocol';
import { bookmarkKey, bookmarkSchema, emptyJournal, journalSchema, mergeJournal, saveBookmark, type Bookmark, type Journal } from './model';
import { bookmarkMetadataSchema, cleanBookmarkMetadata, mergeBookmarkMetadata, validBookmarkPin, type BookmarkMetadata, type BookmarkMetadataMap } from './bookmark-metadata';
export type JournalStorage = { getItem(key:string):Promise<string|null>; setItem(key:string,value:string):Promise<unknown> };
export type LocalJournal = { journal: Journal; metadata: BookmarkMetadataMap };
const documentSchema=z.union([journalSchema,syncDocumentSchema]);
const localSchema=z.object({version:z.literal(3),document:documentSchema,metadata:z.record(z.string(),bookmarkMetadataSchema)}).strict();
type LocalDocument=z.infer<typeof localSchema>;
const maxBytes=1024*1024;
const snapshot=(local:LocalDocument):LocalJournal=>({journal:visibleJournal(local.document),metadata:cleanBookmarkMetadata(visibleJournal(local.document),local.metadata)});
/** One queue orders atomic local edits, guest transfer and cloud acknowledgement. */
export class JournalRepository {
  private queue:Promise<unknown>=Promise.resolve();
  constructor(private storage:JournalStorage) {}
  key(principal:string) { if(!principal) throw new Error('journal.invalidOwner'); return `argala.journal.v1:${encodeURIComponent(principal)}`; }
  private serial<T>(work:()=>Promise<T>):Promise<T> { const result=this.queue.then(work); this.queue=result.catch(()=>{}); return result; }
  private async read(principal:string):Promise<LocalDocument> {
    const raw=await this.storage.getItem(this.key(principal)); if(raw===null) return {version:3,document:emptyJournal(),metadata:{}};
    if(raw.length>maxBytes) throw new Error('journal.invalidStorage');
    const parsed=z.union([localSchema,documentSchema]).parse(JSON.parse(raw));
    const local:LocalDocument=parsed.version===3?parsed:{version:3,document:parsed,metadata:{}};
    return local;
  }
  private async write(principal:string,local:LocalDocument) {
    const raw=JSON.stringify(localSchema.parse({...local,metadata:cleanBookmarkMetadata(visibleJournal(local.document),local.metadata)}));
    if(raw.length>maxBytes) throw new Error('journal.capacity');
    await this.storage.setItem(this.key(principal),raw);
  }
  openLocal(principal:string,isCurrent:()=>boolean=()=>true):Promise<LocalJournal> { return this.serial(async()=>{
    const own=await this.read(principal);if(!isCurrent())throw new Error('journal.ownerRetired');
    const visible=snapshot(own);
    const prune=async()=>{if(JSON.stringify(own.metadata)!==JSON.stringify(visible.metadata)){if(!isCurrent())throw new Error('journal.ownerRetired');await this.write(principal,{...own,metadata:visible.metadata});}return visible;};
    if(principal==='guest')return prune();
    const guest=await this.read('guest');const guestJournal=visibleJournal(guest.document);
    if(!guestJournal.bookmarks.length&&!guestJournal.stamps.length)return prune();
    const merged=mergeJournal(visibleJournal(own.document),guestJournal);
    const local:LocalDocument={version:3,document:replaceJournal(own.document,merged,guestJournal.bookmarks.map(reference=>({reference,saved:true}))),metadata:mergeBookmarkMetadata(own.metadata,guest.metadata)};
    // Claim before the durable target write; a claimed transfer stays with its original account.
    if(!isCurrent())throw new Error('journal.ownerRetired');await this.write(principal,local);
    await this.write('guest',{version:3,document:emptyJournal(),metadata:{}});return snapshot(local);
  }); }
  async open(principal:string,isCurrent:()=>boolean=()=>true):Promise<Journal> { return (await this.openLocal(principal,isCurrent)).journal; }
  changeLocal(principal:string,update:(state:Journal)=>Journal,isCurrent:()=>boolean=()=>true):Promise<LocalJournal> {return this.serial(async()=>{
    const local=await this.read(principal);const journal=journalSchema.parse(update(visibleJournal(local.document)));
    const next={...local,document:replaceJournal(local.document,journal),metadata:cleanBookmarkMetadata(journal,local.metadata)};
    if(!isCurrent())throw new Error('journal.ownerRetired');await this.write(principal,next);return snapshot(next);
  });}
  async change(principal:string,update:(state:Journal)=>Journal):Promise<Journal> {return (await this.changeLocal(principal,update)).journal;}
  save(principal:string,reference:Bookmark,saved:boolean,metadata?:BookmarkMetadata,aliases:Bookmark[]=[],isCurrent:()=>boolean=()=>true):Promise<LocalJournal> {return this.serial(async()=>{
    const ref=bookmarkSchema.parse(reference);const aliasRefs=aliases.map(x=>bookmarkSchema.parse(x));
    const incoming=metadata?bookmarkMetadataSchema.parse(metadata):undefined;
    if(incoming?.pin&&!validBookmarkPin(incoming))throw new Error('journal.invalidMetadata');
    const local=await this.read(principal);const before=visibleJournal(local.document);
    if(saved&&ref.kind==='google'&&!incoming?.label&&!local.metadata[bookmarkKey(ref)]?.label&&!before.bookmarks.some(item=>bookmarkKey(item)===bookmarkKey(ref)))throw new Error('journal.invalidMetadata');
    let journal=saveBookmark(before,ref,saved);
    if(!saved)for(const alias of aliasRefs)journal=saveBookmark(journal,alias,false);
    const nextMetadata={...local.metadata};const key=bookmarkKey(ref);
    if(saved&&incoming){
      const old=nextMetadata[key];
      // Re-saving or renaming an existing entry cannot renew its original coordinate capture.
      const alreadySaved=before.bookmarks.some(item=>bookmarkKey(item)===key);
      const pin=alreadySaved?validBookmarkPin(old):incoming.pin;
      nextMetadata[key]={...incoming,pin};
      if(!pin)delete nextMetadata[key].pin;
    }
    const explicit=[{reference:ref,saved},...(!saved?aliasRefs.map(reference=>({reference,saved:false})):[])];
    const next:LocalDocument={...local,document:replaceJournal(local.document,journal,explicit),metadata:cleanBookmarkMetadata(journal,nextMetadata)};
    if(!isCurrent())throw new Error('journal.ownerRetired');await this.write(principal,next);return snapshot(next);
  });}
  prepareSync(principal:string,isCurrent:()=>boolean=()=>true):Promise<SyncRequest>{return this.serial(async()=>{
    if(principal==='guest')throw new Error('journal.guestSync');const local=await this.read(principal);
    const next=beginSync(local.document);if(!isCurrent())throw new Error('journal.ownerRetired');
    await this.write(principal,{...local,document:next.document});return next.request;
  });}
  acceptSync(principal:string,request:SyncRequest,response:unknown,isCurrent:()=>boolean=()=>true){return this.serial(async()=>{
    if(principal==='guest')throw new Error('journal.guestSync');const local=await this.read(principal);
    if(local.document.version!==2)throw new Error('journal.invalidSyncResponse');const result=acceptSyncDocument(local.document,request,response);
    const next={...local,document:result.document,metadata:cleanBookmarkMetadata(result.journal,local.metadata)};
    if(!isCurrent())throw new Error('journal.ownerRetired');await this.write(principal,next);return {journal:result.journal,metadata:next.metadata,pending:result.pending};
  });}
}
