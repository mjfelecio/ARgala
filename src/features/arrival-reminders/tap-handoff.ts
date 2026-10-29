import { reminderDestination, tokenSchema } from './model';
import type { FeaturedDestinationId } from '@/features/destinations/catalog';
import type { ReminderRepository } from './repository';
export type ReminderTap={identifier:string;destinationId:FeaturedDestinationId;generation:string};
/** Bounded synchronous response claim prevents cold/live duplicate navigation. */
export class ReminderTapHandoff {
 private seen=new Set<string>();private pending:ReminderTap|null=null;private revision=0;private inFlight:Promise<void>|null=null;
 get hasPending(){return !!this.pending;}
 receive(response:unknown){if(!response||typeof response!=='object')return false;const r=response as {actionIdentifier?:unknown;notification?:{request?:{identifier?:unknown;content?:{data?:unknown}}}};const request=r.notification?.request;const data=request?.content?.data as Record<string,unknown>|undefined;
  if(typeof request?.identifier!=='string'||request.identifier.length>200||!data||data.kind!=='destination-arrival'||!reminderDestination(data.destinationId)||!tokenSchema.safeParse(data.generation).success||this.seen.has(request.identifier))return false;
  this.seen.add(request.identifier);if(this.seen.size>64)this.seen.delete(this.seen.values().next().value!);
  this.pending={identifier:request.identifier,destinationId:data.destinationId as FeaturedDestinationId,generation:data.generation as string};this.revision++;return true;
 }
 clear(){this.pending=null;this.revision++;}
 flush(principalId:string,repository:ReminderRepository,open:(destinationId:FeaturedDestinationId)=>void,isReady:()=>boolean):Promise<void>{
  // Every overlapping caller waits for the actual validation. Returning an
  // already-settled promise here would make the provider retry during storage IO.
  if(this.inFlight)return this.inFlight;
  const pending=this.pending;const revision=this.revision;
  if(!pending||!isReady())return Promise.resolve();
  const operation=(async()=>{
   try{const valid=await repository.validateTap(principalId,pending.destinationId,pending.generation);if(revision!==this.revision)return;if(!valid){this.pending=null;return;}if(!isReady())return;this.pending=null;open(pending.destinationId);}catch{if(revision===this.revision)this.pending=null;}
  })().finally(()=>{this.inFlight=null;});
  this.inFlight=operation;return operation;
 }
}
