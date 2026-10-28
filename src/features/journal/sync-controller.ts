import type { Journal } from './model';
import type { JournalRepository } from './repository';
import { JournalSyncError,type JournalAccount,type JournalSyncTransport,type SyncErrorCode } from './sync-service';
export type JournalSyncStatus={phase:'local'|'pending'|'syncing'|'synced'|'failed';error?:SyncErrorCode};
/** One foreground owner. Retiring it cannot publish or acknowledge into another owner. */
export class JournalSyncController{
 private active=true;private job:Promise<void>|null=null;private abort:AbortController|null=null;private again=false;private latest:JournalAccount|null=null;
 constructor(private repository:JournalRepository,private principalId:string,private transport:JournalSyncTransport,private publish:(journal:Journal)=>void,private status:(status:JournalSyncStatus)=>void){}
 close(){this.active=false;this.again=false;this.abort?.abort();}
 localChanged(account:JournalAccount){this.again=true;return this.run(account);}
 run(account:JournalAccount):Promise<void>{
  if(!this.active||this.principalId==='guest'||account.principalId!==this.principalId||!account.accessToken)return Promise.resolve();
  this.latest=account;if(this.job)return this.job;const abort=new AbortController();this.abort=abort;
  const job=this.perform(account,abort.signal).finally(()=>{if(this.job===job){this.job=null;this.abort=null;if(this.active&&this.again&&this.latest)void this.run(this.latest);}});this.job=job;return job;
 }
 private async perform(account:JournalAccount,signal:AbortSignal){
  const current=()=>this.active&&!signal.aborted;
  this.status({phase:'syncing'});
  try{
   for(let round=0;round<4;round++){
    this.again=false;const request=await this.repository.prepareSync(this.principalId,current);if(!current())return;
    const response=await this.transport(request,account,signal);if(!current())return;
    const result=await this.repository.acceptSync(this.principalId,request,response,current);if(!current())return;this.publish(result.journal);
    if(!result.pending&&!this.again){this.status({phase:'synced'});return;}
   }
   this.again=false;throw new JournalSyncError('journal.syncConflict');
  }catch(error){this.again=false;if(current())this.status({phase:'failed',error:error instanceof JournalSyncError?error.code:'journal.syncFailed'});}
 }
}
