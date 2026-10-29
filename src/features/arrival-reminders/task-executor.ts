import type { ReminderRepository } from './repository';
import { notificationIdentifier, reminderDestination, type ReminderSelection } from './model';
export type ReminderDelivery={check():Promise<boolean>;schedule(selection:ReminderSelection):Promise<void>;cancel(identifier:string):Promise<void>;retire?():Promise<void>};
/** No React, user-position reads, provider requests, AR admission or journal imports. */
export async function executeReminderTask(body:{data?:unknown;error?:unknown},repository:ReminderRepository,delivery:ReminderDelivery){
 if(body.error){try{await delivery.retire?.();}catch{}return;}
 if(!body.data||typeof body.data!=='object')return;
 const {eventType,region}=body.data as {eventType?:unknown;region?:{identifier?:unknown}};
 if(eventType!==1||!region?.identifier)return;
 try{if(!await delivery.check()){await delivery.retire?.();return;}const claim=await repository.claim(region.identifier);if(!claim||!reminderDestination(claim.selection.destinationId)||!await repository.isCurrent(claim))return;
  // Claim survives scheduling ambiguity: a new explicit enable is the only retry.
  try{await delivery.schedule(claim.selection);}finally{if(!await repository.isCurrent(claim))await delivery.cancel(notificationIdentifier(claim.selection));}
 }catch{try{await delivery.retire?.();}catch{/* Native/storage diagnostics never become product copy. */}}
}
