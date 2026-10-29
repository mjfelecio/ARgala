import { activeSchema, ownerSchema, type ActiveReminderOwner, type ReminderSelection, newGeneration, MAX_REMINDERS, reminderDestination, parseRegionIdentifier } from './model';
export const REMINDER_ACTIVE_KEY='argala.reminders.active.v1';
export const reminderOwnerKey=(principalId:string)=>`argala.reminders.v1:${encodeURIComponent(principalId)}`;
export type ReminderStorage={getItem(key:string):Promise<string|null>;setItem(key:string,value:string):Promise<void>};
/** One serialized repository is shared by UI and headless task in the JS runtime. */
export class ReminderRepository {
 private tail:Promise<unknown>=Promise.resolve();
 private blocked=false;
 constructor(private storage:ReminderStorage){}
 private serial<T>(work:()=>Promise<T>):Promise<T>{const result=this.tail.then(work,work);this.tail=result.catch(()=>{});return result;}
 /** Synchronously fences in-flight tasks while principal retirement is being persisted. */
 blockTasks(){this.blocked=true;}
 async readOwner(principalId:string){const raw=await this.storage.getItem(reminderOwnerKey(principalId));return raw===null?{version:1 as const,selections:[] as ReminderSelection[]}:ownerSchema.parse(JSON.parse(raw));}
 read(principalId:string){return this.serial(()=>this.readOwner(principalId));}
 private async write(principalId:string,selections:ReminderSelection[]){await this.storage.setItem(reminderOwnerKey(principalId),JSON.stringify(ownerSchema.parse({version:1,selections})));return selections;}
 enable(principalId:string,destinationId:ReminderSelection['destinationId'],locale:ReminderSelection['locale']){return this.serial(async()=>{if(!reminderDestination(destinationId))throw new Error('invalid-destination');const {selections}=await this.readOwner(principalId);if(selections.some(s=>s.destinationId===destinationId))return selections;if(selections.length>=MAX_REMINDERS)throw new Error('limit');return this.write(principalId,[...selections,{destinationId,generation:newGeneration(),consented:true,locale,claimed:false}]);});}
 disable(principalId:string,destinationId:string){return this.serial(async()=>{const {selections}=await this.readOwner(principalId);return this.write(principalId,selections.filter(s=>s.destinationId!==destinationId));});}
 setActive(active:ActiveReminderOwner,isCurrent:()=>boolean=()=>true){return this.serial(async()=>{await this.storage.setItem(REMINDER_ACTIVE_KEY,JSON.stringify(active));this.blocked=!isCurrent();});}
 private async active(){const raw=await this.storage.getItem(REMINDER_ACTIVE_KEY);return raw===null?null:activeSchema.parse(JSON.parse(raw));}
 claim(identifier:unknown){return this.serial(async()=>{if(this.blocked)return null;const region=parseRegionIdentifier(identifier);if(!region)return null;const active=await this.active();if(!active||active.registrationId!==region.registrationId||this.blocked)return null;const {selections}=await this.readOwner(active.principalId);const s=selections.find(s=>s.destinationId===region.destinationId&&s.generation===region.generation&&!s.claimed);if(!s||this.blocked)return null;await this.write(active.principalId,selections.map(x=>x===s?{...x,claimed:true}:x));if(this.blocked)return null;return {principalId:active.principalId,registrationId:active.registrationId,selection:{...s,claimed:true}};});}
 isCurrent(claim:{principalId:string;registrationId:string;selection:ReminderSelection}){return this.serial(async()=>{if(this.blocked)return false;const active=await this.active();if(!active||active.principalId!==claim.principalId||active.registrationId!==claim.registrationId)return false;const owner=await this.readOwner(claim.principalId);return !this.blocked&&owner.selections.some(s=>s.destinationId===claim.selection.destinationId&&s.generation===claim.selection.generation);});}
 validateTap(principalId:string,destinationId:unknown,generation:unknown){return this.serial(async()=>{if(this.blocked||typeof destinationId!=='string'||typeof generation!=='string'||!reminderDestination(destinationId))return false;const owner=await this.readOwner(principalId);return owner.selections.some(s=>s.destinationId===destinationId&&s.generation===generation&&s.claimed);});}
}
