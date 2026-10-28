import { emptyJournal, journalSchema, mergeJournal, type Journal } from './model';
export type JournalStorage = { getItem(key:string):Promise<string|null>; setItem(key:string,value:string):Promise<unknown> };
const maxBytes=1024*1024;
/** One process-wide queue also orders guest migration against overlapping UI saves. */
export class JournalRepository {
  private queue:Promise<unknown>=Promise.resolve();
  constructor(private storage:JournalStorage) {}
  key(principal:string) { if(!principal) throw new Error('journal.invalidOwner'); return `argala.journal.v1:${encodeURIComponent(principal)}`; }
  private serial<T>(work:()=>Promise<T>):Promise<T> { const result=this.queue.then(work); this.queue=result.catch(()=>{}); return result; }
  private async read(principal:string):Promise<Journal> {
    const raw=await this.storage.getItem(this.key(principal)); if(raw===null) return emptyJournal();
    if(raw.length>maxBytes) throw new Error('journal.invalidStorage');
    return journalSchema.parse(JSON.parse(raw));
  }
  private async write(principal:string,state:Journal) {
    const raw=JSON.stringify(journalSchema.parse(state)); if(raw.length>maxBytes) throw new Error('journal.capacity');
    await this.storage.setItem(this.key(principal),raw);
  }
  open(principal:string):Promise<Journal> { return this.serial(async()=>{
    const own=await this.read(principal); if(principal==='guest') return own;
    const guest=await this.read('guest'); if(!guest.bookmarks.length&&!guest.stamps.length) return own;
    const merged=mergeJournal(own,guest); await this.write(principal,merged);
    // Never clear the source before account persistence. Retry is idempotent after either write fails.
    await this.write('guest',emptyJournal()); return merged;
  }); }
  change(principal:string,update:(state:Journal)=>Journal):Promise<Journal> { return this.serial(async()=>{
    const state=journalSchema.parse(update(await this.read(principal))); await this.write(principal,state); return state;
  }); }
}
